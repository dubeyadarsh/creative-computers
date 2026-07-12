import { Component } from '@angular/core';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-terms-page',
  standalone: true,
  imports: [RouterModule],
  template: `
    <div class="legal-page">
      <header class="legal-head">
        <h1>Terms &amp; Conditions</h1>
        <p class="updated">Last updated: July 2026</p>
      </header>

      <section class="legal-body">
        <p>
          Welcome to Creative Computers. By accessing or using our store, you agree to these terms.
          Please read them carefully.
        </p>

        <h2>1. Use of the store</h2>
        <p>
          You agree to use the site lawfully and not to misuse any features. You are responsible for
          maintaining the confidentiality of your account credentials.
        </p>

        <h2>2. Products &amp; pricing</h2>
        <ul>
          <li>All prices are listed in INR and are inclusive of applicable taxes.</li>
          <li>We strive for accuracy, but pricing or availability may change without notice.</li>
          <li>Product images are for reference and may vary slightly from the actual item.</li>
        </ul>

        <h2>3. Orders &amp; payment</h2>
        <p>
          Placing an order constitutes an offer to purchase. We reserve the right to accept or
          decline any order. Cash on Delivery and supported online methods are available at checkout.
        </p>

        <h2>4. Shipping &amp; delivery</h2>
        <p>
          Delivery timelines are estimates. Free delivery applies to orders above ₹499; otherwise a
          nominal shipping fee is charged.
        </p>

        <h2>5. Returns &amp; refunds</h2>
        <p>
          Eligible items may be returned within 7 days of delivery in original condition. Refunds are
          processed to the original payment method after inspection.
        </p>

        <h2>6. Reviews</h2>
        <p>
          Reviews you submit must be honest and respectful. We may remove content that is abusive,
          misleading, or violates applicable laws.
        </p>

        <h2>7. Limitation of liability</h2>
        <p>
          Creative Computers is not liable for indirect or consequential damages arising from the use
          of the store, to the extent permitted by law.
        </p>

        <h2>8. Contact</h2>
        <p>
          Questions about these terms? Email
          <a href="mailto:helpdesk&#64;creativecomputersmariahu.in">helpdesk&#64;creativecomputersmariahu.in</a>.
        </p>

        <a routerLink="/" class="back">← Back to home</a>
      </section>
    </div>
  `,
  styles: [`
    :host { display: block; }
    :host, :host *, :host *::before, :host *::after { box-sizing: border-box; }
    .legal-page { max-width: 800px; margin: 0 auto; padding: 2rem 1rem 5rem; }
    .legal-head { border-bottom: 1px solid var(--neutral-200); padding-bottom: 1rem; margin-bottom: 1.5rem; }
    .legal-head h1 { font-size: 1.8rem; font-weight: 800; margin: 0 0 0.35rem; color: var(--neutral-900); letter-spacing: -0.02em; }
    .updated { color: var(--neutral-400); font-size: 0.82rem; margin: 0; }
    .legal-body { color: var(--neutral-600); line-height: 1.75; }
    .legal-body h2 { font-size: 1.1rem; font-weight: 700; color: var(--neutral-900); margin: 1.75rem 0 0.6rem; }
    .legal-body ul { padding-left: 1.25rem; }
    .legal-body li { margin-bottom: 0.4rem; }
    .legal-body a { color: var(--brand-600); }
    .back { display: inline-block; margin-top: 2rem; font-weight: 600; color: var(--brand-600); text-decoration: none; }
  `]
})
export default class TermsPage {}
