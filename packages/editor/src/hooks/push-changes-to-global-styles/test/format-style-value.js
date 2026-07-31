/**
 * Internal dependencies
 */
import {
	formatStyleValue,
	formatBorderShorthand,
	formatBorderRadius,
	formatSpacingShorthand,
	formatBlockGap,
	EMPTY_VALUE_LABEL,
} from '../format-style-value';

describe( 'formatStyleValue', () => {
	it( 'renders a placeholder for empty values', () => {
		expect( formatStyleValue( undefined ) ).toBe( EMPTY_VALUE_LABEL );
		expect( formatStyleValue( null ) ).toBe( EMPTY_VALUE_LABEL );
		expect( formatStyleValue( '' ) ).toBe( EMPTY_VALUE_LABEL );
	} );

	it( 'humanizes preset tokens', () => {
		expect( formatStyleValue( 'var:preset|color|vivid-red' ) ).toBe(
			'Vivid Red'
		);
		expect( formatStyleValue( 'var:preset|font-size|x-large' ) ).toBe(
			'X Large'
		);
	} );

	it( 'humanizes preset CSS custom property values', () => {
		expect(
			formatStyleValue( 'var(--wp--preset--color--vivid-red)' )
		).toBe( 'Vivid Red' );
		expect(
			formatStyleValue( 'var(--wp--preset--font-size--x-large)' )
		).toBe( 'X Large' );
	} );

	it( 'humanizes preset CSS custom property values with a fallback', () => {
		expect(
			formatStyleValue( 'var(--wp--preset--color--vivid-red, #cf2e2e)' )
		).toBe( 'Vivid Red' );
	} );

	it( 'passes plain strings through unchanged', () => {
		expect( formatStyleValue( 'uppercase' ) ).toBe( 'uppercase' );
		expect( formatStyleValue( '20px' ) ).toBe( '20px' );
	} );

	it( 'stringifies numbers', () => {
		expect( formatStyleValue( 1.5 ) ).toBe( '1.5' );
		expect( formatStyleValue( 0 ) ).toBe( '0' );
	} );

	it( 'stringifies non-empty objects and falls back for empty ones', () => {
		expect( formatStyleValue( { top: '1px' } ) ).toBe(
			JSON.stringify( { top: '1px' } )
		);
		expect( formatStyleValue( {} ) ).toBe( EMPTY_VALUE_LABEL );
		expect( formatStyleValue( [] ) ).toBe( EMPTY_VALUE_LABEL );
	} );
} );

describe( 'formatBorderShorthand', () => {
	it( 'orders parts as width, style, color', () => {
		expect(
			formatBorderShorthand( {
				width: '2px',
				style: 'dashed',
				color: '#000fff',
			} )
		).toBe( '2px dashed #000fff' );
	} );

	it( 'omits unset parts', () => {
		expect(
			formatBorderShorthand( { style: 'solid', color: '#ff00ff' } )
		).toBe( 'solid #ff00ff' );
	} );

	it( 'humanizes preset color tokens', () => {
		expect(
			formatBorderShorthand( {
				width: '1px',
				style: 'solid',
				color: 'var:preset|color|vivid-red',
			} )
		).toBe( '1px solid Vivid Red' );
	} );

	it( 'falls back to a placeholder for empty or non-object values', () => {
		expect( formatBorderShorthand( {} ) ).toBe( EMPTY_VALUE_LABEL );
		expect( formatBorderShorthand( undefined ) ).toBe( EMPTY_VALUE_LABEL );
	} );

	it( 'collapses a uniform per-side object to its shared values', () => {
		expect(
			formatBorderShorthand( {
				top: { style: 'dotted' },
				right: { style: 'dotted' },
				bottom: { style: 'dotted' },
				left: { style: 'dotted' },
			} )
		).toBe( 'dotted' );
	} );

	it( 'omits a per-side property when the sides disagree', () => {
		expect(
			formatBorderShorthand( {
				top: { style: 'dotted', width: '1px' },
				right: { style: 'dashed', width: '1px' },
			} )
		).toBe( '1px' );
	} );
} );

describe( 'formatBorderRadius', () => {
	it( 'passes a string radius through unchanged', () => {
		expect( formatBorderRadius( '10px' ) ).toBe( '10px' );
	} );

	it( 'joins a per-corner object in CSS shorthand order', () => {
		expect(
			formatBorderRadius( {
				topLeft: '1px',
				topRight: '20px',
				bottomRight: '1px',
				bottomLeft: '15px',
			} )
		).toBe( '1px 20px 1px 15px' );
	} );

	it( 'falls back to a placeholder for empty values', () => {
		expect( formatBorderRadius( {} ) ).toBe( EMPTY_VALUE_LABEL );
		expect( formatBorderRadius( undefined ) ).toBe( EMPTY_VALUE_LABEL );
	} );
} );

describe( 'formatSpacingShorthand', () => {
	it( 'passes a string value through unchanged', () => {
		expect( formatSpacingShorthand( '10px' ) ).toBe( '10px' );
	} );

	it( 'collapses a uniform object to a single value', () => {
		expect(
			formatSpacingShorthand( {
				top: '10px',
				right: '10px',
				bottom: '10px',
				left: '10px',
			} )
		).toBe( '10px' );
	} );

	it( 'collapses axial values to a vertical horizontal pair', () => {
		expect(
			formatSpacingShorthand( {
				top: '10px',
				right: '20px',
				bottom: '10px',
				left: '20px',
			} )
		).toBe( '10px 20px' );
	} );

	it( 'lists all four sides when they differ', () => {
		expect(
			formatSpacingShorthand( {
				top: '1px',
				right: '2px',
				bottom: '3px',
				left: '4px',
			} )
		).toBe( '1px 2px 3px 4px' );
	} );

	it( 'keeps all four slots for a partial object so positions stay clear', () => {
		expect(
			formatSpacingShorthand( { top: '10px', bottom: '10px' } )
		).toBe( `10px ${ EMPTY_VALUE_LABEL } 10px ${ EMPTY_VALUE_LABEL }` );
	} );

	it( 'humanizes preset spacing tokens without a resolver', () => {
		expect(
			formatSpacingShorthand( {
				top: 'var:preset|spacing|40',
				right: 'var:preset|spacing|40',
				bottom: 'var:preset|spacing|40',
				left: 'var:preset|spacing|40',
			} )
		).toBe( '40' );
	} );

	it( 'resolves preset spacing tokens with a resolver', () => {
		const resolve = ( value ) =>
			value === 'var:preset|spacing|40' ? '1.5rem' : value;

		expect(
			formatSpacingShorthand(
				{
					top: 'var:preset|spacing|40',
					right: '20px',
					bottom: 'var:preset|spacing|40',
					left: '20px',
				},
				resolve
			)
		).toBe( '1.5rem 20px' );
	} );

	it( 'falls back to a placeholder for empty values', () => {
		expect( formatSpacingShorthand( {} ) ).toBe( EMPTY_VALUE_LABEL );
		expect( formatSpacingShorthand( undefined ) ).toBe( EMPTY_VALUE_LABEL );
	} );
} );

describe( 'formatBlockGap', () => {
	it( 'passes a string value through unchanged', () => {
		expect( formatBlockGap( '10px' ) ).toBe( '10px' );
	} );

	it( 'collapses matching axes to a single value', () => {
		expect( formatBlockGap( { top: '10px', left: '10px' } ) ).toBe(
			'10px'
		);
	} );

	it( 'shows differing axes as a row - column pair', () => {
		expect( formatBlockGap( { top: '10px', left: '20px' } ) ).toBe(
			'10px - 20px'
		);
	} );

	it( 'keeps a placeholder for an unset axis', () => {
		expect( formatBlockGap( { top: '10px' } ) ).toBe(
			`10px - ${ EMPTY_VALUE_LABEL }`
		);
		expect( formatBlockGap( { left: '20px' } ) ).toBe(
			`${ EMPTY_VALUE_LABEL } - 20px`
		);
	} );

	it( 'resolves preset gap tokens with a resolver', () => {
		const resolve = ( value ) =>
			value === 'var:preset|spacing|40' ? '1.5rem' : value;

		expect(
			formatBlockGap(
				{ top: 'var:preset|spacing|40', left: '20px' },
				resolve
			)
		).toBe( '1.5rem - 20px' );
	} );

	it( 'falls back to a placeholder for empty values', () => {
		expect( formatBlockGap( {} ) ).toBe( EMPTY_VALUE_LABEL );
		expect( formatBlockGap( undefined ) ).toBe( EMPTY_VALUE_LABEL );
	} );
} );
