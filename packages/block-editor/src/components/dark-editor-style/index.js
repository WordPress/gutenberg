/**
 * External dependencies
 */
import tinycolor from 'tinycolor2';

/**
 * WordPress dependencies
 */
import { useEffect } from '@wordpress/element';

export default function DarkEditorStyle( ref ) {
	useEffect( () => {
		const { ownerDocument } = ref.current;
		const editorStylesWrapper = ownerDocument.getElementsByClassName(
			'editor-styles-wrapper'
		);
		const backgroundColor = window
			.getComputedStyle( editorStylesWrapper[ 0 ], null )
			.getPropertyValue( 'background-color' );

		if ( tinycolor( backgroundColor ).getLuminance() > 0.5 ) {
			// Is 100 the right number?
			const body = ownerDocument.getElementsByTagName( 'body' )[ 0 ];
			// If we only remove it rather than adding it, then if themes don't declare support this will have no impact
			body.classList.remove( 'is-dark-theme' );
		}
	}, [ ref ] );
}
