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

type NoExtraProps<Shape, Actual extends Shape> = Actual & {
  [K in Exclude<keyof Actual, keyof Shape>]: never;
};

export type StrictExtractInputs<T> = NoExtraProps<
  ExtractInputs<T>,
  ExtractInputs<T>
>;
export type StrictExtractOutputs<T> = NoExtraProps<
  ExtractOutputs<T>,
  ExtractOutputs<T>
>;

export type StrictConnectOptions<T> = {
  inputs: StrictExtractInputs<T>;
  outputs: StrictExtractOutputs<T>;
};

export function defineConnectOptions<T>(
  options: StrictConnectOptions<T>
): StrictConnectOptions<T> {
  return options;
}

export function connect<TComp extends Type<any>>(
  component: TComp,
  optionsFactory: () => StrictConnectOptions<TComp> = () => ({
    inputs: {} as StrictExtractInputs<TComp>,
    outputs: {} as StrictExtractOutputs<TComp>,
  })
): Type<any> {
  @Component({
    template: '',
  })
  class ConnectedWrapper implements OnDestroy {
    readonly #envInjector = inject(EnvironmentInjector);
    readonly #vcr = inject(ViewContainerRef);
    readonly #compRef: ComponentRef<InstanceType<TComp>> | undefined;

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
