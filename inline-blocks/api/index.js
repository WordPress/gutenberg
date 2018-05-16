/* eslint no-console: [ 'error', { allow: [ 'error' ] } ] */

/**
 * Inline Block type definitions keyed by inline block name.
 *
 * @type {Object.<string,WPInlineBlockType>}
 */
const inlineBlocks = {};

/**
 * Registers a new inline block provided a unique name and an object defining
 * its behavior. Once registered, the inline block is made available as an
 * option to any editor interface where inline blocks are implemented.
 *
 * @param {string} name     Inline Block name.
 * @param {Object} settings Inline Block settings.
 *
 * @return {?WPInlineBlock} The inline block, if it has been successfully
 *                           registered; otherwise `undefined`.
 */
export function registerInlineBlockType( name, settings ) {
	settings = {
		name,
		...settings,
	};

	if ( typeof name !== 'string' ) {
		console.error(
			'Inline Block names must be strings.'
		);
		return;
	}
	if ( ! /^[a-z][a-z0-9-]*\/[a-z][a-z0-9-]*$/.test( name ) ) {
		console.error(
			'Inline Block names must contain a namespace prefix, include only lowercase alphanumeric characters or dashes, and start with a letter. Example: my-plugin/my-custom-inline-block'
		);
		return;
	}
	if ( inlineBlocks[ name ] ) {
		console.error(
			'Inline Block "' + name + '" is already registered.'
		);
		return;
	}
	if ( ! ( 'title' in settings ) || settings.title === '' ) {
		console.error(
			'The inline block "' + name + '" must have a title.'
		);
		return;
	}
	if ( typeof settings.title !== 'string' ) {
		console.error(
			'Inline Block titles must be strings.'
		);
		return;
	}
	if ( ! settings.icon ) {
		settings.icon = 'block-default';
	}

	return inlineBlocks[ name ] = settings;
}

/**
 * Returns a registered inline block type.
 *
 * @param {string} name Inline Block name.
 *
 * @return {?Object} Inline Block type.
 */
export function getInlineBlockType( name ) {
	return inlineBlocks[ name ];
}

/**
 * Returns all registered inline blocks.
 *
 * @return {Array} Inline Block settings.
 */
export function getInlineBlockTypes() {
	return Object.values( inlineBlocks );
}
