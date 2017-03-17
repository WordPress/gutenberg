export { default as Editable } from './components/editable';

/**
 * Block settings keyed by block name.
 *
 * @var {Object} blocks
 */
const blocks = {};

/**
 * Validates a block name and throws an error if it is invalid.
 *
 * @param {string} name Block name
 */
export function validateBlockName( name ) {
	if ( ! /^[a-z0-9-]+\/[a-z0-9-]+$/.test( name ) ) {
		throw new Error(
			'Block names must contain a namespace prefix.  Example:  my-plugin/my-custom-block'
		)
	}
}

/**
 * Registers a block.
 *
 * @param {string} name     Block name
 * @param {Object} settings Block settings
 */
export function registerBlock( name, settings ) {
	validateBlockName( name );
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
