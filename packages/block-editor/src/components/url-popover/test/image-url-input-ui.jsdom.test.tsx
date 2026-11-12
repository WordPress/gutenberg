import { afterEach, describe, expect, it, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { __experimentalImageURLInputUI as ImageURLInputUI } from '../image-url-input-ui';
import { expectValidatedInputControlDeprecationIfCalled } from '../../url-input/test/fixtures/validated-input-control-deprecation';

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

async function submitLink( url: string ) {
	const user = userEvent.setup();
	const onChangeUrl = vi.fn();

	render(
		<ImageURLInputUI linkDestination="none" onChangeUrl={ onChangeUrl } />
	);

	await user.click( screen.getByRole( 'button', { name: 'Link' } ) );
	await user.type( screen.getByRole( 'combobox' ), url );
	await user.click( screen.getByRole( 'button', { name: 'Apply' } ) );

	return { user, onChangeUrl };
}

describe( 'ImageURLInputUI', () => {
	afterEach( () => {
		expectValidatedInputControlDeprecationIfCalled();
	} );

	it.each( [
		[ 'www.wordpress.org', 'https://www.wordpress.org' ],
		[ 'http://wordpress.org', 'http://wordpress.org' ],
		[ '/sample-page/', '/sample-page/' ],
		[ '#section', '#section' ],
	] )( 'saves %s as %s', async ( url, expected ) => {
		const { onChangeUrl } = await submitLink( url );

		expect( onChangeUrl ).toHaveBeenCalledWith( {
			href: expected,
			linkDestination: 'custom',
			lightbox: { enabled: false },
		} );
		expect(
			screen.queryByText( 'Please enter a valid URL.' )
		).not.toBeInTheDocument();
	} );

	it.each( [ 'wordpress', 'not a url', 'https://' ] )(
		'shows an error and does not save %s',
		async ( url ) => {
			const { onChangeUrl } = await submitLink( url );

			await waitFor( () => {
				expect(
					screen.getByText( 'Please enter a valid URL.' )
				).toBeVisible();
			} );
			expect( onChangeUrl ).not.toHaveBeenCalled();
			expect( screen.getByRole( 'combobox' ) ).toHaveValue( url );
		}
	);

	it( 'saves the link once an invalid URL is corrected', async () => {
		const { user, onChangeUrl } = await submitLink( 'wordpress' );

		await user.type( screen.getByRole( 'combobox' ), '.org' );
		await user.click( screen.getByRole( 'button', { name: 'Apply' } ) );

		expect( onChangeUrl ).toHaveBeenCalledWith( {
			href: 'https://wordpress.org',
			linkDestination: 'custom',
			lightbox: { enabled: false },
		} );
	} );

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
