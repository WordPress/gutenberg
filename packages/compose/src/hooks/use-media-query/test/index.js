/**
 * External dependencies
 */
import { render, act } from '@testing-library/react';

/**
 * Internal dependencies
 */
import useMediaQuery from '../';

describe( 'useMediaQuery', () => {
	let addEventListener, removeEventListener;

	beforeAll( () => {
		jest.spyOn( global, 'matchMedia' );

		addEventListener = jest.fn();
		removeEventListener = jest.fn();
	} );

	afterEach( () => {
		global.matchMedia.mockClear();
		addEventListener.mockClear();
		removeEventListener.mockClear();
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
			addEventListener,
			removeEventListener,
			matches: true,
		} );

		const { container, unmount } = render(
			<TestComponent query="(min-width: 782px)" />
		);

		expect( container ).toHaveTextContent( 'useMediaQuery: true' );

		unmount();

		expect( removeEventListener ).toHaveBeenCalled();
	} );

	it( 'should correctly update the value when the query evaluation matches', async () => {
		// First render.
		global.matchMedia.mockReturnValueOnce( {
			addEventListener,
			removeEventListener,
			matches: true,
		} );
		// The query within useEffect.
		global.matchMedia.mockReturnValueOnce( {
			addEventListener,
			removeEventListener,
			matches: true,
		} );
		global.matchMedia.mockReturnValueOnce( {
			addEventListener,
			removeEventListener,
			matches: true,
		} );
		global.matchMedia.mockReturnValueOnce( {
			addEventListener,
			removeEventListener,
			matches: false,
		} );

		const { container, unmount } = render(
			<TestComponent query="(min-width: 782px)" />
		);

		expect( container ).toHaveTextContent( 'useMediaQuery: true' );

		let updateMatchFunction;
		await act( async () => {
			updateMatchFunction = addEventListener.mock.calls[ 0 ][ 1 ];
			updateMatchFunction();
		} );

		updateMatchFunction();

		expect( container ).toHaveTextContent( 'useMediaQuery: false' );

		unmount();

		expect( removeEventListener ).toHaveBeenCalledWith(
			updateMatchFunction
		);
	} );

	it( 'should return false when the query does not matches', async () => {
		global.matchMedia.mockReturnValue( {
			addEventListener,
			removeEventListener,
			matches: false,
		} );

		const { container, unmount } = render(
			<TestComponent query="(min-width: 782px)" />
		);

		expect( container ).toHaveTextContent( 'useMediaQuery: false' );

		unmount();

		expect( removeEventListener ).toHaveBeenCalled();
	} );

	it( 'should not call matchMedia if a query is not passed', async () => {
		global.matchMedia.mockReturnValue( {
			addEventListener,
			removeEventListener,
			matches: false,
		} );

		const { container, rerender, unmount } = render( <TestComponent /> );

		// Query will be case to a boolean to simplify the return type.
		expect( container ).toHaveTextContent( 'useMediaQuery: false' );

		rerender( <TestComponent query={ false } /> );

		expect( container ).toHaveTextContent( 'useMediaQuery: false' );

		unmount();
		expect( global.matchMedia ).not.toHaveBeenCalled();
		expect( addEventListener ).not.toHaveBeenCalled();
		expect( removeEventListener ).not.toHaveBeenCalled();
	} );
} );
