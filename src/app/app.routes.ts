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
    component: connect(MyButtonComponent, () => { // <--- Here's the change: options is now a function
      // Inject the store once inside this factory function
      const buttonStore = inject(ButtonStore);

      return {
        inputs: {
          label: buttonStore.label(), // Use the injected store instance
          test: 'test', // Example of another input
        },
        outputs: {
          clicked: (val: string) => buttonStore.handleClick(val), // Use the injected store instance
          testChange: (value: string) => console.log('Model changed:', value), // Example of a model output
        },
      };
    }),
  },
];
