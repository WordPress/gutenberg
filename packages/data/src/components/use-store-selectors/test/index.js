/**
 * Internal dependencies
 */
import { createRegistry } from '../../../registry';
import useStoreSelectors from '../index';

jest.mock( '../../use-select', () => {
	return jest.fn();
} );

import useSelect from '../../use-select';

describe( 'useStoreSelectors', () => {
	let registry;
	beforeEach( () => {
		registry = createRegistry();
	} );

	it( 'wraps useSelect', () => {
		registry.registerStore( 'testStore', {
			reducer: () => ( { foo: 'bar' } ),
			selectors: {
				testSelector: ( state, key ) => state[ key ],
			},
		} );

		// Setup mocks
		const mapSelectSpy = jest.fn( () => 'map select retval' );
		const selectSpy = jest.fn();
		useSelect.mockImplementation( () => 'return value' );

		// Call with a mock mapSelect fn
		const retval = useStoreSelectors( 'testStore', mapSelectSpy );

		// Make sure useSelect was called and we got its return value
		expect( retval ).toBe( 'return value' );
		expect( useSelect ).toHaveBeenCalledTimes( 1 );

		// Make sure mapSelect was _not_ called just yet
		expect( mapSelectSpy ).not.toHaveBeenCalled();

		// Grab the wrapped mapSelect created by useStoreSelectors
		const wrappedMapSelect = useSelect.mock.calls[ 0 ][ 0 ];
		expect( wrappedMapSelect ).toEqual( expect.any( Function ) );
		expect( selectSpy ).not.toHaveBeenCalled();

		// Call it and make sure it calls the callback passed to useStoreSelectors
		expect( wrappedMapSelect( selectSpy ) ).toBe( 'map select retval' );
		expect( selectSpy ).toHaveBeenCalledWith( 'testStore' );
	} );
} );
