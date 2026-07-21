/**
 * Internal dependencies
 */
import type { Editor } from './index';

/**
 * Switches to legacy (non-iframed) canvas.
 *
 * @deprecated The editor is now always iframed. This function will be
 *             removed in a future release.
 * @param      this
 */
export async function switchToLegacyCanvas( this: Editor ) {
	// eslint-disable-next-line no-console
	console.warn(
		'switchToLegacyCanvas is deprecated and will be removed in a future release. The editor is now always iframed.'
	);

	await this.page.waitForFunction( () => window?.wp?.blocks );

	await this.page.evaluate( () => {
		window.wp.blocks.registerBlockType( 'test/v2', {
			apiVersion: '2',
			title: 'test',
		} );
	} );
}
