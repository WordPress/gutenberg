import { describe, expect, test } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Scrollable } from '../index';

describe( 'props', () => {
	test( 'should render correctly', () => {
		render(
			<div data-testid="scrollable-parent" style={ { height: 120 } }>
				<Scrollable data-testid="scrollable">
					WordPress.org - Code is Poetry
				</Scrollable>
			</div>
		);

		const styles = getComputedStyle( screen.getByTestId( 'scrollable' ) );
		expect( styles.height ).toBe(
			getComputedStyle( screen.getByTestId( 'scrollable-parent' ) ).height
		);
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
			getComputedStyle( screen.getByTestId( 'smooth-scrollable' ) )
				.scrollBehavior
		).toBe( 'smooth' );
		expect(
			getComputedStyle( screen.getByTestId( 'scrollable' ) )
				.scrollBehavior
		).toBe( 'auto' );
	} );

	test( 'supports native scrolling', () => {
		render(
			<div style={ { height: 100, width: 100 } }>
				<Scrollable data-testid="scrollable">
					<div style={ { height: 300 } }>Content</div>
				</Scrollable>
			</div>
		);
		const scrollable = screen.getByTestId( 'scrollable' );

		scrollable.scrollTo( { top: 100 } );

		expect( scrollable.scrollTop ).toBe( 100 );
	} );
} );
