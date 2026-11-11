import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { userEvent } from 'vitest/browser';
import Router from '../router';
import RootSinglePage from '../../root/single-page';

const ROUTES = [
	{
		path: '/settings',
		content_module: new URL( './fixtures/settings.tsx', import.meta.url )
			.href,
	},
	{
		path: '/settings/general',
		content_module: new URL(
			'./fixtures/settings-general.tsx',
			import.meta.url
		).href,
	},
];

// Wait long enough for the router to finish a navigation that leaves no
// visible change to wait for.
const settle = () => new Promise( ( resolve ) => setTimeout( resolve, 100 ) );

async function renderAt( path: string ) {
	window.history.replaceState( null, '', `?p=${ path }` );
	render( <Router routes={ ROUTES } rootComponent={ RootSinglePage } /> );
}

describe( 'navigation focus', () => {
	beforeEach( () => {
		// Each route load requests the site's base entity from the REST API.
		vi.stubGlobal(
			'fetch',
			vi.fn(
				async () =>
					new Response( JSON.stringify( { name: 'Test site' } ), {
						headers: { 'Content-Type': 'application/json' },
					} )
			)
		);
	} );

	afterEach( () => {
		vi.unstubAllGlobals();
	} );

	it( 'does not move focus on the initial load', async () => {
		await renderAt( '/settings/general' );

		const page = await screen.findByRole( 'region', { name: 'General' } );
		await settle();

		expect( page.matches( ':focus-within' ) ).toBe( false );
	} );

	it( 'moves focus to the new page when the focused link is removed', async () => {
		await renderAt( '/settings/general' );

		const link = await screen.findByRole( 'link', { name: 'Settings' } );
		link.focus();
		await userEvent.keyboard( '{Enter}' );

		const page = await screen.findByRole( 'region', { name: 'Settings' } );
		await waitFor( () =>
			expect( page.matches( ':focus-within' ) ).toBe( true )
		);
	} );

	it( 'keeps focus on a link that the navigation does not remove', async () => {
		await renderAt( '/settings/general' );

		const link = await screen.findByRole( 'link', { name: 'Advanced' } );
		link.focus();
		await userEvent.keyboard( '{Enter}' );

		await waitFor( () =>
			expect( window.location.search ).toContain( 'advanced' )
		);
		await settle();

		expect( link ).toHaveFocus();
	} );
} );
