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

const EDITOR_STYLES_SELECTOR = '.editor-styles-wrapper';

function useDarkThemeBodyClassName( styles ) {
	return useCallback(
		( node ) => {
			if ( ! node ) {
				return;
			}

			const { ownerDocument } = node;
			const { defaultView, body } = ownerDocument;
			const canvas = ownerDocument.querySelector(
				EDITOR_STYLES_SELECTOR
			);
			const backgroundColor = defaultView
				.getComputedStyle( canvas, null )
				.getPropertyValue( 'background-color' );
			const color = tinycolor( backgroundColor );
			const isLight =
				// The default color is "transparent", which is
				// "rgba(0, 0, 0, 0)" through `getComputedStyle`.
				// `tinycolor` considers this te be be low luminance because it
				// is black and it doesn't seem to consider the opacity.
				color.getAlpha() === 0 || color.getLuminance() > 0.5;
			const action = isLight ? 'remove' : 'add';

			body.classList[ action ]( 'is-dark-theme' );
		},
		[ styles ]
	);
}

export default function EditorStyles( { styles } ) {
	const transformedStyles = useMemo(
		() => transformStyles( styles, EDITOR_STYLES_SELECTOR ),
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
