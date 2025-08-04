import {
  Component,
  EnvironmentInjector,
  inject,
  inputBinding,
  ModelSignal,
  outputBinding,
  Type,
  ViewContainerRef,
} from '@angular/core';
import { Signal, OutputEmitterRef } from '@angular/core';

export type ExtractInputs<T> = {
  [K in keyof T as T[K] extends Signal<infer U>
    ? K
    : never]: T[K] extends Signal<infer U> ? () => U : never;
};

export type ExtractOutputs<T> = {
  [K in keyof T as T[K] extends OutputEmitterRef<infer U>
    ? K
    : never]: T[K] extends OutputEmitterRef<infer U>
    ? (value: U) => void
    : never;
} & {
  [K in keyof T as T[K] extends ModelSignal<infer U>
    ? `${string & K}Change`
    : never]: T[K] extends ModelSignal<infer U> ? (value: U) => void : never;
};

export function connect<TComp extends Type<any>>(
  component: TComp,
  optionsFactory: () => {
    inputs: ExtractInputs<InstanceType<TComp>>;
    outputs: ExtractOutputs<InstanceType<TComp>>;
  } = () => ({
    inputs: {} as ExtractInputs<InstanceType<TComp>>,
    outputs: {} as ExtractOutputs<InstanceType<TComp>>,
  })
): Type<any> {
  @Component({
    template: `<ng-container #vc></ng-container>`,
  })
  class ConnectedWrapper {
    private readonly envInjector = inject(EnvironmentInjector);
    private readonly vcr = inject(ViewContainerRef);

    constructor() {
      const bindings = optionsFactory();
      const inputBindings = Object.entries(bindings.inputs || {}).map(
        ([key, value]) => inputBinding(key, value as () => any)
      );
      const outputBindings = Object.entries(bindings.outputs || {}).map(
        ([key, handler]) => outputBinding(key, handler as (value: any) => void)
      );
      this.vcr.createComponent(component, {
        environmentInjector: this.envInjector,
        bindings: [...inputBindings, ...outputBindings],
      });
    }
  }

  return ConnectedWrapper;
}
