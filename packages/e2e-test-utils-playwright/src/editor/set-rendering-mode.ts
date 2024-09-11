/**
 * Internal dependencies
 */
import type { Editor } from './index';

/**
 * Set the rendering mode of the editor.
 *
 * @param this
 * @param mode The rendering mode to set.
 */
async function setRenderingMode( this: Editor, mode: string = 'post-only' ) {
	await this.page.waitForFunction( () => window?.wp?.data );

	await this.page.evaluate( ( renderingMode ) => {
		// Set editing mode
		window.wp.data
			.dispatch( 'core/editor' )
			.setRenderingMode( renderingMode );
	}, mode );
}

export { setRenderingMode };
