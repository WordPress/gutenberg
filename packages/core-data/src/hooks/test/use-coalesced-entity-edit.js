import { act, render } from '@testing-library/react';
import { createRegistry, RegistryProvider } from '@wordpress/data';
import useCoalescedEntityEdit from '../use-coalesced-entity-edit';

describe( 'useCoalescedEntityEdit', () => {
	let registry;
	let edits;

	beforeEach( () => {
		jest.useFakeTimers();
		edits = [];
		registry = createRegistry();
		// A stand-in for the core store, so the options each edit is
		// dispatched with can be observed.
		registry.registerStore( 'core', {
			reducer: ( state = {} ) => state,
			actions: {
				editEntityRecord: ( kind, name, recordId, record, options ) => {
					edits.push( { record, options } );
					return { type: 'NOOP' };
				},
			},
		} );
	} );

	afterEach( () => {
		jest.useRealTimers();
	} );

	function getEditFunction() {
		let edit;
		const TestComponent = () => {
			edit = useCoalescedEntityEdit( 'root', 'site' );
			return <div />;
		};
		render(
			<RegistryProvider value={ registry }>
				<TestComponent />
			</RegistryProvider>
		);
		return ( ...args ) => act( () => edit( ...args ) );
	}

	it( 'opens an undo level on the first edit and stages the rest', () => {
		const edit = getEditFunction();

		edit( { title: 'a' } );
		edit( { title: 'ab' } );
		edit( { title: 'abc' } );

		expect( edits.map( ( { options } ) => options.isCached ) ).toEqual( [
			false,
			true,
			true,
		] );
	} );

	it( 'opens a new undo level once the run goes idle', () => {
		const edit = getEditFunction();

		edit( { title: 'a' } );
		edit( { title: 'ab' } );

		act( () => {
			jest.advanceTimersByTime( 1000 );
		} );

		edit( { title: 'abc' } );

		expect( edits.map( ( { options } ) => options.isCached ) ).toEqual( [
			false,
			true,
			false,
		] );
	} );

	it( 'keeps the run open while edits keep arriving', () => {
		const edit = getEditFunction();

		edit( { title: 'a' } );
		act( () => {
			jest.advanceTimersByTime( 900 );
		} );
		edit( { title: 'ab' } );
		act( () => {
			jest.advanceTimersByTime( 900 );
		} );
		edit( { title: 'abc' } );

		expect( edits.map( ( { options } ) => options.isCached ) ).toEqual( [
			false,
			true,
			true,
		] );
	} );

	it( 'passes through the caller options', () => {
		const edit = getEditFunction();

		edit( { title: 'a' }, { undoIgnore: true } );

		expect( edits[ 0 ].options ).toEqual( {
			undoIgnore: true,
			isCached: false,
		} );
	} );
} );
