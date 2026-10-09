import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen, waitFor, within } from '@testing-library/react';
import * as Popover from '..';
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

describe( 'Popover.Portal', () => {
	it( 'waits for an explicit null container to become available', async () => {
		const content = ( container: HTMLElement | null ) => (
			<Popover.Root defaultOpen>
				<Popover.Trigger>Open Popover</Popover.Trigger>
				<div data-testid="portal-target" />
				<Popover.Popup
					portal={ <Popover.Portal container={ container } /> }
				>
					<Popover.Title>Popover title</Popover.Title>
					Portal content
				</Popover.Popup>
			</Popover.Root>
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
