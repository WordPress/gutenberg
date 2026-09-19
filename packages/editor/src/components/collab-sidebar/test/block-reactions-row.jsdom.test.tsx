import {
	afterAll,
	beforeAll,
	beforeEach,
	describe,
	expect,
	it,
	vi,
} from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import apiFetch from '@wordpress/api-fetch';
import { dispatch } from '@wordpress/data';
import {
	createBlock,
	registerBlockType,
	unregisterBlockType,
} from '@wordpress/blocks';
// @ts-expect-error - No type declarations available for @wordpress/block-editor.
import { store as blockEditorStore } from '@wordpress/block-editor';
import { BlockReactionsRow } from '../block-reactions-row';

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

describe( 'BlockReactionsRow', () => {
	let clientId: string;

	beforeAll( () => {
		registerBlockType( 'core/paragraph', {
			title: 'Paragraph',
			category: 'text',
			attributes: { metadata: { type: 'object' } },
			edit: () => null,
			save: () => null,
		} );
	} );

	afterAll( () => {
		unregisterBlockType( 'core/paragraph' );
	} );

	beforeEach( () => {
		mockApiFetch.mockReset();
		mockApiFetch.mockRejectedValue( new Error( 'not mocked' ) );
		const block = createBlock( 'core/paragraph' );
		clientId = block.clientId;
		dispatch( blockEditorStore ).resetBlocks( [ block ] );
	} );

	it( 'labels the group after the block and lists its pills', () => {
		render(
			<BlockReactionsRow
				clientId={ clientId }
				reactionsId="blockaaa"
				reactions={ {
					heart: { count: 2, reacted: false },
					rocket: { count: 1, reacted: true, my_reaction_id: 4 },
				} }
				onToggleBlockReaction={ () => {} }
			/>
		);

		const group = screen.getByRole( 'group', {
			name: 'Reactions on Paragraph',
		} );
		expect( group ).toBeVisible();
		expect(
			screen.getByRole( 'button', { name: 'Heart, 2 reactions' } )
		).toHaveAttribute( 'aria-pressed', 'false' );
		expect(
			screen.getByRole( 'button', { name: 'Rocket, 1 reaction' } )
		).toHaveAttribute( 'aria-pressed', 'true' );
	} );

	it( 'toggles with the block client id and slug', async () => {
		const user = userEvent.setup();
		const onToggleBlockReaction = vi.fn();
		render(
			<BlockReactionsRow
				clientId={ clientId }
				reactionsId="blockaaa"
				reactions={ { heart: { count: 2, reacted: false } } }
				onToggleBlockReaction={ onToggleBlockReaction }
			/>
		);

		await user.click(
			screen.getByRole( 'button', { name: 'Heart, 2 reactions' } )
		);

		expect( onToggleBlockReaction ).toHaveBeenCalledWith( {
			clientId,
			emoji: 'heart',
		} );
	} );

	it( 'names its trigger "Add block reaction"', async () => {
		const user = userEvent.setup();
		const onToggleBlockReaction = vi.fn();
		render(
			<BlockReactionsRow
				clientId={ clientId }
				reactionsId="blockaaa"
				reactions={ { heart: { count: 1, reacted: false } } }
				onToggleBlockReaction={ onToggleBlockReaction }
			/>
		);

		// Distinct from a note's "Add reaction" so the two never collide
		// when a block's row sits beside its notes.
		const trigger = screen.getByRole( 'button', {
			name: 'Add block reaction',
		} );
		expect(
			screen.queryByRole( 'button', { name: 'Add reaction' } )
		).not.toBeInTheDocument();

		await user.click( trigger );
		await user.click(
			await screen.findByRole( 'button', { name: 'Rocket' } )
		);

		expect( onToggleBlockReaction ).toHaveBeenCalledWith( {
			clientId,
			emoji: 'rocket',
		} );
	} );
} );
