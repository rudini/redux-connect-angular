import { Component, output, input, model, OnDestroy } from '@angular/core';
import { RouterLink, RouterModule } from '@angular/router';

@Component({
  standalone: true,
  selector: 'MyButton',
  imports: [RouterModule, RouterLink],
  template: `
    <button (click)="clickedHandler()">
      {{ label() }}
    </button>

    <p>{{ test() }}</p>

    <a [routerLink]="['/another']">Go to another page</a>
  `,
})
export class MyButtonComponent implements OnDestroy {
  label = input.required<string>(); // Example of a required input
  clicked = output<string>(); // Example of an output event
  test = model<string>('default value'); // Example of a model input

  clickedHandler() {
    this.clicked.emit(this.label()); // Emit the clicked event with the label or a default message
    this.test.set('Button clicked!'); // Update the model input
  }

    ngOnDestroy(): void {
      console.log('MyButtonComponent destroyed'); // Cleanup logic if needed
  }
}
