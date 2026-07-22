import { sendMail } from "./mailer";

interface OrderItemLike {
  name: string;
  color: string;
  size: string;
  quantity: number;
  price: number;
}
interface OrderLike {
  id: string;
  total: number;
  items: OrderItemLike[];
}

/** Order confirmation email, sent after an order is saved. */
export async function sendOrderConfirmation(to: string, order: OrderLike) {
  const rows = order.items
    .map(
      (i) =>
        `<tr>
           <td style="padding:6px 0;color:#1C1A17">${i.quantity}× ${i.name} (${i.color}, ${i.size})</td>
           <td style="padding:6px 0;text-align:right;color:#1C1A17">$${i.price * i.quantity}</td>
         </tr>`
    )
    .join("");

  const html = `
    <div style="font-family:Arial,Helvetica,sans-serif;max-width:520px;margin:0 auto;color:#1C1A17;background:#F9F7F4;padding:32px">
      <h1 style="font-weight:normal;font-size:24px">Order Confirmed</h1>
      <p style="color:#6B6660">Thank you for your order. Your order number is
        <strong style="color:#1C1A17">${order.id}</strong>.</p>
      <table style="width:100%;border-top:1px solid rgba(28,26,23,.1);margin-top:16px;font-size:14px">
        ${rows}
        <tr>
          <td style="padding-top:12px;border-top:1px solid rgba(28,26,23,.1);font-weight:bold">Total</td>
          <td style="padding-top:12px;border-top:1px solid rgba(28,26,23,.1);text-align:right;font-weight:bold">$${order.total}</td>
        </tr>
      </table>
      <p style="color:#6B6660;font-size:12px;margin-top:24px">K18 — Thoughtfully designed menswear.</p>
    </div>`;

  const text =
    `Order Confirmed\nOrder number: ${order.id}\n\n` +
    order.items.map((i) => `${i.quantity}x ${i.name} (${i.color}, ${i.size}) - $${i.price * i.quantity}`).join("\n") +
    `\n\nTotal: $${order.total}`;

  return sendMail({ to, subject: `K18 — Order Confirmed (${order.id})`, html, text });
}

/** Email-verification code, sent at registration. */
export async function sendVerificationCode(to: string, code: string) {
  const html = `
    <div style="font-family:Arial,Helvetica,sans-serif;max-width:520px;margin:0 auto;color:#1C1A17;background:#F9F7F4;padding:32px">
      <h1 style="font-weight:normal;font-size:24px">Verify your email</h1>
      <p style="color:#6B6660">Enter this code to verify your K18 account. It expires in 15 minutes.</p>
      <p style="font-size:32px;letter-spacing:8px;font-weight:bold;margin:24px 0">${code}</p>
      <p style="color:#6B6660;font-size:12px">If you didn't create a K18 account, you can ignore this email.</p>
    </div>`;
  const text = `Your K18 verification code is ${code}. It expires in 15 minutes.`;
  return sendMail({ to, subject: "K18 — Verify your email", html, text });
}
