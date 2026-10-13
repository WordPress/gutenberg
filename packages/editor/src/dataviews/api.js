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

/*
 * Both functions below keep their parameters so an existing call still type
 * checks, and ignore them.
 */
/* eslint-disable no-unused-vars */

/**
 * Has no effect: every field of an entity is registered on the server.
 *
 * Register the field in PHP on the `wp_fields_api_init` action instead, with a
 * script module for the parts PHP cannot serialize (`render`, `Edit`,
 * `getElements`…).
 *
 * @deprecated since Gutenberg 24.2. Register the field in PHP on the
 *             `wp_fields_api_init` action instead, with a script module for its
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
		alternative: 'the `wp_fields_api_init` PHP action',
	} );
}

/**
 * Has no effect: every field of an entity is registered on the server.
 *
 * Unregister the field in PHP on the `wp_fields_api_init` action instead.
 *
 * @deprecated since Gutenberg 24.2. Unregister the field in PHP on the
 *             `wp_fields_api_init` action instead.
 *
 * @param {string} kind    Entity kind.
 * @param {string} name    Entity name.
 * @param {string} fieldId Field ID.
 */
export function unregisterEntityField( kind, name, fieldId ) {
	deprecated( 'wp.editor.unregisterEntityField', {
		since: '24.2',
		plugin: 'Gutenberg',
		alternative: 'the `wp_fields_api_init` PHP action',
	} );
}

/* eslint-enable no-unused-vars */
