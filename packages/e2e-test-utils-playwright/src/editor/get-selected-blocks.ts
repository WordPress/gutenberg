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
 * Returns the currently selected blocks, in the same shape as `getBlocks`:
 * name, serialized attributes, and inner blocks. A single block selection
 * returns an array of one; no selection returns an empty array.
 */
export async function getSelectedBlocks( this: Editor ): Promise< Block[] > {
	await this.page.waitForFunction(
		() => window?.wp?.blocks && window?.wp?.data
	);

	return await this.page.evaluate( () => {
		function serializeAttributes( attributes: Record< string, unknown > ) {
			return Object.fromEntries(
				Object.entries( attributes ).map( ( [ key, value ] ) => {
					// Serialize RichTextData to string.
					if ( value instanceof window.wp.richText.RichTextData ) {
						return [ key, ( value as string ).toString() ];
					}
					return [ key, value ];
				} )
			);
		}

		function recursivelyTransformBlocks( blocks: Block[] ): Block[] {
			return blocks.map( ( block ) => ( {
				name: block.name,
				attributes: serializeAttributes( block.attributes ),
				innerBlocks: recursivelyTransformBlocks( block.innerBlocks ),
			} ) );
		}

		const { getSelectedBlockClientIds, getBlock } =
			window.wp.data.select( 'core/block-editor' );

		return recursivelyTransformBlocks(
			getSelectedBlockClientIds().map( getBlock ) as Block[]
		);
	} );
}
