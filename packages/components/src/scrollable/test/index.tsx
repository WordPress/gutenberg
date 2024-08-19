/**
 * External dependencies
 */
import { screen } from '@testing-library/react';
import { render } from '@ariakit/test/react';

/**
 * Internal dependencies
 */
import { Scrollable } from '../index';

describe( 'props', () => {
	test( 'should render correctly', () => {
		render(
			<Scrollable data-testid="scrollable">
				WordPress.org - Code is Poetry
			</Scrollable>
		);

		expect( screen.getByTestId( 'scrollable' ) ).toMatchSnapshot();
	} );

	test( 'should render smoothScroll', () => {
		render(
			<Scrollable data-testid="scrollable">
				WordPress.org - Code is Poetry
			</Scrollable>
		);
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
