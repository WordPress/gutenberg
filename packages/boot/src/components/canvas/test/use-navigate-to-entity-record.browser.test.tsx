import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { waitFor } from '@testing-library/react';
import { page, userEvent } from 'vitest/browser';
import { render } from 'vitest-browser-react';
import { useRegistry, useSelect } from '@wordpress/data';
import { privateApis as routePrivateApis } from '@wordpress/route';
import { unlock } from '../../../lock-unlock';
import useNavigateToEntityRecord from '../use-navigate-to-entity-record';

const {
	createBrowserHistory,
	createRootRoute,
	createRoute,
	createRouter,
	Outlet,
	parseHref,
	RouterProvider,
} = unlock( routePrivateApis );

vi.mock( import( '@wordpress/data' ), { spy: true } );

let history: ReturnType< typeof createBrowserHistory > | undefined;
let unmount: ( () => Promise< void > ) | undefined;
let originalUrl: string;
let originalState: unknown;
let entityEdits: {
	selection?: { selectionStart: { clientId: string } };
};

function Navigation( { viewport }: { viewport?: string } ) {
	const { onNavigateToEntityRecord, onNavigateToPreviousEntityRecord } =
		useNavigateToEntityRecord( 'page', '42' );

	return (
		<>
			<button
				onClick={ () =>
					onNavigateToEntityRecord( {
						postType: 'wp_template_part',
						postId: 'theme//header',
						viewport,
					} )
				}
			>
				Edit template part
			</button>
			{ onNavigateToPreviousEntityRecord && (
				<button onClick={ onNavigateToPreviousEntityRecord }>
					Back to page
				</button>
			) }
			<Outlet />
		</>
	);
}

function getCurrentUrl() {
	return new URL(
		new URL( window.location.href ).searchParams.get( 'p' ) || '/',
		window.location.origin
	);
}

async function renderNavigation( viewport?: string ) {
	const url = new URL( window.location.href );
	url.searchParams.set( 'p', '/page?view=all&viewport=desktop' );
	window.history.replaceState( { __TSR_index: 0 }, '', url );

	// Use the same browser URL mapping as the app. Memory history does not
	// batch writes, so it cannot reproduce a lost replacement before a push.
	history = createBrowserHistory( {
		parseLocation: () => {
			const current = new URL( window.location.href );
			const path = current.searchParams.get( 'p' ) || '/';
			return parseHref(
				`${ path }${ current.hash }`,
				window.history.state
			);
		},
		createHref: ( href: string ) => {
			const search = new URLSearchParams( window.location.search );
			search.set( 'p', href );
			return `${ window.location.pathname }?${ search }`;
		},
	} );
	const rootRoute = createRootRoute( {
		component: () => <Navigation viewport={ viewport } />,
	} );
	const pageRoute = createRoute( {
		getParentRoute: () => rootRoute,
		path: '/page',
		component: () => <h1>Page</h1>,
	} );
	const templatePartRoute = createRoute( {
		getParentRoute: () => rootRoute,
		path: '/template-part',
		component: () => <h1>Template part</h1>,
	} );
	const router = createRouter( {
		history,
		routeTree: rootRoute.addChildren( [ pageRoute, templatePartRoute ] ),
	} );
	const result = await render( <RouterProvider router={ router } /> );
	unmount = async () => {
		await result.unmount();
	};
	await expect
		.element( page.getByRole( 'heading', { name: 'Page' } ) )
		.toBeVisible();
}

describe( 'nested entity navigation', () => {
	beforeEach( () => {
		originalUrl = window.location.href;
		originalState = window.history.state;
		entityEdits = {};

		// Substitute only the entity's edits and its link. Navigation,
		// route state, browser history and the hook itself remain real.
		vi.mocked( useRegistry ).mockReturnValue( {
			select: () => ( { getEntityRecordEdits: () => entityEdits } ),
		} as unknown as ReturnType< typeof useRegistry > );
		vi.mocked( useSelect ).mockReturnValue( () => '/template-part' );
	} );

	afterEach( async () => {
		await unmount?.();
		unmount = undefined;
		if ( history ) {
			history.flush();
			const index = history.location.state.__TSR_index;
			history.destroy();
			history = undefined;
			// A failed assertion may leave the test on the nested entity. Return
			// to the entry we replaced before restoring the runner's URL/state.
			if ( index > 0 ) {
				await new Promise< void >( ( resolve ) => {
					window.addEventListener( 'popstate', () => resolve(), {
						once: true,
					} );
					window.history.go( -index );
				} );
			}
		}
		window.history.replaceState( originalState, '', originalUrl );
		vi.clearAllMocks();
	} );

	it( 'restores the parent selection and search after leaving a nested entity', async () => {
		entityEdits = {
			selection: {
				selectionStart: { clientId: 'selected-template-part' },
			},
		};
		await renderNavigation( 'Mobile' );

		await userEvent.click(
			page.getByRole( 'button', { name: 'Edit template part' } )
		);
		await expect
			.element( page.getByRole( 'heading', { name: 'Template part' } ) )
			.toBeVisible();
		await waitFor( () =>
			expect( getCurrentUrl().pathname ).toBe( '/template-part' )
		);
		expect( getCurrentUrl().searchParams.get( 'focusMode' ) ).toBe(
			'true'
		);
		expect( getCurrentUrl().searchParams.get( 'viewport' ) ).toBe(
			'mobile'
		);
		expect( getCurrentUrl().searchParams.has( 'selectedBlock' ) ).toBe(
			false
		);
		expect( getCurrentUrl().searchParams.has( 'view' ) ).toBe( false );
		expect( window.history.state.__TSR_index ).toBe( 1 );

		await userEvent.click(
			page.getByRole( 'button', { name: 'Back to page' } )
		);
		await expect
			.element( page.getByRole( 'heading', { name: 'Page' } ) )
			.toBeVisible();
		await waitFor( () =>
			expect( getCurrentUrl().pathname ).toBe( '/page' )
		);
		expect( getCurrentUrl().searchParams.get( 'view' ) ).toBe( 'all' );
		expect( getCurrentUrl().searchParams.get( 'viewport' ) ).toBe(
			'desktop'
		);
		expect( getCurrentUrl().searchParams.get( 'selectedBlock' ) ).toBe(
			'selected-template-part'
		);
		expect( getCurrentUrl().searchParams.has( 'focusMode' ) ).toBe( false );
		expect( window.history.state.__TSR_index ).toBe( 0 );
	} );

	it( 'returns in one step when the parent has no selected block', async () => {
		await renderNavigation();

		await userEvent.click(
			page.getByRole( 'button', { name: 'Edit template part' } )
		);
		await expect
			.element( page.getByRole( 'heading', { name: 'Template part' } ) )
			.toBeVisible();
		await waitFor( () =>
			expect( getCurrentUrl().pathname ).toBe( '/template-part' )
		);
		expect( getCurrentUrl().searchParams.get( 'focusMode' ) ).toBe(
			'true'
		);
		expect( getCurrentUrl().searchParams.has( 'viewport' ) ).toBe( false );
		expect( getCurrentUrl().searchParams.has( 'selectedBlock' ) ).toBe(
			false
		);
		expect( window.history.state.__TSR_index ).toBe( 1 );

		await userEvent.click(
			page.getByRole( 'button', { name: 'Back to page' } )
		);
		await expect
			.element( page.getByRole( 'heading', { name: 'Page' } ) )
			.toBeVisible();
		await waitFor( () =>
			expect( getCurrentUrl().pathname ).toBe( '/page' )
		);
		expect( getCurrentUrl().searchParams.get( 'view' ) ).toBe( 'all' );
		expect( getCurrentUrl().searchParams.get( 'viewport' ) ).toBe(
			'desktop'
		);
		expect( getCurrentUrl().searchParams.has( 'selectedBlock' ) ).toBe(
			false
		);
		expect( window.history.state.__TSR_index ).toBe( 0 );
	} );
} );
