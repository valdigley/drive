import { supabase } from '../lib/supabase';

interface BusinessInfo {
  id: string;
  name: string;
  logo_url?: string;
  address?: string;
  whatsapp?: string;
  email?: string;
  city?: string;
  state?: string;
  instagram?: string;
  document?: string;
  zip_code?: string;
  created_at: string;
  updated_at: string;
}

class BusinessService {
  async getBusinessInfo(): Promise<BusinessInfo | null> {
    try {
      const { data, error } = await supabase
        .from('business_info')
        .select('*')
        .single();

      if (error) {
        console.error('Error fetching business info:', error);
        return null;
      }

      return data;
    } catch (error) {
      console.error('Error in getBusinessInfo:', error);
      return null;
    }
  }

  async updateBusinessInfo(updates: Partial<BusinessInfo>): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('business_info')
        .update(updates)
        .eq('id', updates.id);

      if (error) {
        console.error('Error updating business info:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error in updateBusinessInfo:', error);
      return false;
    }
  }
}

export const businessService = new BusinessService();