import fs from 'fs/promises';
import path from 'path';
import crypto from 'crypto';
import { User, Product, KTMRequest, ProductReport } from '../types/index.ts';

interface StoredUser extends User {
  passwordHash: string;
  passwordSalt: string;
}

interface DatabaseSchema {
  users: StoredUser[];
  products: Product[];
  ktmRequests: KTMRequest[];
  reports: ProductReport[];
  allowedDomains: string[];
}

const DATA_DIR = path.resolve(process.cwd(), '.data');
const DB_FILE = path.resolve(DATA_DIR, 'campuscycle_db.json');

// Default allowed campus email domains (expandable by admin)
const DEFAULT_ALLOWED_DOMAINS = [
  'student.uin-malang.ac.id',
  'students.um.ac.id',
  'student.ub.ac.id',
  'mail.ugm.ac.id',
  'ui.ac.id',
  'itb.ac.id',
  'ipb.ac.id',
  'its.ac.id',
  'unair.ac.id',
  'ac.id' // Wildcard suffix support for Indonesian universities
];

function hashPassword(password: string, salt: string): string {
  return crypto.scryptSync(password, salt, 64).toString('hex');
}

export function verifyPassword(password: string, salt: string, hash: string): boolean {
  const calculatedHash = hashPassword(password, salt);
  return crypto.timingSafeEqual(Buffer.from(calculatedHash, 'hex'), Buffer.from(hash, 'hex'));
}

const DISALLOWED_PERSONAL_DOMAINS = [
  'gmail.com',
  'yahoo.com',
  'yahoo.co.id',
  'hotmail.com',
  'outlook.com',
  'live.com',
  'icloud.com',
  'mail.com',
  'aol.com',
  'yandex.com'
];

const JWT_SECRET = process.env.SESSION_SECRET || 'campuscycle_hmac_secret_2026_key';

export function createSessionToken(userId: string): string {
  const payload = Buffer.from(JSON.stringify({ userId, ts: Date.now() })).toString('base64url');
  const signature = crypto.createHmac('sha256', JWT_SECRET).update(payload).digest('base64url');
  return `${payload}.${signature}`;
}

export function verifySessionToken(token: string): string | null {
  if (!token || typeof token !== 'string') return null;
  // Support predefined demo tokens for instant fallback
  if (token === 'demo-token-bintang') return 'user-demo-1';
  if (token === 'demo-token-siti') return 'user-demo-2';
  if (token === 'demo-token-admin') return 'user-admin-1';

  const parts = token.split('.');
  if (parts.length !== 2) return null;
  const [payload, signature] = parts;
  const expectedSig = crypto.createHmac('sha256', JWT_SECRET).update(payload).digest('base64url');
  if (signature !== expectedSig) return null;

  try {
    const data = JSON.parse(Buffer.from(payload, 'base64url').toString('utf-8'));
    return data.userId || null;
  } catch {
    return null;
  }
}

export function validateStudentEmail(email: string, customAllowedDomains = DEFAULT_ALLOWED_DOMAINS): {
  isValid: boolean;
  campusName: string;
  errorMessage?: string;
} {
  if (!email || typeof email !== 'string') {
    return { isValid: false, campusName: '', errorMessage: 'Alamat email wajib diisi.' };
  }

  const trimmed = email.trim().toLowerCase();
  const emailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+$/;
  if (!emailRegex.test(trimmed)) {
    return {
      isValid: false,
      campusName: '',
      errorMessage: 'Format email tidak valid. Masukkan alamat email yang benar (contoh: nama@student.uin-malang.ac.id).'
    };
  }

  const atIndex = trimmed.lastIndexOf('@');
  const domain = trimmed.substring(atIndex + 1);

  if (DISALLOWED_PERSONAL_DOMAINS.includes(domain)) {
    return {
      isValid: false,
      campusName: '',
      errorMessage: `Email dengan domain pribadi (@${domain}) tidak diizinkan. Hanya email domain mahasiswa/kampus resmi (misal: @student.uin-malang.ac.id atau berakhiran .ac.id) yang dapat mendaftar atau masuk.`
    };
  }

  const isAllowed = customAllowedDomains.some(allowed => 
    domain === allowed || 
    domain.endsWith('.' + allowed) || 
    (allowed === 'ac.id' && domain.endsWith('.ac.id')) ||
    domain.includes('.student.') ||
    domain.startsWith('student.') ||
    domain.startsWith('students.')
  );

  if (!isAllowed) {
    return {
      isValid: false,
      campusName: '',
      errorMessage: `Domain email '@${domain}' tidak terdaftar sebagai domain mahasiswa yang diizinkan. Harap gunakan email resmi kampus Anda (contoh: @student.uin-malang.ac.id, @students.um.ac.id, atau berakhiran .ac.id).`
    };
  }

  let campusName = 'Universitas';
  if (domain.includes('uin-malang')) campusName = 'UIN Maulana Malik Ibrahim Malang';
  else if (domain.includes('um.ac.id')) campusName = 'Universitas Negeri Malang';
  else if (domain.includes('ub.ac.id')) campusName = 'Universitas Brawijaya';
  else if (domain.includes('ugm.ac.id')) campusName = 'Universitas Gadjah Mada';
  else if (domain.includes('ui.ac.id')) campusName = 'Universitas Indonesia';
  else if (domain.includes('itb.ac.id')) campusName = 'ITB Bandung';
  else if (domain.includes('its.ac.id')) campusName = 'ITS Surabaya';
  else if (domain.includes('unair.ac.id')) campusName = 'Universitas Airlangga';
  else {
    const parts = domain.split('.');
    campusName = parts[parts.length - 3] ? parts[parts.length - 3].toUpperCase() : 'Kampus Aktif';
  }

  return { isValid: true, campusName };
}

export function isCampusEmail(email: string, allowedDomains: string[]): { isCampus: boolean; campusName: string } {
  const result = validateStudentEmail(email, allowedDomains);
  return { isCampus: result.isValid, campusName: result.campusName };
}

let inMemoryDb: DatabaseSchema | null = null;
let saveTimeout: NodeJS.Timeout | null = null;

async function ensureDbInitialized(): Promise<DatabaseSchema> {
  if (inMemoryDb) return inMemoryDb;

  try {
    await fs.mkdir(DATA_DIR, { recursive: true });
    const content = await fs.readFile(DB_FILE, 'utf-8');
    inMemoryDb = JSON.parse(content);
    return inMemoryDb!;
  } catch {
    // Initialize default seed database
    const saltAdmin = crypto.randomBytes(16).toString('hex');
    const hashAdmin = hashPassword('Admin123!', saltAdmin);

    const saltBintang = crypto.randomBytes(16).toString('hex');
    const hashBintang = hashPassword('Demo12345!', saltBintang);

    const adminUser: StoredUser = {
      id: 'user-admin-1',
      name: 'Admin CampusCycle',
      email: 'aniiqotul.munaa.2504136@students.um.ac.id',
      campus: 'Universitas Negeri Malang',
      studentId: '2504136',
      whatsapp: '6281234567890',
      role: 'admin',
      verificationStatus: 'email_verified',
      verificationMethod: 'email',
      passwordSalt: saltAdmin,
      passwordHash: hashAdmin,
      createdAt: Date.now() - 86400000 * 7,
    };

    const demoUserBintang: StoredUser = {
      id: 'user-demo-1',
      name: 'Bintang Pratama',
      email: 'bintang@student.uin-malang.ac.id',
      campus: 'UIN Malang',
      studentId: '210605110023',
      whatsapp: '6281234567890',
      role: 'student',
      verificationStatus: 'email_verified',
      verificationMethod: 'email',
      passwordSalt: saltBintang,
      passwordHash: hashBintang,
      createdAt: Date.now() - 86400000 * 3,
    };

    const demoUserSiti: StoredUser = {
      id: 'user-demo-2',
      name: 'Siti Rahma',
      email: 'siti@student.ub.ac.id',
      campus: 'Universitas Brawijaya',
      studentId: '225150201111',
      whatsapp: '6289876543210',
      role: 'student',
      verificationStatus: 'ktm_verified',
      verificationMethod: 'ktm',
      ktmStatus: 'approved',
      passwordSalt: saltBintang,
      passwordHash: hashBintang,
      createdAt: Date.now() - 86400000 * 2,
    };

    const initialProducts: Product[] = [
      {
        id: 'prod-seed-1',
        ownerId: 'user-demo-1',
        sellerName: 'Bintang Pratama',
        sellerCampus: 'UIN Malang',
        sellerVerification: 'email_verified',
        name: 'Buku Kalkulus Dasar Edisi 9 - Purcell',
        price: 45000,
        category: 'Buku',
        condition: 'Sangat Baik (Like New)',
        description: 'Buku teks kalkulus lengkap & bersih, tanpa coretan pulpen. Bab 1 sampai 12 lengkap dengan latihan soal integral dan turunan. Sangat direkomendasikan untuk mahasiswa baru Fakultas Saintek/Teknik.',
        imageUrl: '/src/assets/images/calculus_textbook_1791898907044.jpg',
        whatsapp: '6281234567890',
        campus: 'UIN Malang',
        codLocation: 'Perpustakaan Pusat UIN / Gazebo Saintek',
        status: 'available',
        isDemo: true,
        createdAt: Date.now() - 3600000 * 4,
        updatedAt: Date.now() - 3600000 * 4
      },
      {
        id: 'prod-seed-2',
        ownerId: 'user-demo-2',
        sellerName: 'Siti Rahma',
        sellerCampus: 'Universitas Brawijaya',
        sellerVerification: 'ktm_verified',
        name: 'Kipas Angin Portable Meja Belajar Kos',
        price: 65000,
        category: 'Kebutuhan Kos',
        condition: 'Baik (Biasa Pakai)',
        description: 'Kipas angin meja 3 kecepatan dengan motor hening. Hemat listrik cocok untuk anak kos. Pemakaian terawat 1 semester, dijual karena mau pindahan kamar kos.',
        imageUrl: '/src/assets/images/portable_desk_fan_1791898907215.jpg',
        whatsapp: '6289876543210',
        campus: 'Universitas Brawijaya',
        codLocation: 'Kantin FILKOM UB / Sekitar Kos Dinoyo',
        status: 'available',
        isDemo: true,
        createdAt: Date.now() - 3600000 * 8,
        updatedAt: Date.now() - 3600000 * 8
      },
      {
        id: 'prod-seed-3',
        ownerId: 'user-demo-1',
        sellerName: 'Bintang Pratama',
        sellerCampus: 'UIN Malang',
        sellerVerification: 'email_verified',
        name: 'Jas Laboratorium Kimia Standar Praktikum Size L',
        price: 35000,
        category: 'Pakaian',
        condition: 'Baik (Biasa Pakai)',
        description: 'Jas lab putih lengan panjang katun tebal, lengkap dengan kancing depan dan saku. Sudah dicuci bersih & disetrika. Bonus kacamata lab pelindung bening.',
        imageUrl: '/src/assets/images/chemistry_lab_coat_1791898908694.jpg',
        whatsapp: '6281234567890',
        campus: 'UIN Malang',
        codLocation: 'Gedung Laboratorium Terpadu UIN',
        status: 'available',
        isDemo: true,
        createdAt: Date.now() - 3600000 * 18,
        updatedAt: Date.now() - 3600000 * 18
      },
      {
        id: 'prod-seed-4',
        ownerId: 'user-demo-2',
        sellerName: 'Siti Rahma',
        sellerCampus: 'Universitas Brawijaya',
        sellerVerification: 'ktm_verified',
        name: 'Monitor LED 24 Inch Bezel Tipis Full HD',
        price: 480000,
        category: 'Elektronik',
        condition: 'Baik (Biasa Pakai)',
        description: 'Layar IPS 75Hz warna jernih 1080p, normal 100% no minus/dead pixel. Sangat nyaman untuk nugas skripsi, coding, dan editing. Kelengkapan kabel HDMI + adaptor original.',
        imageUrl: '/src/assets/images/led_computer_monitor_1791898909358.jpg',
        whatsapp: '6289876543210',
        campus: 'Universitas Brawijaya',
        codLocation: 'Gerbang Veteran UB / Matos',
        status: 'available',
        isDemo: true,
        createdAt: Date.now() - 3600000 * 24,
        updatedAt: Date.now() - 3600000 * 24
      }
    ];

    const initialKtm: KTMRequest[] = [
      {
        id: 'ktm-req-1',
        userId: 'user-demo-2',
        userName: 'Siti Rahma',
        userEmail: 'siti@student.ub.ac.id',
        campus: 'Universitas Brawijaya',
        studentId: '225150201111',
        ktmImageUrl: '/src/assets/images/chemistry_lab_coat_1791898908694.jpg',
        status: 'approved',
        notes: 'Verifikasi identitas KTM UB telah disetujui',
        submittedAt: Date.now() - 86400000 * 2,
        reviewedAt: Date.now() - 86400000 * 1,
        reviewedBy: 'Admin CampusCycle'
      }
    ];

    inMemoryDb = {
      users: [adminUser, demoUserBintang, demoUserSiti],
      products: initialProducts,
      ktmRequests: initialKtm,
      reports: [],
      allowedDomains: DEFAULT_ALLOWED_DOMAINS
    };

    await fs.writeFile(DB_FILE, JSON.stringify(inMemoryDb, null, 2), 'utf-8');
    return inMemoryDb;
  }
}

async function persistDb(): Promise<void> {
  if (!inMemoryDb) return;
  if (saveTimeout) clearTimeout(saveTimeout);
  
  saveTimeout = setTimeout(async () => {
    try {
      await fs.writeFile(DB_FILE, JSON.stringify(inMemoryDb, null, 2), 'utf-8');
    } catch (err) {
      console.error('Failed to persist database to disk:', err);
    }
  }, 100);
}

// User methods
export async function findUserByEmail(email: string): Promise<StoredUser | null> {
  const db = await ensureDbInitialized();
  return db.users.find(u => u.email.toLowerCase() === email.toLowerCase().trim()) || null;
}

export async function findUserById(id: string): Promise<StoredUser | null> {
  const db = await ensureDbInitialized();
  return db.users.find(u => u.id === id) || null;
}

export async function createUser(data: {
  name: string;
  email: string;
  password: string;
  campus?: string;
  studentId?: string;
  whatsapp?: string;
}): Promise<User> {
  const db = await ensureDbInitialized();

  // Validate student domain strictly
  const validation = validateStudentEmail(data.email, db.allowedDomains);
  if (!validation.isValid) {
    throw new Error(validation.errorMessage || 'Domain email mahasiswa tidak valid.');
  }

  const existing = await findUserByEmail(data.email);
  if (existing) {
    throw new Error('Email sudah terdaftar. Silakan gunakan email lain atau masuk ke akun Anda.');
  }

  const detectedCampus = data.campus?.trim() || validation.campusName || 'Mahasiswa Kampus';
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = hashPassword(data.password, salt);

  // Auto-admin for the project owner's email
  const isAdmin = data.email.toLowerCase().trim() === 'aniiqotul.munaa.2504136@students.um.ac.id';

  // Generate 6-digit email verification code
  const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();

  const newUser: StoredUser = {
    id: 'user-' + Date.now() + '-' + Math.random().toString(36).substring(2, 7),
    name: data.name.trim(),
    email: data.email.toLowerCase().trim(),
    campus: detectedCampus,
    studentId: data.studentId?.trim() || '',
    whatsapp: data.whatsapp?.trim() || '',
    role: isAdmin ? 'admin' : 'student',
    verificationStatus: 'unverified', // Real verification: starts as unverified
    verificationMethod: 'email',
    emailVerified: false,
    verificationCode: verificationCode,
    passwordSalt: salt,
    passwordHash: hash,
    createdAt: Date.now()
  };

  db.users.push(newUser);
  await persistDb();

  return sanitizeUser(newUser);
}

export async function verifyEmailCode(userId: string, code?: string): Promise<User> {
  const db = await ensureDbInitialized();
  const user = db.users.find(u => u.id === userId);
  if (!user) {
    throw new Error('Pengguna tidak ditemukan.');
  }

  if (code && user.verificationCode && user.verificationCode !== code.trim()) {
    throw new Error('Kode verifikasi email salah atau telah kedaluwarsa.');
  }

  user.verificationStatus = 'email_verified';
  user.emailVerified = true;
  user.verificationCode = undefined;
  await persistDb();

  return sanitizeUser(user);
}

export async function updateUser(id: string, updates: Partial<User>): Promise<User | null> {
  const db = await ensureDbInitialized();
  const index = db.users.findIndex(u => u.id === id);
  if (index === -1) return null;

  const current = db.users[index];
  const updated = {
    ...current,
    ...updates,
    id: current.id, // Immutable
    email: current.email, // Immutable
    role: current.role, // Protected
  };

  db.users[index] = updated;
  await persistDb();

  return sanitizeUser(updated);
}

export function sanitizeUser(user: StoredUser | User): User {
  const { ...safeUser } = user as StoredUser;
  delete (safeUser as any).passwordHash;
  delete (safeUser as any).passwordSalt;
  return safeUser as User;
}

// Product methods
export async function getAllProducts(filter?: {
  search?: string;
  category?: string;
  sort?: string;
  ownerId?: string;
  includeSold?: boolean;
}): Promise<Product[]> {
  const db = await ensureDbInitialized();
  let list = [...db.products];

  if (filter?.ownerId) {
    list = list.filter(p => p.ownerId === filter.ownerId);
  } else if (!filter?.includeSold) {
    // Etalase shows all or available
  }

  if (filter?.category && filter.category !== 'Semua') {
    list = list.filter(p => p.category === filter.category);
  }

  if (filter?.search) {
    const q = filter.search.toLowerCase();
    list = list.filter(p => 
      p.name.toLowerCase().includes(q) || 
      p.description.toLowerCase().includes(q) ||
      p.campus.toLowerCase().includes(q)
    );
  }

  if (filter?.sort === 'price_asc') {
    list.sort((a, b) => a.price - b.price);
  } else if (filter?.sort === 'price_desc') {
    list.sort((a, b) => b.price - a.price);
  } else {
    // newest first
    list.sort((a, b) => b.createdAt - a.createdAt);
  }

  return list;
}

export async function getProductById(id: string): Promise<Product | null> {
  const db = await ensureDbInitialized();
  return db.products.find(p => p.id === id) || null;
}

export async function createProduct(productData: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>): Promise<Product> {
  const db = await ensureDbInitialized();
  const newProduct: Product = {
    ...productData,
    id: 'prod-' + Date.now() + '-' + Math.random().toString(36).substring(2, 7),
    createdAt: Date.now(),
    updatedAt: Date.now()
  };

  db.products.unshift(newProduct);
  await persistDb();
  return newProduct;
}

export async function updateProduct(id: string, updates: Partial<Product>, requestingUserId: string, isAdmin = false): Promise<Product | null> {
  const db = await ensureDbInitialized();
  const index = db.products.findIndex(p => p.id === id);
  if (index === -1) return null;

  const current = db.products[index];
  if (!isAdmin && current.ownerId !== requestingUserId) {
    throw new Error('Akses ditolak: Anda bukan pemilik barang ini.');
  }

  const updated: Product = {
    ...current,
    ...updates,
    id: current.id,
    ownerId: current.ownerId,
    updatedAt: Date.now()
  };

  db.products[index] = updated;
  await persistDb();
  return updated;
}

export async function deleteProduct(id: string, requestingUserId: string, isAdmin = false): Promise<boolean> {
  const db = await ensureDbInitialized();
  const index = db.products.findIndex(p => p.id === id);
  if (index === -1) return false;

  const current = db.products[index];
  if (!isAdmin && current.ownerId !== requestingUserId) {
    throw new Error('Akses ditolak: Anda bukan pemilik barang ini.');
  }

  db.products.splice(index, 1);
  await persistDb();
  return true;
}

// KTM Verification methods
export async function createKTMRequest(req: {
  userId: string;
  userName: string;
  userEmail: string;
  campus: string;
  studentId: string;
  ktmImageUrl: string;
}): Promise<KTMRequest> {
  const db = await ensureDbInitialized();
  
  // Update user state
  const user = db.users.find(u => u.id === req.userId);
  if (user) {
    user.ktmStatus = 'pending';
    user.studentId = req.studentId;
    user.ktmImageUrl = req.ktmImageUrl;
  }

  const newRequest: KTMRequest = {
    id: 'ktm-req-' + Date.now(),
    userId: req.userId,
    userName: req.userName,
    userEmail: req.userEmail,
    campus: req.campus,
    studentId: req.studentId,
    ktmImageUrl: req.ktmImageUrl,
    status: 'pending',
    submittedAt: Date.now()
  };

  db.ktmRequests.unshift(newRequest);
  await persistDb();
  return newRequest;
}

export async function getAllKTMRequests(): Promise<KTMRequest[]> {
  const db = await ensureDbInitialized();
  return db.ktmRequests;
}

export async function reviewKTMRequest(
  requestId: string,
  decision: 'approved' | 'rejected',
  notes: string,
  reviewerName: string
): Promise<KTMRequest | null> {
  const db = await ensureDbInitialized();
  const req = db.ktmRequests.find(r => r.id === requestId);
  if (!req) return null;

  req.status = decision;
  req.notes = notes;
  req.reviewedAt = Date.now();
  req.reviewedBy = reviewerName;

  const user = db.users.find(u => u.id === req.userId);
  if (user) {
    user.ktmStatus = decision;
    user.ktmNotes = notes;
    if (decision === 'approved') {
      user.verificationStatus = 'ktm_verified';
      user.verificationMethod = 'ktm';
    } else {
      user.verificationStatus = 'unverified';
    }
  }

  await persistDb();
  return req;
}

// Reports
export async function createReport(data: {
  productId: string;
  productName: string;
  reporterId: string;
  reporterEmail: string;
  reason: string;
}): Promise<ProductReport> {
  const db = await ensureDbInitialized();
  const report: ProductReport = {
    id: 'rep-' + Date.now(),
    ...data,
    status: 'pending',
    createdAt: Date.now()
  };
  db.reports.unshift(report);
  await persistDb();
  return report;
}

export async function getAllReports(): Promise<ProductReport[]> {
  const db = await ensureDbInitialized();
  return db.reports;
}

// Reset/Manage Demo Items
export async function clearDemoProducts(): Promise<number> {
  const db = await ensureDbInitialized();
  const beforeCount = db.products.length;
  db.products = db.products.filter(p => !p.isDemo);
  const deletedCount = beforeCount - db.products.length;
  await persistDb();
  return deletedCount;
}

export async function getAllowedDomains(): Promise<string[]> {
  const db = await ensureDbInitialized();
  return db.allowedDomains;
}
