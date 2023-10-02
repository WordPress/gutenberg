/**
 * Internal dependencies
 */
import type { Editor } from './index';

/**
 * Switches to legacy (non-iframed) canvas.
 *
 * @param this
 */
export async function switchToLegacyCanvas( this: Editor ) {
	await this.page.waitForFunction( () => {
		if ( ! window?.wp?.blocks?.registerBlockType ) {
			return false;
		}
		window.wp.blocks.registerBlockType( 'test/v2', {
			apiVersion: '2',
			title: 'test',
		} );

		return true;
	} );

	this.useLegacyCanvas = true;
}
