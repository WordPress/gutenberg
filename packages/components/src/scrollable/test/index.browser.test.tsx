import { describe, expect, test } from 'vitest';
import { screen } from '@testing-library/react';
import { render } from 'vitest-browser-react';
import { Scrollable } from '../index';
import styles from '../style.module.scss';

describe( 'props', () => {
	test( 'should render correctly', async () => {
		await render(
			<div data-testid="scrollable-parent" style={ { height: 120 } }>
				<Scrollable data-testid="scrollable">
					WordPress.org - Code is Poetry
				</Scrollable>
			</div>
		);

		const scrollable = screen.getByTestId( 'scrollable' );
		const computedStyles = getComputedStyle( scrollable );

		expect( scrollable ).toHaveClass( 'components-scrollable' );
		expect( scrollable ).toHaveClass( styles.scrollable );
		expect( scrollable ).toHaveClass( styles[ 'scroll-y' ] );
		expect( scrollable ).not.toHaveClass( styles[ 'smooth-scroll' ] );
		expect( computedStyles.height ).toBe(
			getComputedStyle( screen.getByTestId( 'scrollable-parent' ) ).height
		);
		expect( computedStyles.overflowY ).toBe( 'auto' );
	} );

	test( 'should render smoothScroll', async () => {
		await render(
			<Scrollable data-testid="scrollable">
				WordPress.org - Code is Poetry
			</Scrollable>
		);
		await render(
			<Scrollable smoothScroll data-testid="smooth-scrollable">
				WordPress.org - Code is Poetry
			</Scrollable>
		);

		expect( screen.getByTestId( 'smooth-scrollable' ) ).toHaveClass(
			styles[ 'smooth-scroll' ]
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

	test( 'supports native scrolling', async () => {
		await render(
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

	test( 'should render scrollDirection x', async () => {
		await render(
			<Scrollable scrollDirection="x" data-testid="scrollable-x">
				WordPress.org - Code is Poetry
			</Scrollable>
		);

		const scrollable = screen.getByTestId( 'scrollable-x' );

		expect( scrollable ).toHaveClass( styles[ 'scroll-x' ] );
		expect( scrollable ).not.toHaveClass( styles[ 'scroll-y' ] );
	} );

	test( 'should render scrollDirection auto', async () => {
		await render(
			<Scrollable scrollDirection="auto" data-testid="scrollable-auto">
				WordPress.org - Code is Poetry
			</Scrollable>
		);

		const scrollable = screen.getByTestId( 'scrollable-auto' );

		expect( scrollable ).toHaveClass( styles[ 'scroll-auto' ] );
		expect( scrollable ).not.toHaveClass( styles[ 'scroll-y' ] );
	} );
} );
