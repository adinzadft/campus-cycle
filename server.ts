import express, { Request, Response, NextFunction } from 'express';
import path from 'path';
import {
  findUserByEmail,
  findUserById,
  createUser,
  updateUser,
  sanitizeUser,
  verifyPassword,
  createSessionToken,
  verifySessionToken,
  validateStudentEmail,
  verifyEmailCode,
  getAllProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
  createKTMRequest,
  getAllKTMRequests,
  reviewKTMRequest,
  createReport,
  getAllReports,
  clearDemoProducts,
  getAllowedDomains,
  isCampusEmail
} from './src/server/db.ts';
import { User } from './src/types/index.ts';

const app = express();
const PORT = Number(process.env.PORT) || 3000;

// Body parser with 15MB limit for photo uploads
app.use(express.json({ limit: '15mb' }));
app.use(express.urlencoded({ extended: true, limit: '15mb' }));

// Auth middleware with cryptographic session validation
interface AuthenticatedRequest extends Request {
  user?: User;
}

async function authMiddleware(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return next();
  }

  const token = authHeader.substring(7);
  const userId = verifySessionToken(token);
  if (!userId) {
    return next();
  }

  const user = await findUserById(userId);
  if (user) {
    req.user = sanitizeUser(user);
  }
  next();
}

app.use(authMiddleware);

function requireAuth(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  if (!req.user) {
    return res.status(401).json({ error: 'Harap masuk ke akun Anda terlebih dahulu.' });
  }
  next();
}

function requireAdmin(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  if (!req.user || req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Akses khusus administrator CampusCycle.' });
  }
  next();
}

function requireVerified(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  if (!req.user) {
    return res.status(401).json({ error: 'Harap masuk ke akun Anda terlebih dahulu.' });
  }
  if (req.user.verificationStatus === 'unverified') {
    return res.status(403).json({
      error: 'Fitur ini memerlukan verifikasi mahasiswa (Email Kampus terverifikasi atau KTM yang telah disetujui).'
    });
  }
  next();
}

// ==========================================
// AUTH ROUTES
// ==========================================

app.post('/api/auth/register', async (req: Request, res: Response) => {
  try {
    const { name, email, password, campus, studentId, whatsapp } = req.body;
    if (!name || !email || !password) {
      return res.status(400).json({ error: 'Nama, email, dan kata sandi wajib diisi.' });
    }

    // 1. Validate email format & student domain strictly
    const emailValidation = validateStudentEmail(email);
    if (!emailValidation.isValid) {
      return res.status(400).json({ error: emailValidation.errorMessage });
    }

    if (password.length < 6) {
      return res.status(400).json({ error: 'Kata sandi minimal 6 karakter.' });
    }

    const user = await createUser({
      name,
      email,
      password,
      campus: campus || emailValidation.campusName,
      studentId,
      whatsapp
    });

    const token = createSessionToken(user.id);

    res.status(201).json({
      token,
      user,
      verificationCode: user.verificationCode,
      message: 'Pendaftaran akun berhasil! Silakan verifikasi email Anda dengan kode verifikasi yang disediakan.'
    });
  } catch (err: any) {
    res.status(400).json({ error: err.message || 'Gagal mendaftarkan akun.' });
  }
});

app.post('/api/auth/login', async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'Email dan kata sandi wajib diisi.' });
    }

    // 1. Validate format & domain strictly before authentication
    const emailValidation = validateStudentEmail(email);
    if (!emailValidation.isValid) {
      return res.status(400).json({ error: emailValidation.errorMessage });
    }

    const storedUser = await findUserByEmail(email);
    if (!storedUser) {
      return res.status(401).json({ error: 'Email atau kata sandi tidak sesuai.' });
    }

    const isValid = verifyPassword(password, storedUser.passwordSalt, storedUser.passwordHash);
    if (!isValid) {
      return res.status(401).json({ error: 'Email atau kata sandi tidak sesuai.' });
    }

    const token = createSessionToken(storedUser.id);

    res.json({
      token,
      user: sanitizeUser(storedUser),
      message: 'Berhasil masuk ke akun CampusCycle.'
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Terjadi kesalahan pada server saat login.' });
  }
});

// Dedicated Local Demo Login Endpoint
app.post('/api/auth/demo-login', async (req: Request, res: Response) => {
  try {
    const { role } = req.body; // 'student' | 'ktm_student' | 'admin'
    let targetEmail = 'bintang@student.uin-malang.ac.id';
    if (role === 'admin') {
      targetEmail = 'aniiqotul.munaa.2504136@students.um.ac.id';
    } else if (role === 'ktm_student') {
      targetEmail = 'siti@student.ub.ac.id';
    }

    const storedUser = await findUserByEmail(targetEmail);
    if (!storedUser) {
      return res.status(404).json({ error: 'Akun demo tidak ditemukan di database.' });
    }

    const token = createSessionToken(storedUser.id);
    res.json({
      token,
      user: sanitizeUser(storedUser),
      message: `Berhasil masuk dalam mode demo sebagai ${storedUser.name}.`
    });
  } catch (err: any) {
    res.status(500).json({ error: 'Gagal memproses login mode demo.' });
  }
});

// Real Email Verification Endpoint
app.post('/api/auth/verify-email', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { code } = req.body;
    const user = req.user!;
    const updated = await verifyEmailCode(user.id, code);
    res.json({
      user: updated,
      message: 'Email kampus Anda berhasil diverifikasi! Akses memasang jualan kini aktif.'
    });
  } catch (err: any) {
    res.status(400).json({ error: err.message || 'Gagal memverifikasi email.' });
  }
});

app.get('/api/auth/me', (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) {
    return res.status(401).json({ error: 'Belum login.' });
  }
  res.json({ user: req.user });
});

app.post('/api/auth/logout', (_req: Request, res: Response) => {
  res.json({ success: true, message: 'Berhasil keluar dari akun CampusCycle.' });
});

app.post('/api/auth/verify-email-simulated', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const user = req.user!;
    const updated = await updateUser(user.id, {
      verificationStatus: 'email_verified',
      verificationMethod: 'email'
    });
    res.json({ user: updated, message: 'Email berhasil diverifikasi!' });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Gagal memverifikasi email.' });
  }
});

app.post('/api/auth/submit-ktm', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { studentId, ktmImageUrl, campus } = req.body;
    if (!studentId || !ktmImageUrl) {
      return res.status(400).json({ error: 'Nomor Mahasiswa (NIM) dan Foto KTM wajib diunggah.' });
    }

    const user = req.user!;
    const ktmReq = await createKTMRequest({
      userId: user.id,
      userName: user.name,
      userEmail: user.email,
      campus: campus || user.campus,
      studentId,
      ktmImageUrl
    });

    const refreshedUser = await findUserById(user.id);

    res.status(201).json({
      message: 'KTM berhasil diajukan dan sedang dalam antrean pemeriksaan admin.',
      request: ktmReq,
      user: refreshedUser ? sanitizeUser(refreshedUser) : user
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Gagal mengajukan verifikasi KTM.' });
  }
});

app.post('/api/auth/update-profile', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { name, campus, whatsapp, studentId } = req.body;
    const user = req.user!;
    
    const updated = await updateUser(user.id, {
      name: name?.trim() || user.name,
      campus: campus?.trim() || user.campus,
      whatsapp: whatsapp?.trim() || user.whatsapp,
      studentId: studentId?.trim() || user.studentId
    });

    res.json({ user: updated, message: 'Profil berhasil diperbarui.' });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Gagal memperbarui profil.' });
  }
});

// ==========================================
// PRODUCT ROUTES
// ==========================================

app.get('/api/products', async (req: Request, res: Response) => {
  try {
    const { search, category, sort, ownerId } = req.query;
    const products = await getAllProducts({
      search: typeof search === 'string' ? search : undefined,
      category: typeof category === 'string' ? category : undefined,
      sort: typeof sort === 'string' ? sort : undefined,
      ownerId: typeof ownerId === 'string' ? ownerId : undefined,
    });
    res.json(products);
  } catch (err: any) {
    res.status(500).json({ error: 'Gagal memuat katalog barang.' });
  }
});

app.get('/api/products/:id', async (req: Request, res: Response) => {
  try {
    const product = await getProductById(req.params.id);
    if (!product) {
      return res.status(404).json({ error: 'Barang tidak ditemukan atau telah dihapus.' });
    }
    res.json(product);
  } catch (err: any) {
    res.status(500).json({ error: 'Gagal memuat detail barang.' });
  }
});

app.post('/api/products', requireVerified, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { name, price, category, condition, description, imageUrl, whatsapp, codLocation, campus } = req.body;
    const user = req.user!;

    if (!name || !price || !category || !condition || !description || !imageUrl || !whatsapp) {
      return res.status(400).json({ error: 'Semua kolom bertanda bintang wajib diisi.' });
    }

    const numPrice = Number(price);
    if (isNaN(numPrice) || numPrice < 0) {
      return res.status(400).json({ error: 'Harga harus berupa angka valid (minimal Rp 0).' });
    }

    const cleanWa = whatsapp.replace(/[^0-9]/g, '');
    if (cleanWa.length < 8) {
      return res.status(400).json({ error: 'Nomor WhatsApp tidak valid (minimal 8 digit).' });
    }

    const newProduct = await createProduct({
      ownerId: user.id,
      sellerName: user.name,
      sellerCampus: user.campus || campus || 'Kampus',
      sellerVerification: user.verificationStatus,
      name: name.trim(),
      price: numPrice,
      category,
      condition,
      description: description.trim(),
      imageUrl,
      whatsapp: cleanWa,
      campus: campus?.trim() || user.campus || 'Kampus',
      codLocation: codLocation?.trim() || 'Area Kampus',
      status: 'available',
      isDemo: false
    });

    res.status(201).json({
      product: newProduct,
      message: 'Barang berhasil ditayangkan di Etalase Kampus!'
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Gagal menyimpan barang baru.' });
  }
});

app.patch('/api/products/:id', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const user = req.user!;
    const isAdmin = user.role === 'admin';
    const updated = await updateProduct(req.params.id, req.body, user.id, isAdmin);
    
    if (!updated) {
      return res.status(404).json({ error: 'Barang tidak ditemukan.' });
    }

    res.json({ product: updated, message: 'Data barang berhasil diperbarui.' });
  } catch (err: any) {
    res.status(403).json({ error: err.message || 'Gagal mengubah data barang.' });
  }
});

app.post('/api/products/:id/toggle-status', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const user = req.user!;
    const product = await getProductById(req.params.id);
    if (!product) {
      return res.status(404).json({ error: 'Barang tidak ditemukan.' });
    }

    const isAdmin = user.role === 'admin';
    if (!isAdmin && product.ownerId !== user.id) {
      return res.status(403).json({ error: 'Akses ditolak: Anda bukan pemilik barang ini.' });
    }

    const nextStatus = product.status === 'available' ? 'sold' : 'available';
    const updated = await updateProduct(req.params.id, { status: nextStatus }, user.id, isAdmin);

    res.json({
      product: updated,
      message: nextStatus === 'sold' 
        ? 'Barang telah ditandai sebagai Terjual/Laku.' 
        : 'Barang kembali diaktifkan di etalase.'
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Gagal mengubah status barang.' });
  }
});

app.delete('/api/products/:id', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const user = req.user!;
    const isAdmin = user.role === 'admin';
    const success = await deleteProduct(req.params.id, user.id, isAdmin);
    
    if (!success) {
      return res.status(404).json({ error: 'Barang tidak ditemukan.' });
    }

    res.json({ success: true, message: 'Barang berhasil dihapus dari etalase.' });
  } catch (err: any) {
    res.status(403).json({ error: err.message || 'Gagal menghapus barang.' });
  }
});

app.post('/api/products/:id/report', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { reason, reporterEmail } = req.body;
    const product = await getProductById(req.params.id);
    if (!product) {
      return res.status(404).json({ error: 'Barang tidak ditemukan.' });
    }

    const report = await createReport({
      productId: product.id,
      productName: product.name,
      reporterId: req.user?.id || 'anonymous',
      reporterEmail: reporterEmail || req.user?.email || 'anon@student.kampus.id',
      reason: reason || 'Laporan ketidaksesuaian barang'
    });

    res.status(201).json({ message: 'Laporan Anda telah diterima tim CampusCycle.', report });
  } catch (err: any) {
    res.status(500).json({ error: 'Gagal mengirim laporan.' });
  }
});

// ==========================================
// ADMIN ROUTES
// ==========================================

app.get('/api/admin/ktm-requests', requireAdmin, async (_req: Request, res: Response) => {
  try {
    const requests = await getAllKTMRequests();
    res.json(requests);
  } catch (err: any) {
    res.status(500).json({ error: 'Gagal memuat daftar antrean KTM.' });
  }
});

app.post('/api/admin/ktm-requests/:id/review', requireAdmin, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { decision, notes } = req.body;
    if (decision !== 'approved' && decision !== 'rejected') {
      return res.status(400).json({ error: 'Keputusan harus berupa "approved" atau "rejected".' });
    }

    const reviewer = req.user!.name;
    const result = await reviewKTMRequest(req.params.id, decision, notes || '', reviewer);
    if (!result) {
      return res.status(404).json({ error: 'Pengajuan KTM tidak ditemukan.' });
    }

    res.json({
      request: result,
      message: decision === 'approved' 
        ? 'Verifikasi KTM disetujui. Akun mahasiswa kini terverifikasi resmi.' 
        : 'Verifikasi KTM ditolak dengan catatan yang diberikan.'
    });
  } catch (err: any) {
    res.status(500).json({ error: 'Gagal memperbarui status KTM.' });
  }
});

app.get('/api/admin/reports', requireAdmin, async (_req: Request, res: Response) => {
  try {
    const reports = await getAllReports();
    res.json(reports);
  } catch (err: any) {
    res.status(500).json({ error: 'Gagal memuat daftar laporan.' });
  }
});

app.get('/api/admin/stats', requireAdmin, async (_req: Request, res: Response) => {
  try {
    const products = await getAllProducts();
    const ktm = await getAllKTMRequests();
    const reports = await getAllReports();
    
    res.json({
      totalProducts: products.length,
      availableProducts: products.filter(p => p.status === 'available').length,
      soldProducts: products.filter(p => p.status === 'sold').length,
      demoProducts: products.filter(p => p.isDemo).length,
      pendingKtm: ktm.filter(k => k.status === 'pending').length,
      totalReports: reports.length
    });
  } catch (err: any) {
    res.status(500).json({ error: 'Gagal memuat statistik.' });
  }
});

app.post('/api/admin/clear-demo', requireAdmin, async (_req: Request, res: Response) => {
  try {
    const count = await clearDemoProducts();
    res.json({ message: `${count} produk demo berhasil dihapus dari etalase.`, count });
  } catch (err: any) {
    res.status(500).json({ error: 'Gagal menghapus produk demo.' });
  }
});

app.get('/api/config/domains', async (_req: Request, res: Response) => {
  const domains = await getAllowedDomains();
  res.json({ allowedDomains: domains });
});

// Static files for generated images in /src/assets/images
app.use('/src/assets/images', express.static(path.resolve(process.cwd(), 'src/assets/images')));

// Start Vite middleware in dev or static files in production
async function startServer() {
  if (process.env.NODE_ENV === 'production') {
    app.use(express.static(path.resolve(process.cwd(), 'dist')));
    app.get('*', (_req: Request, res: Response) => {
      res.sendFile(path.resolve(process.cwd(), 'dist/index.html'));
    });
  } else {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[CampusCycle] Server running on http://localhost:${PORT}`);
  });
}

startServer().catch(err => {
  console.error('Server startup error:', err);
});
