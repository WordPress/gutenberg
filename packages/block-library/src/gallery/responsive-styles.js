import { MAX_COLUMNS } from './constants';

const FALLBACK_GAP = '16px';

function isObject( value ) {
	return !! value && typeof value === 'object' && ! Array.isArray( value );
}

export function isValidGalleryColumns( value ) {
	return Number.isInteger( value ) && value >= 1 && value <= MAX_COLUMNS;
}

export function getViewportGalleryLayout( style, viewport ) {
	if ( ! isObject( style ) || ! isObject( style[ viewport ] ) ) {
		return {};
	}

	const layout = style[ viewport ].layout;
	return isObject( layout ) ? layout : {};
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
	const currentViewportStyle = isObject( currentStyle[ viewport ] )
		? currentStyle[ viewport ]
		: {};
	const nextLayout = {
		...getViewportGalleryLayout( currentStyle, viewport ),
	};

	Object.entries( settings ).forEach( ( [ key, value ] ) => {
		if ( value === undefined || value === baseSettings[ key ] ) {
			delete nextLayout[ key ];
		} else {
			nextLayout[ key ] = value;
		}
	} );

	const nextViewportStyle = cleanObject( {
		...currentViewportStyle,
		layout: cleanObject( nextLayout ),
	} );
	const nextStyle = { ...currentStyle };
	if ( nextViewportStyle ) {
		nextStyle[ viewport ] = nextViewportStyle;
	} else {
		delete nextStyle[ viewport ];
	}

	return cleanObject( nextStyle );
}

function getGallerySelector( selector ) {
	return `${ selector }.wp-block-gallery.has-nested-images:where(.is-layout-flex)`;
}

function getImageSelector( selector ) {
	return `${ getGallerySelector(
		selector
	) } figure.wp-block-image:not(#individual-image)`;
}

function getColumnsCSS( selector, columns ) {
	const width =
		columns === 1
			? '100%'
			: `calc((100% - (var(--wp--style--unstable-gallery-gap, ${ FALLBACK_GAP }) * ${
					columns - 1
			  })) / ${ columns })`;

	return `${ getImageSelector( selector ) }{width:${ width };}`;
}

function getImageCropCSS( selector, imageCrop ) {
	const imageSelector = getImageSelector( selector );
	const wrapperSelector = `${ imageSelector } > div:not(.components-drop-zone)`;
	const linkSelector = `${ imageSelector } > a`;
	const mediaSelector = `${ imageSelector } a,${ imageSelector } img`;

	if ( imageCrop ) {
		return `${ imageSelector }{align-self:inherit;margin-bottom:0;}${ wrapperSelector },${ linkSelector }{display:flex;}${ mediaSelector }{width:100%;flex:1 0 0%;height:100%;object-fit:cover;}`;
	}

	return `${ imageSelector }{align-self:auto;margin-top:0;margin-bottom:auto;}${ wrapperSelector }{display:block;}${ linkSelector }{display:inline-block;}${ mediaSelector }{width:auto;flex:0 1 auto;height:auto;object-fit:fill;}`;
}

/**
 * Generates Gallery-specific responsive layout CSS.
 *
 * @param {string} selector     Gallery block selector.
 * @param {Object} style        Gallery block style attribute.
 * @param {Object} mediaQueries Map of viewport keys to media queries.
 * @return {string} Responsive Gallery CSS.
 */
export function getGalleryResponsiveLayoutCSS( selector, style, mediaQueries ) {
	if ( ! isObject( mediaQueries ) ) {
		return '';
	}

	return Object.entries( mediaQueries )
		.map( ( [ viewport, mediaQuery ] ) => {
			if ( typeof mediaQuery !== 'string' ) {
				return '';
			}

			const layout = getViewportGalleryLayout( style, viewport );
			let css = '';

			if ( isValidGalleryColumns( layout.columns ) ) {
				css += getColumnsCSS( selector, layout.columns );
			}

			if ( typeof layout.imageCrop === 'boolean' ) {
				css += getImageCropCSS( selector, layout.imageCrop );
			}

			return css ? `${ mediaQuery }{${ css }}` : '';
		} )
		.join( '' );
}
