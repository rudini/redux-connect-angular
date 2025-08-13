import { Injectable, signal } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class GlobalStore {
  #_user = signal('John');
  user = this.#_user.asReadonly();
}
