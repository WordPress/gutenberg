/**
 * Internal dependencies
 */
import {
	isValueSpacingPreset,
	getCustomValueFromPreset,
	getPresetValueFromCustomValue,
	getSpacingPresetCssVar,
	getSpacingPresetSlug,
	getSliderValueFromPreset,
	getAllRawValue,
	isValuesMixed,
	isValuesDefined,
} from '../utils';

describe( 'isValueSpacingPreset', () => {
	it( 'should return true if value is string in spacing presets var format', () => {
		expect( isValueSpacingPreset( 'var:preset|spacing|20' ) ).toBe( true );
	} );
	it( 'should return false if value is not a string in spacing presets var format', () => {
		expect( isValueSpacingPreset( '30px' ) ).toBe( false );
	} );
} );

describe( 'getCustomValueFromPreset', () => {
	const spacingSizes = [ { name: 'Small', slug: 20, size: '8px' } ];
	it( 'should return original value if not a string in spacing presets var format', () => {
		expect( getCustomValueFromPreset( '20px', spacingSizes ) ).toBe(
			'20px'
		);
	} );
	it( 'should return value from matching spacingSizes array entry if string in spacing presets var format', () => {
		expect(
			getCustomValueFromPreset( 'var:preset|spacing|20', spacingSizes )
		).toBe( '8px' );
	} );
	it( 'should return undefined if no matching preset in spacingSizes array', () => {
		expect(
			getCustomValueFromPreset( 'var:preset|spacing|30', spacingSizes )
		).toBe( undefined );
	} );
} );

describe( 'getPresetValueFromCustomValue', () => {
	const spacingSizes = [ { name: 'Small', slug: 20, size: '8px' } ];
	it( 'should return original value if a string in spacing presets var format', () => {
		expect(
			getPresetValueFromCustomValue(
				'var:preset|spacing|80',
				spacingSizes
			)
		).toBe( 'var:preset|spacing|80' );
	} );
	it( 'should return value constructed from matching spacingSizes array entry if value matches sizes', () => {
		expect( getPresetValueFromCustomValue( '8px', spacingSizes ) ).toBe(
			'var:preset|spacing|20'
		);
	} );
	it( 'should return values as-is if no matching preset in spacingSizes array', () => {
		expect(
			getPresetValueFromCustomValue( '1.125rem', spacingSizes )
		).toBe( '1.125rem' );
	} );
} );

describe( 'getSpacingPresetCssVar', () => {
	it( 'should return original value if not a string in spacing presets var format', () => {
		expect( getSpacingPresetCssVar( '20px' ) ).toBe( '20px' );
	} );
	it( 'should return a string in spacing presets css var format with slug from provided value', () => {
		expect( getSpacingPresetCssVar( 'var:preset|spacing|20' ) ).toBe(
			'var(--wp--preset--spacing--20)'
		);
	} );
} );

describe( 'getSpacingPresetSlug', () => {
	it( 'should return original value if 0 or default', () => {
		expect( getSpacingPresetSlug( '0' ) ).toBe( '0' );
		expect( getSpacingPresetSlug( 'default' ) ).toBe( 'default' );
	} );
	it( 'should return the int value of the slug portion of a valid preset var', () => {
		expect( getSpacingPresetSlug( 'var:preset|spacing|20' ) ).toBe( '20' );
	} );
} );

describe( 'getSliderValueFromPreset', () => {
	const spacingSizes = [
		{ name: 'Small', slug: 20, size: '8px' },
		{ name: 'Large', slug: 30, size: '24px' },
	];
	it( 'should return NaN if no matching preset found - NaN makes range control go to start', () => {
		expect( getSliderValueFromPreset( '10px', spacingSizes ) ).toBe( NaN );
	} );
	it( 'should return the int value of the slug portion of a valid preset var', () => {
		expect(
			getSliderValueFromPreset( 'var:preset|spacing|30', spacingSizes )
		).toBe( 1 );
	} );
} );

describe( 'getAllRawValue', () => {
	const customValues = {
		top: '5px',
		bottom: '5px',
		left: '6px',
		right: '2px',
	};
	it( 'should return the most common custom value from the values object', () => {
		expect( getAllRawValue( customValues ) ).toBe( '5px' );
	} );
	const presetValues = {
		top: 'var:preset|spacing|30',
		bottom: 'var:preset|spacing|20',
		left: 'var:preset|spacing|10',
		right: 'var:preset|spacing|30',
	};
	it( 'should return the most common preset value from the values object', () => {
		expect( getAllRawValue( presetValues ) ).toBe(
			'var:preset|spacing|30'
		);
	} );
} );

describe( 'isValuesMixed', () => {
	const unmixedValues = {
		top: '5px',
		bottom: '5px',
		left: '5px',
		right: '5px',
	};
	it( 'should return false if all values are the same', () => {
		expect( isValuesMixed( unmixedValues ) ).toBe( false );
	} );
	const mixedValues = {
		top: 'var:preset|spacing|30',
		bottom: 'var:preset|spacing|20',
		left: 'var:preset|spacing|10',
		right: 'var:preset|spacing|30',
	};
	it( 'should return true if all the values are not the same', () => {
		expect( isValuesMixed( mixedValues ) ).toBe( true );
	} );
	const singleValue = {
		top: 'var:preset|spacing|30',
	};
	it( 'should return true if only one side set', () => {
		expect( isValuesMixed( singleValue ) ).toBe( true );
	} );
	const incompleteValues = {
		top: 'var:preset|spacing|30',
		bottom: 'var:preset|spacing|30',
		left: 'var:preset|spacing|30',
	};
	it( 'should return true if all sides not set', () => {
		expect( isValuesMixed( incompleteValues ) ).toBe( true );
	} );
} );

describe( 'isValuesDefined', () => {
	const undefinedValues = {
		top: undefined,
		bottom: undefined,
		left: undefined,
		right: undefined,
	};
	it( 'should return false if values are not defined', () => {
		expect( isValuesDefined( undefinedValues ) ).toBe( false );
	} );
	it( 'should return false if values is passed in as null', () => {
		expect( isValuesDefined( null ) ).toBe( false );
	} );
	const definedValues = {
		top: 'var:preset|spacing|30',
		bottom: 'var:preset|spacing|20',
		left: 'var:preset|spacing|10',
		right: 'var:preset|spacing|30',
	};
	it( 'should return true if all the values are not the same', () => {
		expect( isValuesDefined( definedValues ) ).toBe( true );
	} );
} );
