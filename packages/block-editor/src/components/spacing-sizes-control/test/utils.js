/**
 * Internal dependencies
 */
import {
	ALL_SIDES,
	getAllRawValue,
	getCustomValueFromPreset,
	getInitialView,
	getPresetValueFromCustomValue,
	getSliderValueFromPreset,
	getSpacingPresetCssVar,
	getSpacingPresetSlug,
	getSupportedMenuItems,
	hasAxisSupport,
	hasBalancedSidesSupport,
	isValuesDefined,
	isValuesMixed,
	isValueSpacingPreset,
	LABELS,
	VIEWS,
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
	const spacingSizes = [
		{ name: 'Default', slug: 'default', size: undefined },
		{ name: 'Small', slug: 20, size: '8px' },
	];
	it( 'should return undefined even if an undefined value exist in spacing sizes as occurs if spacingSizes has > 7 entries', () => {
		expect( getPresetValueFromCustomValue( undefined, spacingSizes ) ).toBe(
			undefined
		);
	} );
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

describe( 'hasAxisSupport', () => {
	it( 'should return true for horizontal support if it is in sides', () => {
		expect( hasAxisSupport( [ 'horizontal' ], 'horizontal' ) ).toBe( true );
	} );
	it( 'should return true for horizontal support if both left and right are in sides', () => {
		expect( hasAxisSupport( [ 'left', 'right' ], 'horizontal' ) ).toBe(
			true
		);
	} );
	it( 'should return false for horizontal when not supported', () => {
		expect( hasAxisSupport( [ 'left' ], 'horizontal' ) ).toBe( false );
	} );
	it( 'should return true for vertical support if it is in sides', () => {
		expect( hasAxisSupport( [ 'vertical' ], 'vertical' ) ).toBe( true );
	} );
	it( 'should return true for vertical support if both top and bottom are in sides', () => {
		expect( hasAxisSupport( [ 'top', 'bottom' ], 'vertical' ) ).toBe(
			true
		);
	} );
	it( 'should return false for vertical when not supported', () => {
		expect( hasAxisSupport( [ 'top' ], 'vertical' ) ).toBe( false );
	} );
	it( 'should return true when either horizontal or vertical axes are supported and no axis supplied', () => {
		expect( hasAxisSupport( [ 'horizontal' ] ) ).toBe( true );
		expect( hasAxisSupport( [ 'vertical' ] ) ).toBe( true );
		expect( hasAxisSupport( [ 'left', 'right' ] ) ).toBe( true );
		expect( hasAxisSupport( [ 'top', 'bottom' ] ) ).toBe( true );
		expect( hasAxisSupport( [ 'top', 'left' ] ) ).toBe( false );
	} );
} );

describe( 'getSupportedMenuItems', () => {
	it( 'returns no items when sides are not configured', () => {
		expect( getSupportedMenuItems( [] ) ).toEqual( {} );
		expect( getSupportedMenuItems() ).toEqual( {} );
	} );

	const sideConfigs = [
		[ LABELS.axial, [ 'horizontal', 'vertical' ] ],
		[ LABELS.axial, [ 'top', 'right', 'bottom', 'left' ] ],
		[ LABELS.horizontal, [ 'horizontal' ] ],
		[ LABELS.horizontal, [ 'left', 'right' ] ],
		[ LABELS.vertical, [ 'vertical' ] ],
		[ LABELS.vertical, [ 'top', 'bottom' ] ],
		[ LABELS.horizontal, [ 'horizontal' ] ],
	];

	test.each( sideConfigs )(
		'should include %s axial menu with %s sides',
		( label, sides ) => {
			expect( getSupportedMenuItems( sides ) ).toHaveProperty(
				'axial.label',
				label
			);
		}
	);

	it( 'returns no axial item when not not supported', () => {
		expect( getSupportedMenuItems( [ 'left', 'top' ] ) ).not.toHaveProperty(
			'axial'
		);
	} );

	it( 'should include the correct individual side options', () => {
		expect( getSupportedMenuItems( [ 'top' ] ) ).toHaveProperty(
			'top.label',
			LABELS.top
		);
		expect( getSupportedMenuItems( [ 'right' ] ) ).toHaveProperty(
			'right.label',
			LABELS.right
		);
		expect( getSupportedMenuItems( [ 'bottom' ] ) ).toHaveProperty(
			'bottom.label',
			LABELS.bottom
		);
		expect( getSupportedMenuItems( [ 'left' ] ) ).toHaveProperty(
			'left.label',
			LABELS.left
		);
	} );
	it( 'should include the custom option only when applicable', () => {
		expect( getSupportedMenuItems( [ 'top', 'left' ] ) ).toHaveProperty(
			'custom.label',
			LABELS.custom
		);
		expect( getSupportedMenuItems( [ 'top' ] ) ).not.toHaveProperty(
			'custom'
		);
		expect(
			getSupportedMenuItems( [ 'horizontal', 'vertical' ] )
		).not.toHaveProperty( 'custom.label' );
	} );
} );

describe( 'hasBalancedSidesSupport', () => {
	it( 'should determine balanced sides', () => {
		expect( hasBalancedSidesSupport( ALL_SIDES ) ).toBe( true );
		expect( hasBalancedSidesSupport( [ 'top', 'bottom' ] ) ).toBe( true );
		expect( hasBalancedSidesSupport( [ 'left', 'right' ] ) ).toBe( true );
		expect( hasBalancedSidesSupport() ).toBe( true );
	} );
	it( 'should determine unbalanced sides', () => {
		expect( hasBalancedSidesSupport( [ 'top' ] ) ).toBe( false );
		expect( hasBalancedSidesSupport( [ 'left' ] ) ).toBe( false );
		expect( hasBalancedSidesSupport( [ 'top', 'right' ] ) ).toBe( false );
	} );
} );

describe( 'getInitialView', () => {
	describe( 'Axial view (Horizontal & vertical, Horizontal, or Vertical)', () => {
		it( 'should return axial view when no values defined with balanced sides config', () => {
			expect( getInitialView( {}, ALL_SIDES ) ).toBe( VIEWS.axial );
			expect( getInitialView( undefined, ALL_SIDES ) ).toBe(
				VIEWS.axial
			);
		} );
		it( 'should return axial view when horizontal & vertical axes are supported and have axial values', () => {
			expect(
				getInitialView(
					{ top: '1em', right: '2em', bottom: '1em', left: '2em' },
					ALL_SIDES
				)
			).toBe( VIEWS.axial );
		} );
		it( 'should return axial view when horizontal axis is supported, horizontal values set and no vertical supported or values', () => {
			expect(
				getInitialView( { left: '1em', right: '1em' }, ALL_SIDES )
			).toBe( VIEWS.axial );
		} );
		it( 'should return axial view when vertical axis is supported and vertical values are set without horizontal values', () => {
			expect(
				getInitialView( { top: '1em', bottom: '1em' }, ALL_SIDES )
			).toBe( VIEWS.axial );
		} );
		it( 'should not return axial view when axial values do not match', () => {
			expect(
				getInitialView(
					{ top: '1em', bottom: '1.5em', left: '1em', right: '1em' },
					ALL_SIDES
				)
			).not.toBe( VIEWS.axial );
		} );
	} );

	describe( 'Custom sides view', () => {
		it( 'should return custom view when no values and unbalanced sides config with > 1 side', () => {
			expect( getInitialView( {}, [ 'top', 'left' ] ) ).toBe(
				VIEWS.custom
			);
			expect(
				getInitialView( undefined, [ 'right', 'bottom', 'left' ] )
			).toBe( VIEWS.custom );
		} );
		it( 'should return custom sides view when all values match and unbalanced sides config', () => {
			expect(
				getInitialView( { top: '1em', right: '1em', bottom: '1em' }, [
					'top',
					'right',
					'bottom',
				] )
			).toBe( VIEWS.custom );
		} );
		it( 'should return custom view if there is more than one side with differing values', () => {
			expect(
				getInitialView(
					{ top: '1em', bottom: '1.5em', left: '1em', right: '1em' },
					ALL_SIDES
				)
			).toBe( VIEWS.custom );
		} );
		it( 'should return custom view if mixed partial subset of values is provided', () => {
			expect(
				getInitialView( { top: '1em', right: '10px' }, ALL_SIDES )
			).toBe( VIEWS.custom );
		} );
		it( 'should return custom view if there is only a single side value', () => {
			expect( getInitialView( { top: '1em' }, ALL_SIDES ) ).toBe(
				VIEWS.custom
			);
		} );
		it( 'should return custom view even if only single side supported', () => {
			expect( getInitialView( { top: '1em' }, [ 'top' ] ) ).toBe(
				VIEWS.custom
			);
			expect( getInitialView( { right: '1em' }, [ 'right' ] ) ).toBe(
				VIEWS.custom
			);
			expect( getInitialView( { bottom: '1em' }, [ 'bottom' ] ) ).toBe(
				VIEWS.custom
			);
			expect( getInitialView( { left: '1em' }, [ 'left' ] ) ).toBe(
				VIEWS.custom
			);
		} );
	} );

	describe( 'Single side view', () => {
		it( 'should return single side when only single side supported and no value defined', () => {
			expect( getInitialView( {}, [ 'top' ] ) ).toBe( VIEWS.top );
		} );

		it( 'should return single side when only single side supported and has only axial sides', () => {
			expect(
				getInitialView( { top: '1em' }, [ 'horizontal', 'vertical' ] )
			).toBe( VIEWS.top );
			expect(
				getInitialView( { left: '4em' }, [ 'horizontal', 'vertical' ] )
			).toBe( VIEWS.left );
		} );
	} );
} );
