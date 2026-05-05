/**
 * Internal dependencies
 */
import {
	isValuePreset,
	getPresetSlug,
	getSliderValueFromPreset,
	getCustomValueFromPreset,
	getPresetValueFromCustomValue,
} from '../utils';

describe( 'isValuePreset', () => {
	it( 'should return true for "0" value', () => {
		expect( isValuePreset( '0', 'spacing' ) ).toBe( true );
		expect( isValuePreset( '0', 'border-radius' ) ).toBe( true );
	} );

	it( 'should return true for preset format strings', () => {
		expect( isValuePreset( 'var:preset|spacing|small', 'spacing' ) ).toBe(
			true
		);
		expect(
			isValuePreset( 'var:preset|border-radius|medium', 'border-radius' )
		).toBe( true );
	} );

	it( 'should return false for non-preset values', () => {
		expect( isValuePreset( '10px', 'spacing' ) ).toBe( false );
		expect( isValuePreset( '1rem', 'border-radius' ) ).toBe( false );
		expect( isValuePreset( '100%', 'spacing' ) ).toBe( false );
	} );

	it( 'should return false for undefined or null values', () => {
		expect( isValuePreset( undefined, 'spacing' ) ).toBe( false );
		expect( isValuePreset( null, 'spacing' ) ).toBe( false );
	} );

	it( 'should return false for non-string values', () => {
		expect( isValuePreset( 10, 'spacing' ) ).toBe( false );
		expect( isValuePreset( {}, 'spacing' ) ).toBe( false );
		expect( isValuePreset( [], 'spacing' ) ).toBe( false );
	} );

	it( 'should match specific preset types', () => {
		expect( isValuePreset( 'var:preset|spacing|large', 'spacing' ) ).toBe(
			true
		);
		expect(
			isValuePreset( 'var:preset|spacing|large', 'border-radius' )
		).toBe( false );
	} );
} );

describe( 'getPresetSlug', () => {
	it( 'should return undefined for empty values', () => {
		expect( getPresetSlug( '', 'spacing' ) ).toBe( undefined );
		expect( getPresetSlug( undefined, 'spacing' ) ).toBe( undefined );
		expect( getPresetSlug( null, 'spacing' ) ).toBe( undefined );
	} );

	it( 'should return "0" for zero value', () => {
		expect( getPresetSlug( '0', 'spacing' ) ).toBe( '0' );
	} );

	it( 'should return "default" for default value', () => {
		expect( getPresetSlug( 'default', 'spacing' ) ).toBe( 'default' );
	} );

	it( 'should extract slug from preset format strings', () => {
		expect( getPresetSlug( 'var:preset|spacing|small', 'spacing' ) ).toBe(
			'small'
		);
		expect(
			getPresetSlug( 'var:preset|border-radius|medium', 'border-radius' )
		).toBe( 'medium' );
		expect( getPresetSlug( 'var:preset|spacing|x-large', 'spacing' ) ).toBe(
			'x-large'
		);
	} );

	it( 'should return undefined for non-matching preset types', () => {
		expect(
			getPresetSlug( 'var:preset|spacing|large', 'border-radius' )
		).toBe( undefined );
		expect(
			getPresetSlug( 'var:preset|border-radius|large', 'spacing' )
		).toBe( undefined );
	} );

	it( 'should return undefined for non-preset format strings', () => {
		expect( getPresetSlug( '10px', 'spacing' ) ).toBe( undefined );
		expect( getPresetSlug( 'large', 'spacing' ) ).toBe( undefined );
		expect( getPresetSlug( 'var:custom|spacing|large', 'spacing' ) ).toBe(
			undefined
		);
	} );
} );

describe( 'getSliderValueFromPreset', () => {
	const mockPresets = [
		{ slug: '0', size: '0' },
		{ slug: 'small', size: '8px' },
		{ slug: 'medium', size: '16px' },
		{ slug: 'large', size: '24px' },
	];

	it( 'should return 0 for undefined preset value', () => {
		expect(
			getSliderValueFromPreset( undefined, mockPresets, 'spacing' )
		).toBe( 0 );
	} );

	it( 'should return correct index for zero value', () => {
		expect( getSliderValueFromPreset( '0', mockPresets, 'spacing' ) ).toBe(
			0
		);
		expect( getSliderValueFromPreset( 0, mockPresets, 'spacing' ) ).toBe(
			0
		);
	} );

	it( 'should return correct index for preset values', () => {
		expect(
			getSliderValueFromPreset(
				'var:preset|spacing|small',
				mockPresets,
				'spacing'
			)
		).toBe( 1 );
		expect(
			getSliderValueFromPreset(
				'var:preset|spacing|medium',
				mockPresets,
				'spacing'
			)
		).toBe( 2 );
		expect(
			getSliderValueFromPreset(
				'var:preset|spacing|large',
				mockPresets,
				'spacing'
			)
		).toBe( 3 );
	} );

	it( 'should return NaN for non-existent presets', () => {
		expect(
			getSliderValueFromPreset(
				'var:preset|spacing|nonexistent',
				mockPresets,
				'spacing'
			)
		).toBe( NaN );
		expect(
			getSliderValueFromPreset(
				'var:preset|spacing|xl',
				mockPresets,
				'spacing'
			)
		).toBe( NaN );
	} );

	it( 'should return NaN for non-preset values', () => {
		expect(
			getSliderValueFromPreset( '10px', mockPresets, 'spacing' )
		).toBe( NaN );
		expect(
			getSliderValueFromPreset( '1rem', mockPresets, 'spacing' )
		).toBe( NaN );
	} );

	it( 'should work with different preset types', () => {
		const borderRadiusPresets = [
			{ slug: '0', size: '0' },
			{ slug: 'small', size: '4px' },
			{ slug: 'medium', size: '8px' },
		];
		expect(
			getSliderValueFromPreset(
				'var:preset|border-radius|small',
				borderRadiusPresets,
				'border-radius'
			)
		).toBe( 1 );
		expect(
			getSliderValueFromPreset(
				'var:preset|spacing|small',
				borderRadiusPresets,
				'border-radius'
			)
		).toBe( NaN );
	} );
} );

describe( 'getCustomValueFromPreset', () => {
	const mockPresets = [
		{ slug: '0', size: '0' },
		{ slug: 'small', size: '8px' },
		{ slug: 'medium', size: '16px' },
		{ slug: 'large', size: '24px' },
	];

	it( 'should return original value for non-preset values', () => {
		expect(
			getCustomValueFromPreset( '10px', mockPresets, 'spacing' )
		).toBe( '10px' );
		expect(
			getCustomValueFromPreset( '1rem', mockPresets, 'spacing' )
		).toBe( '1rem' );
		expect(
			getCustomValueFromPreset( '100%', mockPresets, 'spacing' )
		).toBe( '100%' );
	} );

	it( 'should return size for zero preset value', () => {
		expect( getCustomValueFromPreset( '0', mockPresets, 'spacing' ) ).toBe(
			'0'
		);
	} );

	it( 'should return size for preset format strings', () => {
		expect(
			getCustomValueFromPreset(
				'var:preset|spacing|small',
				mockPresets,
				'spacing'
			)
		).toBe( '8px' );
		expect(
			getCustomValueFromPreset(
				'var:preset|spacing|medium',
				mockPresets,
				'spacing'
			)
		).toBe( '16px' );
		expect(
			getCustomValueFromPreset(
				'var:preset|spacing|large',
				mockPresets,
				'spacing'
			)
		).toBe( '24px' );
	} );

	it( 'should return undefined for non-existent presets', () => {
		expect(
			getCustomValueFromPreset(
				'var:preset|spacing|nonexistent',
				mockPresets,
				'spacing'
			)
		).toBe( undefined );
		expect(
			getCustomValueFromPreset(
				'var:preset|spacing|xl',
				mockPresets,
				'spacing'
			)
		).toBe( undefined );
	} );

	it( 'should work with different preset types', () => {
		const borderRadiusPresets = [
			{ slug: 'small', size: '4px' },
			{ slug: 'medium', size: '8px' },
		];
		expect(
			getCustomValueFromPreset(
				'var:preset|border-radius|small',
				borderRadiusPresets,
				'border-radius'
			)
		).toBe( '4px' );
		expect(
			getCustomValueFromPreset(
				'var:preset|spacing|small',
				borderRadiusPresets,
				'border-radius'
			)
		).toBe( 'var:preset|spacing|small' );
	} );

	it( 'should handle numeric slugs correctly', () => {
		const numericPresets = [
			{ slug: 0, size: '0px' },
			{ slug: 10, size: '10px' },
			{ slug: 20, size: '20px' },
		];
		expect(
			getCustomValueFromPreset(
				'var:preset|spacing|10',
				numericPresets,
				'spacing'
			)
		).toBe( '10px' );
		expect(
			getCustomValueFromPreset(
				'var:preset|spacing|20',
				numericPresets,
				'spacing'
			)
		).toBe( '20px' );
	} );
} );

describe( 'getPresetValueFromCustomValue', () => {
	const mockPresets = [
		{ slug: '0', size: '0' },
		{ slug: 'small', size: '8px' },
		{ slug: 'medium', size: '16px' },
		{ slug: 'large', size: '24px' },
	];

	it( 'should return original value for undefined or empty values', () => {
		expect(
			getPresetValueFromCustomValue( undefined, mockPresets, 'spacing' )
		).toBe( undefined );
		expect(
			getPresetValueFromCustomValue( '', mockPresets, 'spacing' )
		).toBe( '' );
		expect(
			getPresetValueFromCustomValue( null, mockPresets, 'spacing' )
		).toBe( null );
	} );

	it( 'should return original value for zero string', () => {
		expect(
			getPresetValueFromCustomValue( '0', mockPresets, 'spacing' )
		).toBe( '0' );
	} );

	it( 'should return original value if already a preset value', () => {
		expect(
			getPresetValueFromCustomValue(
				'var:preset|spacing|small',
				mockPresets,
				'spacing'
			)
		).toBe( 'var:preset|spacing|small' );
		expect(
			getPresetValueFromCustomValue(
				'var:preset|spacing|medium',
				mockPresets,
				'spacing'
			)
		).toBe( 'var:preset|spacing|medium' );
	} );

	it( 'should convert custom values to preset values when match found', () => {
		expect(
			getPresetValueFromCustomValue( '8px', mockPresets, 'spacing' )
		).toBe( 'var:preset|spacing|small' );
		expect(
			getPresetValueFromCustomValue( '16px', mockPresets, 'spacing' )
		).toBe( 'var:preset|spacing|medium' );
		expect(
			getPresetValueFromCustomValue( '24px', mockPresets, 'spacing' )
		).toBe( 'var:preset|spacing|large' );
	} );

	it( 'should return original value when no preset match found', () => {
		expect(
			getPresetValueFromCustomValue( '12px', mockPresets, 'spacing' )
		).toBe( '12px' );
		expect(
			getPresetValueFromCustomValue( '1rem', mockPresets, 'spacing' )
		).toBe( '1rem' );
		expect(
			getPresetValueFromCustomValue( '100%', mockPresets, 'spacing' )
		).toBe( '100%' );
	} );

	it( 'should work with different preset types', () => {
		const borderRadiusPresets = [
			{ slug: 'small', size: '4px' },
			{ slug: 'medium', size: '8px' },
		];
		expect(
			getPresetValueFromCustomValue(
				'4px',
				borderRadiusPresets,
				'border-radius'
			)
		).toBe( 'var:preset|border-radius|small' );
		expect(
			getPresetValueFromCustomValue(
				'8px',
				borderRadiusPresets,
				'border-radius'
			)
		).toBe( 'var:preset|border-radius|medium' );
	} );

	it( 'should handle numeric values and slugs correctly', () => {
		const numericPresets = [
			{ slug: 10, size: '10px' },
			{ slug: 20, size: '20px' },
			{ slug: '30', size: '30px' },
		];
		expect(
			getPresetValueFromCustomValue( '10px', numericPresets, 'spacing' )
		).toBe( 'var:preset|spacing|10' );
		expect(
			getPresetValueFromCustomValue( '20px', numericPresets, 'spacing' )
		).toBe( 'var:preset|spacing|20' );
		expect(
			getPresetValueFromCustomValue( '30px', numericPresets, 'spacing' )
		).toBe( 'var:preset|spacing|30' );
	} );

	it( 'should handle string comparison correctly', () => {
		const mixedPresets = [
			{ slug: 'small', size: '10' },
			{ slug: 'medium', size: 20 },
		];
		expect(
			getPresetValueFromCustomValue( '10', mixedPresets, 'spacing' )
		).toBe( 'var:preset|spacing|small' );
		expect(
			getPresetValueFromCustomValue( 20, mixedPresets, 'spacing' )
		).toBe( 'var:preset|spacing|medium' );
	} );

	it( 'should not convert already preset values from different types', () => {
		expect(
			getPresetValueFromCustomValue(
				'var:preset|border-radius|small',
				mockPresets,
				'spacing'
			)
		).toBe( 'var:preset|border-radius|small' );
	} );
} );
