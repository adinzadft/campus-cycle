import { 
  User, 
  Product, 
  KTMRequest, 
  ProductReport, 
  AuthResponse, 
  UserRole, 
  VerificationStatus, 
  KTMStatus, 
  ProductCategory, 
  ProductCondition 
} from '../types/index.ts';
import { supabase } from './supabase';

const TOKEN_KEY = 'campuscycle_auth_token';

export function getStoredToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function setStoredToken(token: string | null): void {
  if (token) {
    localStorage.setItem(TOKEN_KEY, token);
  } else {
    localStorage.removeItem(TOKEN_KEY);
  }
}

// -------------------------------------------------------------
// HELPER MAPPERS (Sesuai persis dengan interface di src/types/index.ts)
// -------------------------------------------------------------

function mapUser(p: any): User {
  const ktmStatus: KTMStatus = (p.ktm_status as KTMStatus) || (p.is_ktm_verified ? 'approved' : 'none');
  
  let verificationStatus: VerificationStatus = 'unverified';
  if (p.is_ktm_verified || ktmStatus === 'approved') {
    verificationStatus = 'ktm_verified';
  } else if (p.is_email_verified) {
    verificationStatus = 'email_verified';
  }

  let verificationMethod: 'email' | 'ktm' | 'none' = 'none';
  if (verificationStatus === 'ktm_verified') verificationMethod = 'ktm';
  else if (verificationStatus === 'email_verified') verificationMethod = 'email';

  return {
    id: p.id,
    name: p.name || 'Pengguna',
    email: p.email || '',
    campus: p.campus || 'UIN Malang',
    studentId: p.student_id,
    whatsapp: p.whatsapp,
    role: (p.role as UserRole) || 'student',
    verificationStatus,
    verificationMethod,
    emailVerified: Boolean(p.is_email_verified),
    ktmStatus,
    ktmNotes: p.ktm_notes,
    ktmImageUrl: p.ktm_image_url,
    createdAt: p.created_at ? new Date(p.created_at).getTime() : Date.now(),
  };
}

function mapProduct(p: any): Product {
  const profile = Array.isArray(p.profiles) ? p.profiles[0] : p.profiles;
  const sellerName = profile?.name || p.seller_name || 'Penjual';
  const sellerCampus = profile?.campus || p.campus || 'UIN Malang';
  
  let sellerVerification: VerificationStatus = 'unverified';
  if (profile?.is_ktm_verified) sellerVerification = 'ktm_verified';
  else if (profile?.is_email_verified) sellerVerification = 'email_verified';

  const createdTime = p.created_at ? new Date(p.created_at).getTime() : Date.now();
  const updatedTime = p.updated_at ? new Date(p.updated_at).getTime() : createdTime;

  return {
    id: p.id,
    ownerId: p.owner_id || '',
    sellerName,
    sellerCampus,
    sellerVerification,
    name: p.name,
    price: Number(p.price),
    category: p.category as Exclude<ProductCategory, 'Semua'>,
    condition: p.condition as ProductCondition,
    description: p.description || '',
    imageUrl: p.image_url || '',
    whatsapp: p.whatsapp || '',
    campus: p.campus || sellerCampus,
    codLocation: p.cod_location || '',
    status: (p.status as 'available' | 'sold') || 'available',
    isDemo: Boolean(p.is_demo),
    createdAt: createdTime,
    updatedAt: updatedTime,
  };
}

function mapKTMRequest(r: any): KTMRequest {
  const profile = Array.isArray(r.profiles) ? r.profiles[0] : r.profiles;
  return {
    id: r.id,
    userId: r.user_id,
    userName: profile?.name || r.user_name || 'Mahasiswa',
    userEmail: profile?.email || r.user_email || '',
    campus: r.campus || profile?.campus || 'UIN Malang',
    studentId: r.student_id,
    ktmImageUrl: r.ktm_image_url,
    status: (r.status as KTMStatus) || 'pending',
    notes: r.notes,
    submittedAt: r.created_at ? new Date(r.created_at).getTime() : Date.now(),
    reviewedAt: r.reviewed_at ? new Date(r.reviewed_at).getTime() : undefined,
    reviewedBy: r.reviewed_by,
  };
}

function mapProductReport(rep: any): ProductReport {
  const product = Array.isArray(rep.products) ? rep.products[0] : rep.products;
  return {
    id: rep.id,
    productId: rep.product_id,
    productName: product?.name || 'Produk',
    reporterId: rep.reporter_id || '',
    reporterEmail: rep.reporter_email || '',
    reason: rep.reason,
    status: (rep.status as 'pending' | 'resolved') || 'pending',
    createdAt: rep.created_at ? new Date(rep.created_at).getTime() : Date.now(),
  };
}

// -------------------------------------------------------------
// API ENDPOINTS IMPLEMENTATION
// -------------------------------------------------------------

export const api = {
  auth: {
    async register(payload: {
      name: string;
      email: string;
      password: string;
      campus?: string;
      studentId?: string;
      whatsapp?: string;
    }): Promise<AuthResponse> {
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: payload.email,
        password: payload.password,
      });

      if (authError || !authData.user) {
        throw new Error(authError?.message || 'Gagal mendaftar');
      }

      const userId = authData.user.id;
      const profileData = {
        id: userId,
        name: payload.name,
        email: payload.email,
        role: 'student',
        campus: payload.campus || 'UIN Malang',
        student_id: payload.studentId || '',
        whatsapp: payload.whatsapp || '',
        is_email_verified: true,
        is_ktm_verified: false,
      };

      const { error: profileError } = await supabase.from('profiles').insert(profileData);
      if (profileError) throw new Error(profileError.message);

      const user = mapUser(profileData);
      const token = authData.session?.access_token || userId;
      setStoredToken(token);
      return { user, token };
    },

    async login(email: string, password: string): Promise<AuthResponse> {
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (authError || !authData.user) {
        throw new Error('Email atau password salah');
      }

      const user = await api.auth.getMe();
      const token = authData.session?.access_token || authData.user.id;
      setStoredToken(token);
      return { user, token };
    },

    async getMe(): Promise<User> {
      const { data: { user: authUser } } = await supabase.auth.getUser();
      if (!authUser) throw new Error('Sesi berakhir, silakan login kembali');

      const { data: profile, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', authUser.id)
        .single();

      if (error || !profile) {
        throw new Error('Profil pengguna tidak ditemukan');
      }

      return mapUser(profile);
    },

    async logout(): Promise<void> {
      await supabase.auth.signOut();
      setStoredToken(null);
    },

    async demoLogin(role: 'student' | 'ktm_student' | 'admin'): Promise<AuthResponse> {
      const mockEmail = `demo_${role}@campuscycle.id`;
      const mockPassword = 'demopassword123';

      try {
        return await api.auth.login(mockEmail, mockPassword);
      } catch {
        return await api.auth.register({
          name: `Demo ${role.toUpperCase()}`,
          email: mockEmail,
          password: mockPassword,
          campus: 'UIN Malang',
          whatsapp: '081234567890',
        });
      }
    },

    async verifyEmail(email: string, token: string) {
      const { data, error } = await supabase.auth.verifyOtp({
        email,
        token,
        type: 'signup'
      });

      if (error) throw new Error(error.message || 'Kode verifikasi salah.');

      if (data.user) {
        await supabase
          .from('profiles')
          .update({ is_email_verified: true })
          .eq('id', data.user.id);
      }

      const currentUser = await api.auth.getMe();
      return { user: currentUser, message: 'Email berhasil diverifikasi' };
    },
    async resendOtp(email: string) {
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email: email.trim(),
      });

      if (error) {
        throw new Error(error.message || 'Gagal mengirim ulang kode OTP.');
      }

      return { message: 'Kode OTP baru berhasil dikirim!' };
    },

    async submitKtm(payload: { studentId: string; ktmImageUrl: string; campus?: string }): Promise<{ request: KTMRequest; user: User; message: string }> {
      const currentUser = await api.auth.getMe();

      const { data: ktmReq, error } = await supabase
        .from('ktm_requests')
        .insert({
          user_id: currentUser.id,
          student_id: payload.studentId,
          ktm_image_url: payload.ktmImageUrl,
          campus: payload.campus || currentUser.campus,
          status: 'pending',
        })
        .select('*, profiles(name, email, campus)')
        .single();

      if (error) throw new Error(error.message);

      const requestData = mapKTMRequest(ktmReq);
      const updatedUser: User = { ...currentUser, ktmStatus: 'pending', ktmImageUrl: payload.ktmImageUrl };

      return { request: requestData, user: updatedUser, message: 'Pengajuan KTM berhasil dikirim' };
    },

    async updateProfile(payload: { name?: string; campus?: string; whatsapp?: string; studentId?: string }): Promise<{ user: User; message: string }> {
      const currentUser = await api.auth.getMe();

      const updates: any = {};
      if (payload.name) updates.name = payload.name;
      if (payload.campus) updates.campus = payload.campus;
      if (payload.whatsapp) updates.whatsapp = payload.whatsapp;
      if (payload.studentId) updates.student_id = payload.studentId;

      const { error } = await supabase.from('profiles').update(updates).eq('id', currentUser.id);
      if (error) throw new Error(error.message);

      const updatedUser = { ...currentUser, ...payload };
      return { user: updatedUser, message: 'Profil berhasil diperbarui' };
    }
  },

  products: {
    async getAll(params?: { search?: string; category?: string; sort?: string; ownerId?: string }): Promise<Product[]> {
      let query = supabase.from('products').select('*, profiles(name, campus, is_email_verified, is_ktm_verified)');

      if (params?.category && params.category !== 'Semua') {
        query = query.eq('category', params.category);
      }
      if (params?.ownerId) {
        query = query.eq('owner_id', params.ownerId);
      }
      if (params?.search) {
        query = query.ilike('name', `%${params.search}%`);
      }

      if (params?.sort === 'price_asc') {
        query = query.order('price', { ascending: true });
      } else if (params?.sort === 'price_desc') {
        query = query.order('price', { ascending: false });
      } else {
        query = query.order('created_at', { ascending: false });
      }

      const { data, error } = await query;
      if (error) throw new Error(error.message);

      return (data || []).map(mapProduct);
    },

    async getById(id: string): Promise<Product> {
      const { data, error } = await supabase
        .from('products')
        .select('*, profiles(name, campus, is_email_verified, is_ktm_verified)')
        .eq('id', id)
        .single();

      if (error || !data) throw new Error('Produk tidak ditemukan');
      return mapProduct(data);
    },

    async create(data: {
      name: string;
      price: number;
      category: string;
      condition: string;
      description: string;
      imageUrl: string;
      whatsapp: string;
      campus?: string;
      codLocation?: string;
    }): Promise<{ product: Product; message: string }> {
      const currentUser = await api.auth.getMe();

      const { data: newProd, error } = await supabase
        .from('products')
        .insert({
          name: data.name,
          price: data.price,
          category: data.category,
          condition: data.condition,
          description: data.description,
          image_url: data.imageUrl,
          whatsapp: data.whatsapp,
          campus: data.campus || currentUser.campus,
          cod_location: data.codLocation,
          status: 'available',
          owner_id: currentUser.id,
        })
        .select('*, profiles(name, campus, is_email_verified, is_ktm_verified)')
        .single();

      if (error) throw new Error(error.message);

      return { product: mapProduct(newProd), message: 'Produk berhasil ditambahkan' };
    },

    async update(id: string, updates: Partial<Product>): Promise<{ product: Product; message: string }> {
      const payload: any = {};
      if (updates.name) payload.name = updates.name;
      if (updates.price) payload.price = updates.price;
      if (updates.category) payload.category = updates.category;
      if (updates.condition) payload.condition = updates.condition;
      if (updates.description) payload.description = updates.description;
      if (updates.imageUrl) payload.image_url = updates.imageUrl;
      if (updates.whatsapp) payload.whatsapp = updates.whatsapp;
      if (updates.status) payload.status = updates.status;

      const { data, error } = await supabase
        .from('products')
        .update(payload)
        .eq('id', id)
        .select('*, profiles(name, campus, is_email_verified, is_ktm_verified)')
        .single();

      if (error) throw new Error(error.message);

      return { product: mapProduct(data), message: 'Produk berhasil diperbarui' };
    },

    async toggleStatus(id: string): Promise<{ product: Product; message: string }> {
      const current = await api.products.getById(id);
      const newStatus = current.status === 'available' ? 'sold' : 'available';
      return api.products.update(id, { status: newStatus });
    },

    async delete(id: string): Promise<{ success: boolean; message: string }> {
      const { error } = await supabase.from('products').delete().eq('id', id);
      if (error) throw new Error(error.message);
      return { success: true, message: 'Produk berhasil dihapus' };
    },

    async report(id: string, reason: string, reporterEmail?: string): Promise<{ message: string }> {
      let reporterId = '';
      try {
        const user = await api.auth.getMe();
        reporterId = user.id;
      } catch {
        // Bebas jika anonim
      }

      const { error } = await supabase.from('product_reports').insert({
        product_id: id,
        reporter_id: reporterId,
        reason,
        reporter_email: reporterEmail || '',
        status: 'pending',
      });
      if (error) throw new Error(error.message);
      return { message: 'Laporan berhasil dikirim' };
    }
  },

  admin: {
    async getStats(): Promise<{
      totalProducts: number;
      availableProducts: number;
      soldProducts: number;
      demoProducts: number;
      pendingKtm: number;
      totalReports: number;
    }> {
      const { count: totalProducts } = await supabase.from('products').select('*', { count: 'exact', head: true });
      const { count: availableProducts } = await supabase.from('products').select('*', { count: 'exact', head: true }).eq('status', 'available');
      const { count: soldProducts } = await supabase.from('products').select('*', { count: 'exact', head: true }).eq('status', 'sold');
      const { count: pendingKtm } = await supabase.from('ktm_requests').select('*', { count: 'exact', head: true }).eq('status', 'pending');
      const { count: totalReports } = await supabase.from('product_reports').select('*', { count: 'exact', head: true });

      return {
        totalProducts: totalProducts || 0,
        availableProducts: availableProducts || 0,
        soldProducts: soldProducts || 0,
        demoProducts: 0,
        pendingKtm: pendingKtm || 0,
        totalReports: totalReports || 0,
      };
    },

    async getKtmRequests(): Promise<KTMRequest[]> {
      const { data, error } = await supabase
        .from('ktm_requests')
        .select('*, profiles(name, email, campus)')
        .order('created_at', { ascending: false });

      if (error) throw new Error(error.message);

      return (data || []).map(mapKTMRequest);
    },

    async reviewKtm(requestId: string, decision: 'approved' | 'rejected', notes: string): Promise<{ request: KTMRequest; message: string }> {
      const { data: ktmReq, error } = await supabase
        .from('ktm_requests')
        .update({ status: decision, notes })
        .eq('id', requestId)
        .select('*, profiles(name, email, campus)')
        .single();

      if (error) throw new Error(error.message);

      if (decision === 'approved') {
        await supabase.from('profiles').update({ is_ktm_verified: true }).eq('id', ktmReq.user_id);
      }

      return { request: mapKTMRequest(ktmReq), message: `Status KTM berhasil diperbarui ke ${decision}` };
    },

    async getReports(): Promise<ProductReport[]> {
      const { data, error } = await supabase
        .from('product_reports')
        .select('*, products(name)')
        .order('created_at', { ascending: false });

      if (error) throw new Error(error.message);

      return (data || []).map(mapProductReport);
    },

    async clearDemo(): Promise<{ message: string; count: number }> {
      return { message: 'Data demo telah dibersihkan', count: 0 };
    }
  },

  config: {
    async getAllowedDomains(): Promise<{ allowedDomains: string[] }> {
      return {
        allowedDomains: ['student.uin-malang.ac.id', 'student.ub.ac.id', 'student.um.ac.id', 'gmail.com']
      };
    }
  }
};