/**
 * External dependencies
 */
import tinycolor from 'tinycolor2';

/**
 * WordPress dependencies
 */
import { useCallback, useMemo } from '@wordpress/element';

/**
 * Internal dependencies
 */
import transformStyles from '../../utils/transform-styles';

function useDarkThemeBodyClassName( styles ) {
	return useCallback(
		( node ) => {
			if ( ! node ) {
				return;
			}

			const { ownerDocument } = node;
			const { defaultView, body } = ownerDocument;

			// The real .editor-styles-wrapper element might not exist in the
			// DOM, so calculate the background color by creating a fake
			// wrapper.
			const canvas = ownerDocument.createElement( 'div' );
			canvas.classList.add( 'editor-styles-wrapper' );
			body.appendChild( canvas );
			const backgroundColor = defaultView
				.getComputedStyle( canvas, null )
				.getPropertyValue( 'background-color' );
			body.removeChild( canvas );

			// If background is transparent, it should be treated as light color.
			if (
				tinycolor( backgroundColor ).getLuminance() > 0.5 ||
				tinycolor( backgroundColor ).getAlpha() === 0
			) {
				body.classList.remove( 'is-dark-theme' );
			} else {
				body.classList.add( 'is-dark-theme' );
			}
		},
		[ styles ]
	);
}

export default function EditorStyles( { styles } ) {
	const transformedStyles = useMemo(
		() => transformStyles( styles, '.editor-styles-wrapper' ),
		[ styles ]
	);
	return (
		<>
			{ /* Use an empty style element to have a document reference,
			     but this could be any element. */ }
			<style ref={ useDarkThemeBodyClassName( styles ) } />
			{ transformedStyles.map( ( css, index ) => (
				<style key={ index }>{ css }</style>
			) ) }
		</>
	);
}
