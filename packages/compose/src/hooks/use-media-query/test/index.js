/**
 * External dependencies
 */
import { act, render } from '@testing-library/react';
import { matchMedia, setMedia } from 'mock-match-media';

/**
 * Internal dependencies
 */
import useMediaQuery from '../';

const TestComponent = ( { query } ) => {
	const queryResult = useMediaQuery( query );
	return `useMediaQuery: ${ queryResult }`;
};

describe( 'useMediaQuery', () => {
	beforeAll( () => {
		window.matchMedia = matchMedia;
	} );

	beforeEach( () => {
		setMedia( {
			width: '960px',
		} );
	} );

	afterEach( () => {
		// Do not clean up, this will break our cache. Browsers also do not
		// reset media queries.
	} );

	it( 'should return true when the query matches', async () => {
		const { container } = render(
			<TestComponent query="(min-width: 782px)" />
		);

		expect( container ).toHaveTextContent( 'useMediaQuery: true' );
	} );

	it( 'should correctly update the value when the query evaluation matches', async () => {
		const { container } = render(
			<TestComponent query="(min-width: 782px)" />
		);

		expect( container ).toHaveTextContent( 'useMediaQuery: true' );

		act( () => {
			setMedia( {
				width: '600px',
			} );
		} );

		expect( container ).toHaveTextContent( 'useMediaQuery: false' );
	} );

	it( 'should return false when the query does not match', async () => {
		const { container } = render(
			<TestComponent query="(max-width: 782px)" />
		);

		expect( container ).toHaveTextContent( 'useMediaQuery: false' );
	} );

	it( 'should return false when a query is not passed', async () => {
		const { container, rerender } = render( <TestComponent /> );

		// Query will be case to a boolean to simplify the return type.
		expect( container ).toHaveTextContent( 'useMediaQuery: false' );

		rerender( <TestComponent query={ false } /> );

		expect( container ).toHaveTextContent( 'useMediaQuery: false' );
	} );
} );
