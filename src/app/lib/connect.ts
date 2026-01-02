import {
  Component,
  ComponentRef,
  EnvironmentInjector,
  inject,
  inputBinding,
  ModelSignal,
  OnDestroy,
  outputBinding,
  Type,
  ViewContainerRef,
  Signal,
  OutputEmitterRef,
} from '@angular/core';

// Simplified: Extract all Signal properties as input factories
export type ExtractInputs<T> = {
  [K in keyof T as T[K] extends Signal<any> ? K : never]: T[K] extends Signal<infer U>
    ? () => U
    : never;
};

// Simplified: Extract OutputEmitterRef + ModelSignal change handlers
export type ExtractOutputs<T> = {
  [K in keyof T as T[K] extends OutputEmitterRef<any> ? K : never]: T[K] extends OutputEmitterRef<infer U>
    ? (value: U) => void
    : never;
} & {
  [K in keyof T as T[K] extends ModelSignal<any> ? `${string & K}Change` : never]: T[K] extends ModelSignal<infer U>
    ? (value: U) => void
    : never;
};

export type ConnectOptions<T> = {
  inputs: Partial<ExtractInputs<T>>;
  outputs: Partial<ExtractOutputs<T>>;
};

// Strict version that requires all inputs/outputs
export type StrictConnectOptions<T> = ConnectOptions<T>;

// Helper function for type inference
export function defineConnectOptions<T>(options: ConnectOptions<T>): ConnectOptions<T> {
  return options;
}

let wrapperIdCounter = 0;

export function connect<T>(
  component: Type<T>,
  optionsFactory: () => ConnectOptions<T> = () => ({ inputs: {}, outputs: {} })
): Type<any> {
  const wrapperId = `connect-wrapper-${++wrapperIdCounter}`;

  @Component({
    template: '',
    host: { 'data-wrapper-id': wrapperId },
  })
  class ConnectedWrapper implements OnDestroy {
    readonly #envInjector = inject(EnvironmentInjector);
    readonly #vcr = inject(ViewContainerRef);
    readonly #compRef: ComponentRef<T> | undefined;

    constructor() {
      const bindings = optionsFactory();
      const inputBindings = Object.entries(bindings.inputs || {}).map(
        ([key, value]) => inputBinding(key, value as () => any)
      );
      const outputBindings = Object.entries(bindings.outputs || {}).map(
        ([key, handler]) => outputBinding(key, handler as (value: any) => void)
      );
      this.#compRef = this.#vcr.createComponent(component, {
        environmentInjector: this.#envInjector,
        bindings: [...inputBindings, ...outputBindings],
      });
    }
    ngOnDestroy(): void {
      this.#compRef?.destroy();
    }
  }

  return ConnectedWrapper;
}
