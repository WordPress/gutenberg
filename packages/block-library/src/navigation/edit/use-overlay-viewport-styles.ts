import { useSettings, useStyleOverride } from '@wordpress/block-editor';
import { getViewportMediaQueries } from '@wordpress/global-styles-engine';
import { isRTL } from '@wordpress/i18n';
import {
	getInlineViewports,
	type OverlayViewportMap,
} from '../overlay-viewports';

/**
 * Returns the rules that show the links inline in a viewport.
 *
 * Mirrors `WP_Navigation_Block_Renderer::add_overlay_viewport_styles()`, so
 * keep the selectors and declarations in sync with it. The editor needs no
 * hashed class, since the base selector is already unique to the block.
 *
 * @param base Selector of the Navigation wrapper.
 * @return Rules, keyed by selector.
 */
function getInlineRules(
	base: string
): Record< string, Record< string, string > > {
	const container = `${ base } .wp-block-navigation__responsive-container`;
	const inline = `${ container }:not(.hidden-by-default):not(.is-menu-open)`;
	// Static styles are flipped for right-to-left languages by the RTL build,
	// but these rules are not, so pick the inline start side here.
	const submenuStart = isRTL() ? 'right' : 'left';
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
			{ [ submenuStart ]: '0' },
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
 * @return Whether any rules were added, in which case the Navigation wrapper
 *         needs the `has-overlay-viewports` class for them to apply.
 */
export default function useOverlayViewportStyles( {
	clientId,
	overlayViewports,
}: {
	clientId: string;
	overlayViewports: OverlayViewportMap | null;
} ): boolean {
	const [ viewportSettings ] = useSettings( 'viewport' );
	const inlineViewports = getInlineViewports( overlayViewports );
	let css = '';
	if ( inlineViewports.length ) {
		const mediaQueries = getViewportMediaQueries(
			viewportSettings as Parameters<
				typeof getViewportMediaQueries
			>[ 0 ],
			{ includeDesktop: true }
		);
		const rules = Object.entries(
			getInlineRules(
				`.wp-block-navigation.has-overlay-viewports:where(#block-${ clientId })`
			)
		)
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

	return css !== '';
}
