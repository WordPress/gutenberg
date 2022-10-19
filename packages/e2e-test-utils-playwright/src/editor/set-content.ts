/**
 * Internal dependencies
 */
import type { Editor } from './index';

/**
 * Set the content of the editor.
 *
 * @param  this
 * @param  html Serialized block HTML.
 */
async function setContent( this: Editor, html: string ) {
	await this.page.evaluate( ( _html ) => {
		// @ts-ignore (Reason: wp isn't typed).
		const blocks = window.wp.blocks.parse( _html );

		// @ts-ignore (Reason: wp isn't typed).
		window.wp.data.dispatch( 'core/block-editor' ).resetBlocks( blocks );
	}, html );
}

export { setContent };
