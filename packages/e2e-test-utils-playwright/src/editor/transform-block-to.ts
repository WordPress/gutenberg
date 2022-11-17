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
			const clientIds = window.wp.data
				.select( 'core/block-editor' )
				.getSelectedBlockClientIds();
			const blocks = window.wp.data
				.select( 'core/block-editor' )
				.getBlocksByClientId( clientIds );
			window.wp.data
				.dispatch( 'core/block-editor' )
				.replaceBlocks(
					clientIds,
					window.wp.blocks.switchToBlockType( blocks, blockName )
				);
		},
		[ name ]
	);
}
