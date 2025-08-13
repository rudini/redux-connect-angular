import { inject, isSignal, Type } from '@angular/core';
import { connect, ExtractInputs, ExtractOutputs } from './connect';

export function bindStore<T extends Type<any>, TComp extends Type<any>>(
  type: T,
  component: TComp
) {
  return connect(component, () => {
    const store = inject(type);

    const storeInputs = Object.getOwnPropertyNames(store).filter((key) =>
      isSignal(store[key])
    );
    const inputs = storeInputs.reduce(
      (acc: { [key: string]: any }, key) => ({
        ...acc,
        [key]: store[key],
      }),
      {}
    ) as ExtractInputs<InstanceType<TComp>>;

    const storeOutputs = Object.getOwnPropertyNames(
      Object.getPrototypeOf(store)
    ).filter(
      (key) => key.startsWith('handle') && typeof store[key] === 'function'
    );
    const outputs = storeOutputs.reduce(
      (acc: { [key: string]: any }, key) => ({
        ...acc,
        [key.replace('handle', '').toLowerCase()]: (value: any) =>
          store[key](value),
      }),
      {}
    ) as ExtractOutputs<InstanceType<TComp>>;

    return {
      inputs,
      outputs,
    };
  });
}
