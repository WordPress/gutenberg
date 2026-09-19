import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import apiFetch from '@wordpress/api-fetch';
import { BlockReactionsToolbarButton } from '../block-reactions-toolbar-button';

// The editor store pulls in the viewport package, which reads matchMedia
// while loading, so the mock has to be in place before the imports run.
vi.hoisted( () => {
	globalThis.wpVitest.mockMatchMedia();
} );

vi.mock( import( '@wordpress/api-fetch' ), async ( importOriginal ) => {
	const original = await importOriginal();

	return {
		...original,
		default: vi.fn(),
	} as unknown as typeof original;
} );

const mockApiFetch = vi.mocked( apiFetch );

describe( 'BlockReactionsToolbarButton', () => {
	beforeEach( () => {
		mockApiFetch.mockReset();
		mockApiFetch.mockRejectedValue( new Error( 'not mocked' ) );
	} );

	it( 'is named "React to block" and opens the reaction picker', async () => {
		const user = userEvent.setup();
		render(
			<BlockReactionsToolbarButton
				clientId="client-a"
				onToggleReaction={ () => {} }
			/>
		);

		const trigger = screen.getByRole( 'button', {
			name: 'React to block',
		} );
		expect( trigger ).toHaveAttribute( 'aria-haspopup', 'dialog' );
		expect( trigger ).toHaveAttribute( 'aria-expanded', 'false' );

		await user.click( trigger );

		expect(
			screen.getByRole( 'dialog', { name: 'React to block' } )
		).toBeVisible();
		expect( trigger ).toHaveAttribute( 'aria-expanded', 'true' );
	} );

	it( 'toggles with the block client id and the picked slug', async () => {
		const user = userEvent.setup();
		const onToggleReaction = vi.fn();
		render(
			<BlockReactionsToolbarButton
				clientId="client-a"
				onToggleReaction={ onToggleReaction }
			/>
		);

		await user.click(
			screen.getByRole( 'button', { name: 'React to block' } )
		);
		await user.click(
			await screen.findByRole( 'button', { name: 'Heart' } )
		);

		expect( onToggleReaction ).toHaveBeenCalledWith( {
			clientId: 'client-a',
			emoji: 'heart',
		} );
	} );

	it( 'is disabled when reacting is unavailable', () => {
		render(
			<BlockReactionsToolbarButton
				clientId="client-a"
				disabled
				onToggleReaction={ () => {} }
			/>
		);

		// Kept focusable while disabled, so the tooltip can still explain
		// the control; the state is carried by aria-disabled.
		expect(
			screen.getByRole( 'button', { name: 'React to block' } )
		).toHaveAttribute( 'aria-disabled', 'true' );
	} );

	it( 'keeps the same trigger mounted while the picker is open', async () => {
		const user = userEvent.setup();
		render(
			<BlockReactionsToolbarButton
				clientId="client-a"
				onToggleReaction={ () => {} }
			/>
		);

		const trigger = screen.getByRole( 'button', {
			name: 'React to block',
		} );
		await user.click( trigger );

		expect( screen.getByRole( 'button', { name: 'React to block' } ) ).toBe(
			trigger
		);
	} );
} );
