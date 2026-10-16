import { colord } from 'colord';

/**
 * Convert a list of colors to an object of R, G, and B values.
 *
 * @param colors Array of RBG color strings.
 *
 * @return R, G, and B values.
 */
export function getValuesFromColors( colors: string[] = [] ) {
	const values: { r: number[]; g: number[]; b: number[]; a: number[] } = {
		r: [],
		g: [],
		b: [],
		a: [],
	};

	colors.forEach( ( color ) => {
		const rgbColor = colord( color ).toRgb();
		values.r.push( rgbColor.r / 255 );
		values.g.push( rgbColor.g / 255 );
		values.b.push( rgbColor.b / 255 );
		values.a.push( rgbColor.a );
	} );

	return values;
}

/**
 * Stylesheet for disabling a global styles duotone filter.
 *
 * @param selector Selector to disable the filter for.
 *
 * @return Filter none style.
 */
export function getDuotoneUnsetStylesheet( selector: string ) {
	return `${ selector }{filter:none}`;
}

/**
 * SVG and stylesheet needed for rendering the duotone filter.
 *
 * @param {string} selector Selector to apply the filter to.
 * @param {string} id       Unique id for this duotone filter.
 *
 * @return {string} Duotone filter style.
 */
export function getDuotoneStylesheet( selector: string, id: string ) {
	return `${ selector }{filter:url(#${ id })}`;
}

/**
 * The SVG part of the duotone filter.
 *
 * @param id     Unique id for this duotone filter.
 * @param colors Color strings from dark to light.
 *
 * @return Duotone SVG.
 */
export function getDuotoneFilter( id: string, colors: string[] ) {
	const values = getValuesFromColors( colors );
	return `
<svg
	xmlns:xlink="http://www.w3.org/1999/xlink"
	viewBox="0 0 0 0"
	width="0"
	height="0"
	focusable="false"
	role="none"
	aria-hidden="true"
	style="visibility: hidden; position: absolute; left: -9999px; overflow: hidden;"
>
	<defs>
		<filter id="${ id }">
			<!--
				Use sRGB instead of linearRGB so transparency looks correct.
				Use perceptual brightness to convert to grayscale.
			-->
			<feColorMatrix color-interpolation-filters="sRGB" type="matrix" values=" .299 .587 .114 0 0 .299 .587 .114 0 0 .299 .587 .114 0 0 .299 .587 .114 0 0 "></feColorMatrix>
			<!-- Use sRGB instead of linearRGB to be consistent with how CSS gradients work. -->
			<feComponentTransfer color-interpolation-filters="sRGB">
				<feFuncR type="table" tableValues="${ values.r.join( ' ' ) }"></feFuncR>
				<feFuncG type="table" tableValues="${ values.g.join( ' ' ) }"></feFuncG>
				<feFuncB type="table" tableValues="${ values.b.join( ' ' ) }"></feFuncB>
				<feFuncA type="table" tableValues="${ values.a.join( ' ' ) }"></feFuncA>
			</feComponentTransfer>
			<!-- Re-mask the image with the original transparency since the feColorMatrix above loses that information. -->
			<feComposite in2="SourceGraphic" operator="in"></feComposite>
		</filter>
	</defs>
</svg>`;
}

/**
 * Stable filter id for a custom duotone, a raw list of colors. Mirrors
 * `WP_Duotone_Gutenberg::get_custom_filter_id()`, so the same colors map to
 * the same id in the editor and on the front end.
 *
 * @param colors The duotone value, e.g. `[ '#000', '#fff' ]`.
 *
 * @return The filter id, or undefined when the value is not a list of at least two valid colors.
 */
export function getCustomDuotoneFilterId( colors: unknown ) {
	if (
		! Array.isArray( colors ) ||
		colors.length < 2 ||
		! colors.every(
			( color ) => typeof color === 'string' && colord( color ).isValid()
		)
	) {
		return undefined;
	}
	const hexColors = colors.map( ( color ) =>
		colord( color ).toHex().slice( 1 )
	);
	return `wp-duotone-custom-${ hexColors.join( '-' ) }`;
}
