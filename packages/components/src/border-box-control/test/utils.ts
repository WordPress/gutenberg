/**
 * Internal dependencies
 */
import {
	getBorderDiff,
	getCommonBorder,
	getShorthandBorderStyle,
	getSplitBorders,
	hasMixedBorders,
	hasSplitBorders,
	isCompleteBorder,
	isDefinedBorder,
	isEmptyBorder,
} from '../utils';

const completeBorder = { color: '#000', style: 'solid', width: '1px' };
const partialBorder = { color: undefined, style: undefined, width: '2px' };
const partialWithExtraProp = { color: '#fff', unrelated: true };
const nonBorder = { unrelatedProperty: true };

const splitBorders = {
	top: completeBorder,
	right: completeBorder,
	bottom: completeBorder,
	left: completeBorder,
};
const undefinedSplitBorders = {
	top: undefined,
	right: undefined,
	bottom: undefined,
	left: undefined,
};
const mixedBorders = {
	top: completeBorder,
	right: completeBorder,
	bottom: completeBorder,
	left: { color: '#fff', style: 'dashed', width: '10px' },
};
const mixedBordersWithUndefined = {
	top: undefined,
	right: undefined,
	bottom: completeBorder,
	left: partialBorder,
};

describe( 'BorderBoxControl Utils', () => {
	describe( 'isEmptyBorder', () => {
		it( 'should determine a undefined, null, and {} to be empty', () => {
			expect( isEmptyBorder( undefined ) ).toBe( true );
			// Checking for extra resilience, even if not a valid type.
			// @ts-expect-error
			expect( isEmptyBorder( null ) ).toBe( true );
			expect( isEmptyBorder( {} ) ).toBe( true );
		} );

		it( 'should determine object missing all border props to be empty', () => {
			// Checking for extra resilience, even if not a valid type.
			// @ts-expect-error
			expect( isEmptyBorder( nonBorder ) ).toBe( true );
		} );

		it( 'should determine that a border object with all properties is not empty', () => {
			expect( isEmptyBorder( completeBorder ) ).toBe( false );
		} );

		it( 'should determine object with at least one border property as non-empty', () => {
			expect( isEmptyBorder( partialWithExtraProp ) ).toBe( false );
		} );
	} );

	describe( 'isDefinedBorder', () => {
		it( 'should determine undefined is not a defined border', () => {
			expect( isDefinedBorder( undefined ) ).toBe( false );
		} );

		it( 'should determine an empty object to be an undefined border', () => {
			expect( isDefinedBorder( {} ) ).toBe( false );
		} );

		it( 'should determine an border object with undefined properties to be an undefined border', () => {
			const emptyBorder = {
				color: undefined,
				style: undefined,
				width: undefined,
			};
			expect( isDefinedBorder( emptyBorder ) ).toBe( false );
		} );

		it( 'should class an object with at least one side border as defined', () => {
			expect( isDefinedBorder( mixedBordersWithUndefined ) ).toBe( true );
		} );

		it( 'should determine complete split borders object is defined border', () => {
			expect( isDefinedBorder( splitBorders ) ).toBe( true );
		} );

		it( 'should determine border is not defined when all sides are empty', () => {
			const mixedUndefinedBorders = {
				top: undefined,
				right: undefined,
				bottom: {},
				left: {
					color: undefined,
					style: undefined,
					width: undefined,
				},
			};

			expect( isDefinedBorder( undefinedSplitBorders ) ).toBe( false );
			expect( isDefinedBorder( mixedUndefinedBorders ) ).toBe( false );
		} );
	} );

	describe( 'isCompleteBorder', () => {
		it( 'should determine a undefined, null, and {} to be incomplete', () => {
			expect( isCompleteBorder( undefined ) ).toBe( false );
			// Checking for extra resilience, even if not a valid type.
			// @ts-expect-error
			expect( isCompleteBorder( null ) ).toBe( false );
			expect( isCompleteBorder( {} ) ).toBe( false );
		} );

		it( 'should determine objects missing border props to be incomplete', () => {
			// Checking for extra resilience, even if not a valid type.
			// @ts-expect-error
			expect( isCompleteBorder( nonBorder ) ).toBe( false );
			expect( isCompleteBorder( partialBorder ) ).toBe( false );
			expect( isCompleteBorder( partialWithExtraProp ) ).toBe( false );
		} );

		it( 'should determine that a border object with all properties is complete', () => {
			expect( isCompleteBorder( completeBorder ) ).toBe( true );
		} );
	} );

	describe( 'hasSplitBorders', () => {
		it( 'should determine empty or undefined borders as not being split', () => {
			expect( hasSplitBorders( undefined ) ).toBe( false );
			expect( hasSplitBorders( {} ) ).toBe( false );
		} );

		it( 'should determine flat border object as not being split', () => {
			expect( hasSplitBorders( completeBorder ) ).toBe( false );
		} );

		it( 'should determine object with at least one side property as split', () => {
			expect( hasSplitBorders( splitBorders ) ).toBe( true );
			expect( hasSplitBorders( { top: completeBorder } ) ).toBe( true );
		} );

		it( 'should determine object with undefined sides but containing properties as split', () => {
			expect( hasSplitBorders( undefinedSplitBorders ) ).toBe( true );
		} );
	} );

	describe( 'hasMixedBorders', () => {
		it( 'should determine undefined, non-border or empty object as not being mixed', () => {
			expect( hasMixedBorders( undefined ) ).toBe( false );
			expect( hasMixedBorders( {} ) ).toBe( false );
			// Checking for extra resilience, even if not a valid type.
			// @ts-expect-error
			expect( hasMixedBorders( nonBorder ) ).toBe( false );
		} );

		it( 'should determine flat border object as not being mixed', () => {
			expect( hasMixedBorders( completeBorder ) ).toBe( false );
		} );

		it( 'should determine split border object with some undefined side borders as mixed', () => {
			expect( hasMixedBorders( mixedBordersWithUndefined ) ).toBe( true );
		} );

		it( 'should determine split border object with different side borders as mixed', () => {
			expect( hasMixedBorders( mixedBorders ) ).toBe( true );
		} );
	} );

	describe( 'getSplitBorders', () => {
		it( 'should return undefined when no border provided', () => {
			expect( getSplitBorders( undefined ) ).toEqual( undefined );
			// Checking for extra resilience, even if not a valid type.
			// @ts-expect-error
			expect( getSplitBorders( null ) ).toEqual( undefined );
		} );

		it( 'should return undefined when supplied border is empty', () => {
			expect( getSplitBorders( {} ) ).toEqual( undefined );
			// Checking for extra resilience, even if not a valid type.
			// @ts-expect-error
			expect( getSplitBorders( nonBorder ) ).toEqual( undefined );
		} );

		it( 'should return object with all sides populated when given valid border', () => {
			expect( getSplitBorders( completeBorder ) ).toEqual( {
				top: completeBorder,
				right: completeBorder,
				bottom: completeBorder,
				left: completeBorder,
			} );
		} );
	} );

	describe( 'getBorderDiff', () => {
		it( 'should return empty object when there are no differences', () => {
			const diff = getBorderDiff( completeBorder, completeBorder );
			expect( diff ).toEqual( {} );
		} );

		it( 'should only return differences for border related properties', () => {
			// Checking for extra resilience, even if not a valid type.
			// @ts-expect-error
			const diff = getBorderDiff( nonBorder, { caffeine: 'coffee' } );
			expect( diff ).toEqual( {} );
		} );

		it( 'should return object with only border properties that have changed', () => {
			const diff = getBorderDiff( completeBorder, {
				...completeBorder,
				color: '#21759b',
				// Checking for extra resilience, even if not a valid type.
				// @ts-expect-error
				caffeine: 'cola',
			} );
			expect( diff ).toEqual( { color: '#21759b' } );
		} );
	} );

	describe( 'getCommonBorder', () => {
		it( 'should return undefined when no borders supplied', () => {
			expect( getCommonBorder( undefined ) ).toEqual( undefined );
		} );

		it( 'should return border object with undefined properties when undefined borders given', () => {
			const undefinedBorder = {
				color: undefined,
				style: undefined,
				width: undefined,
			};

			expect( getCommonBorder( {} ) ).toEqual( undefinedBorder );
			expect( getCommonBorder( undefinedSplitBorders ) ).toEqual(
				undefinedBorder
			);
		} );

		it( 'should return flat border object when split borders are the same', () => {
			expect( getCommonBorder( splitBorders ) ).toEqual( completeBorder );
		} );

		it( 'should only set properties where every side border shares the same value', () => {
			const sideBorders = {
				top: { color: '#fff', style: 'solid', width: '1px' },
				right: { color: '#000', style: 'solid', width: '1px' },
				bottom: { color: '#000', style: 'solid', width: '1px' },
				left: { color: '#000', style: undefined, width: '1px' },
			};
			const commonBorder = {
				color: undefined,
				style: undefined,
				width: '1px',
			};

			expect( getCommonBorder( sideBorders ) ).toEqual( commonBorder );
		} );

		it( 'should return most common unit selection if border widths are mixed', () => {
			const sideBorders = {
				top: { color: '#fff', style: 'solid', width: '10px' },
				right: { color: '#000', style: 'solid', width: '1rem' },
				bottom: { color: '#000', style: 'solid', width: '2em' },
				left: { color: '#000', style: undefined, width: '2em' },
			};
			const commonBorder = {
				color: undefined,
				style: undefined,
				width: 'em',
			};

			expect( getCommonBorder( sideBorders ) ).toEqual( commonBorder );
		} );

		it( 'should return first unit when multiple units are equal most common', () => {
			const sideBorders = {
				top: { color: '#fff', style: 'solid', width: '1rem' },
				right: { color: '#000', style: 'solid', width: '0.75em' },
				bottom: { color: '#000', style: 'solid', width: '1vw' },
				left: { color: '#000', style: undefined, width: '2vh' },
			};
			const commonBorder = {
				color: undefined,
				style: undefined,
				width: 'rem',
			};

			expect( getCommonBorder( sideBorders ) ).toEqual( commonBorder );
		} );

		it( 'should ignore undefined values in determining most common unit', () => {
			const sideBorders = {
				top: { color: '#fff', style: 'solid', width: undefined },
				right: { color: '#000', style: 'solid', width: '5vw' },
				bottom: { color: '#000', style: 'solid', width: undefined },
				left: { color: '#000', style: undefined, width: '2vh' },
			};
			const commonBorder = {
				color: undefined,
				style: undefined,
				width: 'vw',
			};

			expect( getCommonBorder( sideBorders ) ).toEqual( commonBorder );
		} );
	} );

	describe( 'getShorthandBorderStyle', () => {
		it( 'should return undefined when no border provided', () => {
			expect( getShorthandBorderStyle( undefined ) ).toEqual( undefined );
			expect( getShorthandBorderStyle( {} ) ).toEqual( undefined );
			// Checking for extra resilience, even if not a valid type.
			// @ts-expect-error
			expect( getShorthandBorderStyle( nonBorder ) ).toEqual( undefined );
		} );

		it( 'should generate correct shorthand style from valid border', () => {
			const style = getShorthandBorderStyle( completeBorder );
			expect( style ).toEqual( '1px solid #000' );
		} );

		it( 'should generate correct style from partial border', () => {
			const style = getShorthandBorderStyle( {
				style: 'dashed',
				width: '2px',
			} );
			expect( style ).toEqual( '2px dashed' );
		} );

		it( 'should default borders with either color or width to solid style', () => {
			const widthOnlyStyle = getShorthandBorderStyle( { width: '5px' } );
			const colorOnlyStyle = getShorthandBorderStyle( { color: '#000' } );

			expect( widthOnlyStyle ).toEqual( '5px solid' );
			expect( colorOnlyStyle ).toEqual( 'solid #000' );
		} );

		it( 'should not default border style to solid for zero width border', () => {
			const zeroWidthStyle = getShorthandBorderStyle( { width: '0' } );
			expect( zeroWidthStyle ).toEqual( '0' );
		} );

		it( 'should return undefined when no border or fallback supplied', () => {
			expect( getShorthandBorderStyle() ).toBe( undefined );
		} );

		it( 'should return fallback border when border is undefined', () => {
			const result = getShorthandBorderStyle( undefined, completeBorder );
			expect( result ).toEqual( completeBorder );
		} );

		it( 'should return fallback border when empty border supplied', () => {
			const result = getShorthandBorderStyle( {}, completeBorder );
			expect( result ).toEqual( completeBorder );
		} );

		it( 'should use fallback border properties if missing from border', () => {
			const result = getShorthandBorderStyle(
				{ width: '1em' },
				{ width: '5px', style: 'dashed', color: '#72aee6' }
			);

			expect( result ).toEqual( `1em dashed #72aee6` );
		} );
	} );
} );
