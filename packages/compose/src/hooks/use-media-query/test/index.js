/**
 * External dependencies
 */
import { render, act } from '@testing-library/react';

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

		const { container, unmount } = render(
			<TestComponent query="(min-width: 782px)" />
		);

		expect( container ).toHaveTextContent( 'useMediaQuery: true' );

		unmount();

		expect( removeListener ).toHaveBeenCalled();
	} );

	it( 'should correctly update the value when the query evaluation matches', async () => {
		// First render.
		global.matchMedia.mockReturnValueOnce( {
			addListener,
			removeListener,
			matches: true,
		} );
		// The query within useEffect.
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

		const { container, unmount } = render(
			<TestComponent query="(min-width: 782px)" />
		);

		expect( container ).toHaveTextContent( 'useMediaQuery: true' );

		let updateMatchFunction;
		await act( async () => {
			updateMatchFunction = addListener.mock.calls[ 0 ][ 0 ];
			updateMatchFunction();
		} );

		expect( container ).toHaveTextContent( 'useMediaQuery: false' );

		unmount();

		expect( removeListener ).toHaveBeenCalledWith( updateMatchFunction );
	} );

	it( 'should return false when the query does not matches', async () => {
		global.matchMedia.mockReturnValue( {
			addListener,
			removeListener,
			matches: false,
		} );

		const { container, unmount } = render(
			<TestComponent query="(min-width: 782px)" />
		);

		expect( container ).toHaveTextContent( 'useMediaQuery: false' );

		unmount();

		expect( removeListener ).toHaveBeenCalled();
	} );

	it( 'should not call matchMedia if a query is not passed', async () => {
		global.matchMedia.mockReturnValue( {
			addListener,
			removeListener,
			matches: false,
		} );

		const { container, rerender, unmount } = render( <TestComponent /> );

		// Query will be case to a boolean to simplify the return type.
		expect( container ).toHaveTextContent( 'useMediaQuery: false' );

		rerender( <TestComponent query={ false } /> );

		expect( container ).toHaveTextContent( 'useMediaQuery: false' );

		unmount();
		expect( global.matchMedia ).not.toHaveBeenCalled();
		expect( addListener ).not.toHaveBeenCalled();
		expect( removeListener ).not.toHaveBeenCalled();
	} );
} );
