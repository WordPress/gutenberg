/**
 * External dependencies
 */
import { merge } from 'lodash';
import { css, ThemeProvider } from '@emotion/react';
import { render, screen } from '@testing-library/react';

/**
 * Internal dependencies
 */
import { createTheme, safeTheme, useTheme } from '..';

import { CONFIG, COLORS, useCx } from '../../../utils';

describe( 'theme utils', () => {
	describe( 'safeTheme', () => {
		it( 'should return the default theme if a non-WP-theme object is supplied', () => {
			expect( safeTheme( {} ) ).toMatchObject( {
				config: CONFIG,
				colors: COLORS,
			} );
		} );

		it( 'should return the overridden theme if a WP theme object is supplied', () => {
			const theme = createTheme( { colors: { black: 'white' } } );

			expect( safeTheme( theme ) ).toBe( theme );
		} );
	} );

	describe( 'createTheme', () => {
		it( 'should return the merged theme', () => {
			expect(
				createTheme( { colors: { black: 'white' } } )
			).toMatchObject(
				merge(
					{ colors: COLORS, config: CONFIG },
					{ colors: { black: 'white' } }
				)
			);
		} );

		it( 'should return a function that merges the ancestor theme', () => {
			const themeGetter = createTheme(
				{ colors: { black: 'white' } },
				{ isStatic: false }
			);

			const expectedResult = merge(
				{ colors: COLORS, config: CONFIG },
				{ colors: { white: 'black', black: 'white' } }
			);

			expect(
				themeGetter( { colors: { white: 'black' } } )
			).toMatchObject( expectedResult );
		} );
	} );

	describe( 'useTheme', () => {
		const Wrapper = () => {
			const theme = useTheme();
			const cx = useCx();

			const style = css`
				color: ${ theme.colors.alert.red };
			`;

			return <div className={ cx( style ) }>Code is Poetry</div>;
		};

		it( 'should render using the default theme if there is no provider', () => {
			render( <Wrapper /> );
			expect( screen.getByText( 'Code is Poetry' ) ).toHaveStyle(
				`color: ${ COLORS.alert.red }`
			);
		} );

		it( 'should render using the custom theme if there is a ThemeProvider', () => {
			const theme = createTheme( {
				colors: { alert: { red: 'green ' } },
			} );
			render(
				<ThemeProvider theme={ theme }>
					<Wrapper />
				</ThemeProvider>
			);
			expect( screen.getByText( 'Code is Poetry' ) ).toHaveStyle(
				'color: green'
			);
		} );
	} );
} );
