/**
 * Internal dependencies
 */
import type { Editor } from './index';

/**
 * Returns the edited blocks.
 *
 * @param  this
 *
 * @return  The blocks.
 */
export async function getBlocks( this: Editor ) {
	return await this.page.evaluate( () => {
		// The editor might still contain an unmodified empty block even when it's technically "empty".
		if ( window.wp.data.select( 'core/editor' ).isEditedPostEmpty() ) {
			return [];
		}
		return window.wp.data.select( 'core/block-editor' ).getBlocks();
	} );
}
