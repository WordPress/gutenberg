import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import { Root, Portal, Popup } from '..';
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

describe( 'AlertDialog.Portal', () => {
	it( 'waits for an explicit null container to become available', () => {
		const content = ( container: HTMLElement | null ) => (
			<Root defaultOpen>
				<div data-testid="portal-target" />
				<Popup
					title="Dialog title"
					portal={ <Portal container={ container } /> }
				>
					Portal content
				</Popup>
			</Root>
		);

		const { rerender } = render( content( null ) );

		expect(
			screen.queryByText( 'Portal content' )
		).not.toBeInTheDocument();

		const target = screen.getByTestId( 'portal-target' );
		rerender( content( target ) );

		expect( within( target ).getByText( 'Portal content' ) ).toBeVisible();
	} );
} );
