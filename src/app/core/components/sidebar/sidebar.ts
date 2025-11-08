import { Component, OnDestroy, OnInit } from '@angular/core';
import { SidebarToggleService } from '../../services/sidebar-toggle-service';
import { Subscription } from 'rxjs';
import { SharedModule } from '../../../shared/modules/shared-module/shared-module';

@Component({
  selector: 'app-sidebar',
  imports: [SharedModule],
  templateUrl: './sidebar.html',
  styleUrl: './sidebar.scss'
})
export class Sidebar implements OnInit, OnDestroy {

  navbarToggleSubscription: Subscription | null = null;

  constructor(public sidebarToggle: SidebarToggleService) {

  }

  ngOnInit(): void {
    this.navbarToggleSubscription = this.sidebarToggle.isExpanded$.subscribe(res => {
      if (!res) {
        let sidebar = document.getElementById('sidebar');
        Array.from(sidebar!.getElementsByClassName('show')).forEach(ul => {
          ul.classList.remove('show');
          ul.previousElementSibling?.classList.remove('rotate');
        })
      }
    })
  }

  ngOnDestroy(): void {
    this.navbarToggleSubscription?.unsubscribe();
  }

  toggleSubMenu(buttonId: string) {

    if (!this.sidebarToggle.currentValue) {
      this.sidebarToggle.toggleSidebar();
    }

    let element = document.getElementById(buttonId);
    element?.nextElementSibling?.classList.toggle('show');
    element?.classList.toggle('rotate');
  }
}
