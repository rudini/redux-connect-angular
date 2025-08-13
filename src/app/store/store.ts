import { Injectable, signal } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class ButtonStore {
  #_label = signal('Click me now!');
  label = this.#_label.asReadonly();

  handleClicked(value: string) {
    console.log('Clicked with:', value);
    this.#_label.set('Thanks!');
  }
}
  