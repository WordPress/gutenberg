import { describe, expect, it } from 'vitest';
import reducer from '../reducer';
import { registerCommandLoader, unregisterCommandLoader } from '../actions';
import { setLoaderLoading } from '../private-actions';
import { isLoading } from '../private-selectors';
import type { Action, State } from '../types';

const NAME = 'test/loader';
const hook = () => ( { commands: [], isLoading: true } );

function reduce( ...actions: Action[] ): State {
	return actions.reduce< State | undefined >(
		( state, action ) => reducer( state, action ),
		undefined
	) as State;
}

describe( 'isLoading', () => {
	it( 'is true while a registered loader is loading', () => {
		const state = reduce(
			registerCommandLoader( { name: NAME, hook } ),
			setLoaderLoading( NAME, true )
		);

		expect( isLoading( state ) ).toBe( true );
	} );

	it( 'ignores a loader that unregistered while loading', () => {
		const state = reduce(
			registerCommandLoader( { name: NAME, hook } ),
			setLoaderLoading( NAME, true ),
			unregisterCommandLoader( NAME )
		);

		expect( isLoading( state ) ).toBe( false );
	} );

	it( 'ignores a loading flag set after the loader unregistered', () => {
		const state = reduce(
			registerCommandLoader( { name: NAME, hook } ),
			unregisterCommandLoader( NAME ),
			setLoaderLoading( NAME, true )
		);

		expect( isLoading( state ) ).toBe( false );
	} );

	it( 'keeps the loading flag when a loader registers again', () => {
		const state = reduce(
			registerCommandLoader( { name: NAME, hook } ),
			setLoaderLoading( NAME, true ),
			unregisterCommandLoader( NAME ),
			registerCommandLoader( { name: NAME, hook } )
		);

		expect( isLoading( state ) ).toBe( true );
	} );

	it( 'drops the flag once the loader stops loading', () => {
		const state = reduce(
			registerCommandLoader( { name: NAME, hook } ),
			setLoaderLoading( NAME, true ),
			setLoaderLoading( NAME, false )
		);

		expect( isLoading( state ) ).toBe( false );
		expect( state.loaderStates ).toEqual( {} );
	} );
} );
