/**
 * Internal dependencies
 */
import type { Editor } from './index';

/**
 * Set the rendering mode of the editor.
 *
 * @param this
 */
async function setRenderingMode( this: Editor ) {
	await this.page.waitForFunction( () => window?.wp?.data );

	// Set editing mode
	window.wp.data.dispatch( 'core/editor' ).setRenderingMode( 'post-only' );
}

export { setRenderingMode };
