import { beforeEach, describe, expect, it } from 'vitest';
import { page } from 'vitest/browser';
import { render, waitFor } from '@testing-library/react';
import useMediaQuery from '../';

const TestComponent = ( { query } ) => {
	const queryResult = useMediaQuery( query );
	return `useMediaQuery: ${ queryResult }`;
};

describe( 'useMediaQuery', () => {
	beforeEach( async () => {
		await page.viewport( 960, 768 );
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

		await page.viewport( 600, 768 );

		await waitFor( () => {
			expect( container ).toHaveTextContent( 'useMediaQuery: false' );
		} );
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
