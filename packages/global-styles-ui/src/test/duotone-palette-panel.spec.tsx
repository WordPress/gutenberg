/**
 * External dependencies
 */
import { render, screen } from '@testing-library/react';

/**
 * Internal dependencies
 */
import DuotonePalettePanel from '../duotone-palette-panel';
import { GlobalStylesProvider } from '../provider';

describe( 'DuotonePalettePanel', () => {
	it( 'shows theme and scheme duotones with the same read-only controls', () => {
		render(
			<GlobalStylesProvider
				value={ {
					settings: {
						color: {
							dark: {
								duotone: [
									{
										slug: 'portrait',
										name: 'Portrait',
										colors: [ '#222', '#ddd' ],
									},
								],
							},
						},
					},
					styles: {},
				} }
				baseValue={ {
					settings: {
						color: {
							palette: {
								theme: [
									{
										slug: 'base',
										name: 'Base',
										color: '#fff',
									},
								],
							},
							duotone: {
								theme: [
									{
										slug: 'portrait',
										name: 'Portrait',
										colors: [ '#111', '#eee' ],
									},
								],
							},
							dark: {
								duotone: [
									{
										slug: 'portrait',
										name: 'Portrait',
										colors: [ '#000', '#fff' ],
									},
								],
							},
						},
					},
					styles: {},
				} }
				onChange={ () => {} }
			>
				<DuotonePalettePanel />
			</GlobalStylesProvider>
		);

		expect( screen.getByText( 'Theme' ) ).toBeVisible();
		expect(
			screen.getByRole( 'listbox', {
				name: 'Theme duotone palette',
			} )
		).toBeVisible();
		expect(
			screen.getByRole( 'listbox', {
				name: 'Dark duotone palette',
			} )
		).toBeVisible();
		expect( screen.queryByText( 'Light duotone' ) ).not.toBeInTheDocument();
		expect(
			screen.queryByRole( 'button', { name: 'Edit Portrait' } )
		).not.toBeInTheDocument();
		expect(
			screen.queryByRole( 'button', { name: 'Reset Dark duotone' } )
		).not.toBeInTheDocument();
	} );
} );
