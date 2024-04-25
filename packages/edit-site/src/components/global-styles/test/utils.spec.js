/**
 * Internal dependencies
 */
import { getShadowParts, shadowStringToObject } from '../utils';

const colorFormats = {
	named: 'red',
	hex: '#ff0000',
	hexAlpha: '#ff000077',
	rgb: 'rgb(255, 0, 0)',
	rgbSpaced: 'rgb(255 0 0)',
	rgbMultiSpaced: 'rgb(255  0   0)',
	rgba: 'rgba(255, 0, 0, 0.5)',
	rgbp: 'rgb(255 0 0 / 50%)',
	hsl: 'hsl(0, 100%, 50%)',
	hsla: 'hsla(0, 100%, 50%, 0.5)',
	hslp: 'hsl(0 100% 50% / 50%)',
	currentcolor: 'currentcolor',

	// invalidColor1: 'invalid',
	// invalidColor2: 'hwb(0, 0%, 0%)',
};
const shadowFormats = {
	xy: '{x} {y}',
	xyInset: '{x} {y} inset',
	insetXY: 'inset {x} {y}',

	xyColor: '{x} {y} {color}',
	xyColorInset: '{x} {y} {color} inset',
	xyInsetColor: '{x} {y} inset {color}',
	insetXYColor: 'inset {x} {y} {color}',

	colorXY: '{color} {x} {y}',
	colorXYInset: '{color} {x} {y} inset',
	colorInsetXY: '{color} inset {x} {y}',
	insetColorXY: 'inset {color} {x} {y}',

	xyBlur: '{x} {y} {blur}',
	xyBlurInset: '{x} {y} {blur} inset',
	insetXYBlur: 'inset {x} {y} {blur}',

	xyBlurColor: '{x} {y} {blur} {color}',
	xyBlurColorInset: '{x} {y} {blur} {color} inset',
	xyBlurInsetColor: '{x} {y} {blur} inset {color}',
	insetXYBlurColor: 'inset {x} {y} {blur} {color}',

	colorXYBlur: '{color} {x} {y} {blur}',
	colorXYBlurInset: '{color} {x} {y} {blur} inset',
	colorInsetXYBlur: '{color} inset {x} {y} {blur}',
	insetColorXYBlur: 'inset {color} {x} {y} {blur}',

	xyBlurSpread: '{x} {y} {blur} {spread}',
	xyBlurSpreadInset: '{x} {y} {blur} {spread} inset',
	insetXYBlurSpread: 'inset {x} {y} {blur} {spread}',

	xyBlurSpreadColor: '{x} {y} {blur} {spread} {color}',
	xyBlurSpreadColorInset: '{x} {y} {blur} {spread} {color} inset',
	xyBlurSpreadInsetColor: '{x} {y} {blur} {spread} inset {color}',
	insetXYBlurSpreadColor: 'inset {x} {y} {blur} {spread} {color}',

	colorXYBlurSpread: '{color} {x} {y} {blur} {spread}',
	colorXYBlurSpreadInset: '{color} {x} {y} {blur} {spread} inset',
	colorInsetXYBlurSpread: '{color} inset {x} {y} {blur} {spread}',
	insetColorXYBlurSpread: 'inset {color} {x} {y} {blur} {spread}',

	multipleSpaces: '{x}  {y}   {blur} {spread}',

	// invalidShadow1: '{x}',
	// invalidShadow2: '{x} {color} {y}',
	// invalidShadow3: '{x} {y} {color} {blur}',
};

const combinedShadows = {
	onePart: '{1}',
	twoParts: '{1},{2}',
	twoPartsSpaced: '{1}, {2}',
	threeParts: '{1},{2},{3}',
};

const shadowUnits = {
	px: '1px',
	em: '1em',
	rem: '1rem',
	halfRem: '0.5rem',
	percent: '1%',
	halfPercent: '0.5%',
	zero: '0',
};

// Data helper functions
function getShadowString( format, parts ) {
	return format.replace( /{([^}]+)}/g, ( match, key ) => parts[ key ] );
}
function getCombinedShadowString( format, parts ) {
	return format.replace( /{(\d+)}/g, ( match, index ) => parts[ index - 1 ] );
}

describe( 'getShadowParts', () => {
	Object.entries( shadowFormats ).forEach( ( [ shadowKey, shadow ] ) => {
		describe( `test shadow format: ${ shadowKey }`, () => {
			Object.entries( colorFormats ).forEach( ( [ colorKey, color ] ) => {
				Object.entries( combinedShadows ).forEach(
					( [ combinedShadowKey, combinedShadow ] ) => {
						const shadowCount = combinedShadow.split( ',' ).length;
						const shadowStrings = Array.from(
							{ length: shadowCount },
							() =>
								getShadowString( shadow, {
									x: shadowUnits.px,
									y: shadowUnits.px,
									blur: shadowUnits.px,
									spread: shadowUnits.px,
									color,
								} )
						);

						const input = getCombinedShadowString(
							combinedShadow,
							shadowStrings
						);
						const output = shadowStrings;

						it( `should return shadow parts for ${ colorKey } color and ${ combinedShadowKey } shadow`, () => {
							const parts = getShadowParts( input );
							expect( parts ).toEqual( output );
						} );
					}
				);
			} );
		} );
	} );
} );

describe( 'shadowStringToObject', () => {
	const defaultColor = '#000';

	Object.entries( shadowFormats ).forEach( ( [ shadowKey, shadow ] ) => {
		describe( `test shadow format: ${ shadowKey }`, () => {
			Object.entries( colorFormats ).forEach( ( [ colorKey, color ] ) => {
				const hasX = shadow.includes( '{x}' );
				const hasY = shadow.includes( '{y}' );
				const hasBlur = shadow.includes( '{blur}' );
				const hasSpread = shadow.includes( '{spread}' );
				const hasColor = shadow.includes( '{color}' );
				const hasInset = shadow.includes( 'inset' );

				const shadowString = getShadowString( shadow, {
					...( hasX ? { x: shadowUnits.px } : {} ),
					...( hasY ? { y: shadowUnits.px } : {} ),
					...( hasBlur ? { blur: shadowUnits.px } : {} ),
					...( hasSpread ? { spread: shadowUnits.px } : {} ),
					color,
				} );

				const input = shadowString;
				const output = {
					x: hasX ? shadowUnits.px : 0,
					y: hasY ? shadowUnits.px : 0,
					blur: hasBlur ? shadowUnits.px : 0,
					spread: hasSpread ? shadowUnits.px : 0,
					color: hasColor ? color : defaultColor,
					insert: hasInset,
				};

				it( `should return shadow object for ${ colorKey } color`, () => {
					const shadowObj = shadowStringToObject( input );
					expect( shadowObj ).toEqual( output );
				} );
			} );
		} );
	} );
} );
