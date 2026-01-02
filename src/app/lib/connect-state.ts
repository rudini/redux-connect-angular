import {
  Component,
  ComponentRef,
  EnvironmentInjector,
  inject,
  inputBinding,
  OnDestroy,
  outputBinding,
  Type,
  ViewContainerRef,
} from '@angular/core';
import { ExtractInputs, ExtractOutputs } from './connect';

let stateWrapperIdCounter = 0;

export function connectState<T, TStates extends Type<any>[]>(
  component: Type<T>,
  types: TStates,
  optionsFactory: (
    ...states: { [K in keyof TStates]: InstanceType<TStates[K]> }
  ) => {
    inputs: Partial<ExtractInputs<T>>;
    outputs: Partial<ExtractOutputs<T>>;
  } = () => ({ inputs: {}, outputs: {} })
): Type<any> {
  const wrapperId = `connect-state-wrapper-${++stateWrapperIdCounter}`;

  @Component({
    template: '',
    host: { 'data-wrapper-id': wrapperId },
  })
  class ConnectedWrapper implements OnDestroy {
    readonly #envInjector = inject(EnvironmentInjector);
    readonly #vcr = inject(ViewContainerRef);
    readonly #compRef: ComponentRef<T> | undefined;
    readonly #instances: { [K in keyof TStates]: InstanceType<TStates[K]> };

    constructor() {
      this.#instances = types.map((t) => inject(t)) as {
        [K in keyof TStates]: InstanceType<TStates[K]>;
      };

      const bindings = optionsFactory(...this.#instances);
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
