/**
 * Internal dependencies
 */
import type { Editor } from './index';

/**
 * Toggles the fixed toolbar option.
 *
 * @param this
 * @param setIsFixedToolbar Boolean value true/false for on/off.
 */
export async function toggleFixedToolbar(
	this: Editor,
	setIsFixedToolbar: boolean
) {
	await this.page.evaluate( ( _setIsFixedToolbar ) => {
		const { select, dispatch } = window.wp.data;
		const isCurrentlyFixed =
			select( 'core/edit-post' ).isFeatureActive( 'fixedToolbar' );
		if ( isCurrentlyFixed !== _setIsFixedToolbar ) {
			dispatch( 'core/edit-post' ).toggleFeature( 'fixedToolbar' );
		}
	}, setIsFixedToolbar );
}
