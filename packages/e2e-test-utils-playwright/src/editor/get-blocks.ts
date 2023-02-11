/**
 * Internal dependencies
 */
import type { Editor } from './index';

/**
 * Returns the edited blocks.
 *
 * @param this
 *
 * @return  The blocks.
 */
export async function getBlocks( this: Editor ) {
	return await this.page.evaluate( () => {
		const blocks = window.wp.data.select( 'core/block-editor' ).getBlocks();

		// The editor might still contain an unmodified empty block even when it's technically "empty".
		if ( blocks.length === 1 ) {
			const blockName = blocks[ 0 ].name;
			if (
				blockName === window.wp.blocks.getDefaultBlockName() ||
				blockName === window.wp.blocks.getFreeformContentHandlerName()
			) {
				return [];
			}
		}

		return blocks;
	} );
}
