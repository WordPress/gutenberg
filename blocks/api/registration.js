/* eslint no-console: [ 'error', { allow: [ 'error' ] } ] */

/**
 * Block settings keyed by block slug.
 *
 * @type {Object}
 */
const blocks = {};

/**
 * Slug of block handling unknown types.
 *
 * @type {?string}
 */
let unknownTypeHandler;

/**
 * Registers a new block provided a unique slug and an object defining its
 * behavior. Once registered, the block is made available as an option to any
 * editor interface where blocks are implemented.
 *
 * @param  {string}   slug     Block slug
 * @param  {Object}   settings Block settings
 * @return {?WPBlock}          The block, if it has been successfully
 *                             registered; otherwise `undefined`.
 */
export function registerBlockType( slug, settings ) {
	if ( typeof slug !== 'string' ) {
		console.error(
			'Block slugs must be strings.'
		);
		return;
	}
	if ( ! /^[a-z0-9-]+\/[a-z0-9-]+$/.test( slug ) ) {
		console.error(
			'Block slugs must contain a namespace prefix. Example: my-plugin/my-custom-block'
		);
		return;
	}
	if ( blocks[ slug ] ) {
		console.error(
			'Block "' + slug + '" is already registered.'
		);
		return;
	}
	const block = Object.assign( { slug }, settings );
	blocks[ slug ] = block;
	return block;
}

/**
 * Unregisters a block.
 *
 * @param  {string}   slug Block slug
 * @return {?WPBlock}      The previous block value, if it has been
 *                         successfully unregistered; otherwise `undefined`.
 */
export function unregisterBlockType( slug ) {
	if ( ! blocks[ slug ] ) {
		console.error(
			'Block "' + slug + '" is not registered.'
		);
		return;
	}
	const oldBlock = blocks[ slug ];
	delete blocks[ slug ];
	return oldBlock;
}

/**
 * Assigns slug of block handling unknown block types.
 *
 * @param {string} slug Block slug
 */
export function setUnknownTypeHandler( slug ) {
	unknownTypeHandler = slug;
}

/**
 * Retrieves slug of block handling unknown block types, or undefined if no
 * handler has been defined.
 *
 * @return {?string} Blog slug
 */
export function getUnknownTypeHandler() {
	return unknownTypeHandler;
}

/**
 * Returns a registered block type.
 *
 * @param  {string}  slug Block slug
 * @return {?Object}      Block type
 */
export function getBlockType( slug ) {
	return blocks[ slug ];
}

/**
 * Returns all registered blocks.
 *
 * @return {Array} Block settings
 */
export function getBlockTypes() {
	return Object.values( blocks );
}
