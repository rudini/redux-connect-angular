import { Component, output, input, model } from '@angular/core';

@Component({
  standalone: true,
  selector: 'MyButton',
  template: `
    <button (click)="clickedHandler()">
      {{ label() }}
    </button>

    <p>{{ test() }}</p>
  `,
})
export class MyButtonComponent {
  label = input.required<string>(); // Example of a required input
  clicked = output<string>(); // Example of an output event
  test = model<string>('default value'); // Example of a model input

  clickedHandler() {
    this.clicked.emit(this.label());
    this.test.set('Button clicked!'); // Update the model input
  }
}
