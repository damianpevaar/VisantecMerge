import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class SidebarToggleService {
  private _isExpanded = new BehaviorSubject<boolean>(true);
  isExpanded$ = this._isExpanded.asObservable();

  toggleSidebar() {
    this._isExpanded.next(!this._isExpanded.value);
  }

  get currentValue(): boolean {
    return this._isExpanded.getValue();
  }
}
