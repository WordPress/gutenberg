import { expect, it } from 'vitest';
import { screen } from '@testing-library/react';
import { render } from 'vitest-browser-react';
import '@wordpress/theme/design-tokens.css';
// Keep `Item` the first component this file imports. Its stylesheet then
// loads before the stylesheet of `Text`, which is the order that exposes an
// override made from the same cascade layer.
import * as Item from '../index';

it( 'gives the label more weight than the description, whatever the order of the stylesheets', async () => {
	await render(
		<Item.ContentRow>
			<Item.Label>Soft shadow</Item.Label>
			<Item.Description>Used on featured images.</Item.Description>
		</Item.ContentRow>
	);

	// Both parts are a `Text`, which sets a weight of its own.
	const label = getComputedStyle( screen.getByText( 'Soft shadow' ) );
	const description = getComputedStyle(
		screen.getByText( 'Used on featured images.' )
	);

	expect( Number( label.fontWeight ) ).toBeGreaterThan(
		Number( description.fontWeight )
	);
} );
