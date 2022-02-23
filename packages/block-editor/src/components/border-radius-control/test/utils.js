/**
 * Internal dependencies
 */
import {
	getAllUnit,
	getAllValue,
	hasMixedValues,
	hasDefinedValues,
	mode,
} from '../utils';

describe( 'getAllUnit', () => {
	describe( 'when provided string based values', () => {
		it( 'should return valid unit when passed a valid unit', () => {
			expect( getAllUnit( '32em' ) ).toBe( 'em' );
		} );

		it( 'should fall back to px when passed an invalid unit', () => {
			expect( getAllUnit( '32apples' ) ).toBe( 'px' );
		} );

		it( 'should fall back to px when passed a value without a unit', () => {
			expect( getAllUnit( '32' ) ).toBe( 'px' );
		} );
	} );

	describe( 'when provided object based values', () => {
		it( 'should return the most common value', () => {
			const values = {
				bottomLeft: '2em',
				bottomRight: '2em',
				topLeft: '0',
				topRight: '2px',
			};
			expect( getAllUnit( values ) ).toBe( 'em' );
		} );

		it( 'should return the real value when the most common value is undefined', () => {
			const values = {
				bottomLeft: '0',
				bottomRight: '0',
				topLeft: '0',
				topRight: '2em',
			};
			expect( getAllUnit( values ) ).toBe( 'em' );
		} );

		it( 'should return the most common value there are no undefined values', () => {
			const values = {
				bottomLeft: '1em',
				bottomRight: '1em',
				topLeft: '2px',
				topRight: '2em',
			};
			expect( getAllUnit( values ) ).toBe( 'em' );
		} );

		it( 'should fall back to px when all values are undefined or equivalent', () => {
			const values = {
				bottomLeft: '0',
				bottomRight: undefined,
				topLeft: undefined,
				topRight: '0',
			};
			expect( getAllUnit( values ) ).toBe( 'px' );
		} );
	} );

	describe( 'when provided invalid values', () => {
		it( 'should return px when passed an array', () => {
			expect( getAllUnit( [] ) ).toBe( 'px' );
		} );
		it( 'should return px when passed a boolean', () => {
			expect( getAllUnit( false ) ).toBe( 'px' );
		} );
		it( 'should return px when passed undefined', () => {
			expect( getAllUnit( false ) ).toBe( 'px' );
		} );
	} );
} );

describe( 'getAllValue', () => {
	describe( 'when provided string based values', () => {
		it( 'should return valid value + unit when passed a valid unit', () => {
			expect( getAllValue( '32em' ) ).toBe( '32em' );
		} );

		it( 'should return string as-is without parsing it', () => {
			expect( getAllValue( '32apples' ) ).toBe( '32apples' );
		} );
	} );

	describe( 'when provided object based values', () => {
		it( 'should return undefined if values are mixed', () => {
			const values = {
				bottomLeft: '2em',
				bottomRight: '2em',
				topLeft: '0',
				topRight: '2px',
			};
			expect( getAllValue( values ) ).toBe( undefined );
		} );

		it( 'should return the common value + unit when all values are the same', () => {
			const values = {
				bottomLeft: '1em',
				bottomRight: '1em',
				topLeft: '1em',
				topRight: '1em',
			};
			expect( getAllValue( values ) ).toBe( '1em' );
		} );

		it( 'should return the common value + most common unit when same values but different units', () => {
			const values = {
				bottomLeft: '1em',
				bottomRight: '1em',
				topLeft: '1px',
				topRight: '1rem',
			};
			expect( getAllValue( values ) ).toBe( '1em' );
		} );

		it( 'should fall back to undefined when values are undefined', () => {
			const values = {
				bottomLeft: undefined,
				bottomRight: undefined,
				topLeft: undefined,
				topRight: undefined,
			};
			expect( getAllValue( values ) ).toBe( undefined );
		} );
	} );

	describe( 'when provided invalid values', () => {
		it( 'should return px when passed an array', () => {
			expect( getAllValue( [] ) ).toBe( undefined );
		} );
		it( 'should return px when passed a boolean', () => {
			expect( getAllValue( false ) ).toBe( undefined );
		} );
		it( 'should return px when passed undefined', () => {
			expect( getAllValue( false ) ).toBe( undefined );
		} );
	} );
} );

describe( 'hasMixedValues', () => {
	it( 'should return false when passed a string value', () => {
		expect( hasMixedValues( '2px' ) ).toBe( false );
	} );

	it( 'should return true when passed mixed values', () => {
		const values = {
			bottomLeft: '1em',
			bottomRight: '1px',
			topLeft: '2px',
			topRight: '2em',
		};
		expect( hasMixedValues( values ) ).toBe( true );
	} );

	it( 'should return false when passed a common value', () => {
		const values = {
			bottomLeft: '1em',
			bottomRight: '1em',
			topLeft: '1em',
			topRight: '1em',
		};
		expect( hasMixedValues( values ) ).toBe( false );
	} );
} );

describe( 'hasDefinedValues', () => {
	it( 'should return false when passed a falsy value', () => {
		expect( hasDefinedValues( undefined ) ).toBe( false );
		expect( hasDefinedValues( null ) ).toBe( false );
		expect( hasDefinedValues( '' ) ).toBe( false );
	} );

	it( 'should return true when passed a non empty string value', () => {
		expect( hasDefinedValues( '1px' ) ).toBe( true );
	} );

	it( 'should return false when passed an object with empty values', () => {
		const values = {
			bottomLeft: undefined,
			bottomRight: undefined,
			topLeft: undefined,
			topRight: undefined,
		};
		expect( hasDefinedValues( values ) ).toBe( false );
	} );

	it( 'should return true when passed an object with at least one real value', () => {
		const values = {
			bottomLeft: undefined,
			bottomRight: '1px',
			topLeft: undefined,
			topRight: undefined,
		};
		expect( hasDefinedValues( values ) ).toBe( true );
	} );
} );

describe( 'mode', () => {
	it( 'should return the most common value', () => {
		const values = [ 'a', 'z', 'z', 'b', undefined ];
		expect( mode( values ) ).toBe( 'z' );
	} );

	it( 'should return the most common real value', () => {
		const values = [ undefined, 'a', undefined, undefined, undefined ];
		expect( mode( values ) ).toBe( 'a' );
	} );
} );
