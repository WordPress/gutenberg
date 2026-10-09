import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen, waitFor, within } from '@testing-library/react';
import * as Autocomplete from '..';
import {
	getWpCompatOverlaySlot,
	__resetWpCompatOverlaySlotCacheForTests,
} from '../../../../utils/wp-compat-overlay-slot';

beforeEach( () => {
	vi.stubGlobal( '__wpUiCompatOverlaySlotEnabled', true );
} );

afterEach( () => {
	getWpCompatOverlaySlot()?.remove();
	__resetWpCompatOverlaySlotCacheForTests();
	vi.unstubAllGlobals();
} );

describe( 'Autocomplete.Portal', () => {
	it( 'waits for an explicit null container to become available', async () => {
		const content = ( container: HTMLElement | null ) => (
			<Autocomplete.Root defaultOpen>
				<Autocomplete.Input aria-label="Search" />
				<div data-testid="portal-target" />
				<Autocomplete.Popup
					portal={ <Autocomplete.Portal container={ container } /> }
				>
					Portal content
				</Autocomplete.Popup>
			</Autocomplete.Root>
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
