import { Component, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Subject, takeUntil } from 'rxjs';
import { AngularMaterialModule } from '../../../shared/modules/angular-material/angular-material-module';
import { SidebarToggleService } from '../../services/sidebar-toggle-service';
import { AuthService } from '../../services/auth-service';
import { IUser } from '../../domain/iuser';

@Component({
  selector: 'app-header',
  imports: [AngularMaterialModule, CommonModule],
  templateUrl: './header.html',
  styleUrl: './header.scss'
})
export class Header implements OnInit, OnDestroy {
  private readonly destroy$ = new Subject<void>();
  currentUser: IUser | null = null;
  isUserMenuOpen = false;

  constructor(
    public readonly sidebarToggle: SidebarToggleService,
    private readonly _authService: AuthService
  ) { }

  ngOnInit(): void {
    this.currentUser = this._authService.getCurrentUser();

    this._authService.currentUser$
      .pipe(takeUntil(this.destroy$))
      .subscribe(user => this.currentUser = user);
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  toggleSidebar(): void {
    this.sidebarToggle.toggleSidebar();
  }

  toggleUserMenu(): void {
    this.isUserMenuOpen = !this.isUserMenuOpen;
  }

  closeUserMenu(): void {
    this.isUserMenuOpen = false;
  }

  logout(): void {
    this.closeUserMenu();
    this._authService.logout();
  }
}
