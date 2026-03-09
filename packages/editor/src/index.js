// Ensure the StoreRegistry module augmentation is included in the declaration
// output so that consumers get typed access via store name (e.g. select('core/editor')).
/// <reference path="./store-registry.ts" preserve="true" />

/**
 * Internal dependencies
 */
import './hooks';

export { storeConfig, store } from './store';
export * from './components';
export * from './utils';
export * from './private-apis';
export * from './dataviews/api';

/*
 * Backward compatibility
 */
export { transformStyles } from '@wordpress/block-editor';
