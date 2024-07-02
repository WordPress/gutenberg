/**
 * External dependencies
 */
import { render, screen } from '@testing-library/react';

/**
 * Internal dependencies
 */
import { Truncate } from '..';

describe( 'Truncate', () => {
	describe( 'with string or number children', () => {
		test( 'should pass through when no truncation props are set', () => {
			render( <Truncate>Lorem ipsum</Truncate> );
			expect( screen.getByText( 'Lorem ipsum' ) ).toBeVisible();
		} );

		test( 'should render numbers correctly', () => {
			render( <Truncate>{ 14 }</Truncate> );
			expect( screen.getByText( '14' ) ).toBeVisible();
		} );

		test( 'should truncate text from the start when the limit prop is set and the ellipsizeMode is tail', () => {
			render(
				<Truncate limit={ 1 } ellipsizeMode="tail">
					Lorem ipsum
				</Truncate>
			);
			expect( screen.getByText( 'L…' ) ).toBeVisible();
		} );

		test( 'should truncate text from the end when the limit prop is set and the ellipsizeMode is head', () => {
			render(
				<Truncate limit={ 1 } ellipsizeMode="head">
					Lorem ipsum
				</Truncate>
			);
			expect( screen.getByText( '…m' ) ).toBeVisible();
		} );

		test( 'should render custom ellipsis', () => {
			render(
				<Truncate ellipsis="!!!" limit={ 5 } ellipsizeMode="tail">
					Lorem ipsum.
				</Truncate>
			);
			expect( screen.getByText( 'Lorem!!!' ) ).toBeVisible();
		} );

		test( 'should render custom ellipsizeMode', () => {
			render(
				<Truncate ellipsis="!!!" ellipsizeMode="middle" limit={ 5 }>
					Lorem ipsum.
				</Truncate>
			);
			expect( screen.getByText( 'Lo!!!m.' ) ).toBeVisible();
		} );
	} );

	describe( 'with other children types', () => {
		test( 'should no-op and output a warning to console', () => {
			render(
				<Truncate>
					<>Lorem ipsum</>
				</Truncate>
			);
			expect( screen.getByText( 'Lorem ipsum' ) ).toBeVisible();
		} );
	} );
} );
