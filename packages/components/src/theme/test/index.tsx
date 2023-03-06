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
		it( 'does not define the accent color (and its variations) as a CSS variable when the `accent` prop is undefined', () => {
			render(
				<Theme data-testid="theme">
					<MyThemableComponent>Inner</MyThemableComponent>
				</Theme>
			);

			const innerElementStyles = window.getComputedStyle(
				screen.getByTestId( 'theme' )
			);

			[
				'--wp-components-color-accent',
				'--wp-components-color-accent-darker-10',
				'--wp-components-color-accent-darker-20',
				'--wp-components-color-accent-inverted',
			].forEach( ( cssVariable ) => {
				expect(
					innerElementStyles.getPropertyValue( cssVariable )
				).toBe( '' );
			} );
		} );

		it( 'defines the accent color (and its variations) as a CSS variable', () => {
			render(
				<Theme accent="#123abc" data-testid="theme">
					<MyThemableComponent>Inner</MyThemableComponent>
				</Theme>
			);

			expect( screen.getByTestId( 'theme' ) ).toHaveStyle( {
				'--wp-components-color-accent': '#123abc',
				'--wp-components-color-accent-darker-10': '#0e2c8d',
				'--wp-components-color-accent-darker-20': '#091d5f',
				'--wp-components-color-accent-inverted': '#fff',
			} );
		} );
	} );

	describe( 'background color', () => {
		it( 'does not define the background color (and its dependent colors) as a CSS variable when the `background` prop is undefined', () => {
			render(
				<Theme data-testid="theme">
					<MyThemableComponent>Inner</MyThemableComponent>
				</Theme>
			);

			const innerElementStyles = window.getComputedStyle(
				screen.getByTestId( 'theme' )
			);

			[
				'--wp-components-color-background',
				'--wp-components-color-foreground',
				'--wp-components-color-foreground-inverted',
				...[ '100', '200', '300', '400', '600', '700', '800' ].map(
					( shade ) => `--wp-components-color-gray-${ shade }`
				),
			].forEach( ( cssVariable ) => {
				expect(
					innerElementStyles.getPropertyValue( cssVariable )
				).toBe( '' );
			} );
		} );

		it( 'defines the background color (and its dependent colors) as a CSS variable', () => {
			render(
				<Theme background="#ffffff" data-testid="theme">
					<MyThemableComponent>Inner</MyThemableComponent>
				</Theme>
			);

			expect( screen.getByTestId( 'theme' ) ).toHaveStyle( {
				'--wp-components-color-background': '#ffffff',
				'--wp-components-color-foreground': '#1e1e1e',
				'--wp-components-color-foreground-inverted': '#fff',
				'--wp-components-color-gray-100': '#f0f0f0',
				'--wp-components-color-gray-200': '#e0e0e0',
				'--wp-components-color-gray-300': '#dddddd',
				'--wp-components-color-gray-400': '#cccccc',
				'--wp-components-color-gray-600': '#949494',
				'--wp-components-color-gray-700': '#757575',
				'--wp-components-color-gray-800': '#2f2f2f',
			} );
		} );
	} );

	describe( 'unsupported values', () => {
		describe.each( [ 'accent', 'background' ] )( '%s', ( propName ) => {
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
			] )( 'should warn when the value is "%s"', ( value ) => {
				render( <Theme { ...{ [ propName ]: value } } /> );
				expect( console ).toHaveWarned();
			} );
		} );
	} );
} );
