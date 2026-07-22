/**
 * External dependencies
 */
import { act, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

/**
 * WordPress dependencies
 */
import apiFetch from '@wordpress/api-fetch';

/**
 * Internal dependencies
 */
import ReactionDisplay from '../reaction-display';

jest.mock( '@wordpress/api-fetch', () => jest.fn() );

/*
 * The tooltip name cache in reaction-display.js is module-level and keyed
 * by `noteId:slug`, so each test uses a distinct noteId to stay isolated.
 */
let uniqueNoteId = 1;

describe( 'ReactionDisplay', () => {
	beforeEach( () => {
		uniqueNoteId += 1;
		apiFetch.mockReset();
		// Reject by default so tests that never await a tooltip fetch
		// fall back to the count-based label instead of hanging.
		apiFetch.mockRejectedValue( new Error( 'not mocked' ) );
	} );

	it( 'renders nothing when there are no reactions', () => {
		const { container } = render(
			<ReactionDisplay
				noteId={ uniqueNoteId }
				reactions={ {} }
				onToggleReaction={ () => {} }
			/>
		);

		expect( container ).toBeEmptyDOMElement();
	} );

	it( 'renders nothing when every reaction has a zero count', () => {
		const { container } = render(
			<ReactionDisplay
				noteId={ uniqueNoteId }
				reactions={ {
					heart: { count: 0, reacted: false, my_reaction_id: 0 },
				} }
				onToggleReaction={ () => {} }
			/>
		);

		expect( container ).toBeEmptyDOMElement();
	} );

	it( 'renders a pill per reacted emoji with count and pressed state', () => {
		render(
			<ReactionDisplay
				noteId={ uniqueNoteId }
				reactions={ {
					heart: { count: 2, reacted: true, my_reaction_id: 7 },
					rocket: { count: 1, reacted: false, my_reaction_id: 0 },
				} }
				onToggleReaction={ () => {} }
			/>
		);

		const heart = screen.getByRole( 'button', {
			name: 'Heart, 2 reactions',
			pressed: true,
		} );
		expect( heart ).toBeVisible();
		expect( heart ).toHaveTextContent( '❤️' );
		expect( heart ).toHaveTextContent( '2' );

		const rocket = screen.getByRole( 'button', {
			name: 'Rocket, 1 reaction',
			pressed: false,
		} );
		expect( rocket ).toBeVisible();
		expect( rocket ).toHaveTextContent( '🚀' );
		expect( rocket ).toHaveTextContent( '1' );
	} );

	it( 'falls back to the raw slug for emojis outside the curated set', () => {
		render(
			<ReactionDisplay
				noteId={ uniqueNoteId }
				reactions={ {
					custom: { count: 1, reacted: false, my_reaction_id: 0 },
				} }
				onToggleReaction={ () => {} }
			/>
		);

		expect(
			screen.getByRole( 'button', { name: 'custom, 1 reaction' } )
		).toHaveTextContent( 'custom' );
	} );

	it( 'resolves the emoji name from the Emojibase dataset for hex-key reactions', async () => {
		window.gutenbergEmojibaseUrl = 'https://example.test/emojibase';
		const originalFetch = global.fetch;
		global.fetch = jest.fn( ( url ) =>
			Promise.resolve( {
				ok: true,
				json: () =>
					Promise.resolve(
						String( url ).includes( 'data.json' )
							? [
									{
										hexcode: '1F44D',
										emoji: '👍',
										label: 'thumbs up',
										group: 0,
									},
							  ]
							: { groups: [] }
					),
			} )
		);

		try {
			render(
				<ReactionDisplay
					noteId={ uniqueNoteId }
					reactions={ {
						'1f44d': {
							count: 2,
							reacted: false,
							my_reaction_id: 0,
						},
					} }
					onToggleReaction={ () => {} }
				/>
			);

			// Until the dataset resolves, the emoji character stands in
			// for the label; afterwards the accessible name uses the
			// Emojibase label.
			expect(
				await screen.findByRole( 'button', {
					name: 'thumbs up, 2 reactions',
				} )
			).toHaveTextContent( '👍' );
		} finally {
			global.fetch = originalFetch;
			delete window.gutenbergEmojibaseUrl;
		}
	} );

	it( 'calls onToggleReaction with the slug when a pill is clicked', async () => {
		const user = userEvent.setup();
		const onToggleReaction = jest.fn();
		render(
			<ReactionDisplay
				noteId={ uniqueNoteId }
				reactions={ {
					heart: { count: 2, reacted: false, my_reaction_id: 0 },
				} }
				onToggleReaction={ onToggleReaction }
			/>
		);

		await user.click(
			screen.getByRole( 'button', { name: 'Heart, 2 reactions' } )
		);

		expect( onToggleReaction ).toHaveBeenCalledTimes( 1 );
		expect( onToggleReaction ).toHaveBeenCalledWith( 'heart' );
	} );

	it( 'moves focus to the parent thread when removing the last reaction', async () => {
		const user = userEvent.setup();
		render(
			<div
				className="editor-collab-sidebar-panel__thread"
				tabIndex={ 0 }
				data-testid="thread"
			>
				<ReactionDisplay
					noteId={ uniqueNoteId }
					reactions={ {
						heart: { count: 1, reacted: true, my_reaction_id: 7 },
					} }
					onToggleReaction={ () => {} }
				/>
			</div>
		);

		await user.click(
			screen.getByRole( 'button', { name: 'Heart, 1 reaction' } )
		);

		expect( screen.getByTestId( 'thread' ) ).toHaveFocus();
	} );

	it( 'lazy-loads reacting user names into the label on hover', async () => {
		const user = userEvent.setup();
		apiFetch.mockResolvedValue( [
			{ author_name: 'Alice', content: { raw: 'heart' } },
			// A different emoji on the same note must be filtered out.
			{ author_name: 'Mallory', content: { raw: 'rocket' } },
		] );
		render(
			<ReactionDisplay
				noteId={ uniqueNoteId }
				reactions={ {
					heart: { count: 1, reacted: true, my_reaction_id: 7 },
				} }
				onToggleReaction={ () => {} }
			/>
		);

		await user.hover(
			screen.getByRole( 'button', { name: 'Heart, 1 reaction' } )
		);

		await waitFor( () =>
			expect(
				screen.getByRole( 'button', {
					name: 'Alice reacted with Heart',
				} )
			).toBeVisible()
		);
		expect( apiFetch ).toHaveBeenCalledTimes( 1 );
	} );

	it( 'formats two and three-plus reactor names GitHub-style', async () => {
		const user = userEvent.setup();
		apiFetch.mockResolvedValue( [
			{ author_name: 'Alice', content: { raw: 'heart' } },
			{ author_name: 'Bob', content: { raw: 'heart' } },
			{ author_name: 'Carol', content: { raw: 'heart' } },
		] );
		render(
			<ReactionDisplay
				noteId={ uniqueNoteId }
				reactions={ {
					heart: { count: 3, reacted: true, my_reaction_id: 7 },
				} }
				onToggleReaction={ () => {} }
			/>
		);

		await user.hover(
			screen.getByRole( 'button', { name: 'Heart, 3 reactions' } )
		);

		await waitFor( () =>
			expect(
				screen.getByRole( 'button', {
					name: 'Alice, Bob, and 1 other reacted with Heart',
				} )
			).toBeVisible()
		);
	} );

	it( 'updates the reactor tooltip when the emoji label resolves after the names', async () => {
		// Pin the race between the two requests behind a hex-key pill's
		// tooltip: when the reactor names resolve first, the tooltip is
		// formatted with the emoji-character fallback label, and it must
		// re-derive once the Emojibase dataset supplies the real label.
		// A distinct base URL keeps the module-level dataset cache from
		// earlier tests out of the way.
		window.gutenbergEmojibaseUrl = 'https://example.test/emojibase-race';
		const originalFetch = global.fetch;
		let resolveDataset;
		const datasetGate = new Promise( ( resolve ) => {
			resolveDataset = resolve;
		} );
		global.fetch = jest.fn( ( url ) =>
			datasetGate.then( () => ( {
				ok: true,
				json: () =>
					Promise.resolve(
						String( url ).includes( 'data.json' )
							? [
									{
										hexcode: '1F44D',
										emoji: '👍',
										label: 'thumbs up',
										group: 0,
									},
							  ]
							: { groups: [] }
					),
			} ) )
		);
		apiFetch.mockResolvedValue( [
			{ author_name: 'Alice', content: { raw: '1f44d' } },
		] );

		try {
			const user = userEvent.setup();
			render(
				<ReactionDisplay
					noteId={ uniqueNoteId }
					reactions={ {
						'1f44d': {
							count: 1,
							reacted: false,
							my_reaction_id: 0,
						},
					} }
					onToggleReaction={ () => {} }
				/>
			);

			await user.hover(
				screen.getByRole( 'button', { name: '👍, 1 reaction' } )
			);
			// Names resolved first: the tooltip uses the emoji-character
			// fallback label while the dataset request is still pending.
			await waitFor( () =>
				expect(
					screen.getByRole( 'button', {
						name: 'Alice reacted with 👍',
					} )
				).toBeVisible()
			);

			await act( async () => {
				resolveDataset();
			} );
			// The dataset label arrived after the names: the already
			// visible tooltip must pick it up, not stay frozen on the
			// fallback.
			await waitFor( () =>
				expect(
					screen.getByRole( 'button', {
						name: 'Alice reacted with thumbs up',
					} )
				).toBeVisible()
			);
		} finally {
			global.fetch = originalFetch;
			delete window.gutenbergEmojibaseUrl;
		}
	} );

	it( 'keeps the count-based label when the names fetch fails', async () => {
		const user = userEvent.setup();
		apiFetch.mockRejectedValue( new Error( 'network down' ) );
		render(
			<ReactionDisplay
				noteId={ uniqueNoteId }
				reactions={ {
					heart: { count: 1, reacted: true, my_reaction_id: 7 },
				} }
				onToggleReaction={ () => {} }
			/>
		);

		await user.hover(
			screen.getByRole( 'button', { name: 'Heart, 1 reaction' } )
		);

		await waitFor( () => expect( apiFetch ).toHaveBeenCalledTimes( 1 ) );
		expect(
			screen.getByRole( 'button', { name: 'Heart, 1 reaction' } )
		).toBeVisible();
	} );
} );
