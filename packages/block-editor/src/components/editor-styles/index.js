/**
 * External dependencies
 */
import { colord, extend } from 'colord';
import namesPlugin from 'colord/plugins/names';
import a11yPlugin from 'colord/plugins/a11y';

/**
 * WordPress dependencies
 */
import { SVG } from '@wordpress/components';
import { useCallback, useMemo } from '@wordpress/element';

/**
 * Internal dependencies
 */
import transformStyles from '../../utils/transform-styles';

const EDITOR_STYLES_SELECTOR = '.editor-styles-wrapper';
extend( [ namesPlugin, a11yPlugin ] );

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

			let backgroundColor;

			if ( ! canvas ) {
				// The real .editor-styles-wrapper element might not exist in the
				// DOM, so calculate the background color by creating a fake
				// wrapper.
				const tempCanvas = ownerDocument.createElement( 'div' );
				tempCanvas.classList.add( 'editor-styles-wrapper' );
				body.appendChild( tempCanvas );

				backgroundColor = defaultView
					.getComputedStyle( tempCanvas, null )
					.getPropertyValue( 'background-color' );

				body.removeChild( tempCanvas );
			} else {
				backgroundColor = defaultView
					.getComputedStyle( canvas, null )
					.getPropertyValue( 'background-color' );
			}
			const colordBackgroundColor = colord( backgroundColor );
			// If background is transparent, it should be treated as light color.
			if (
				colordBackgroundColor.luminance() > 0.5 ||
				colordBackgroundColor.alpha() === 0
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
		() =>
			transformStyles(
				styles.filter( ( style ) => style?.css ),
				EDITOR_STYLES_SELECTOR
			),
		[ styles ]
	);

	const transformedSvgs = useMemo(
		() =>
			styles
				.filter( ( style ) => style.__unstableType === 'svgs' )
				.map( ( style ) => style.assets )
				.join( '' ),
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
			<SVG
				xmlns="http://www.w3.org/2000/svg"
				viewBox="0 0 0 0"
				width="0"
				height="0"
				role="none"
				style={ {
					visibility: 'hidden',
					position: 'absolute',
					left: '-9999px',
					overflow: 'hidden',
				} }
				dangerouslySetInnerHTML={ { __html: transformedSvgs } }
			/>
		</>
	);
}
