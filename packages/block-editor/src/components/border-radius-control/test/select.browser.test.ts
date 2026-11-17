import { describe, expect, it, vi } from 'vitest';
import { page, userEvent } from 'vitest/browser';
import { render } from 'vitest-browser-react';
import { createElement } from '@wordpress/element';
import BorderRadiusControl from '../index';

describe( 'BorderRadiusControl large preset sets', () => {
	it( 'can interact with select dropdown options', async () => {
		const user = userEvent.setup();
		const presets = {
			default: Array.from( { length: 15 }, ( _, index ) => ( {
				name: `Size ${ index }`,
				slug: `size-${ index }`,
				size: `${ index * 2 }px`,
			} ) ),
		};

		await render(
			createElement( BorderRadiusControl, {
				onChange: vi.fn(),
				values: undefined,
				presets,
			} )
		);

		await user.click( page.getByRole( 'combobox' ) );

		await expect.element( page.getByText( 'Size 1' ) ).toBeVisible();
	} );
} );
