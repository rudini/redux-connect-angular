import {
  Component,
  ComponentRef,
  effect,
  EnvironmentInjector,
  inject,
  ModelSignal,
  runInInjectionContext,
  Type,
  ViewContainerRef,
} from '@angular/core';
import { Signal, OutputEmitterRef } from '@angular/core';

// Utility types for extracting inputs and outputs from a component
export type ExtractInputs<T> = {
  [K in keyof T as T[K] extends Signal<infer U> ? K : never]:
    T[K] extends Signal<infer U> ? U : never;
};


export type ExtractOutputs<T> = {
  // Existing logic for explicit outputs
  [K in keyof T as T[K] extends OutputEmitterRef<infer U> ? K : never]:
    T[K] extends OutputEmitterRef<infer U> ? (value: U) => void : never;
} & {
  // New logic for model signals
  [K in keyof T as T[K] extends ModelSignal<infer U> ? `${string & K}Change` : never]:
    T[K] extends ModelSignal<infer U> ? (value: U) => void : never;
};

export function connect<TComp extends Type<any>>(
  component: TComp,
  // Now options is a function that returns the actual inputs/outputs object
  optionsFactory: () => {
    inputs?: ExtractInputs<InstanceType<TComp>>;
    outputs?: ExtractOutputs<InstanceType<TComp>>;
  } = () => ({}) // Default to an empty object if no factory is provided
): Type<any> {
  @Component({
    template: `<ng-container #vc></ng-container>`,
  })
  class ConnectedWrapper {
    private readonly envInjector = inject(EnvironmentInjector);
    private readonly vcr = inject(ViewContainerRef);
    private compRef: ComponentRef<TComp> | undefined;

    constructor() {
      effect(() => {
        if (!this.compRef) {
          this.vcr.clear();
          this.compRef = this.vcr.createComponent(component, {
            environmentInjector: this.envInjector,
          });
        }

        const compRef = this.compRef;

        // Run the optionsFactory in the injection context to get inputs and outputs
        runInInjectionContext(this.envInjector, () => {
          const { inputs = {}, outputs = {} } = optionsFactory(); // Execute the factory

          for (const [key, value] of Object.entries(inputs)) {
            compRef.setInput?.(key as any, value);
          }

          for (const [key, handler] of Object.entries(outputs)) {
            const output = (compRef.instance as any)[key];
            if (output instanceof OutputEmitterRef) {
              const subscription = output.subscribe(
                handler as (value: unknown) => void
              );
              compRef.onDestroy(() => subscription.unsubscribe());
            }
          }
        });
      });
    }
  }

  return ConnectedWrapper;
}
