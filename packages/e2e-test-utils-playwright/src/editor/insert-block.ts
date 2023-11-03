/**
 * Internal dependencies
 */
import type { Editor } from './index';

interface BlockRepresentation {
	name: string;
	attributes?: Object;
	innerBlocks?: BlockRepresentation[];
}

interface InsertedBlock {
	clientId: string;
	name: string;
	isValid: boolean;
	attributes: {
		content: string;
		dropCap: boolean;
	};
	innerBlocks: InsertedBlock[];
}

/**
 * Insert a block.
 *
 * @param this
 * @param blockRepresentation Inserted block representation.
 */
async function insertBlock(
	this: Editor,
	blockRepresentation: BlockRepresentation
) {
	await this.page.waitForFunction(
		() => window?.wp?.blocks && window?.wp?.data
	);

	const { clientId } = await this.page.evaluate( ( _blockRepresentation ) => {
		function recursiveCreateBlock( {
			name,
			attributes = {},
			innerBlocks = [],
		}: BlockRepresentation ): InsertedBlock {
			return window.wp.blocks.createBlock(
				name,
				attributes,
				innerBlocks.map( ( innerBlock ) =>
					recursiveCreateBlock( innerBlock )
				)
			);
		}
		const block = recursiveCreateBlock( _blockRepresentation );

		window.wp.data.dispatch( 'core/block-editor' ).insertBlock( block );

		return block;
	}, blockRepresentation );

	return this.canvas.locator( `#block-${ clientId }` );
}

export type { BlockRepresentation };
export { insertBlock };
