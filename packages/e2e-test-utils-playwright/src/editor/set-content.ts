/**
 * Internal dependencies
 */
import type { Editor } from './index';

/**
 * Set the content of the editor.
 *
 * @param this
 * @param html Serialized block HTML.
 */
async function setContent( this: Editor, html: string ) {
	await this.page.waitForFunction(
		() => window?.wp?.blocks && window?.wp?.data
	);

	await this.page.evaluate( ( _html ) => {
		const blocks = window.wp.blocks.parse( _html );

		window.wp.data.dispatch( 'core/block-editor' ).resetBlocks( blocks );
	}, html );
}

export { setContent };
