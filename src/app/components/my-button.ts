import {
  Component,
  output,
  input,
  model,
  OnDestroy,
  inject,
} from '@angular/core';
import { RouterLink, RouterModule } from '@angular/router';
import { connect, StrictConnectOptions } from '../lib/connect';
import { ButtonStore } from '../store/store';

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
  user = input<string>();

  clickedHandler() {
    this.clicked.emit(this.label()); // Emit the clicked event with the label or a default message
    this.test.set('Button clicked!'); // Update the model input
  }

  ngOnDestroy(): void {
    console.log('MyButtonComponent destroyed'); // Cleanup logic if needed
  }
}

export const Wrapped = connect(MyButtonComponent, () => {
  // Inject the store once inside this factory function or use imported functions
  const buttonStore = inject(ButtonStore);

  return {
    inputs: {
      label: buttonStore.label, // Use the injected store instance
      test: () => 'set from route', // Example of one time binding input
    },
    outputs: {
      clicked: (val: string) => (
        console.log('Button clicked:', val), buttonStore.handleClicked(val)
      ), // Use the injected store instance
      testChange: (value: string) => console.log('Model changed:', value), // Example of a model output
    },
  } satisfies StrictConnectOptions<MyButtonComponent>;
});
