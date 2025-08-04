import { Injectable, signal } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class ButtonStore {
  private _label = signal('Click me');
  label = this._label.asReadonly();

  handleClick(value: string) {
    console.log('Clicked with:', value);
    this._label.set('Thanks!');
  }
}

