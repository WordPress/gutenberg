import { describe, expect, it, vi } from 'vitest';
import { page, userEvent } from 'vitest/browser';
import { render } from 'vitest-browser-react';
import { screen } from '@testing-library/react';
import { useSelect } from '@wordpress/data';
import { createElement } from '@wordpress/element';
import SpacingSizesControl from '../index';

vi.mock( import( '@wordpress/data' ), { spy: true } );

vi.mocked( useSelect ).mockReturnValue( false );

vi.mock( import( '../hooks/use-spacing-sizes' ), () => ( {
	__esModule: true,
	default: vi.fn( () =>
		Array.from( { length: 15 }, ( _, index ) => ( {
			name: `Size ${ index }`,
			slug: `${ index * 10 }`,
			size: `${ index * 0.5 }rem`,
		} ) )
	),
} ) );

vi.mock( import( '../../use-settings' ), () => ( {
	useSettings: vi.fn( ( ...keys ) => {
		const defaults = {
			'spacing.units': [ 'px', 'em', 'rem' ],
			'spacing.spacingSizes.custom': [],
			'spacing.spacingSizes.theme': [],
			'spacing.spacingSizes.default': [],
			'spacing.defaultSpacingSizes': true,
		};
		return keys.map( ( key ) => defaults[ key ] );
	} ),
} ) );

describe( 'SpacingSizesControl large preset sets', () => {
	it( 'can interact with select dropdown options', async () => {
		const user = userEvent.setup();

		await render(
			createElement( SpacingSizesControl, {
				label: 'Padding',
				onChange: vi.fn(),
			} )
		);

		const comboboxes = screen.getAllByRole( 'combobox' );
		expect( comboboxes ).toHaveLength( 2 );
		expect( comboboxes[ 0 ] ).toBeVisible();

		await user.click( comboboxes[ 0 ] );

		await expect
			.element( page.getByRole( 'combobox', { expanded: true } ) )
			.toBeVisible();
	} );
} );
