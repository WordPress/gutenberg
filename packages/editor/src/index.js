/**
 * WordPress dependencies
 */
import { createSlotFill } from '@wordpress/components';

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

export const VisualEditorOverlay = createSlotFill( 'VisualEditorOverlay' );
