import { Signal } from '@angular/core';
import { ExtractInputs, ExtractOutputs } from './connect';

// Helper function to check if a value is a signal
function isSignal(value: unknown): value is Signal<unknown> {
  return value !== null && typeof value === 'function' && 'subscribe' in value;
}

// Helper function to merge multiple store instances into a single object
function mergeStores(...stores: object[]): Record<string, unknown> {
  const merged: Record<string, unknown> = {};

  for (const store of stores) {
    if (!store) continue;

    for (const prop of Object.getOwnPropertyNames(store)) {
      if (!prop.startsWith('#') && !prop.startsWith('_')) {
        merged[prop] = (store as Record<string, unknown>)[prop];
      }
    }

    const proto = Object.getPrototypeOf(store);
    if (proto && proto !== Object.prototype) {
      for (const prop of Object.getOwnPropertyNames(proto)) {
        const value = (store as Record<string, unknown>)[prop];
        if (prop !== 'constructor' && typeof value === 'function') {
          merged[prop] = value.bind(store);
        }
      }
    }
  }

  return merged;
}

// Helper function to convert handler method names to output event names
function handlerToOutputName(handlerName: string): string {
  // Convert 'handleClicked' to 'clicked', 'handleUserChange' to 'userChange', etc.
  const withoutHandle = handlerName.replace(/^handle/, '');
  // Convert first letter to lowercase
  return withoutHandle.charAt(0).toLowerCase() + withoutHandle.slice(1);
}

export function withAutoMapping<T>(
  ...stores: object[]
): {
  inputs: ExtractInputs<T>;
  outputs: ExtractOutputs<T>;
} {
  // Merge all stores into a single object
  const mergedStores = mergeStores(...stores);

  // Extract inputs (signals)
  const signalKeys = Object.keys(mergedStores).filter((key) =>
    isSignal(mergedStores[key])
  );

  const inputs = Object.fromEntries(
    signalKeys.map((key) => [key, mergedStores[key]])
  ) as ExtractInputs<T>;

  // Extract outputs (handle methods)
  const handlerKeys = Object.keys(mergedStores).filter(
    (key) => key.startsWith('handle') && typeof mergedStores[key] === 'function'
  );

  const outputs = Object.fromEntries(
    handlerKeys.map((key) => [
      handlerToOutputName(key),
      (value: unknown) => (mergedStores[key] as Function)(value),
    ])
  ) as ExtractOutputs<T>;

  // Handle model change outputs (for two-way binding)
  // Look for signals that might need change handlers
  const modelChangeOutputs = Object.fromEntries(
    signalKeys
      .filter((key) => {
        const handler = `handle${key.charAt(0).toUpperCase() + key.slice(1)}Change`;
        return typeof mergedStores[handler] === 'function';
      })
      .map((key) => {
        const handler = `handle${key.charAt(0).toUpperCase() + key.slice(1)}Change`;
        return [`${key}Change`, (value: unknown) => (mergedStores[handler] as Function)(value)];
      })
  );

  return {
    inputs,
    outputs: { ...outputs, ...modelChangeOutputs } as ExtractOutputs<T>,
  };
}
