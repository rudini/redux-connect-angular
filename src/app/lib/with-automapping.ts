import { Signal } from '@angular/core';
import { ExtractInputs, ExtractOutputs } from './connect';

// Helper function to check if a value is a signal
function isSignal(value: any): value is Signal<any> {
  return value && typeof value === 'function' && 'subscribe' in value;
}

// Helper function to merge multiple store instances into a single object
function mergeStores<TStates extends readonly any[]>(
  ...stores: TStates
): Record<string, any> {
  const merged: Record<string, any> = {};

  stores.forEach((store) => {
    if (!store) return;

    // Get all own properties (including signals defined as properties)
    const ownProps = Object.getOwnPropertyNames(store);
    ownProps.forEach(prop => {
      if (!prop.startsWith('#') && !prop.startsWith('_')) { // Skip private properties
        merged[prop] = store[prop];
      }
    });

    // Get all prototype methods (including handle methods)
    const proto = Object.getPrototypeOf(store);
    if (proto && proto !== Object.prototype) {
      const protoProps = Object.getOwnPropertyNames(proto);
      protoProps.forEach(prop => {
        if (prop !== 'constructor' && typeof store[prop] === 'function') {
          merged[prop] = store[prop].bind(store); // Bind methods to original store instance
        }
      });
    }
  });

  return merged;
}

// Helper function to convert handler method names to output event names
function handlerToOutputName(handlerName: string): string {
  // Convert 'handleClicked' to 'clicked', 'handleUserChange' to 'userChange', etc.
  const withoutHandle = handlerName.replace(/^handle/, '');
  // Convert first letter to lowercase
  return withoutHandle.charAt(0).toLowerCase() + withoutHandle.slice(1);
}

export function withAutoMapping<
  TComp extends any,
  TStates extends readonly any[]
>(
  ...stores: { [K in keyof TStates]: TStates[K] }
): {
  inputs: ExtractInputs<TComp>;
  outputs: ExtractOutputs<TComp>;
} {
  // Merge all stores into a single object
  const mergedStores = mergeStores(...stores);

  // Extract inputs (signals)
  const storeInputs = Object.keys(mergedStores).filter((key) =>
    isSignal(mergedStores[key])
  );

  const inputs = storeInputs.reduce(
    (acc: { [key: string]: any }, key) => ({
      ...acc,
      [key]: mergedStores[key], // Direct reference to the signal
    }),
    {}
  ) as ExtractInputs<TComp>;

  // Extract outputs (handle methods)
  const storeOutputs = Object.keys(mergedStores).filter(
    (key) => key.startsWith('handle') && typeof mergedStores[key] === 'function'
  );

  const outputs = storeOutputs.reduce(
    (acc: { [key: string]: any }, key) => {
      const outputName = handlerToOutputName(key);
      return {
        ...acc,
        [outputName]: (value: any) => mergedStores[key](value),
      };
    },
    {}
  ) as ExtractOutputs<TComp>;

  // Handle model change outputs (for two-way binding)
  // Look for signals that might need change handlers
  const modelChangeOutputs = storeInputs.reduce(
    (acc: { [key: string]: any }, key) => {
      const changeHandlerName = `handle${key.charAt(0).toUpperCase() + key.slice(1)}Change`;
      if (mergedStores[changeHandlerName] && typeof mergedStores[changeHandlerName] === 'function') {
        acc[`${key}Change`] = (value: any) => mergedStores[changeHandlerName](value);
      }
      return acc;
    },
    {}
  );

  return {
    inputs,
    outputs: { ...outputs, ...modelChangeOutputs } as ExtractOutputs<TComp>,
  };
}
