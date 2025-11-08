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

  constructor(private _fb: FormBuilder, private authService: AuthService, private router: Router) {
    this.loginForm = _fb.group({
      email: ['', Validators.required],
      password: ['', Validators.required]
    });
  }

  login() {
    if (this.isLoading) return;

    this.isLoading = true;
    this.showError = false;
    this.authService.login(this.loginForm.value)
      .pipe(
        finalize(() => this.isLoading = false)
      )
      .subscribe({
        next: _ => { this.router.navigate(['/dashboard']); },
        error: _ => { this.showError = true; }
      })
  }
}
