import { Injectable, inject } from '@angular/core';
import { AuthService } from './auth.service';
import { CartItem } from './cart.service';
import { Address, Order } from './shop.types';

@Injectable({ providedIn: 'root' })
export class OrderService {
  private auth = inject(AuthService);

  async list(): Promise<Order[]> {
    const { data, error } = await this.auth.client
      .from('orders')
      .select('*, order_items(*)')
      .order('created_at', { ascending: false });
    if (error) throw error;
    return (data as Order[]) ?? [];
  }

  async place(input: {
    items: CartItem[];
    address: Address;
    subtotal: number;
    shipping: number;
    total: number;
    paymentMethod?: string;
  }): Promise<Order> {
    const userId = this.auth.userId;
    if (!userId) throw new Error('You must be logged in to place an order.');

    const { data: order, error: orderErr } = await this.auth.client
      .from('orders')
      .insert({
        user_id: userId,
        subtotal: input.subtotal,
        shipping: input.shipping,
        total: input.total,
        payment_method: input.paymentMethod ?? 'cod',
        ship_full_name: input.address.full_name,
        ship_phone: input.address.phone,
        ship_line1: input.address.line1,
        ship_line2: input.address.line2 ?? null,
        ship_city: input.address.city,
        ship_state: input.address.state ?? null,
        ship_postal: input.address.postal_code,
        ship_country: input.address.country ?? 'India',
      })
      .select()
      .single();
    if (orderErr) throw orderErr;

    const orderItems = input.items.map((i) => ({
      order_id: (order as Order).id,
      product_id: i.id,
      name: i.name,
      price: i.price,
      qty: i.qty,
      image_url: i.image,
    }));

    const { error: itemsErr } = await this.auth.client.from('order_items').insert(orderItems);
    if (itemsErr) throw itemsErr;

    // Notify the admin by email (best-effort — never blocks the order).
    this.notifyAdmin((order as Order).id).catch(() => {});

    return order as Order;
  }

  private async notifyAdmin(orderId?: string): Promise<void> {
    if (!orderId) return;
    const token = await this.auth.getAuthToken();
    if (!token) return;
    await fetch('/api/v1/notify-order', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ orderId }),
    });
  }
}
