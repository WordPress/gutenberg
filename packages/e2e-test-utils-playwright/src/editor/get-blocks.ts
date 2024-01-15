/**
 * Internal dependencies
 */
import type { Editor } from './index';

type Block = {
	name: string;
	attributes: Record< string, unknown >;
	innerBlocks: Block[];
};

/**
 * Returns the edited blocks.
 *
 * @param this
 * @param options
 * @param options.clientId Limit the results to be only under a partial tree of the specified clientId.
 * @param options.full     Whether to return the full block data or just the name and attributes.
 *
 * @return  The blocks.
 */
export async function getBlocks(
	this: Editor,
	{ clientId, full = false }: { clientId?: string; full?: boolean } = {}
) {
	await this.page.waitForFunction(
		() => window?.wp?.blocks && window?.wp?.data
	);

	return await this.page.evaluate(
		( [ _full, _clientId ] ) => {
			// Remove other unpredictable properties like clientId from blocks for testing purposes.
			function recursivelyTransformBlocks( blocks: Block[] ): Block[] {
				return blocks.map( ( block ) => ( {
					name: block.name,
					attributes: block.attributes,
					innerBlocks: recursivelyTransformBlocks(
						block.innerBlocks
					),
				} ) );
			}

			const blocks = window.wp.data
				.select( 'core/block-editor' )
				.getBlocks( _clientId ) as Block[];

			// The editor might still contain an unmodified empty block even when it's technically "empty".
			if (
				blocks.length === 1 &&
				window.wp.blocks.isUnmodifiedDefaultBlock( blocks[ 0 ] )
			) {
				return [];
			}

			return _full ? blocks : recursivelyTransformBlocks( blocks );
		},
		[ full, clientId ]
	);
}
