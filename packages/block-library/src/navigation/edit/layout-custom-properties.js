const JUSTIFICATION_VALUES = {
	left: 'flex-start',
	center: 'center',
	right: 'flex-end',
	'space-between': 'space-between',
};

/**
 * Returns the custom properties used by the Navigation block for a layout.
 *
 * @param {Object} layout Layout configuration.
 * @return {Object} Navigation layout custom properties.
 */
export function getNavigationLayoutCustomProperties( layout = {} ) {
	const justifyContent = Object.hasOwn(
		JUSTIFICATION_VALUES,
		layout.justifyContent
	)
		? layout.justifyContent
		: 'left';
	const justification = JUSTIFICATION_VALUES[ justifyContent ];
	const isVertical = layout.orientation === 'vertical';

	let align = 'center';
	let justify = justification;
	if ( isVertical ) {
		align = [ 'center', 'right' ].includes( justifyContent )
			? justification
			: 'flex-start';
		justify = justifyContent === 'left' ? 'initial' : justification;
	}

	return {
		'--navigation-layout-justification-setting': justification,
		'--navigation-layout-direction': isVertical ? 'column' : 'row',
		'--navigation-layout-wrap':
			layout.flexWrap === 'nowrap' ? 'nowrap' : 'wrap',
		'--navigation-layout-justify': justify,
		'--navigation-layout-align': align,
	};
}

/**
 * Generates responsive Navigation layout custom property styles.
 *
 * @param {Object} options              Options.
 * @param {string} options.selector     Selector for the Navigation block.
 * @param {Object} options.layout       Base layout configuration.
 * @param {Object} options.style        Block style attribute.
 * @param {Object} options.mediaQueries Viewport media queries keyed by state.
 * @return {string} Responsive custom property CSS.
 */
export function getNavigationResponsiveLayoutCSS( {
	selector,
	layout = {},
	style = {},
	mediaQueries = {},
} ) {
	return Object.entries( mediaQueries )
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

			const properties = getNavigationLayoutCustomProperties( {
				...layout,
				...viewportLayout,
			} );
			const declarations = Object.entries( properties )
				.map( ( [ property, value ] ) => `${ property }: ${ value };` )
				.join( '' );

			return `${ mediaQuery }{${ selector } {${ declarations }}}`;
		} )
		.join( '' );
}
