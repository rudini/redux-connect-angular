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

export function connectState<
  TComp extends Type<any>,
  TStates extends readonly Type<any>[]
>(
  component: TComp,
  types: TStates,
  optionsFactory: (
    ...states: { [K in keyof TStates]: InstanceType<TStates[K]> }
  ) => {
    inputs: ExtractInputs<InstanceType<TComp>>;
    outputs: ExtractOutputs<InstanceType<TComp>>;
  } = () => ({
    inputs: {} as ExtractInputs<InstanceType<TComp>>,
    outputs: {} as ExtractOutputs<InstanceType<TComp>>,
  })
): Type<any> {
  @Component({
    template: ''
  })
  class ConnectedWrapper implements OnDestroy {
    readonly #envInjector = inject(EnvironmentInjector);
    readonly #vcr = inject(ViewContainerRef);
    readonly #compRef: ComponentRef<InstanceType<TComp>> | undefined;
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
