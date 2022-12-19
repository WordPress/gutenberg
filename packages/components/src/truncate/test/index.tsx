/**
 * External dependencies
 */
import { render, screen } from '@testing-library/react';

/**
 * Internal dependencies
 */
import { Truncate } from '..';

describe( 'props', () => {
	test( 'should render correctly', () => {
		render( <Truncate>Lorem ipsum.</Truncate> );
		expect( screen.getByText( 'Lorem ipsum.' ) ).toBeVisible();
	} );

	test( 'should render limit', () => {
		render(
			<Truncate limit={ 1 } ellipsizeMode="tail">
				Lorem ipsum.
			</Truncate>
		);
		expect( screen.getByText( 'L…' ) ).toBeVisible();
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
