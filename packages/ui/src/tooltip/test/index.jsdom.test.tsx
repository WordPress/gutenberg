import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import * as Tooltip from '..';
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

describe( 'Tooltip.Portal', () => {
	it( 'waits for an explicit null container to become available', async () => {
		const content = ( container: HTMLElement | null ) => (
			<Tooltip.Provider delay={ 0 }>
				<Tooltip.Root>
					<Tooltip.Trigger>Open Tooltip</Tooltip.Trigger>
					<div data-testid="portal-target" />
					<Tooltip.Popup
						portal={ <Tooltip.Portal container={ container } /> }
					>
						Portal content
					</Tooltip.Popup>
				</Tooltip.Root>
			</Tooltip.Provider>
		);

		const user = userEvent.setup();
		const { rerender } = render( content( null ) );

		const trigger = screen.getByRole( 'button', { name: 'Open Tooltip' } );
		await user.hover( trigger );
		await waitFor( () => {
			expect( trigger ).toHaveAttribute( 'data-popup-open' );
		} );

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
