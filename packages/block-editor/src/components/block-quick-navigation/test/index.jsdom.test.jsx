import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {
	createBlock,
	registerBlockType,
	unregisterBlockType,
} from '@wordpress/blocks';
import { useRegistry } from '@wordpress/data';
import BlockQuickNavigation from '../';
import { BlockEditorProvider } from '../../provider';
import { store as blockEditorStore } from '../../../store';

// The items render `@wordpress/components` layout primitives, which measure
// themselves on mount, and userEvent dispatches pointer events.
globalThis.wpVitest.mockMatchMedia();
globalThis.wpVitest.mockResizeObserver();
globalThis.wpVitest.mockPointerEvent();

const ALPHA = 'test/alpha';
const BETA = 'test/beta';

function CaptureRegistry( { onRegistry } ) {
	onRegistry( useRegistry() );
	return null;
}

describe( 'BlockQuickNavigation', () => {
	beforeAll( () => {
		registerBlockType( ALPHA, {
			apiVersion: 3,
			title: 'Alpha',
			category: 'text',
			save: () => null,
		} );
		registerBlockType( BETA, {
			apiVersion: 3,
			title: 'Beta',
			category: 'text',
			save: () => null,
		} );
	} );

	afterAll( () => {
		unregisterBlockType( ALPHA );
		unregisterBlockType( BETA );
	} );

	let registry;
	let blocks;

	function renderNavigation() {
		const alpha = createBlock( ALPHA );
		const beta = createBlock( BETA );
		blocks = { alpha: alpha.clientId, beta: beta.clientId };

		return render(
			<BlockEditorProvider value={ [ alpha, beta ] }>
				<CaptureRegistry
					onRegistry={ ( value ) => {
						registry = value;
					} }
				/>
				<BlockQuickNavigation
					clientIds={ [ alpha.clientId, beta.clientId ] }
				/>
			</BlockEditorProvider>
		);
	}

	const isHighlighted = ( clientId ) =>
		registry.select( blockEditorStore ).isBlockHighlighted( clientId );

	it( 'highlights the block while its item is hovered', async () => {
		const user = userEvent.setup();
		renderNavigation();

		await user.hover( screen.getByRole( 'button', { name: 'Alpha' } ) );

		await waitFor( () =>
			expect( isHighlighted( blocks.alpha ) ).toBe( true )
		);
		expect( isHighlighted( blocks.beta ) ).toBe( false );
	} );

	it( 'clears the highlight when the pointer leaves', async () => {
		const user = userEvent.setup();
		renderNavigation();

		const item = screen.getByRole( 'button', { name: 'Alpha' } );
		await user.hover( item );
		await waitFor( () =>
			expect( isHighlighted( blocks.alpha ) ).toBe( true )
		);

		await user.unhover( item );

		await waitFor( () =>
			expect( isHighlighted( blocks.alpha ) ).toBe( false )
		);
	} );

	it( 'highlights the block while its item is focused', async () => {
		const user = userEvent.setup();
		renderNavigation();

		await user.tab();

		expect( screen.getByRole( 'button', { name: 'Alpha' } ) ).toHaveFocus();
		await waitFor( () =>
			expect( isHighlighted( blocks.alpha ) ).toBe( true )
		);
	} );

	it( 'clears the highlight when focus moves on', async () => {
		const user = userEvent.setup();
		renderNavigation();

		await user.tab();
		await waitFor( () =>
			expect( isHighlighted( blocks.alpha ) ).toBe( true )
		);

		await user.tab();

		await waitFor( () => {
			expect( isHighlighted( blocks.alpha ) ).toBe( false );
			expect( isHighlighted( blocks.beta ) ).toBe( true );
		} );
	} );

	// Selecting an item can switch the inspector to the List View tab, which
	// unmounts this panel while the pointer is still over the item. Without an
	// unmount cleanup the block would stay highlighted for good.
	it( 'clears the highlight when the panel unmounts while hovered', async () => {
		const user = userEvent.setup();
		const { unmount } = renderNavigation();

		await user.hover( screen.getByRole( 'button', { name: 'Alpha' } ) );
		await waitFor( () =>
			expect( isHighlighted( blocks.alpha ) ).toBe( true )
		);

		unmount();

		expect( isHighlighted( blocks.alpha ) ).toBe( false );
	} );
} );
