/**
 * WordPress dependencies
 */
import { useSettings, useStyleOverride } from '@wordpress/block-editor';
import { privateApis as globalStylesEnginePrivateApis } from '@wordpress/global-styles-engine';

/**
 * Internal dependencies
 */
import { unlock } from '../../lock-unlock';

const { getResponsiveMediaQueries } = unlock( globalStylesEnginePrivateApis );

const JUSTIFICATION_VALUES = {
	left: 'flex-start',
	center: 'center',
	right: 'flex-end',
	'space-between': 'space-between',
};

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
	const selector = `#block-${ clientId }`;
	const css = Object.entries( getResponsiveMediaQueries( viewportSettings ) )
		.map( ( [ viewport, mediaQuery ] ) => {
			const viewportLayout = style?.[ viewport ]?.layout;
			if (
				! viewportLayout ||
				typeof viewportLayout !== 'object' ||
				Array.isArray( viewportLayout ) ||
				! Object.keys( viewportLayout ).length
			) {
				return '';
			}

			const effectiveLayout = { ...layout, ...viewportLayout };
			const justifyContent = Object.hasOwn(
				JUSTIFICATION_VALUES,
				effectiveLayout.justifyContent
			)
				? effectiveLayout.justifyContent
				: 'left';
			const justification = JUSTIFICATION_VALUES[ justifyContent ];
			const isVertical = effectiveLayout.orientation === 'vertical';
			let align = 'center';
			if ( isVertical ) {
				align = [ 'center', 'right' ].includes( justifyContent )
					? justification
					: 'flex-start';
			}
			const justify =
				isVertical && justifyContent === 'left'
					? 'initial'
					: justification;
			const declarations = {
				'--navigation-layout-justification-setting': justification,
				'--navigation-layout-direction': isVertical ? 'column' : 'row',
				'--navigation-layout-wrap':
					effectiveLayout.flexWrap === 'nowrap' ? 'nowrap' : 'wrap',
				'--navigation-layout-justify': justify,
				'--navigation-layout-align': align,
			};
			const cssDeclarations = Object.entries( declarations )
				.map( ( [ property, value ] ) => `${ property }: ${ value };` )
				.join( '' );

			return `${ mediaQuery }{${ selector } {${ cssDeclarations }}}`;
		} )
		.join( '' );

	useStyleOverride( { css } );
}
