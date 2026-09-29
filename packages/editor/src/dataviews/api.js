import { dispatch } from '@wordpress/data';
import deprecated from '@wordpress/deprecated';
import { unlock } from '../lock-unlock';
import { store as editorStore } from '../store';

/**
 * @typedef {import('@wordpress/dataviews').Action} Action
 * @typedef {import('@wordpress/dataviews').Field} Field
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

/**
 * Registers a new DataViews field.
 *
 * This is an experimental API and is subject to change.
 * it's only available in the Gutenberg plugin for now.
 *
 * @deprecated since Gutenberg 24.2. Register the field in PHP on the
 *             `fields_api_init` action instead, with a script module for its
 *             JavaScript parts.
 *
 * @param {string} kind   Entity kind.
 * @param {string} name   Entity name.
 * @param {Field}  config Field configuration.
 */
export function registerEntityField( kind, name, config ) {
	deprecated( 'wp.editor.registerEntityField', {
		since: '24.2',
		plugin: 'Gutenberg',
		alternative: 'the `fields_api_init` PHP action',
	} );
	const { registerEntityField: _registerEntityField } = unlock(
		dispatch( editorStore )
	);

	if ( globalThis.IS_GUTENBERG_PLUGIN ) {
		_registerEntityField( kind, name, config );
	}
}

/**
 * Unregisters a DataViews field.
 *
 * This is an experimental API and is subject to change.
 * it's only available in the Gutenberg plugin for now.
 *
 * @deprecated since Gutenberg 24.2. Unregister the field in PHP on the
 *             `fields_api_init` action instead.
 *
 * @param {string} kind    Entity kind.
 * @param {string} name    Entity name.
 * @param {string} fieldId Field ID.
 */
export function unregisterEntityField( kind, name, fieldId ) {
	deprecated( 'wp.editor.unregisterEntityField', {
		since: '24.2',
		plugin: 'Gutenberg',
		alternative: 'the `fields_api_init` PHP action',
	} );
	const { unregisterEntityField: _unregisterEntityField } = unlock(
		dispatch( editorStore )
	);

	if ( globalThis.IS_GUTENBERG_PLUGIN ) {
		_unregisterEntityField( kind, name, fieldId );
	}
}
