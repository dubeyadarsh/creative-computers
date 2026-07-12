import { Injectable, inject } from '@angular/core';
import { AuthService } from './auth.service';
import { Order } from './shop.types';

@Injectable({ providedIn: 'root' })
export class AdminService {
  private auth = inject(AuthService);
  private base = '/api/v1';

  private async authHeaders(): Promise<Record<string, string>> {
    const token = await this.auth.getAuthToken();
    return { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' };
  }

  async listOrders(status?: string): Promise<Order[]> {
    const headers = await this.authHeaders();
    const url = status ? `${this.base}/orders?status=${status}` : `${this.base}/orders`;
    const res = await fetch(url, { headers });
    if (!res.ok) throw new Error('Failed to load orders');
    const json = await res.json();
    return (json.data as Order[]) ?? [];
  }

  async updateOrderStatus(id: string, status: string): Promise<void> {
    const headers = await this.authHeaders();
    const res = await fetch(`${this.base}/orders?id=${id}`, {
      method: 'PATCH',
      headers,
      body: JSON.stringify({ status }),
    });
    if (!res.ok) throw new Error('Failed to update order status');
  }
}
