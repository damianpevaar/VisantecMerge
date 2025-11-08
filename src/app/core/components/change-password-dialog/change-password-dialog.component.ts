import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { AngularMaterialModule } from '../../../shared/modules/angular-material/angular-material-module';
import { ChangePasswordRequest } from '../../application/change-password-request';
import { AuthService } from '../../services/auth-service';

@Component({
  selector: 'app-change-password-dialog',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, AngularMaterialModule, MatDialogModule],
  templateUrl: './change-password-dialog.component.html',
  styleUrl: './change-password-dialog.component.scss'
})
export class ChangePasswordDialogComponent {

  private readonly dialogRef = inject(MatDialogRef<ChangePasswordDialogComponent>);
  private readonly authService = inject(AuthService);
  private readonly snackBar = inject(MatSnackBar);
  private readonly fb = inject(FormBuilder);

  isSubmitting = false;

  readonly form = this.fb.group({
    currentPassword: ['', [Validators.required]],
    newPassword: ['', [Validators.required, Validators.minLength(8)]],
    confirmPassword: ['', [Validators.required]]
  });

  cancel(): void {
    this.dialogRef.close();
  }

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    if (this.form.value.newPassword !== this.form.value.confirmPassword) {
      this.form.get('confirmPassword')?.setErrors({ mismatch: true });
      return;
    }

    const payload: ChangePasswordRequest = {
      currentPassword: this.form.value.currentPassword ?? '',
      newPassword: this.form.value.newPassword ?? '',
      confirmNewPassword: this.form.value.confirmPassword ?? ''
    };

    this.isSubmitting = true;
    this.authService.changePassword(payload).subscribe({
      next: () => {
        this.snackBar.open('Contraseña actualizada correctamente', 'Cerrar', { duration: 3000 });
        this.dialogRef.close(true);
      },
      error: () => {
        this.snackBar.open('No se pudo actualizar la contraseña', 'Cerrar', { duration: 4000 });
      }
    }).add(() => this.isSubmitting = false);
  }
}
