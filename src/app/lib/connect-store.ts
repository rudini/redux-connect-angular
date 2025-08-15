import { inject, isSignal, Type } from '@angular/core';
import {
  connect,
  ExtractOutputs,
  StrictExtractInputs,
  StrictExtractOutputs,
} from './connect';

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
    ) as StrictExtractInputs<InstanceType<TComp>>;

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
    ) as StrictExtractOutputs<InstanceType<TComp>>;

    return {
      inputs,
      outputs,
    };
  });
}
