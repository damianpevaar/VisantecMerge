import { Component } from '@angular/core';
import { AngularMaterialModule } from '../../../shared/modules/angular-material/angular-material-module';
import { AuthService } from '../../services/auth-service';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { SharedModule } from '../../../shared/modules/shared-module/shared-module';
import { finalize } from 'rxjs';
import { Router } from '@angular/router';

@Component({
  selector: 'app-login-component',
  imports: [SharedModule, AngularMaterialModule],
  templateUrl: './login-component.html',
  styleUrl: './login-component.scss'
})
export class LoginComponent {

  loginForm: FormGroup;
  isLoading: boolean = false;
  showError: boolean = false;
  currentYear: number = new Date().getFullYear();
  passwordVisible = false;

  constructor(private _fb: FormBuilder, private authService: AuthService, private router: Router) {
    this.loginForm = _fb.group({
      tenant: [''],
      email: ['', Validators.required],
      password: ['', Validators.required],
      remember: [false]
    });
  }

  login() {
    if (this.isLoading) return;

    this.isLoading = true;
    this.showError = false;
    const { email, password } = this.loginForm.getRawValue();
    this.authService.login({ email, password })
      .pipe(
        finalize(() => this.isLoading = false)
      )
      .subscribe({
        next: _ => { this.router.navigate(['/dashboard']); },
        error: _ => { this.showError = true; }
      })
  }

  togglePasswordVisibility(): void {
    this.passwordVisible = !this.passwordVisible;
  }
}
