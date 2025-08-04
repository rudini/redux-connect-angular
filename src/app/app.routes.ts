import { Routes } from '@angular/router';

import {
  MyButtonComponent,
} from './components/my-button';
import { ButtonStore } from './store/store';

import { inject } from '@angular/core';
import { connect, ExtractInputs, ExtractOutputs } from './lib/connect';

type test = ExtractInputs<MyButtonComponent>;

type o = ExtractOutputs<MyButtonComponent>;

export const routes: Routes = [
  {
    path: '',
    component: connect(MyButtonComponent, () => {
      // Inject the store once inside this factory function or use imported functions
      const buttonStore = inject(ButtonStore);

      return {
        inputs: {
          label: buttonStore.label, // Use the injected store instance
          test: () => 'set from route', // Example of one time binding input
        },
        outputs: {
          clicked: (val: string) => (console.log('Button clicked:', val), buttonStore.handleClick(val)), // Use the injected store instance
          testChange: (value: string) => console.log('Model changed:', value), // Example of a model output
        },
      };
    }),
  },
];
