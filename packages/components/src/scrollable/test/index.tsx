/**
 * External dependencies
 */
import { render, screen } from '@testing-library/react';

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

	test( 'should apply default scroll styles', () => {
		render(
			<Scrollable data-testid="scrollable">
				WordPress.org - Code is Poetry
			</Scrollable>
		);

		const styles = window.getComputedStyle(
			screen.getByTestId( 'scrollable' )
		);

		expect( styles.height ).toBe( '100%' );
		expect( styles.overflowX ).toBe( 'hidden' );
		expect( styles.overflowY ).toBe( 'auto' );
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
