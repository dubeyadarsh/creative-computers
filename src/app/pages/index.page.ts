import { Component } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { FooterComponent } from "../components/footer/footer";

@Component({
  selector: 'app-home-page',
  standalone: true,
  imports: [RouterLink, FooterComponent],
  templateUrl: './home.html',
  styleUrls: ['./home.css']
})
export default class HomePageComponent {
  constructor(private router: Router) {}
  // In a real scenario, this data would come from your Analog server routes / Supabase
  bestSellers = [
    {
      id: 'luxebook-pro-14',
      name: 'LuxeBook Pro 14"',
      description: 'Ultra-light workstation for professionals.',
      price: 1499,
      image: 'https://images.unsplash.com/photo-1611186871348-b1ce696e52c9?auto=format&fit=crop&w=400&q=80',
      isNew: true
    },
    {
      id: 'securevision-ptz',
      name: 'SecureVision PTZ 4K',
      description: 'Enterprise-grade surveillance with night vision.',
      price: 299,
      image: 'https://images.unsplash.com/photo-1557825835-70d97c4aa567?auto=format&fit=crop&w=400&q=80',
      isNew: false
    }
  ];
  shopHardware(){
    this.router.navigate(['/shops']);
  }
}