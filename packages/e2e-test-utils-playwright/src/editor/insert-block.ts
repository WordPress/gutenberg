/**
 * Internal dependencies
 */
import type { Editor } from './index';

interface BlockRepresentation {
	name: string;
	attributes: Object;
	innerBlocks: BlockRepresentation[];
}

/**
 * Insert a block.
 *
 * @param {Editor}              this
 * @param {BlockRepresentation} blockRepresentation Inserted block representation.
 */
async function insertBlock(
	this: Editor,
	blockRepresentation: BlockRepresentation
) {
	await this.page.evaluate( ( _blockRepresentation ) => {
		function recursiveCreateBlock( {
			name,
			attributes = {},
			innerBlocks = [],
		}: BlockRepresentation ): Object {
			// @ts-ignore (Reason: wp isn't typed).
			return window.wp.blocks.createBlock(
				name,
				attributes,
				innerBlocks.map( ( innerBlock ) =>
					recursiveCreateBlock( innerBlock )
				)
			);
		}
		const block = recursiveCreateBlock( _blockRepresentation );

		// @ts-ignore (Reason: wp isn't typed).
		window.wp.data.dispatch( 'core/block-editor' ).insertBlock( block );
	}, blockRepresentation );
}

export type { BlockRepresentation };
export { insertBlock };
