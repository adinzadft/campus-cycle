export type UserRole = 'student' | 'admin';
export type VerificationStatus = 'unverified' | 'email_verified' | 'ktm_verified';
export type KTMStatus = 'none' | 'pending' | 'approved' | 'rejected';

export type ProductCategory = 
  | 'Semua'
  | 'Buku'
  | 'Elektronik'
  | 'Pakaian'
  | 'Kebutuhan Kos'
  | 'Aksesoris'
  | 'Lainnya';

export type ProductCondition = 
  | 'Sangat Baik (Like New)'
  | 'Baik (Biasa Pakai)'
  | 'Cukup (Ada Minus)';

export interface User {
  id: string;
  name: string;
  email: string;
  campus: string;
  studentId?: string;
  whatsapp?: string;
  role: UserRole;
  verificationStatus: VerificationStatus;
  verificationMethod: 'email' | 'ktm' | 'none';
  emailVerified?: boolean;
  verificationCode?: string;
  ktmStatus?: KTMStatus;
  ktmNotes?: string;
  ktmImageUrl?: string;
  createdAt: number;
}

export type CityCategory =
  | 'Semua Kota'
  | 'Malang'
  | 'Surabaya'
  | 'Bandung'
  | 'Yogyakarta'
  | 'Semarang'
  | 'Solo'
  | 'Depok'
  | 'Bogor'
  | 'Lainnya';

export interface Product {
  id: string;
  ownerId: string;
  sellerName: string;
  sellerCampus: string;
  sellerVerification: VerificationStatus;
  name: string;
  price: number;
  category: Exclude<ProductCategory, 'Semua'>;
  condition: ProductCondition;
  description: string;
  imageUrl: string;
  images?: string[];
  whatsapp: string;
  campus: string;
  city?: string; // Kolom kategori kota lokasi
  codLocation: string;
  status: 'available' | 'sold';
  isDemo?: boolean;
  createdAt: number;
  updatedAt: number;
}

export interface ProductReport {
  id: string;
  productId: string;
  productName: string;
  reporterId: string;
  reporterEmail: string;
  reason: string;
  status: 'pending' | 'resolved';
  createdAt: number;
}

export interface KTMRequest {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  campus: string;
  studentId: string;
  ktmImageUrl: string;
  status: KTMStatus;
  notes?: string;
  submittedAt: number;
  reviewedAt?: number;
  reviewedBy?: string;
}

export interface AuthResponse {
  token: string;
  user: User;
}

export interface FilterState {
  search: string;
  category: ProductCategory;
  sort: 'newest' | 'price_asc' | 'price_desc';
  onlyAvailable: boolean;
  campus: string;
}
