/**
 * Internal dependencies
 */
import type { Editor } from './index';

/**
 * Toggles the fixed toolbar option.
 *
 * @param this
 * @param isFixed Boolean value true/false for on/off.
 */
export async function setIsFixedToolbar( this: Editor, isFixed: boolean ) {
	await this.page.waitForFunction( () => window?.wp?.data );

	await this.page.evaluate( ( _isFixed ) => {
		window.wp.data
			.dispatch( 'core/preferences' )
			.set( 'core', 'fixedToolbar', _isFixed );
	}, isFixed );
}
