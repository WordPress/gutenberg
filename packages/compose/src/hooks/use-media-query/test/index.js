/**
 * External dependencies
 */
import { render } from '@testing-library/react';
import MatchMediaMock from 'jest-matchmedia-mock';

/**
 * Internal dependencies
 */
import useMediaQuery from '../';

describe( 'useMediaQuery', () => {
	let matchMedia;

	beforeAll( () => {
		matchMedia = new MatchMediaMock();
	} );

	afterEach( () => {
		matchMedia.clear();
	} );

	const TestComponent = ( { query } ) => {
		const queryResult = useMediaQuery( query );
		return `useMediaQuery: ${ queryResult }`;
	};

	it( 'should return true when query matches', async () => {
		matchMedia.useMediaQuery( '(min-width: 782px)' );

		const { container, unmount } = render(
			<TestComponent query="(min-width: 782px)" />
		);

		expect( container ).toHaveTextContent( 'useMediaQuery: true' );

		unmount();
		expect( matchMedia.getListeners( '(min-width: 782px)' ).length ).toBe(
			0
		);
	} );

	it( 'should correctly update the value when the query evaluation matches', async () => {
		const query = '(min-width: 782px)';
		matchMedia.useMediaQuery( query );

		const { container } = render(
			<TestComponent query="(min-width: 782px)" />
		);

		expect( container ).toHaveTextContent( 'useMediaQuery: true' );

		// @todo fix re-evaluataions case.
		// expect( container ).toHaveTextContent( 'useMediaQuery: false' );
	} );

	it( 'should return false when the query does not matches', async () => {
		matchMedia.useMediaQuery( '(min-width: 600px)' );

		const { container } = render(
			<TestComponent query="(min-width: 782px)" />
		);

		expect( container ).toHaveTextContent( 'useMediaQuery: false' );
	} );

	it( 'should not call matchMedia if a query is not passed', async () => {
		matchMedia.useMediaQuery( '(min-width: 600px)' );

		const { container, rerender } = render( <TestComponent /> );

		// Query will be case to a boolean to simplify the return type.
		expect( container ).toHaveTextContent( 'useMediaQuery: false' );

		rerender( <TestComponent query={ false } /> );

		expect( container ).toHaveTextContent( 'useMediaQuery: false' );
	} );
} );
