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
} from '@angular/core';
import { Signal, OutputEmitterRef } from '@angular/core';

export type ExtractInputs<T> = {
  [K in keyof T as T[K] extends Signal<infer U>
    ? undefined extends U
      ? K
      : never
    : never]?: T[K] extends Signal<infer U> ? () => U : never;
} & {
  [K in keyof T as T[K] extends Signal<infer U>
    ? undefined extends U
      ? never
      : K
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
  class ConnectedWrapper implements OnDestroy {
    private readonly envInjector = inject(EnvironmentInjector);
    private readonly vcr = inject(ViewContainerRef);
    private compRef: ComponentRef<TComp> | undefined;

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
    ngOnDestroy(): void {
      this.compRef?.destroy();
    }
  }

  return ConnectedWrapper;
}
