/**
 * Internal dependencies
 */
import { getStateControlValues } from '../states';

describe( 'getStateControlValues', () => {
	it( 'returns default values for the default state', () => {
		expect( getStateControlValues( 'default' ) ).toEqual( {
			viewportValue: 'default',
			pseudoStateValue: 'default',
		} );
	} );

	it( 'maps responsive states to the viewport value', () => {
		expect( getStateControlValues( 'mobile' ) ).toEqual( {
			viewportValue: 'mobile',
			pseudoStateValue: 'default',
		} );
	} );

	it( 'maps pseudo states to the pseudo state value', () => {
		expect( getStateControlValues( ':hover' ) ).toEqual( {
			viewportValue: 'default',
			pseudoStateValue: ':hover',
		} );
	} );
} );
