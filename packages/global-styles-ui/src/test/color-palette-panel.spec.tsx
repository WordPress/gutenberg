/**
 * External dependencies
 */
import { fireEvent, render, screen } from '@testing-library/react';

/**
 * Internal dependencies
 */
import ColorPalettePanel from '../color-palette-panel';
import { GlobalStylesProvider } from '../provider';

describe( 'ColorPalettePanel color schemes', () => {
	it( 'shows a complete alternative palette and omits unmatched slugs', async () => {
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
									{
										slug: 'accent',
										name: 'Accent',
										color: '#f00',
									},
								],
							},
							dark: {
								palette: [
									{ slug: 'base', color: '#111' },
									{ slug: 'unknown', color: '#f0f' },
								],
							},
						},
					},
					styles: {},
				} }
				onChange={ () => {} }
			>
				<ColorPalettePanel />
			</GlobalStylesProvider>
		);

		fireEvent.click(
			screen.getByRole( 'button', {
				name: 'Color options',
			} )
		);
		fireEvent.click(
			screen.getByRole( 'button', {
				name: 'Show details',
			} )
		);

		expect(
			screen.getAllByRole( 'button', { name: 'Edit: Base' } )
		).toHaveLength( 2 );
		expect(
			screen.getAllByRole( 'button', { name: 'Edit: Accent' } )
		).toHaveLength( 2 );
		expect(
			screen.queryByRole( 'button', { name: 'Edit: unknown' } )
		).not.toBeInTheDocument();
	} );
} );
