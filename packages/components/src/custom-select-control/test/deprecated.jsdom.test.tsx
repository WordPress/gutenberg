import { expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { CustomSelectControl } from '../..';

globalThis.wpVitest.mockMatchMedia();

it( 'renders the public control and warns with a link to the migration guide', async () => {
	render(
		<CustomSelectControl
			label="Image size"
			options={ [ { key: 'medium', name: 'Medium' } ] }
		/>
	);

	expect(
		await screen.findByRole( 'combobox', { name: 'Image size' } )
	).toBeVisible();
	expect( console ).toHaveWarnedWith(
		'wp.components.CustomSelectControl is deprecated since version 7.3 and will be removed in version 7.6. Please use SelectControl from @wordpress/ui instead. See: https://wordpress.github.io/gutenberg/?path=/docs/components-customselectcontrol--migration-guide'
	);
} );
