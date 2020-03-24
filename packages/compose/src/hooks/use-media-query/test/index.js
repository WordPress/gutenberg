/**
 * External dependencies
 */
import { create, act } from 'react-test-renderer';

/**
 * Internal dependencies
 */
import useMediaQuery from '../';

describe( 'useMediaQuery', () => {
	let addListener, removeListener;

	beforeAll( () => {
		jest.spyOn( global, 'matchMedia' );

		addListener = jest.fn();
		removeListener = jest.fn();
	} );

	afterEach( () => {
		global.matchMedia.mockClear();
		addListener.mockClear();
		removeListener.mockClear();
	} );

	afterAll( () => {
		global.matchMedia.mockRestore();
	} );

	const TestComponent = ( { query } ) => {
		const queryResult = useMediaQuery( query );
		return `useMediaQuery: ${ queryResult }`;
	};

	it( 'should return true when query matches', async () => {
		global.matchMedia.mockReturnValue( {
			addListener,
			removeListener,
			matches: true,
		} );

		let root;

		await act( async () => {
			root = create( <TestComponent query="(min-width: 782px)" /> );
		} );

		expect( root.toJSON() ).toBe( 'useMediaQuery: true' );

		await act( async () => {
			root.unmount();
		} );
		expect( removeListener ).toHaveBeenCalled();
	} );

	it( 'should correctly update the value when the query evaluation matches', async () => {
		global.matchMedia.mockReturnValueOnce( {
			addListener,
			removeListener,
			matches: true,
		} );
		global.matchMedia.mockReturnValueOnce( {
			addListener,
			removeListener,
			matches: true,
		} );
		global.matchMedia.mockReturnValueOnce( {
			addListener,
			removeListener,
			matches: false,
		} );

		let root, updateMatchFunction;
		await act( async () => {
			root = create( <TestComponent query="(min-width: 782px)" /> );
		} );
		expect( root.toJSON() ).toBe( 'useMediaQuery: true' );

		await act( async () => {
			updateMatchFunction = addListener.mock.calls[ 0 ][ 0 ];
			updateMatchFunction();
		} );
		expect( root.toJSON() ).toBe( 'useMediaQuery: false' );

		await act( async () => {
			root.unmount();
		} );
		expect( removeListener.mock.calls ).toEqual( [
			[ updateMatchFunction ],
		] );
	} );

	it( 'should return false when the query does not matches', async () => {
		global.matchMedia.mockReturnValue( {
			addListener,
			removeListener,
			matches: false,
		} );
		let root;
		await act( async () => {
			root = create( <TestComponent query="(min-width: 782px)" /> );
		} );
		expect( root.toJSON() ).toBe( 'useMediaQuery: false' );

		await act( async () => {
			root.unmount();
		} );
		expect( removeListener ).toHaveBeenCalled();
	} );

	it( 'should not call matchMedia if a query is not passed', async () => {
		global.matchMedia.mockReturnValue( {
			addListener,
			removeListener,
			matches: false,
		} );
		let root;
		await act( async () => {
			root = create( <TestComponent /> );
		} );
		expect( root.toJSON() ).toBe( 'useMediaQuery: undefined' );

		await act( async () => {
			root.update( <TestComponent query={ false } /> );
		} );
		expect( root.toJSON() ).toBe( 'useMediaQuery: false' );

		await act( async () => {
			root.unmount();
		} );
		expect( global.matchMedia ).not.toHaveBeenCalled();
		expect( addListener ).not.toHaveBeenCalled();
		expect( removeListener ).not.toHaveBeenCalled();
	} );
} );
