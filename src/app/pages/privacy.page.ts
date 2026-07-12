import { Component } from '@angular/core';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-privacy-page',
  standalone: true,
  imports: [RouterModule],
  template: `
    <div class="legal-page">
      <header class="legal-head">
        <h1>Privacy Policy</h1>
        <p class="updated">Last updated: July 2026</p>
      </header>

      <section class="legal-body">
        <p>
          Creative Computers ("we", "us") respects your privacy. This policy explains what
          information we collect, how we use it, and the choices you have.
        </p>

        <h2>1. Information we collect</h2>
        <ul>
          <li><strong>Account details:</strong> name, email and phone you provide at sign-up.</li>
          <li><strong>Order information:</strong> delivery addresses and items purchased.</li>
          <li><strong>Usage data:</strong> basic analytics to improve the store experience.</li>
        </ul>

        <h2>2. How we use your information</h2>
        <ul>
          <li>To process and deliver your orders.</li>
          <li>To provide customer support and respond to enquiries.</li>
          <li>To secure your account and prevent fraud.</li>
        </ul>

        <h2>3. Data storage &amp; security</h2>
        <p>
          Your data is stored securely and access is restricted. Payment and session data are
          protected using industry-standard encryption. We never sell your personal information.
        </p>

        <h2>4. Cookies</h2>
        <p>
          We use essential cookies and local storage to keep you signed in and to remember your cart
          and favourites. You can clear these at any time from your browser.
        </p>

        <h2>5. Your rights</h2>
        <p>
          You can request access to, correction of, or deletion of your personal data by contacting
          us. You may also update your profile details from your account page.
        </p>

        <h2>6. Contact</h2>
        <p>
          For any privacy questions, email
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
export default class PrivacyPage {}
