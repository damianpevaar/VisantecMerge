import { Component, OnDestroy, OnInit } from '@angular/core';
import { Header } from "../../components/header/header";
import { AngularMaterialModule } from '../../../shared/modules/angular-material/angular-material-module';
import { Sidebar } from "../../components/sidebar/sidebar";
import { SharedModule } from '../../../shared/modules/shared-module/shared-module';
import { SidebarToggleService } from '../../services/sidebar-toggle-service';
import { Subscription } from 'rxjs';
import { RouterOutlet } from '@angular/router';

@Component({
  selector: 'app-dashboard-layout',
  imports: [SharedModule, AngularMaterialModule, Header, Sidebar, RouterOutlet],
  templateUrl: './dashboard-layout.html',
  styleUrl: './dashboard-layout.scss'
})
export class DashboardLayout implements OnInit, OnDestroy {

  navbarExtended: boolean = false;
  navbarToggleSubscription: Subscription | null = null;

  constructor(private sidebarToggleService: SidebarToggleService) {

  }

  ngOnInit(): void {
    this.sidebarToggleService.isExpanded$.subscribe(res => this.navbarExtended = res);
  }

  ngOnDestroy(): void {
    this.navbarToggleSubscription?.unsubscribe();
  }
}
