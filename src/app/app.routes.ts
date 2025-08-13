import { Routes } from '@angular/router';

import { ButtonStore } from './store/store';

import { inject } from '@angular/core';
import { connect } from './lib/connect';
import { TestComponent } from './components/test';
import { bindStore } from './lib/connect-store';
import { MyButtonComponent } from './components/my-button';

// what if we can implement all components as dumb components and connect them to the store in the routes?
// what if we can use dependency injection to inject the store into the routes?
// what if we can use imported functions like static selectors form signal store to bind inputs and outputs?

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
          clicked: (val: string) => (
            console.log('Button clicked:', val), buttonStore.handleClicked(val)
          ), // Use the injected store instance
          testChange: (value: string) => console.log('Model changed:', value), // Example of a model output
        },
      };
    }),
  },
  {
    path: 'bindStore',
    loadComponent: () => import('./components/my-button').then(m => bindStore(ButtonStore, m.MyButtonComponent)),
  },
  {
    path: 'wrapped',
    loadComponent: () => import('./components/my-button').then(m => m.Wrapped),
  },
  {
    path: 'another',
    component: TestComponent,
  },
];
