/**
 * Internal dependencies
 */
import { getShadowParts, shadowStringToObject } from '../shadow-utils';

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
};
const validShadowFormats = {
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
	upperInset: 'INSET {x} {y} {blur} {spread} {color}',
};

const invalidShadowFormats = {
	oneLength: '{x}',
	multipleLengthGroups1: '{x} {y} {color} {blur}',
	multipleLengthGroups2: '{x} {y} {blur} {spread} {color} 5px',
	multipleInsets: 'inset inset {x} {y} {blur} {spread} {color}',
	multipleColors: '{x} {y} {blur} {spread} {color} {color}',
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
	ex: '1ex',
	inch: '1in',
	cm: '1cm',
	mm: '1mm',
	pt: '1pt',
	pc: '1pc',
	vh: '1vh',
	vw: '1vw',
	vmin: '1vmin',
	vmax: '1vmax',
	ch: '1ch',
	lh: '1lh',
	zero: '0',
};

// Data helper functions
function getShadowString( formatString, values ) {
	return formatString.replace( /\{(\w+)\}/g, ( match, placeholder ) => {
		if ( values.hasOwnProperty( placeholder ) ) {
			return values[ placeholder ];
		}
		return match;
	} );
}
function getCombinedShadowString( format, parts ) {
	return format.replace( /{(\d+)}/g, ( _, index ) => parts[ index - 1 ] );
}

describe( 'getShadowParts', () => {
	Object.entries( validShadowFormats ).forEach( ( [ shadowKey, shadow ] ) => {
		describe( `test shadow format: ${ shadowKey }`, () => {
			Object.entries( colorFormats ).forEach( ( [ colorKey, color ] ) => {
				Object.entries( combinedShadows ).forEach(
					( [ combinedShadowKey, combinedShadow ] ) => {
						const shadowCount = combinedShadow.split( ',' ).length;
						const shadowStrings = Array.from(
							{ length: shadowCount },
							() =>
								getShadowString( shadow, {
									x: '1px',
									y: '2px',
									blur: '3px',
									spread: '4px',
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
	const defaultShadow = {
		x: '0',
		y: '0',
		blur: '0',
		spread: '0',
		color: '#000',
		inset: false,
	};

	Object.entries( validShadowFormats ).forEach( ( [ shadowKey, shadow ] ) => {
		describe( `test shadow format: ${ shadowKey }`, () => {
			Object.entries( colorFormats ).forEach( ( [ colorKey, color ] ) => {
				const hasX = shadow.includes( '{x}' );
				const hasY = shadow.includes( '{y}' );
				const hasBlur = shadow.includes( '{blur}' );
				const hasSpread = shadow.includes( '{spread}' );
				const hasColor = shadow.includes( '{color}' );
				const hasInset = shadow.toLowerCase().includes( 'inset' );

				const shadowString = getShadowString( shadow, {
					x: '1px',
					y: '2px',
					blur: '3px',
					spread: '4px',
					color,
				} );

				const input = shadowString;
				const output = {
					x: hasX ? '1px' : defaultShadow.x,
					y: hasY ? '2px' : defaultShadow.y,
					blur: hasBlur ? '3px' : defaultShadow.blur,
					spread: hasSpread ? '4px' : defaultShadow.spread,
					color: hasColor ? color : defaultShadow.color,
					inset: hasInset,
				};

				it( `should return shadow object for ${ colorKey } color`, () => {
					const shadowObj = shadowStringToObject( input );
					expect( shadowObj ).toEqual( output );
				} );
			} );
		} );
	} );

	describe( `test invalid shadow formats`, () => {
		const color = colorFormats.hex;
		Object.entries( invalidShadowFormats ).forEach(
			( [ shadowKey, shadow ] ) => {
				const shadowString = getShadowString( shadow, {
					x: '1px',
					y: '2px',
					blur: '3px',
					spread: '4px',
					color,
				} );

				const input = shadowString;
				const output = defaultShadow;

				it( `should return default shadow object for ${ shadowKey }`, () => {
					const shadowObj = shadowStringToObject( input );
					expect( shadowObj ).toEqual( output );
				} );
			}
		);
	} );

	describe( `test shadow with all units`, () => {
		const shadow = validShadowFormats.xyBlurSpreadColor;
		const color = colorFormats.hex;

		Object.entries( shadowUnits ).forEach( ( [ unitKey, unit ] ) => {
			const shadowString = getShadowString( shadow, {
				x: unit,
				y: unit,
				blur: unit,
				spread: unit,
				color,
			} );

			const input = shadowString;
			const output = {
				x: unit,
				y: unit,
				blur: unit,
				spread: unit,
				color,
				inset: false,
			};

			it( `should return shadow object for the unit: ${ unitKey }`, () => {
				const shadowObj = shadowStringToObject( input );
				expect( shadowObj ).toEqual( output );
			} );
		} );
	} );
} );
