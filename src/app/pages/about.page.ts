import { Component } from '@angular/core';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-about-page',
  standalone: true,
  imports: [RouterModule],
  template: `
    <div class="static-page">
      <header class="sp-hero">
        <span class="sp-orb a"></span>
        <span class="sp-orb b"></span>
        <h1>About Creative Computers</h1>
        <p>Premium IT solutions and electronics for the modern professional.</p>
      </header>

      <section class="sp-body">
        <p class="lead">
          Creative Computers is your trusted destination for genuine tech — from laptops and
          peripherals to smart gadgets and accessories. We combine a carefully curated catalog with
          fast delivery, secure checkout and honest support.
        </p>

        <div class="value-grid">
          <div class="value-card">
            <div class="v-ico">🛡️</div>
            <h3>Genuine Products</h3>
            <p>Every item is sourced from authorised channels and quality-checked before dispatch.</p>
          </div>
          <div class="value-card">
            <div class="v-ico">🚚</div>
            <h3>Fast Delivery</h3>
            <p>Reliable, tracked shipping with free delivery on orders above ₹499.</p>
          </div>
          <div class="value-card">
            <div class="v-ico">💬</div>
            <h3>Real Support</h3>
            <p>A responsive team ready to help with orders, returns and product advice.</p>
          </div>
          <div class="value-card">
            <div class="v-ico">🔒</div>
            <h3>Secure Checkout</h3>
            <p>Your data and payments are protected end-to-end at every step.</p>
          </div>
        </div>

        <h2>Our mission</h2>
        <p>
          To make premium technology accessible and trustworthy for everyone — with transparent
          pricing, dependable service and a shopping experience that feels effortless on any device.
        </p>

        <h2>Get in touch</h2>
        <p>
          Questions or feedback? Email us at
          <a href="mailto:helpdesk&#64;creativecomputersmariahu.in">helpdesk&#64;creativecomputersmariahu.in</a>
          or use the contact form on our home page.
        </p>

        <a routerLink="/shops" class="sp-cta">Browse our catalog →</a>
      </section>
    </div>
  `,
  styles: [`
    :host { display: block; }
    :host, :host *, :host *::before, :host *::after { box-sizing: border-box; }
    .static-page { max-width: 900px; margin: 0 auto; padding: 1.5rem 1rem 5rem; }
    .sp-hero { position: relative; overflow: hidden; background: var(--gradient-card, linear-gradient(135deg,#1e293b,#0f172a)); color: #fff; border-radius: 24px; padding: 3rem 2rem; text-align: center; }
    .sp-hero h1 { font-size: 2rem; font-weight: 800; margin: 0 0 0.6rem; letter-spacing: -0.02em; position: relative; z-index: 1; }
    .sp-hero p { color: rgba(255,255,255,0.75); margin: 0; position: relative; z-index: 1; }
    .sp-orb { position: absolute; border-radius: 50%; filter: blur(40px); opacity: 0.5; }
    .sp-orb.a { width: 180px; height: 180px; background: #6366f1; top: -60px; right: -30px; }
    .sp-orb.b { width: 150px; height: 150px; background: #a855f7; bottom: -60px; left: -20px; }

    .sp-body { padding: 2rem 0.25rem; }
    .lead { font-size: 1.05rem; line-height: 1.7; color: var(--neutral-700); }
    .sp-body h2 { font-size: 1.25rem; font-weight: 700; margin: 2rem 0 0.75rem; color: var(--neutral-900); }
    .sp-body p { color: var(--neutral-600); line-height: 1.7; }
    .sp-body a { color: var(--brand-600); }

    .value-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 1rem; margin: 2rem 0; }
    .value-card { border: 1px solid var(--neutral-200); border-radius: 16px; padding: 1.25rem; background: #fff; }
    .v-ico { font-size: 1.75rem; margin-bottom: 0.5rem; }
    .value-card h3 { margin: 0 0 0.35rem; font-size: 1rem; color: var(--neutral-900); }
    .value-card p { margin: 0; font-size: 0.85rem; }

    .sp-cta { display: inline-block; margin-top: 2rem; padding: 0.8rem 1.5rem; border-radius: 999px; background: var(--gradient-brand, linear-gradient(135deg,#6366f1,#a855f7)); color: #fff; font-weight: 700; text-decoration: none; }

    @media (min-width: 768px) { .sp-hero h1 { font-size: 2.5rem; } }
    @media (max-width: 600px) { .value-grid { grid-template-columns: 1fr; } }
  `]
})
export default class AboutPage {}
