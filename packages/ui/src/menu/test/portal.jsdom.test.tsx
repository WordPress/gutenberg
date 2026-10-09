import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen, waitFor, within } from '@testing-library/react';
import * as Menu from '..';
import {
	getWpCompatOverlaySlot,
	__resetWpCompatOverlaySlotCacheForTests,
} from '../../utils/wp-compat-overlay-slot';

beforeEach( () => {
	vi.stubGlobal( '__wpUiCompatOverlaySlotEnabled', true );
} );

afterEach( () => {
	getWpCompatOverlaySlot()?.remove();
	__resetWpCompatOverlaySlotCacheForTests();
	vi.unstubAllGlobals();
} );

describe( 'Menu.Portal', () => {
	it( 'waits for an explicit null container to become available', async () => {
		const content = ( container: HTMLElement | null ) => (
			<Menu.Root defaultOpen>
				<Menu.Trigger>Open Menu</Menu.Trigger>
				<div data-testid="portal-target" />
				<Menu.Popup portal={ <Menu.Portal container={ container } /> }>
					Portal content
				</Menu.Popup>
			</Menu.Root>
		);

		const { rerender } = render( content( null ) );

		expect(
			screen.queryByText( 'Portal content' )
		).not.toBeInTheDocument();

		const target = screen.getByTestId( 'portal-target' );
		rerender( content( target ) );

		await waitFor( () => {
			expect(
				within( target ).getByText( 'Portal content' )
			).toBeVisible();
		} );
	} );
} );
