import { Injectable, inject } from '@angular/core';
import { MatSnackBar, MatSnackBarConfig } from '@angular/material/snack-bar';

@Injectable({ providedIn: 'root' })
export class NotificationService {
  private snackBar = inject(MatSnackBar);

  private baseConfig: MatSnackBarConfig = {
    horizontalPosition: 'right',
    verticalPosition: 'top',
  };

  success(message: string): void {
    this.show(message, 'toast-success', 3000);
  }

  error(message: string): void {
    this.show(message, 'toast-error', 5000);
  }

  info(message: string): void {
    this.show(message, 'toast-info', 3000);
  }

  private show(message: string, panelClass: string, duration: number): void {
    this.snackBar.open(message, 'Close', {
      ...this.baseConfig,
      duration,
      panelClass: [panelClass],
    });
  }
}
