import { render, screen } from '@testing-library/react';
import { Scrollable } from '../index';
import styles from '../style.module.scss';

describe( 'props', () => {
	test( 'should render correctly', () => {
		render(
			<Scrollable data-testid="scrollable">
				WordPress.org - Code is Poetry
			</Scrollable>
		);

		const scrollable = screen.getByTestId( 'scrollable' );
		expect( scrollable ).toHaveClass( 'components-scrollable' );
		expect( scrollable ).toHaveClass( styles.scrollable );
		expect( scrollable ).toHaveClass( styles[ 'scroll-y' ] );
		expect( scrollable ).not.toHaveClass( styles[ 'smooth-scroll' ] );
	} );

	test( 'should render smoothScroll', () => {
		render(
			<Scrollable smoothScroll data-testid="smooth-scrollable">
				WordPress.org - Code is Poetry
			</Scrollable>
		);

		expect( screen.getByTestId( 'smooth-scrollable' ) ).toHaveClass(
			styles[ 'smooth-scroll' ]
		);
	} );

	test( 'should render scrollDirection x', () => {
		render(
			<Scrollable scrollDirection="x" data-testid="scrollable-x">
				WordPress.org - Code is Poetry
			</Scrollable>
		);

		const scrollable = screen.getByTestId( 'scrollable-x' );
		expect( scrollable ).toHaveClass( styles[ 'scroll-x' ] );
		expect( scrollable ).not.toHaveClass( styles[ 'scroll-y' ] );
	} );

	test( 'should render scrollDirection auto', () => {
		render(
			<Scrollable scrollDirection="auto" data-testid="scrollable-auto">
				WordPress.org - Code is Poetry
			</Scrollable>
		);

		const scrollable = screen.getByTestId( 'scrollable-auto' );
		expect( scrollable ).toHaveClass( styles[ 'scroll-auto' ] );
		expect( scrollable ).not.toHaveClass( styles[ 'scroll-y' ] );
	} );
} );
