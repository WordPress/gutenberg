/**
 * Block settings keyed by block slug.
 *
 * @var {Object} blocks
 */
const blocks = {};

/**
 * Registers a block.
 *
 * @param {string} slug     Block slug
 * @param {Object} settings Block settings
 * @return {Boolean}        Whether the block has been successfuly registered
 */
export function registerBlock( slug, settings ) {
	if ( typeof slug !== 'string' ) {
		console.error( // eslint-disable-line no-console
			'Block slugs must be strings.'
		);
		return false;
	}
	if ( ! /^[a-z0-9-]+\/[a-z0-9-]+$/.test( slug ) ) {
		console.error( // eslint-disable-line no-console
			'Block slugs must contain a namespace prefix. Example: my-plugin/my-custom-block'
		);
		return false;
	}
	if ( blocks[ slug ] ) {
		console.error( // eslint-disable-line no-console
			'Block "' + slug + '" is already registered.'
		);
		return false;
	}
	blocks[ slug ] = Object.assign( { slug }, settings );
	return true;
}

/**
 * Unregisters a block.
 *
 * @param {string} slug Block slug
 */
export function unregisterBlock( slug ) {
	if ( ! blocks[ slug ] ) {
		throw new Error(
			'Block "' + slug + '" is not registered.'
		);
	}
	delete blocks[ slug ];
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
