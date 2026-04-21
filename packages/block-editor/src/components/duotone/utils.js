/**
 * External dependencies
 */
import { colord } from 'colord';

/**
 * Convert a list of colors to an object of R, G, and B values.
 *
 * @param {string[]} colors Array of RBG color strings.
 *
 * @return {Object} R, G, and B values.
 */
export function getValuesFromColors( colors = [] ) {
	const values = { r: [], g: [], b: [], a: [] };

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
 * @param {string} selector Selector to disable the filter for.
 *
 * @return {string} Filter none style.
 */
export function getDuotoneUnsetStylesheet( selector ) {
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
export function getDuotoneStylesheet( selector, id ) {
	return `${ selector }{filter:url(#${ id })}`;
}

/**
 * The SVG part of the duotone filter.
 *
 * @param {string}   id     Unique id for this duotone filter.
 * @param {string[]} colors Color strings from dark to light.
 *
 * @return {string} Duotone SVG.
 */
export function getDuotoneFilter( id, colors ) {
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
