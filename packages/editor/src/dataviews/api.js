/**
 * WordPress dependencies
 */
import { dispatch } from '@wordpress/data';

/**
 * Internal dependencies
 */
import { unlock } from '../lock-unlock';
import { store as editorStore } from '../store';

/**
 * @typedef {import('@wordpress/dataviews').Action} Action
 */

/**
 * Registers a new DataViews action.
 *
 * This is an experimental API and is subject to change.
 * it's only available in the Gutenberg plugin for now.
 *
 * @param {string} kind   Entity kind.
 * @param {string} name   Entity name.
 * @param {Action} config Action configuration.
 */

export function registerEntityAction( kind, name, config ) {
	const { registerEntityAction: _registerEntityAction } = unlock(
		dispatch( editorStore )
	);

	if ( globalThis.IS_GUTENBERG_PLUGIN ) {
		_registerEntityAction( kind, name, config );
	}
}

/**
 * Unregisters a DataViews action.
 *
 * This is an experimental API and is subject to change.
 * it's only available in the Gutenberg plugin for now.
 *
 * @param {string} kind     Entity kind.
 * @param {string} name     Entity name.
 * @param {string} actionId Action ID.
 */
export function unregisterEntityAction( kind, name, actionId ) {
	const { unregisterEntityAction: _unregisterEntityAction } = unlock(
		dispatch( editorStore )
	);

	if ( globalThis.IS_GUTENBERG_PLUGIN ) {
		_unregisterEntityAction( kind, name, actionId );
	}
}
