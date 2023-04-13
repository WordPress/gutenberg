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
	await this.page.evaluate( ( _isFixed ) => {
		const { select, dispatch } = window.wp.data;
		const isCurrentlyFixed =
			select( 'core/edit-post' ).isFeatureActive( 'fixedToolbar' );
		if ( isCurrentlyFixed !== _isFixed ) {
			dispatch( 'core/edit-post' ).toggleFeature( 'fixedToolbar' );
		}
	}, isFixed );
}
