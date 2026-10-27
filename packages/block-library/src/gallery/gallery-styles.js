import {
	__experimentalGetGapCSSValue as getGapCSSValue,
	privateApis as blockEditorPrivateApis,
	store as blockEditorStore,
	useStyleOverride,
	useSettings,
} from '@wordpress/block-editor';
import { useSelect } from '@wordpress/data';
import { privateApis as globalStylesEnginePrivateApis } from '@wordpress/global-styles-engine';
import { unlock } from '../lock-unlock';
import { getGalleryResponsiveCSS } from './responsive-styles';

const { getResponsiveMediaQueries } = unlock( globalStylesEnginePrivateApis );
const { globalStylesDataKey } = unlock( blockEditorPrivateApis );
const GALLERY_BLOCK_NAME = 'core/gallery';

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

function getBlockGapValue( style ) {
	if ( ! Object.hasOwn( style?.spacing || {}, 'blockGap' ) ) {
		return undefined;
	}

	return style.spacing.blockGap;
}

/**
 * Renders the Gallery's instance styles: the gap custom property the Flex
 * layout's column widths are calculated from, and the Gallery's responsive
 * viewport CSS.
 *
 * @param {Object}  props
 * @param {Object}  props.style        Gallery block style attribute.
 * @param {string}  props.clientId     Gallery block client ID.
 * @param {boolean} props.isFlexLayout Whether the Gallery uses the Flex layout.
 */
export default function GalleryStyles( { style, clientId, isFlexLayout } ) {
	const selector = `.wp-block-gallery-${ clientId }`;
	const [ viewportSettings ] = useSettings( 'viewport' );
	const globalStyles = useSelect(
		( select ) =>
			select( blockEditorStore ).getSettings()?.[ globalStylesDataKey ],
		[]
	);
	const responsiveMediaQueries =
		getResponsiveMediaQueries( viewportSettings );
	let css = '';

	// The gap custom property only drives the Flex layout's column width
	// calculations, so it is not emitted for the other Gallery layouts.
	if ( isFlexLayout ) {
		const globalGalleryStyles =
			globalStyles?.blocks?.[ GALLERY_BLOCK_NAME ] || {};
		const styleBlockGap = getBlockGapValue( style );
		const globalGalleryBlockGap =
			globalGalleryStyles?.spacing?.blockGap ?? FALLBACK_VALUE;
		// Prefer the block's own gap value, then Gallery global styles. Missing
		// values fall back to the Gallery blockGap default.
		const blockGap =
			styleBlockGap === undefined ? globalGalleryBlockGap : styleBlockGap;
		css += getGalleryGapCustomPropertyStyle( selector, blockGap );

		Object.entries( responsiveMediaQueries ).forEach(
			( [ viewport, mediaQuery ] ) => {
				const styleViewportBlockGap = getBlockGapValue(
					style?.[ viewport ]
				);
				// Viewport-specific block values win. Gallery global viewport values
				// only apply when the block has no base gap, so they do not override an instance value.
				const globalViewportBlockGap =
					styleBlockGap === undefined
						? globalGalleryStyles?.[ viewport ]?.spacing?.blockGap
						: undefined;
				const viewportBlockGap =
					styleViewportBlockGap === undefined
						? globalViewportBlockGap
						: styleViewportBlockGap;
				if (
					viewportBlockGap === undefined ||
					viewportBlockGap === null
				) {
					return;
				}

				css += `${ mediaQuery }{${ getGalleryGapCustomPropertyStyle(
					selector,
					viewportBlockGap
				) }}`;
			}
		);
	}

	// The column and crop rules are scoped to the Flex layout, so they are
	// inert in the other layouts and this can run for every Gallery.
	css += getGalleryResponsiveCSS( selector, style, responsiveMediaQueries );

	useStyleOverride( { css } );

	return null;
}
