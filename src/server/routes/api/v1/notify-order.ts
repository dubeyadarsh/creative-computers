import { defineEventHandler, getHeader, getMethod, readBody, createError } from 'h3';
import { supabase } from '../../../utils/supabase';

// Sends the admin an email whenever a customer places an order.
// Called (fire-and-forget) by the client right after an order is created.
export default defineEventHandler(async (event) => {
  if (getMethod(event) !== 'POST') {
    throw createError({ statusCode: 405, statusMessage: 'Method not allowed' });
  }

  // Authenticate the buyer.
  const authHeader = getHeader(event, 'authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    throw createError({ statusCode: 401, statusMessage: 'Unauthorized' });
  }
  const token = authHeader.split(' ')[1];
  const { data: { user }, error: userErr } = await supabase.auth.getUser(token);
  if (userErr || !user) {
    throw createError({ statusCode: 401, statusMessage: 'Invalid token' });
  }

  const body = (await readBody(event)) as { orderId?: string };
  if (!body?.orderId) {
    throw createError({ statusCode: 400, statusMessage: 'orderId is required' });
  }

  // Fetch the order (service key bypasses RLS) and confirm it belongs to the buyer.
  const { data: order, error } = await supabase
    .from('orders')
    .select('*, order_items(*)')
    .eq('id', body.orderId)
    .single();
  if (error || !order) {
    throw createError({ statusCode: 404, statusMessage: 'Order not found' });
  }
  if (order.user_id !== user.id) {
    throw createError({ statusCode: 403, statusMessage: 'Forbidden' });
  }

  const to = process.env['CONTACT_TO_EMAIL'] || 'helpdesk@creativecomputersmariahu.in';
  const host = process.env['SMTP_HOST'];
  const smtpUser = process.env['SMTP_USER'];
  const smtpPass = process.env['SMTP_PASS'];

  let emailed = false;
  if (host && smtpUser && smtpPass) {
    try {
      const moduleName = 'nodemailer';
      const nodemailer = await import(/* @vite-ignore */ moduleName).then((m: any) => m.default ?? m);
      const port = parseInt(process.env['SMTP_PORT'] || '465', 10);
      const transporter = nodemailer.createTransport({
        host,
        port,
        secure: port === 465,
        auth: { user: smtpUser, pass: smtpPass },
        // Allow mail to send on networks that intercept TLS (proxy/antivirus).
        tls: { rejectUnauthorized: false },
      });

      const itemsHtml = (order.order_items ?? [])
        .map(
          (it: any) =>
            `<tr><td style="padding:4px 8px">${it.name}</td><td style="padding:4px 8px">×${it.qty}</td><td style="padding:4px 8px">₹${(it.price * it.qty).toFixed(0)}</td></tr>`,
        )
        .join('');

      await transporter.sendMail({
        from: `"Creative Computers" <${smtpUser}>`,
        to,
        replyTo: user.email ?? undefined,
        subject: `🛒 New order #${String(order.id).slice(0, 8)} — ₹${Number(order.total).toFixed(0)}`,
        html: `
          <h2>New order received</h2>
          <p><strong>Order ID:</strong> ${order.id}</p>
          <p><strong>Total:</strong> ₹${Number(order.total).toFixed(0)} (${order.payment_method})</p>
          <h3>Ship to</h3>
          <p>
            ${order.ship_full_name}<br/>
            ${order.ship_line1}${order.ship_line2 ? ', ' + order.ship_line2 : ''}<br/>
            ${order.ship_city}, ${order.ship_state ?? ''} ${order.ship_postal}<br/>
            ${order.ship_country}<br/>
            📞 ${order.ship_phone}
          </p>
          <h3>Items</h3>
          <table style="border-collapse:collapse">${itemsHtml}</table>
        `,
      });
      emailed = true;
    } catch (err: any) {
      console.error('[notify-order] email failed:', err?.message);
    }
  }

  return { status: 'success', emailed };
});
