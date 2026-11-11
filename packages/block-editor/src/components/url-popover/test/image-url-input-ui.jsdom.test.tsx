import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { __experimentalImageURLInputUI as ImageURLInputUI } from '../image-url-input-ui';

globalThis.wpVitest.mockMatchMedia();
globalThis.wpVitest.mockScrollIntoView();

async function toggleNewTab( props: { rel?: string } ) {
	const user = userEvent.setup();
	const onChangeUrl = vi.fn();

	render(
		<ImageURLInputUI
			url="https://wordpress.org"
			linkDestination="custom"
			onChangeUrl={ onChangeUrl }
			{ ...props }
		/>
	);

	await user.click( screen.getByRole( 'button', { name: 'Link' } ) );
	await user.click( screen.getByRole( 'button', { name: 'Link settings' } ) );
	await user.click(
		screen.getByRole( 'checkbox', { name: 'Open in new tab' } )
	);

	return onChangeUrl;
}

describe( 'ImageURLInputUI', () => {
	it( 'opens the link in a new tab without adding noopener', async () => {
		const onChangeUrl = await toggleNewTab( {} );

		expect( onChangeUrl ).toHaveBeenCalledWith( {
			linkTarget: '_blank',
			rel: undefined,
		} );
	} );

	it( 'keeps the existing rel when the link opens in a new tab', async () => {
		const onChangeUrl = await toggleNewTab( { rel: 'nofollow' } );

		expect( onChangeUrl ).toHaveBeenCalledWith( {
			linkTarget: '_blank',
			rel: 'nofollow',
		} );
	} );
} );
