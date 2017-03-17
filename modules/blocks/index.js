export { default as Editable } from './components/editable';

/**
 * Block settings keyed by block name.
 *
 * @var {Object} blocks
 */
const blocks = {};

/**
 * Registers a block.
 *
 * @param {string} name     Block name
 * @param {Object} settings Block settings
 */
export function registerBlock( name, settings ) {
	if ( ! /^\w+\/\w+$/.test( name ) ) {
		throw new Error( 'Use a namespace for your block name please. Example: namespace/block' );
	}
	blocks[ name ] = Object.assign( { name }, settings );
}

/**
 * Returns settings associated with a block.
 *
 * @param  {string}  name Block name
 * @return {?Object}      Block settings
 */
export function getBlockSettings( name ) {
	return blocks[ name ];
}

/**
 * Returns all registered blocks.
 *
 * @return {Array} Block settings
 */
export function getBlocks() {
	return Object.values( blocks );
}
