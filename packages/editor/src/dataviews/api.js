import deprecated from '@wordpress/deprecated';

/**
 * @typedef {import('@wordpress/dataviews').Action} Action
 * @typedef {import('@wordpress/dataviews').Field} Field
 */

/*
 * The functions below keep their parameters so an existing call still type
 * checks, and ignore them.
 */
/* eslint-disable no-unused-vars */

/**
 * Has no effect: every action of an entity is registered on the server.
 *
 * Register the action in PHP on the `wp_entity_actions_api_init` action instead,
 * with a script module for the parts PHP cannot serialize (`callback`,
 * `RenderModal`, `isEligible`…).
 *
 * @deprecated since Gutenberg 24.3. Register the action in PHP on the
 *             `wp_entity_actions_api_init` action instead, with a script module for
 *             its JavaScript parts.
 *
 * @param {string} kind   Entity kind.
 * @param {string} name   Entity name.
 * @param {Action} config Action configuration.
 */
export function registerEntityAction( kind, name, config ) {
	deprecated( 'wp.editor.registerEntityAction', {
		since: '24.3',
		plugin: 'Gutenberg',
		alternative: 'the `wp_entity_actions_api_init` PHP action',
	} );
}

/**
 * Has no effect: every action of an entity is registered on the server.
 *
 * Unregister the action in PHP on the `wp_entity_actions_api_init` action instead.
 *
 * @deprecated since Gutenberg 24.3. Unregister the action in PHP on the
 *             `wp_entity_actions_api_init` action instead.
 *
 * @param {string} kind     Entity kind.
 * @param {string} name     Entity name.
 * @param {string} actionId Action ID.
 */
export function unregisterEntityAction( kind, name, actionId ) {
	deprecated( 'wp.editor.unregisterEntityAction', {
		since: '24.3',
		plugin: 'Gutenberg',
		alternative: 'the `wp_entity_actions_api_init` PHP action',
	} );
}

/**
 * Has no effect: the fields of an entity are registered on the server.
 *
 * Register the field in PHP, with `wp_register_entity_fields()` on the
 * `wp_entity_fields_api_init` action, and with a script module for the parts
 * PHP cannot serialize (`render`, `Edit`, `getElements`…).
 *
 * @deprecated since Gutenberg 24.3. Register the field in PHP with
 *             `wp_register_entity_fields()` instead.
 *
 * @param {string} kind   Entity kind.
 * @param {string} name   Entity name.
 * @param {Field}  config Field configuration.
 */
export function registerEntityField( kind, name, config ) {
	deprecated( 'wp.editor.registerEntityField', {
		since: '24.3',
		plugin: 'Gutenberg',
		alternative: 'wp_register_entity_fields() in PHP',
	} );
}

/**
 * Has no effect: the fields of an entity are registered on the server.
 *
 * Unregister the field in PHP, with `wp_unregister_entity_fields()` on the
 * `wp_entity_fields_api_init` action.
 *
 * @deprecated since Gutenberg 24.3. Unregister the field in PHP with
 *             `wp_unregister_entity_fields()` instead.
 *
 * @param {string} kind    Entity kind.
 * @param {string} name    Entity name.
 * @param {string} fieldId Field ID.
 */
export function unregisterEntityField( kind, name, fieldId ) {
	deprecated( 'wp.editor.unregisterEntityField', {
		since: '24.3',
		plugin: 'Gutenberg',
		alternative: 'wp_unregister_entity_fields() in PHP',
	} );
}

/* eslint-enable no-unused-vars */
