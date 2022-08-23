/**
 * External dependencies
 */
import { render, screen } from '@testing-library/react';

/**
 * Internal dependencies
 */
import { Scrollable } from '../index';

describe( 'props', () => {
	beforeEach( () => {
		render(
			<Scrollable data-testid="scrollable">
				WordPress.org - Code is Poetry
			</Scrollable>
		);
	} );

	test( 'should render correctly', () => {
		expect( screen.getByTestId( 'scrollable' ) ).toMatchSnapshot();
	} );

	test( 'should render smoothScroll', () => {
		render(
			<Scrollable smoothScroll data-testid="smooth-scrollable">
				WordPress.org - Code is Poetry
			</Scrollable>
		);
		expect(
			screen.getByTestId( 'smooth-scrollable' )
		).toMatchStyleDiffSnapshot( screen.getByTestId( 'scrollable' ) );
	} );
} );
