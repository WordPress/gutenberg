// Ensure the StoreRegistry module augmentation is included in the declaration
// output so that consumers get typed access via store name (e.g. select('core')).
/// <reference path="./store-registry.ts" preserve="true" />
export { store } from './store';

/**
 * Enums cannot be exported private without losing the ability to narrow types
 * based on their values (they blur to string type).
 */
export { SelectionType } from './utils/crdt-user-selections';

export { default as EntityProvider } from './entity-provider';
export * from './entity-provider';
export * from './entity-types';
export * from './awareness/types';
export * from './fetch';
export * from './hooks';
export * from './private-apis';
export * from './types';
