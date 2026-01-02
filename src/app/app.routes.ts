import { Routes } from '@angular/router';

import { ButtonStore } from './store/store';

import { inject } from '@angular/core';
import { connect, StrictConnectOptions } from './lib/connect';
import { TestComponent } from './components/test';
import { MyButtonComponent } from './components/my-button';
import { connectState } from './lib/connect-state';
import { GlobalStore } from './store/global-store';
import { withAutoMapping } from './lib/with-automapping';

export const routes: Routes = [
  {
    path: '',
    component: connect(MyButtonComponent, () => {
      // Inject the store once inside this factory function or use imported functions
      const buttonStore = inject(ButtonStore);
      const globalStore = inject(GlobalStore);

      return {
        inputs: {
          label: () => buttonStore.label(), // Use the injected store instance
          test: () => 'set from route', // Example of one time binding input
          user: () => globalStore.user(), // Example of using another store

        },
        outputs: {
          clicked: (val: string) => (
            console.log('Button clicked:', val), buttonStore.handleClicked(val)
          ), // Use the injected store instance
          testChange: (value: string) => console.log('Model changed:', value), // Example of a model output
        },
      } satisfies StrictConnectOptions<MyButtonComponent>;
    }),
  },
  {
    path: 'wrapped',
    loadComponent: () =>
      import('./components/my-button').then((m) => m.Wrapped),
  },
  {
    path: 'connect-with-states',
    loadComponent: () =>
      import('./components/my-button').then((m) =>
        connectState(
          m.MyButtonComponent,
          [ButtonStore, GlobalStore] as const,
          (buttonstate, globalstate) => {
            return {
              inputs: {
                label: buttonstate.label,
                test: () => 'set from route',
                user: globalstate.user,
              },
              outputs: {
                clicked: (val: string) => (
                  console.log('Button clicked:', val),
                  buttonstate.handleClicked(val)
                ),
                testChange: (value: string) =>
                  console.log('Model changed:', value),
              },
            } satisfies StrictConnectOptions<MyButtonComponent>;
          }
        )
      ),
  },
    {
    path: 'connect-with-states',
    loadComponent: () =>
      import('./components/my-button').then((m) =>
        connectState(
          m.MyButtonComponent,
          [ButtonStore, GlobalStore],
          withAutoMapping
        )
      ),
  },
  {
    path: 'another',
    component: TestComponent,
  },
];
