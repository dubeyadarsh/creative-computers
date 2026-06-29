import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { TopBarComponent } from "./components/top-bar/top-bar";
import { BottomNavComponent } from "./components/bottom-nav/bottom-nav";
import { FooterComponent } from "./components/footer/footer";

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, TopBarComponent, BottomNavComponent, FooterComponent],
  template: `
    <div class="min-h-screen bg-slate-50 font-sans text-slate-900">
      <app-top-bar></app-top-bar>
      
      <main class="w-full min-h-full">
        <router-outlet></router-outlet>
        
      </main>
      <app-footer></app-footer>
      <app-bottom-nav></app-bottom-nav>
    </div>
  `
})
export class App {}