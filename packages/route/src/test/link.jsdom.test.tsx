import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import type { ReactNode } from 'react';
import {
	createMemoryHistory,
	createRootRoute,
	createRouter,
	RouterProvider,
} from '@tanstack/react-router';
import { Link } from '../link';

function renderAtPath( path: string, children: ReactNode ) {
	const router = createRouter( {
		routeTree: createRootRoute( { component: () => children } ),
		history: createMemoryHistory( { initialEntries: [ path ] } ),
	} );

	render( <RouterProvider router={ router } /> );
}

describe( 'Link', () => {
	it( 'should mark only a link to the exact current path with aria-current="page"', async () => {
		renderAtPath(
			'/settings/general',
			<>
				<Link to="/settings">Settings</Link>
				<Link to="/settings/general">General</Link>
			</>
		);

		expect(
			await screen.findByRole( 'link', { name: 'General' } )
		).toHaveAttribute( 'aria-current', 'page' );
		expect(
			screen.getByRole( 'link', { name: 'Settings' } )
		).not.toHaveAttribute( 'aria-current' );
	} );

	it( 'should match a parent path when `activeOptions.exact` is false', async () => {
		renderAtPath(
			'/settings/general',
			<Link to="/settings" activeOptions={ { exact: false } }>
				Settings
			</Link>
		);

		expect(
			await screen.findByRole( 'link', { name: 'Settings' } )
		).toHaveAttribute( 'aria-current', 'page' );
	} );
} );
