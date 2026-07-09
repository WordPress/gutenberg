/**
 * Internal dependencies
 */
import {
	hasPseudoStyleStateValue,
	hasStyleStateValue,
	hasViewportStyleStateValue,
} from '../style-states';

describe( 'hasViewportStyleStateValue', () => {
	it( 'returns false for undefined state', () => {
		expect( hasViewportStyleStateValue() ).toBe( false );
	} );

	it( 'returns false for the default viewport state', () => {
		expect(
			hasViewportStyleStateValue( {
				viewport: 'default',
			} )
		).toBe( false );
	} );

	it( 'returns true for a non-default viewport state', () => {
		expect(
			hasViewportStyleStateValue( {
				viewport: '@mobile',
			} )
		).toBe( true );
	} );
} );

describe( 'hasPseudoStyleStateValue', () => {
	it( 'returns false for undefined state', () => {
		expect( hasPseudoStyleStateValue() ).toBe( false );
	} );

	it( 'returns false for the default pseudo state', () => {
		expect(
			hasPseudoStyleStateValue( {
				pseudo: 'default',
			} )
		).toBe( false );
	} );

	it( 'returns true for a non-default pseudo state', () => {
		expect(
			hasPseudoStyleStateValue( {
				pseudo: ':hover',
			} )
		).toBe( true );
	} );
} );

describe( 'hasStyleStateValue', () => {
	it( 'returns false for undefined state', () => {
		expect( hasStyleStateValue() ).toBe( false );
	} );

	it( 'returns false when all state values are default', () => {
		expect(
			hasStyleStateValue( {
				viewport: 'default',
				pseudo: 'default',
			} )
		).toBe( false );
	} );

	it( 'returns true when a viewport state is selected', () => {
		expect(
			hasStyleStateValue( {
				viewport: '@mobile',
				pseudo: 'default',
			} )
		).toBe( true );
	} );

	it( 'returns true when a pseudo state is selected', () => {
		expect(
			hasStyleStateValue( {
				viewport: 'default',
				pseudo: ':hover',
			} )
		).toBe( true );
	} );

	it( 'returns true when an arbitrary state value is selected', () => {
		expect(
			hasStyleStateValue( {
				customState: 'active',
			} )
		).toBe( true );
	} );
} );
