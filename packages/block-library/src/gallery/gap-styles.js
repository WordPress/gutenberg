/**
 * WordPress dependencies
 */
import {
	__experimentalGetGapCSSValue as getGapCSSValue,
	useStyleOverride,
	useSettings,
} from '@wordpress/block-editor';
import { privateApis as globalStylesEnginePrivateApis } from '@wordpress/global-styles-engine';

/**
 * Internal dependencies
 */
import { unlock } from '../lock-unlock';

const { getResponsiveMediaQueries } = unlock( globalStylesEnginePrivateApis );

// --gallery-block--gutter-size is deprecated. --wp--style--gallery-gap-default should be used by themes that want to set a default
// gap on the gallery.
const FALLBACK_VALUE = `var( --wp--style--gallery-gap-default, var( --gallery-block--gutter-size, var( --wp--style--block-gap, 0.5em ) ) )`;

function getGalleryGapCustomPropertyStyle( selector, blockGap ) {
	let column = FALLBACK_VALUE;
	if ( blockGap ) {
		column =
			typeof blockGap === 'string'
				? getGapCSSValue( blockGap ) || FALLBACK_VALUE
				: getGapCSSValue( blockGap?.left ) || FALLBACK_VALUE;
	}

	// The unstable gallery gap calculation requires a real value (such as `0px`) and not `0`.
	return `${ selector } {
		--wp--style--unstable-gallery-gap: ${ column === '0' ? '0px' : column }
	}`;
}

export default function GalleryGapCustomProperties( { style, clientId } ) {
	const selector = `#block-${ clientId }`;
	const [ viewportSettings ] = useSettings( 'viewport' );
	let gap = getGalleryGapCustomPropertyStyle(
		selector,
		style?.spacing?.blockGap
	);

	Object.entries( getResponsiveMediaQueries( viewportSettings ) ).forEach(
		( [ viewport, mediaQuery ] ) => {
			const viewportBlockGap = style?.[ viewport ]?.spacing?.blockGap;
			if ( viewportBlockGap === undefined || viewportBlockGap === null ) {
				return;
			}

			gap += `${ mediaQuery }{${ getGalleryGapCustomPropertyStyle(
				selector,
				viewportBlockGap
			) }}`;
		}
	);

	useStyleOverride( { css: gap } );

	return null;
}
