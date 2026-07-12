import { Injectable, inject } from '@angular/core';
import { AuthService } from './auth.service';
import { Address } from './shop.types';

@Injectable({ providedIn: 'root' })
export class AddressService {
  private auth = inject(AuthService);

  async list(): Promise<Address[]> {
    const { data, error } = await this.auth.client
      .from('addresses')
      .select('*')
      .order('is_default', { ascending: false })
      .order('created_at', { ascending: false });
    if (error) throw error;
    return (data as Address[]) ?? [];
  }

  async create(input: Address): Promise<Address> {
    const userId = this.auth.userId;
    if (!userId) throw new Error('Not authenticated');

    if (input.is_default) await this.clearDefaults();

    const { data, error } = await this.auth.client
      .from('addresses')
      .insert({ ...input, user_id: userId })
      .select()
      .single();
    if (error) throw error;
    return data as Address;
  }

  async update(id: string, input: Partial<Address>): Promise<void> {
    if (input.is_default) await this.clearDefaults();
    const { error } = await this.auth.client.from('addresses').update(input).eq('id', id);
    if (error) throw error;
  }

  async remove(id: string): Promise<void> {
    const { error } = await this.auth.client.from('addresses').delete().eq('id', id);
    if (error) throw error;
  }

  async setDefault(id: string): Promise<void> {
    await this.clearDefaults();
    const { error } = await this.auth.client
      .from('addresses')
      .update({ is_default: true })
      .eq('id', id);
    if (error) throw error;
  }

  private async clearDefaults(): Promise<void> {
    const userId = this.auth.userId;
    if (!userId) return;
    await this.auth.client
      .from('addresses')
      .update({ is_default: false })
      .eq('user_id', userId)
      .eq('is_default', true);
  }
}
