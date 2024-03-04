/**
 * Internal dependencies
 */
import type { Editor } from './index';

interface BlockRepresentation {
	name: string;
	attributes?: Object;
	innerBlocks?: BlockRepresentation[];
}

/**
 * Insert a block.
 *
 * @param this
 * @param blockRepresentation Inserted block representation.
 * @param options
 * @param options.clientId    Client ID of the parent block to insert into.
 */
async function insertBlock(
	this: Editor,
	blockRepresentation: BlockRepresentation,
	{ clientId }: { clientId?: string } = {}
) {
	await this.page.waitForFunction(
		() => window?.wp?.blocks && window?.wp?.data
	);

	await this.page.evaluate(
		( [ _blockRepresentation, _clientId ] ) => {
			function recursiveCreateBlock( {
				name,
				attributes = {},
				innerBlocks = [],
			}: BlockRepresentation ): Object {
				return window.wp.blocks.createBlock(
					name,
					attributes,
					innerBlocks.map( ( innerBlock ) =>
						recursiveCreateBlock( innerBlock )
					)
				);
			}
			const block = recursiveCreateBlock( _blockRepresentation );

			window.wp.data
				.dispatch( 'core/block-editor' )
				.insertBlock( block, undefined, _clientId );
		},
		[ blockRepresentation, clientId ] as const
	);
}

export type { BlockRepresentation };
export { insertBlock };
