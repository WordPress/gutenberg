/**
 * WordPress dependencies
 */
import { useSettings, useStyleOverride } from '@wordpress/block-editor';
import { privateApis as globalStylesEnginePrivateApis } from '@wordpress/global-styles-engine';

/**
 * Internal dependencies
 */
import { unlock } from '../../lock-unlock';
import { getNavigationResponsiveLayoutCSS } from './layout-custom-properties';

const { getResponsiveMediaQueries } = unlock( globalStylesEnginePrivateApis );

/**
 * Adds responsive Navigation layout custom properties to the editor canvas.
 *
 * @param {Object} options          Options.
 * @param {string} options.clientId Block client ID.
 * @param {Object} options.layout   Base layout configuration.
 * @param {Object} options.style    Block style attribute.
 */
export default function useLayoutCustomProperties( {
	clientId,
	layout,
	style,
} ) {
	const [ viewportSettings ] = useSettings( 'viewport' );
	const css = getNavigationResponsiveLayoutCSS( {
		selector: `#block-${ clientId }`,
		layout,
		style,
		mediaQueries: getResponsiveMediaQueries( viewportSettings ),
	} );

	useStyleOverride( { css } );
}
