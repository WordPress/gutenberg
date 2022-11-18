/**
 * External dependencies
 */
import { render, screen } from '@testing-library/react';
import type { ReactNode } from 'react';

/**
 * Internal dependencies
 */
import Theme from '../';

type MyThemableComponentProps = {
	children: ReactNode;
};

const MyThemableComponent = ( props: MyThemableComponentProps ) => {
	return (
		<div
			{ ...props }
			style={ {
				color: 'var(--wp-components-color-accent)',
			} }
		/>
	);
};

describe( 'Theme', () => {
	describe( 'accent color', () => {
		it( 'it does not define the accent color (and its variations) as a CSS variable when the `accent` prop is undefined', () => {
			render(
				<Theme data-testid="theme">
					<MyThemableComponent>Inner</MyThemableComponent>
				</Theme>
			);

			const innerElementStyles = window.getComputedStyle(
				screen.getByTestId( 'theme' )
			);

			expect(
				innerElementStyles.getPropertyValue(
					'--wp-components-color-accent'
				)
			).toBe( '' );

			expect(
				innerElementStyles.getPropertyValue(
					'--wp-components-color-accent-darker-10'
				)
			).toBe( '' );

			expect(
				innerElementStyles.getPropertyValue(
					'--wp-components-color-accent-darker-20'
				)
			).toBe( '' );
		} );

		it( 'it defines the accent color (and its variations) as a CSS variable', () => {
			render(
				<Theme accent="#123abc" data-testid="theme">
					<MyThemableComponent>Inner</MyThemableComponent>
				</Theme>
			);

			expect( screen.getByTestId( 'theme' ) ).toHaveStyle( {
				'--wp-components-color-accent': '#123abc',
				'--wp-components-color-accent-darker-10': '#0e2c8d',
				'--wp-components-color-accent-darker-20': '#091d5f',
			} );
		} );

		describe( 'unsupported values', () => {
			it.each( [
				// Keywords
				'currentcolor',
				'initial',
				'reset',
				'inherit',
				'revert',
				'unset',
				// CSS Custom properties
				'var( --my-variable )',
			] )( 'should warn when the value is "%s"', ( accentValue ) => {
				render( <Theme accent={ accentValue } /> );

				expect( console ).toHaveWarned();
			} );
		} );
	} );
} );
