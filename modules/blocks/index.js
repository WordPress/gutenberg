/* eslint-disable no-console */

/**
 * External dependencies
 */
import * as query from 'hpq';

export { query };
export { default as Editable } from './components/editable';
export { parse } from './post.pegjs';

/**
 * Block settings keyed by block slug.
 *
 * @var {Object} blocks
 */
const blocks = {};

/**
 * Registers a block.
 *
 * @param  {string}   slug     Block slug
 * @param  {Object}   settings Block settings
 * @return {?WPBlock}          The block, if it has been successfully
 *                             registered; otherwise `undefined`.
 */
export function registerBlock( slug, settings ) {
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
export function unregisterBlock( slug ) {
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
 * Returns settings associated with a block.
 *
 * @param  {string}  slug Block slug
 * @return {?Object}      Block settings
 */
export function getBlockSettings( slug ) {
	return blocks[ slug ];
}

/**
 * Returns all registered blocks.
 *
 * @return {Array} Block settings
 */
export function getBlocks() {
	return Object.values( blocks );
}

/**
 * Returns the element of a registered block node given a context and its
 * parsed metadata.
 *
 * @param  {Object}     blockNode Parsed block node
 * @param  {String}     context   Render context ("edit", "save")
 * @return {?WPElement}           Block element, or undefined if type unknown
 */
export function createBlockElement( blockNode, context = 'edit' ) {
	const { blockType, rawContent } = blockNode;

	// Verify block is of known type
	const block = getBlockSettings( blockType );
	if ( ! block ) {
		return;
	}

	// Merge attributes from parse with block implementation
	let { attrs } = blockNode;
	if ( 'function' === typeof block.attributes ) {
		attrs = { ...attrs, ...block.attributes( rawContent ) };
	} else if ( block.attributes ) {
		attrs = { ...attrs, ...query.parse( rawContent, block.attributes ) };
	}

	if ( 'function' === typeof block[ context ] ) {
		return block[ context ]( attrs );
	}
}
