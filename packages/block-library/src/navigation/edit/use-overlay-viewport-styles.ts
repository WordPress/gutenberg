import { useSettings, useStyleOverride } from '@wordpress/block-editor';
import { privateApis as globalStylesEnginePrivateApis } from '@wordpress/global-styles-engine';
import { unlock } from '../../lock-unlock';
import {
	getInlineViewports,
	type OverlayViewportMap,
} from '../overlay-viewports';

const { getResponsiveMediaQueries } = unlock< {
	getResponsiveMediaQueries: (
		viewportSettings: unknown,
		options: { includeDesktop?: boolean }
	) => Record< string, string >;
} >( globalStylesEnginePrivateApis );

/**
 * Returns the rules that show the links inline in a viewport.
 *
 * Mirrors `WP_Navigation_Block_Renderer::add_overlay_viewport_styles()`, so
 * keep the selectors and declarations in sync with it.
 *
 * @param base Selector of the Navigation wrapper.
 * @return Rules, keyed by selector.
 */
function getInlineRules(
	base: string
): Record< string, Record< string, string > > {
	const container = `${ base } .wp-block-navigation__responsive-container`;
	const inline = `${ container }:not(.hidden-by-default):not(.is-menu-open)`;
	return {
		[ inline ]: {
			display: 'block',
			width: '100%',
			position: 'relative',
			'z-index': 'auto',
			'background-color': 'inherit',
		},
		[ `${ inline } .wp-block-navigation__responsive-container-close` ]: {
			display: 'none',
		},
		// Keep submenus in an open overlay positioned as overlay content.
		[ `${ container }.is-menu-open .wp-block-navigation__submenu-container.wp-block-navigation__submenu-container.wp-block-navigation__submenu-container.wp-block-navigation__submenu-container` ]:
			{ left: '0' },
		[ `${ base } .wp-block-navigation__responsive-container-open:not(.always-shown)` ]:
			{ display: 'none' },
	};
}

/**
 * Serializes CSS declarations.
 *
 * @param declarations Declarations, keyed by property.
 * @return Serialized declarations.
 */
function serializeDeclarations( declarations: Record< string, string > ) {
	return Object.entries( declarations )
		.map( ( [ property, value ] ) => `${ property }: ${ value };` )
		.join( '' );
}

/**
 * Shows the Navigation links inline in the editor canvas in the viewports
 * where the overlay is not shown.
 *
 * Media queries are used, rather than `useMediaQuery`, so that the rules match
 * the width of the editor canvas, including device previews.
 *
 * @param options                  Options.
 * @param options.clientId         Block client ID.
 * @param options.overlayViewports Viewport map from `getOverlayViewports()`.
 */
export default function useOverlayViewportStyles( {
	clientId,
	overlayViewports,
}: {
	clientId: string;
	overlayViewports: OverlayViewportMap | null;
} ): void {
	const [ viewportSettings ] = useSettings( 'viewport' );
	const inlineViewports = getInlineViewports( overlayViewports );
	let css = '';
	if ( inlineViewports.length ) {
		const mediaQueries = getResponsiveMediaQueries( viewportSettings, {
			includeDesktop: true,
		} );
		const rules = Object.entries( getInlineRules( `#block-${ clientId }` ) )
			.map(
				( [ selector, declarations ] ) =>
					`${ selector } {${ serializeDeclarations( declarations ) }}`
			)
			.join( '' );
		css = inlineViewports
			.map( ( viewport ) => mediaQueries[ `@${ viewport }` ] )
			.filter( Boolean )
			.map( ( mediaQuery ) => `${ mediaQuery }{${ rules }}` )
			.join( '' );
	}

	useStyleOverride( { css } );
}
