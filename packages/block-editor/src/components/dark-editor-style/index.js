/**
 * External dependencies
 */
import tinycolor from 'tinycolor2';

/**
 * WordPress dependencies
 */
import { useCallback } from '@wordpress/element';

export default function useDarkEditorStyle() {
	return useCallback( ( node ) => {
		if ( ! node ) {
			return;
		}
		const backgroundColor = window
			.getComputedStyle( node, null )
			.getPropertyValue( 'background-color' );

		if ( tinycolor( backgroundColor ).getLuminance() > 0.5 ) {
			// Is 100 the right number?
			const { ownerDocument } = node;
			const body = ownerDocument.getElementsByTagName( 'body' )[ 0 ];
			// If we only remove it rather than adding it, then if themes don't declare support this will have no impact
			body.classList.remove( 'is-dark-theme' );
		}
	}, [] );
}
