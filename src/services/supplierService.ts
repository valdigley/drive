import { supabase } from '../lib/supabase';
import { Supplier, PhotoSupplier } from '../types';

class SupplierService {
  async getAllSuppliers(): Promise<Supplier[]> {
    try {
      const { data, error } = await supabase
        .from('suppliers')
        .select('*')
        .order('name');

      if (error) throw error;

      return (data || []).map(this.mapSupplierFromDB);
    } catch (error) {
      console.error('Error fetching suppliers:', error);
      return [];
    }
  }

  async getSupplierById(id: string): Promise<Supplier | null> {
    try {
      const { data, error } = await supabase
        .from('suppliers')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;

      return data ? this.mapSupplierFromDB(data) : null;
    } catch (error) {
      console.error('Error fetching supplier:', error);
      return null;
    }
  }

  async createSupplier(supplier: Omit<Supplier, 'id' | 'createdAt' | 'updatedAt'>): Promise<Supplier | null> {
    try {
      const { data, error } = await supabase
        .from('suppliers')
        .insert({
          name: supplier.name,
          email: supplier.email,
          phone: supplier.phone,
          category: supplier.category,
        })
        .select()
        .single();

      if (error) throw error;

      return data ? this.mapSupplierFromDB(data) : null;
    } catch (error) {
      console.error('Error creating supplier:', error);
      return null;
    }
  }

  async updateSupplier(id: string, updates: Partial<Supplier>): Promise<Supplier | null> {
    try {
      const { data, error } = await supabase
        .from('suppliers')
        .update({
          name: updates.name,
          email: updates.email,
          phone: updates.phone,
          category: updates.category,
        })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      return data ? this.mapSupplierFromDB(data) : null;
    } catch (error) {
      console.error('Error updating supplier:', error);
      return null;
    }
  }

  async deleteSupplier(id: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('suppliers')
        .delete()
        .eq('id', id);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error deleting supplier:', error);
      return false;
    }
  }

  async tagPhotoWithSupplier(photoId: string, supplierId: string, galleryId: string): Promise<PhotoSupplier | null> {
    try {
      const { data, error } = await supabase
        .from('photo_suppliers')
        .insert({
          photo_id: photoId,
          supplier_id: supplierId,
          gallery_id: galleryId,
        })
        .select()
        .single();

      if (error) throw error;

      return data ? this.mapPhotoSupplierFromDB(data) : null;
    } catch (error) {
      console.error('Error tagging photo:', error);
      return null;
    }
  }

  async untagPhotoFromSupplier(photoId: string, supplierId: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('photo_suppliers')
        .delete()
        .eq('photo_id', photoId)
        .eq('supplier_id', supplierId);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error untagging photo:', error);
      return false;
    }
  }

  async getPhotoSuppliers(photoId: string): Promise<Supplier[]> {
    try {
      const { data, error } = await supabase
        .from('photo_suppliers')
        .select('supplier_id, suppliers(*)')
        .eq('photo_id', photoId);

      if (error) throw error;

      return (data || [])
        .filter(item => item.suppliers)
        .map(item => this.mapSupplierFromDB(item.suppliers));
    } catch (error) {
      console.error('Error fetching photo suppliers:', error);
      return [];
    }
  }

  async getSupplierPhotos(supplierId: string): Promise<any[]> {
    try {
      const { data, error } = await supabase
        .from('photo_suppliers')
        .select(`
          *,
          photos(*),
          galleries(id, name, client_name)
        `)
        .eq('supplier_id', supplierId)
        .order('tagged_at', { ascending: false });

      if (error) throw error;

      return (data || []).map(item => ({
        ...item.photos,
        gallery: item.galleries,
        taggedAt: new Date(item.tagged_at),
      }));
    } catch (error) {
      console.error('Error fetching supplier photos:', error);
      return [];
    }
  }

  async getSupplierGalleries(supplierId: string): Promise<any[]> {
    try {
      const { data, error } = await supabase
        .from('photo_suppliers')
        .select(`
          gallery_id,
          galleries(id, name, client_name, created_date)
        `)
        .eq('supplier_id', supplierId);

      if (error) throw error;

      // Group by gallery and count photos
      const galleryMap = new Map();
      (data || []).forEach(item => {
        if (item.galleries) {
          const galleryId = item.gallery_id;
          if (!galleryMap.has(galleryId)) {
            galleryMap.set(galleryId, {
              ...item.galleries,
              photoCount: 0,
            });
          }
          galleryMap.get(galleryId).photoCount++;
        }
      });

      return Array.from(galleryMap.values());
    } catch (error) {
      console.error('Error fetching supplier galleries:', error);
      return [];
    }
  }

  getCategoryLabel(category: string): string {
    const labels: Record<string, string> = {
      fotografia: 'Fotografia',
      buffet: 'Buffet',
      decoracao: 'Decoração',
      musica: 'Música',
      locacao: 'Locação',
      outros: 'Outros',
    };
    return labels[category] || category;
  }

  private mapSupplierFromDB(data: any): Supplier {
    return {
      id: data.id,
      name: data.name,
      email: data.email,
      phone: data.phone,
      category: data.category,
      galleryId: data.gallery_id,
      accessCode: data.access_code,
      createdAt: new Date(data.created_at),
      updatedAt: new Date(data.updated_at),
    };
  }

  private mapPhotoSupplierFromDB(data: any): PhotoSupplier {
    return {
      id: data.id,
      photoId: data.photo_id,
      supplierId: data.supplier_id,
      galleryId: data.gallery_id,
      taggedAt: new Date(data.tagged_at),
    };
  }
}

export const supplierService = new SupplierService();
