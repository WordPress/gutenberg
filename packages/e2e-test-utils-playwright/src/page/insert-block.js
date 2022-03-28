/**
 * @typedef {Object} BlockRepresentation
 * @property {string}                 name        Block name.
 * @property {?Object}                attributes  Block attributes.
 * @property {?BlockRepresentation[]} innerBlocks Nested blocks.
 */

/**
 * @this {import('./').PageUtils}
 * @param {BlockRepresentation} blockRepresentation Inserted block representation.
 */
async function insertBlock( blockRepresentation ) {
	await this.page.evaluate( ( _blockRepresentation ) => {
		function recursiveCreateBlock( {
			name,
			attributes = {},
			innerBlocks = [],
		} ) {
			return window.wp.blocks.createBlock(
				name,
				attributes,
				innerBlocks.map( ( innerBlock ) =>
					recursiveCreateBlock( innerBlock )
				)
			);
		}
		const block = recursiveCreateBlock( _blockRepresentation );

		window.wp.data.dispatch( 'core/editor' ).insertBlock( block );
	}, blockRepresentation );
}

export { insertBlock };
