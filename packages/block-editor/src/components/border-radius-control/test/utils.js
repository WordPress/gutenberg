/**
 * Internal dependencies
 */
import {
	getAllUnit,
	getAllValue,
	hasMixedValues,
	hasDefinedValues,
	mode,
	getPresetValueFromCustomValue,
	getPresetValueFromControlValue,
} from '../utils';

const defaultUnitSelections = {
	flat: undefined,
	topLeft: '%',
	topRight: 'rem',
	bottomLeft: 'rem',
	bottomRight: 'vw',
};

describe( 'getAllUnit', () => {
	it( 'should return flat radius unit when selected', () => {
		const selectedUnits = { ...defaultUnitSelections, flat: 'em' };
		expect( getAllUnit( selectedUnits ) ).toBe( 'em' );
	} );

	it( 'should return most common corner unit', () => {
		expect( getAllUnit( defaultUnitSelections ) ).toBe( 'rem' );
	} );

	it( 'should return a real unit when the most common is undefined', () => {
		expect( getAllUnit( { bottomRight: '%' } ) ).toBe( '%' );
	} );

	it( 'should return most common corner unit when some are unselected', () => {
		const selectedUnits = { ...defaultUnitSelections, topLeft: undefined };
		expect( getAllUnit( selectedUnits ) ).toBe( 'rem' );
	} );

	it( 'should fallback to px when all values are undefined', () => {
		expect( getAllUnit( {} ) ).toBe( 'px' );
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
		it( 'should return undefined when passed an array', () => {
			expect( getAllValue( [] ) ).toBe( undefined );
		} );
		it( 'should return undefined when passed a boolean', () => {
			expect( getAllValue( false ) ).toBe( undefined );
		} );
		it( 'should return undefined when passed undefined', () => {
			expect( getAllValue( undefined ) ).toBe( undefined );
		} );
	} );

	describe( 'when provided complex CSS values (clamp, min, max, calc)', () => {
		it( 'should preserve clamp values when all corners have the same clamp value', () => {
			const clampValue = 'clamp(1rem, 2vw, 3rem)';
			const values = {
				bottomLeft: clampValue,
				bottomRight: clampValue,
				topLeft: clampValue,
				topRight: clampValue,
			};
			expect( getAllValue( values ) ).toBe( clampValue );
		} );

		it( 'should preserve min() values when all corners have the same min value', () => {
			const minValue = 'min(10px, 5vw)';
			const values = {
				bottomLeft: minValue,
				bottomRight: minValue,
				topLeft: minValue,
				topRight: minValue,
			};
			expect( getAllValue( values ) ).toBe( minValue );
		} );

		it( 'should preserve max() values when all corners have the same max value', () => {
			const maxValue = 'max(20px, 10vw)';
			const values = {
				bottomLeft: maxValue,
				bottomRight: maxValue,
				topLeft: maxValue,
				topRight: maxValue,
			};
			expect( getAllValue( values ) ).toBe( maxValue );
		} );

		it( 'should preserve calc() values when all corners have the same calc value', () => {
			const calcValue = 'calc(100% - 20px)';
			const values = {
				bottomLeft: calcValue,
				bottomRight: calcValue,
				topLeft: calcValue,
				topRight: calcValue,
			};
			expect( getAllValue( values ) ).toBe( calcValue );
		} );

		it( 'should return undefined when complex CSS values are mixed', () => {
			const values = {
				bottomLeft: 'clamp(1rem, 2vw, 3rem)',
				bottomRight: 'clamp(1rem, 2vw, 3rem)',
				topLeft: 'min(10px, 5vw)',
				topRight: 'clamp(1rem, 2vw, 3rem)',
			};
			expect( getAllValue( values ) ).toBe( undefined );
		} );

		it( 'should return undefined when complex CSS values are mixed with simple values', () => {
			const values = {
				bottomLeft: 'clamp(1rem, 2vw, 3rem)',
				bottomRight: 'clamp(1rem, 2vw, 3rem)',
				topLeft: '2px',
				topRight: 'clamp(1rem, 2vw, 3rem)',
			};
			expect( getAllValue( values ) ).toBe( undefined );
		} );

		it( 'should preserve string values that cannot be parsed at all (no numeric prefix)', () => {
			// Values with no numeric prefix cannot be parsed, so they should be preserved
			const unparseableValue = 'apples';
			const values = {
				bottomLeft: unparseableValue,
				bottomRight: unparseableValue,
				topLeft: unparseableValue,
				topRight: unparseableValue,
			};
			expect( getAllValue( values ) ).toBe( unparseableValue );
		} );

		it( 'should parse numeric prefix from partially parseable values', () => {
			// Values with numeric prefix get parsed, so "32apples" becomes "32"
			const partiallyParseableValue = '32apples';
			const values = {
				bottomLeft: partiallyParseableValue,
				bottomRight: partiallyParseableValue,
				topLeft: partiallyParseableValue,
				topRight: partiallyParseableValue,
			};
			expect( getAllValue( values ) ).toBe( '32' );
		} );
	} );
} );

describe( 'hasMixedValues', () => {
	it( 'should return false when passed a string value', () => {
		expect( hasMixedValues( '2px' ) ).toBe( false );
	} );

	it( 'should return false when passed a string value containing a unit with no quantity', () => {
		expect( hasMixedValues( 'em' ) ).toBe( false );
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

describe( 'getPresetValueFromCustomValue', () => {
	const presets = [
		{ name: 'None', slug: '0', size: 0 },
		{ name: 'Small', slug: 'sm', size: '4px' },
		{ name: 'Medium', slug: 'md', size: 'clamp(2px, 1vw, 8px)' },
	];

	it( 'should return "0" if value is "0"', () => {
		expect( getPresetValueFromCustomValue( '0', presets ) ).toBe( '0' );
	} );

	it( 'should return preset reference if value matches a preset', () => {
		expect( getPresetValueFromCustomValue( '4px', presets ) ).toBe(
			'var:preset|border-radius|sm'
		);
		expect(
			getPresetValueFromCustomValue( 'clamp(2px, 1vw, 8px)', presets )
		).toBe( 'var:preset|border-radius|md' );
	} );

	it( 'should return value as-is if no matching preset', () => {
		expect( getPresetValueFromCustomValue( '7px', presets ) ).toBe( '7px' );
	} );

	it( 'should return value as-is if already a preset reference', () => {
		expect(
			getPresetValueFromCustomValue(
				'var:preset|border-radius|md',
				presets
			)
		).toBe( 'var:preset|border-radius|md' );
	} );

	it( 'should return undefined if value is undefined', () => {
		expect(
			getPresetValueFromCustomValue( undefined, presets )
		).toBeUndefined();
	} );
} );

describe( 'getPresetValueFromControlValue', () => {
	const presets = [
		{ name: 'None', slug: '0', size: 0 },
		{ name: 'Small', slug: 'sm', size: '4px' },
		{ name: 'Medium', slug: 'md', size: 'clamp(2px, 1vw, 8px)' },
	];

	it( 'should return "0" if control value is 0 and not selectList', () => {
		expect( getPresetValueFromControlValue( 0, 'slider', presets ) ).toBe(
			'0'
		);
	} );

	it( 'should return undefined if control value is 0 and controlType is selectList', () => {
		expect(
			getPresetValueFromControlValue( 0, 'selectList', presets )
		).toBeUndefined();
	} );

	it( 'should return preset reference for other values', () => {
		expect( getPresetValueFromControlValue( 1, 'slider', presets ) ).toBe(
			'var:preset|border-radius|sm'
		);
		expect( getPresetValueFromControlValue( 2, 'slider', presets ) ).toBe(
			'var:preset|border-radius|md'
		);
	} );
} );
