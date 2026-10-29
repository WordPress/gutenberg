import { useMemo } from '@wordpress/element';
import { useSelect } from '@wordpress/data';
import { store as blocksStore } from '@wordpress/blocks';
import { store as coreStore } from '@wordpress/core-data';
import { privateApis as editorPrivateApis } from '@wordpress/editor';
import {
	generateGlobalStyles,
	mergeGlobalStyles,
	type GlobalStylesConfig,
} from '@wordpress/global-styles-engine';
import { unlock } from '@wordpress/routes-lock-unlock';
import type { SitePreviewGlobalStyles } from './site-preview';

const { useGlobalStyles } = unlock( editorPrivateApis );

type FontFace = {
	fontFamily?: string;
	fontWeight?: string | number;
	fontStyle?: string;
	fontStretch?: string;
	fontDisplay?: string;
	src?: string | string[];
};

function quoteCSSString( value: string ): string {
	return `"${ value.replace( /["\\]/g, '\\$&' ) }"`;
}

/**
 * The `@font-face` rules for the fonts installed through the font library.
 *
 * The server only declares the fonts the saved styles use, so a font that is
 * activated but not saved yet needs its rules here. The theme's own fonts are
 * left out: the server always declares them, and their sources may be
 * relative to the theme.
 *
 * @param config The global styles to declare the fonts of.
 * @return The rules.
 */
function getFontFaceCSS( config: GlobalStylesConfig ): string {
	const fontFamilies = (
		config.settings?.typography?.fontFamilies as
			Record< string, Array< { fontFace?: FontFace[] } > > | undefined
	 )?.custom;
	if ( ! Array.isArray( fontFamilies ) ) {
		return '';
	}

	return fontFamilies
		.flatMap( ( fontFamily ) => fontFamily.fontFace ?? [] )
		.map( ( fontFace ) => {
			const sources = (
				Array.isArray( fontFace.src ) ? fontFace.src : [ fontFace.src ]
			).filter(
				( src ): src is string =>
					typeof src === 'string' && ! src.startsWith( 'file:' )
			);
			if ( ! fontFace.fontFamily || ! sources.length ) {
				return '';
			}

			const declarations = [
				`font-family:${ quoteCSSString(
					fontFace.fontFamily.trim().replace( /^["']|["']$/g, '' )
				) }`,
				`src:${ sources
					.map( ( src ) => `url(${ quoteCSSString( src ) })` )
					.join( ',' ) }`,
				`font-display:${ fontFace.fontDisplay ?? 'fallback' }`,
			];
			if ( fontFace.fontWeight !== undefined ) {
				declarations.push( `font-weight:${ fontFace.fontWeight }` );
			}
			if ( fontFace.fontStyle ) {
				declarations.push( `font-style:${ fontFace.fontStyle }` );
			}
			if ( fontFace.fontStretch ) {
				declarations.push( `font-stretch:${ fontFace.fontStretch }` );
			}
			return `@font-face{${ declarations.join( ';' ) }}`;
		} )
		.join( '\n' );
}

/**
 * The global styles the site preview shows: the ones being edited, or those
 * of a revision, rendered the way the editor canvas renders them.
 *
 * @param options            Options.
 * @param options.isEnabled  Whether to render them. The blocks have to be
 *                           registered first, or their styles are left out.
 * @param options.userConfig The user styles to show instead of the edited ones,
 *                           such as a revision's.
 * @return The styles, or `undefined` while they cannot be rendered.
 */
export function usePreviewGlobalStyles( {
	isEnabled,
	userConfig,
}: {
	isEnabled: boolean;
	userConfig?: GlobalStylesConfig;
} ): SitePreviewGlobalStyles | undefined {
	const { merged, base, isReady } = useGlobalStyles();
	const { blockTypes, getBlockStyles, disableLayoutStyles } = useSelect(
		( select ) => {
			const currentTheme = select( coreStore ).getCurrentTheme() as
				{ theme_supports?: Record< string, unknown > } | undefined;
			return {
				blockTypes: select( blocksStore ).getBlockTypes(),
				getBlockStyles: select( blocksStore ).getBlockStyles,
				disableLayoutStyles:
					!! currentTheme?.theme_supports?.[
						'disable-layout-styles'
					],
			};
		},
		[]
	);

	const config = useMemo(
		() => ( userConfig ? mergeGlobalStyles( base, userConfig ) : merged ),
		[ base, merged, userConfig ]
	);

	return useMemo( () => {
		if ( ! isEnabled || ! isReady || ! blockTypes.length ) {
			return undefined;
		}

		const [ stylesheets ] = generateGlobalStyles( config, blockTypes, {
			disableLayoutStyles,
			getBlockStyles,
		} );
		// Nothing rendered means the config is incomplete, and swapping the
		// server's styles for nothing would leave the site unstyled.
		if ( ! stylesheets.length ) {
			return undefined;
		}

		return {
			css: [
				getFontFaceCSS( config ),
				...stylesheets
					.map( ( stylesheet ) => stylesheet.css )
					.filter(
						( css ): css is string => typeof css === 'string'
					),
			],
			svgs: stylesheets
				.filter(
					( stylesheet ) => stylesheet.__unstableType === 'svgs'
				)
				.map( ( stylesheet ) => stylesheet.assets ?? '' )
				.join( '' ),
		};
	}, [
		isEnabled,
		isReady,
		config,
		blockTypes,
		disableLayoutStyles,
		getBlockStyles,
	] );
}
