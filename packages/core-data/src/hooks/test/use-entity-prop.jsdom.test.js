import { act, renderHook } from '@testing-library/react';
import { createRegistry, RegistryProvider } from '@wordpress/data';
import { createElement } from '@wordpress/element';
import { store as coreDataStore } from '../../index';
import useEntityProp from '../use-entity-prop';

describe( 'useEntityProp', () => {
	let registry;

	beforeEach( () => {
		jest.useFakeTimers();
		registry = createRegistry();
		registry.register( coreDataStore );
		// The site entity is loaded lazily in production, so register it here.
		registry.dispatch( coreDataStore ).addEntities( [
			{
				kind: 'root',
				name: 'site',
				key: false,
				baseURL: '/wp/v2/settings',
			},
		] );
		registry
			.dispatch( coreDataStore )
			.receiveEntityRecords( 'root', 'site', { title: 'My Site' } );
	} );

	afterEach( () => {
		jest.useRealTimers();
	} );

	/**
	 * Renders the hook the way the Site Title block uses it, against the
	 * keyless `root`/`site` entity.
	 *
	 * @param {Object} [options] Hook options.
	 * @return {Object} The `renderHook` result.
	 */
	function mountSiteTitle( options ) {
		const wrapper = ( { children } ) =>
			createElement( RegistryProvider, { value: registry }, children );

		const { result } = renderHook(
			() => useEntityProp( 'root', 'site', 'title', undefined, options ),
			{ wrapper }
		);

		return result;
	}

	/**
	 * Appends the text one character at a time, as a `RichText` onChange would.
	 *
	 * @param {Object} result The `renderHook` result.
	 * @param {string} text   The text to type.
	 */
	function type( result, text ) {
		for ( const character of text ) {
			act( () => {
				const [ value, setValue ] = result.current;
				setValue( value + character );
			} );
		}
	}

	const undo = () =>
		act( () => {
			registry.dispatch( coreDataStore ).undo();
		} );

	it( 'creates an undo level per edit by default', () => {
		const result = mountSiteTitle();

		type( result, ' Blog' );
		expect( result.current[ 0 ] ).toBe( 'My Site Blog' );

		// Each keystroke has to be undone on its own.
		undo();
		expect( result.current[ 0 ] ).toBe( 'My Site Blo' );
	} );

	it( 'merges consecutive edits into a single undo level when coalescing', () => {
		const result = mountSiteTitle( { coalesceEdits: true } );

		type( result, ' Blog' );
		expect( result.current[ 0 ] ).toBe( 'My Site Blog' );

		// A single undo discards the whole burst of typing.
		undo();
		expect( result.current[ 0 ] ).toBe( 'My Site' );
	} );

	it( 'starts a new undo level for an edit made after the timeout', () => {
		const result = mountSiteTitle( { coalesceEdits: true } );

		type( result, ' Blog' );
		act( () => {
			jest.advanceTimersByTime( 1000 );
		} );
		type( result, '!' );

		undo();
		expect( result.current[ 0 ] ).toBe( 'My Site Blog' );

		undo();
		expect( result.current[ 0 ] ).toBe( 'My Site' );
	} );
} );
