import { supabase } from '../lib/supabase';

export interface Client {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  accessCode: string;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

function generateAccessCode(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code = '';
  for (let i = 0; i < 8; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

class ClientService {
  async getAllClients(): Promise<Client[]> {
    const { data, error } = await supabase
      .from('clients')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;

    return (data || []).map(client => ({
      id: client.id,
      name: client.name,
      email: client.email,
      phone: client.phone,
      accessCode: client.access_code,
      notes: client.notes,
      createdAt: new Date(client.created_at),
      updatedAt: new Date(client.updated_at),
    }));
  }

  async getClientByAccessCode(accessCode: string): Promise<Client | null> {
    console.log('🔍 Looking for client with access code:', accessCode);

    const { data, error } = await supabase
      .from('clients')
      .select('*')
      .eq('access_code', accessCode.toUpperCase())
      .maybeSingle();

    if (error) {
      console.error('❌ Error fetching client:', error);
      throw error;
    }

    if (!data) {
      console.log('⚠️ No client found with this access code');
      return null;
    }

    console.log('✅ Client found:', data.name);
    return {
      id: data.id,
      name: data.name,
      email: data.email,
      phone: data.phone,
      accessCode: data.access_code,
      notes: data.notes,
      createdAt: new Date(data.created_at),
      updatedAt: new Date(data.updated_at),
    };
  }

  async createClient(client: Omit<Client, 'id' | 'accessCode' | 'createdAt' | 'updatedAt'>): Promise<Client> {
    let accessCode = generateAccessCode();
    let attempts = 0;
    const maxAttempts = 10;

    while (attempts < maxAttempts) {
      const { data, error } = await supabase
        .from('clients')
        .insert({
          name: client.name,
          email: client.email || null,
          phone: client.phone || null,
          access_code: accessCode,
          notes: client.notes || null,
        })
        .select()
        .single();

      if (!error) {
        return {
          id: data.id,
          name: data.name,
          email: data.email,
          phone: data.phone,
          accessCode: data.access_code,
          notes: data.notes,
          createdAt: new Date(data.created_at),
          updatedAt: new Date(data.updated_at),
        };
      }

      if (error.code === '23505') {
        accessCode = generateAccessCode();
        attempts++;
      } else {
        throw error;
      }
    }

    throw new Error('Failed to generate unique access code');
  }

  async updateClient(id: string, updates: Partial<Omit<Client, 'id' | 'accessCode' | 'createdAt' | 'updatedAt'>>): Promise<Client> {
    const { data, error } = await supabase
      .from('clients')
      .update({
        name: updates.name,
        email: updates.email,
        phone: updates.phone,
        notes: updates.notes,
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    return {
      id: data.id,
      name: data.name,
      email: data.email,
      phone: data.phone,
      accessCode: data.access_code,
      notes: data.notes,
      createdAt: new Date(data.created_at),
      updatedAt: new Date(data.updated_at),
    };
  }

  async deleteClient(id: string): Promise<void> {
    const { error } = await supabase
      .from('clients')
      .delete()
      .eq('id', id);

    if (error) throw error;
  }

  async getClientGalleries(clientId: string) {
    const { data, error } = await supabase
      .from('galleries')
      .select('*')
      .eq('client_id', clientId)
      .order('created_date', { ascending: false });

    if (error) throw error;

    return data || [];
  }

  async linkGalleryToClient(galleryId: string, clientId: string): Promise<void> {
    const { error } = await supabase
      .from('galleries')
      .update({ client_id: clientId })
      .eq('id', galleryId);

    if (error) throw error;
  }

  async unlinkGalleryFromClient(galleryId: string): Promise<void> {
    const { error } = await supabase
      .from('galleries')
      .update({ client_id: null })
      .eq('id', galleryId);

    if (error) throw error;
  }
}

export const clientService = new ClientService();
