export { default as Editable } from './components/editable';

/**
 * Block settings keyed by block slug.
 *
 * @var {Object} blocks
 */
const blocks = {};

/**
 * Validates a block slug and throws an error if it is invalid.
 *
 * @param {string} slug Block slug
 */
export function validateBlockSlug( slug ) {
	if ( ! /^[a-z0-9-]+\/[a-z0-9-]+$/.test( slug ) ) {
		throw new Error(
			'Block slugs must contain a namespace prefix.  Example:  my-plugin/my-custom-block'
		)
	}
}

/**
 * Registers a block.
 *
 * @param {string} slug     Block slug
 * @param {Object} settings Block settings
 */
export function registerBlock( slug, settings ) {
	validateBlockSlug( slug );
	blocks[ slug ] = Object.assign( { slug }, settings );
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
