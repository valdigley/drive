class BusinessService {
  async getBusinessInfo() {
    try {
      const { data, error } = await supabase
        .from('business_info')
        .select('*')
        .limit(1);

      if (error) throw error;
      
      return data && data.length > 0 ? data[0] : null;
    } catch (error) {
      console.error('Error fetching business info:', error);
      throw error;
    }
  }
}

export const businessService = new BusinessService();