/**
 * External dependencies
 */
import EquivalentKeyMap from 'equivalent-key-map';

/**
 * Internal dependencies
 */
import {
	getIsResolving,
	hasStartedResolution,
	hasFinishedResolution,
	isResolving,
} from '../selectors';

describe( 'getIsResolving', () => {
	it( 'should return undefined if no state by reducerKey, selectorName', () => {
		const state = {};
		const result = getIsResolving( state, 'getFoo', [] );

		expect( result ).toBe( undefined );
	} );

	it( 'should return undefined if state by reducerKey, selectorName, but not args', () => {
		const state = {
			getFoo: new EquivalentKeyMap( [ [ [], true ] ] ),
		};
		const result = getIsResolving( state, 'getFoo', [ 'bar' ] );

		expect( result ).toBe( undefined );
	} );

	it( 'should return value by reducerKey, selectorName', () => {
		const state = {
			getFoo: new EquivalentKeyMap( [ [ [], true ] ] ),
		};
		const result = getIsResolving( state, 'getFoo', [] );

		expect( result ).toBe( true );
	} );

	it( 'should normalize args ard return the right value', () => {
		const state = {
			getFoo: new EquivalentKeyMap( [ [ [], true ] ] ),
		};
		expect( getIsResolving( state, 'getFoo' ) ).toBe( true );
		expect( getIsResolving( state, 'getFoo', [ undefined ] ) ).toBe( true );
		expect(
			getIsResolving( state, 'getFoo', [ undefined, undefined ] )
		).toBe( true );
	} );
} );

describe( 'hasStartedResolution', () => {
	it( 'returns false if not has started', () => {
		const state = {};
		const result = hasStartedResolution( state, 'getFoo', [] );

		expect( result ).toBe( false );
	} );

	it( 'returns true if has started', () => {
		const state = {
			getFoo: new EquivalentKeyMap( [ [ [], true ] ] ),
		};
		const result = hasStartedResolution( state, 'getFoo', [] );

		expect( result ).toBe( true );
	} );
} );

describe( 'hasFinishedResolution', () => {
	it( 'returns false if not has finished', () => {
		const state = {
			getFoo: new EquivalentKeyMap( [ [ [], true ] ] ),
		};
		const result = hasFinishedResolution( state, 'getFoo', [] );

		expect( result ).toBe( false );
	} );

	it( 'returns true if has finished', () => {
		const state = {
			getFoo: new EquivalentKeyMap( [ [ [], false ] ] ),
		};
		const result = hasFinishedResolution( state, 'getFoo', [] );

		expect( result ).toBe( true );
	} );
} );

describe( 'isResolving', () => {
	it( 'returns false if not has started', () => {
		const state = {};
		const result = isResolving( state, 'getFoo', [] );

		expect( result ).toBe( false );
	} );

	it( 'returns false if has finished', () => {
		const state = {
			getFoo: new EquivalentKeyMap( [ [ [], false ] ] ),
		};
		const result = isResolving( state, 'getFoo', [] );

		expect( result ).toBe( false );
	} );

	it( 'returns true if has started but not finished', () => {
		const state = {
			getFoo: new EquivalentKeyMap( [ [ [], true ] ] ),
		};
		const result = isResolving( state, 'getFoo', [] );

		expect( result ).toBe( true );
	} );
} );
