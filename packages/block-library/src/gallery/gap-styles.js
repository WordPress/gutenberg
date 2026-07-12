/**
 * WordPress dependencies
 */
import {
	__experimentalGetGapCSSValue as getGapCSSValue,
	privateApis as blockEditorPrivateApis,
	store as blockEditorStore,
	useStyleOverride,
	useSettings,
} from '@wordpress/block-editor';
import { useSelect } from '@wordpress/data';
import { privateApis as globalStylesEnginePrivateApis } from '@wordpress/global-styles-engine';

/**
 * Internal dependencies
 */
import { unlock } from '../lock-unlock';

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

export default function GalleryGapCustomProperties( { style, clientId } ) {
	const selector = `#block-${ clientId }`;
	const [ viewportSettings ] = useSettings( 'viewport' );
	const globalStyles = useSelect(
		( select ) =>
			select( blockEditorStore ).getSettings()?.[ globalStylesDataKey ],
		[]
	);
	const globalGalleryStyles =
		globalStyles?.blocks?.[ GALLERY_BLOCK_NAME ] || {};
	const styleBlockGap = getBlockGapValue( style );
	const globalGalleryBlockGap =
		globalGalleryStyles?.spacing?.blockGap ?? FALLBACK_VALUE;
	// Prefer the block's own gap value, then Gallery global styles. Missing
	// values fall back to the Gallery blockGap default.
	const blockGap =
		styleBlockGap === undefined ? globalGalleryBlockGap : styleBlockGap;
	let gap = getGalleryGapCustomPropertyStyle( selector, blockGap );

	Object.entries( getResponsiveMediaQueries( viewportSettings ) ).forEach(
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
