import { Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { MatIconModule } from '@angular/material/icon';
@Component({
  selector: 'app-top-bar',
  standalone: true,
  imports: [RouterLink, MatIconModule],
  templateUrl: './top-bar.html',
  styleUrls: ['./top-bar.css']
})
export class TopBarComponent {
  authService = inject(AuthService);
}