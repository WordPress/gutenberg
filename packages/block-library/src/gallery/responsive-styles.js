import { MAX_COLUMNS } from './constants';

function isObject( value ) {
	return !! value && typeof value === 'object' && ! Array.isArray( value );
}

export function isValidGalleryColumns( value ) {
	return Number.isInteger( value ) && value >= 1 && value <= MAX_COLUMNS;
}

/*
 * Aspect ratios are interpolated into a generated stylesheet instead of being
 * set as an inline style, so only the numeric forms produced by aspect ratio
 * presets (and `auto`) are accepted. A value from saved content that isn't one
 * of those is ignored rather than emitted, so it can't close the rule early and
 * inject declarations of its own. The frontend applies the same restriction in
 * `block_core_gallery_is_valid_aspect_ratio()`.
 */
const ASPECT_RATIO_PATTERN = /^(auto|\d+(\.\d+)?(\s*\/\s*\d+(\.\d+)?)?)$/;

/**
 * Returns whether a value can be used as a Gallery aspect ratio.
 *
 * @param {*} value Value to check.
 * @return {boolean} Whether the value is a valid aspect ratio.
 */
export function isValidGalleryAspectRatio( value ) {
	return (
		typeof value === 'string' && ASPECT_RATIO_PATTERN.test( value.trim() )
	);
}

/**
 * Returns Gallery styles for a viewport.
 *
 * @param {Object} style    Gallery block style attribute.
 * @param {string} viewport Viewport state.
 * @return {Object} Gallery viewport styles, or an empty object when unavailable.
 */
export function getViewportGalleryStyle( style, viewport ) {
	if ( ! isObject( style ) || ! isObject( style[ viewport ] ) ) {
		return {};
	}

	return style[ viewport ];
}

function cleanObject( value ) {
	if ( ! isObject( value ) ) {
		return value;
	}

	const entries = Object.entries( value ).filter(
		( [ , entryValue ] ) => entryValue !== undefined
	);
	return entries.length ? Object.fromEntries( entries ) : undefined;
}

/**
 * Updates Gallery layout settings for a viewport without changing base values.
 *
 * @param {Object} options              Options.
 * @param {Object} options.style        Gallery block style attribute.
 * @param {string} options.viewport     Selected viewport state.
 * @param {Object} options.baseSettings Gallery base layout settings.
 * @param {Object} options.settings     Gallery layout settings to update.
 * @return {Object|undefined} Updated Gallery style attribute.
 */
export function getUpdatedGalleryStyle( {
	style,
	viewport,
	baseSettings,
	settings,
} ) {
	const currentStyle = isObject( style ) ? style : {};
	const nextViewportStyle = {
		...getViewportGalleryStyle( currentStyle, viewport ),
	};

	Object.entries( settings ).forEach( ( [ key, value ] ) => {
		if ( value === undefined || value === baseSettings[ key ] ) {
			delete nextViewportStyle[ key ];
		} else {
			nextViewportStyle[ key ] = value;
		}
	} );

	const cleanedViewportStyle = cleanObject( nextViewportStyle );
	const nextStyle = { ...currentStyle };
	if ( cleanedViewportStyle ) {
		nextStyle[ viewport ] = cleanedViewportStyle;
	} else {
		delete nextStyle[ viewport ];
	}

	return cleanObject( nextStyle );
}

function getGallerySelector( selector ) {
	return `${ selector }.wp-block-gallery.has-nested-images`;
}

function getFlexGallerySelector( selector ) {
	return `${ getGallerySelector( selector ) }:where(.is-layout-flex)`;
}

function getImageSelector( selector ) {
	return `${ getFlexGallerySelector(
		selector
	) } figure.wp-block-image:not(#individual-image)`;
}

function getColumnsCSS( selector, columns ) {
	// Match the fallback used by the Gallery's existing column-width CSS and
	// server-rendered responsive styles when the gap custom property is unavailable.
	const width =
		columns === 1
			? '100%'
			: `calc((100% - (var(--wp--style--unstable-gallery-gap, 16px) * ${
					columns - 1
			  })) / ${ columns })`;

	return `${ getImageSelector( selector ) }{width:${ width } !important;}`;
}

function getImageCropCSS( selector, imageCrop ) {
	const imageSelector = getImageSelector( selector );
	const wrapperSelector = `${ imageSelector } > div:not(.components-drop-zone)`;
	const linkSelector = `${ imageSelector } > a`;
	const mediaSelector = `${ imageSelector } a,${ imageSelector } img`;

	if ( imageCrop ) {
		return `${ imageSelector }{align-self:inherit !important;margin-bottom:0 !important;}${ wrapperSelector },${ linkSelector }{display:flex !important;}${ mediaSelector }{width:100% !important;flex:1 0 0% !important;height:100% !important;object-fit:cover !important;}`;
	}

	return `${ imageSelector }{align-self:auto !important;margin-top:0 !important;margin-bottom:auto !important;}${ wrapperSelector }{display:block !important;}${ linkSelector }{display:inline-block !important;}${ mediaSelector }{width:auto !important;flex:0 1 auto !important;height:auto !important;object-fit:fill !important;}`;
}

function getAspectRatioCSS( selector, aspectRatio ) {
	// Unlike the column and crop rules, this isn't scoped to the Flex layout:
	// the aspect ratio applies to the images in every Gallery layout.
	const imageSelector = `${ getGallerySelector(
		selector
	) } figure.wp-block-image:not(#individual-image) img`;
	const ratio = aspectRatio.trim();

	// The base aspect ratio is an inline style on each image, so these
	// declarations have to be important to win for the viewport.
	if ( ratio === 'auto' ) {
		/*
		 * Original cancels the base ratio, which means rolling this declaration
		 * out of the cascade rather than giving it a value. `auto` — and
		 * `initial`, `unset` and `revert`, which all compute to it — would
		 * override the `width`/`height` presentational hint that gives a
		 * lazy-loaded image its placeholder ratio, collapsing the image to zero
		 * height until it loads: the Featured Image bug fixed in #80386.
		 * `revert-layer` drops the declaration instead, so the image falls back
		 * to that hint while loading, to its natural ratio once loaded, and to
		 * any ratio a theme set in a lower cascade layer. `object-fit` is left
		 * as the base set it, so a cropped Gallery still crops.
		 */
		return `${ imageSelector }{aspect-ratio:revert-layer !important;}`;
	}

	return `${ imageSelector }{aspect-ratio:${ ratio } !important;object-fit:cover !important;}`;
}

/**
 * Generates Gallery-specific responsive CSS.
 *
 * @param {string} selector     Gallery block selector.
 * @param {Object} style        Gallery block style attribute.
 * @param {Object} mediaQueries Map of viewport keys to media queries.
 * @return {string} Responsive Gallery CSS.
 */
export function getGalleryResponsiveCSS( selector, style, mediaQueries ) {
	if ( ! isObject( mediaQueries ) ) {
		return '';
	}

	return Object.entries( mediaQueries )
		.map( ( [ viewport, mediaQuery ] ) => {
			if ( typeof mediaQuery !== 'string' ) {
				return '';
			}

			const viewportStyle = getViewportGalleryStyle( style, viewport );
			let css = '';

			if ( isValidGalleryColumns( viewportStyle.columns ) ) {
				css += getColumnsCSS( selector, viewportStyle.columns );
			}

			if ( typeof viewportStyle.imageCrop === 'boolean' ) {
				css += getImageCropCSS( selector, viewportStyle.imageCrop );
			}

			// Emitted after the crop rules so an aspect ratio wins the
			// `object-fit` they also set, matching how the base aspect ratio's
			// inline style wins over the crop stylesheet rules.
			if ( isValidGalleryAspectRatio( viewportStyle.aspectRatio ) ) {
				css += getAspectRatioCSS( selector, viewportStyle.aspectRatio );
			}

			return css ? `${ mediaQuery }{${ css }}` : '';
		} )
		.join( '' );
}
