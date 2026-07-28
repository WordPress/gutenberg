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
	it( 'shows only theme-provided scheme palettes as editable controls', () => {
		render(
			<GlobalStylesProvider
				value={ { settings: {}, styles: {} } }
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

		expect( screen.getByText( 'Dark duotone' ) ).toBeVisible();
		expect( screen.queryByText( 'Light duotone' ) ).not.toBeInTheDocument();
		expect(
			screen.getByRole( 'button', { name: 'Edit Portrait' } )
		).toBeVisible();
	} );
} );
