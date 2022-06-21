/**
 * Internal dependencies
 */
import type { Editor } from './index';

/**
 * Clicks the default block appender.
 *
 * @param {Editor} this
 * @param {string} name Block name.
 */
export async function transformBlockTo( this: Editor, name: string ) {
	await this.page.evaluate(
		( [ blockName ] ) => {
			// @ts-ignore (Reason: wp isn't typed)
			const clientIds = window.wp.data
				.select( 'core/block-editor' )
				.getSelectedBlockClientIds();
			// @ts-ignore (Reason: wp isn't typed)
			const blocks = window.wp.data
				.select( 'core/block-editor' )
				.getBlocksByClientId( clientIds );
			// @ts-ignore (Reason: wp isn't typed)
			window.wp.data.dispatch( 'core/block-editor' ).replaceBlocks(
				clientIds,
				// @ts-ignore (Reason: wp isn't typed)
				window.wp.blocks.switchToBlockType( blocks, blockName )
			);
		},
		[ name ]
	);
}
