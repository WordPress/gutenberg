/**
 * External dependencies
 */
import { act, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

/**
 * WordPress dependencies
 */
import apiFetch from '@wordpress/api-fetch';
import { speak } from '@wordpress/a11y';
import { dispatch } from '@wordpress/data';
import { store as blockEditorStore } from '@wordpress/block-editor';

/**
 * Internal dependencies
 */
import { AddReactionButton } from '../add-reaction-picker';

jest.mock( '@wordpress/api-fetch', () => jest.fn() );
jest.mock( '@wordpress/a11y', () => ( { speak: jest.fn() } ) );

/*
 * The tooltip name cache in reaction-display.tsx is module-level and
 * keyed by `noteId:slug`, so each test uses a distinct noteId to stay
 * isolated.
 */
let uniqueNoteId = 100;

describe( 'AddReactionButton', () => {
	beforeEach( () => {
		uniqueNoteId += 1;
		apiFetch.mockReset();
		apiFetch.mockRejectedValue( new Error( 'not mocked' ) );
		speak.mockClear();
	} );

	it( 'falls back to the curated quick row when no Emojibase URL is set', async () => {
		const user = userEvent.setup();
		const onToggleReaction = jest.fn();
		render(
			<AddReactionButton
				noteId={ uniqueNoteId }
				onToggleReaction={ onToggleReaction }
			/>
		);

		const trigger = screen.getByRole( 'button', { name: 'Add reaction' } );
		// The trigger advertises the popup type it opens, and the popup
		// itself is a named non-modal dialog so screen readers announce
		// where focus landed.
		expect( trigger ).toHaveAttribute( 'aria-haspopup', 'dialog' );
		await user.click( trigger );
		expect(
			screen.getByRole( 'dialog', { name: 'Add reaction' } )
		).toBeVisible();
		// The curated options are laid out horizontally, so the listbox
		// must report its orientation (the ARIA default is vertical).
		expect(
			screen.getByRole( 'listbox', {
				name: 'Select an emoji reaction',
			} )
		).toHaveAttribute( 'aria-orientation', 'horizontal' );
		await user.click(
			await screen.findByRole( 'option', { name: 'Rocket' } )
		);

		expect( onToggleReaction ).toHaveBeenCalledTimes( 1 );
		expect( onToggleReaction ).toHaveBeenCalledWith( 'rocket' );
	} );

	it( 'opens the full picker directly and stores a filter-provided emoji under its slug', async () => {
		// With an Emojibase URL configured, "Add reaction" opens the full
		// searchable picker straight away (no intermediate quick row).
		// A site filter adds 👍 with the slug `thumbs-up`; picking it from
		// the full picker must store `thumbs-up`, not the raw hex key
		// `1f44d`, so it aggregates into the same reaction_summary bucket
		// as historical quick-row picks.
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
							: { groups: [ { order: 0, message: 'Smileys' } ] }
					),
			} )
		);
		dispatch( blockEditorStore ).updateSettings( {
			noteEmojibaseUrl: 'https://example.test/emojibase',
			noteReactionEmojis: [
				{ emoji: '👍', label: 'Thumbs up', value: 'thumbs-up' },
			],
		} );

		try {
			const user = userEvent.setup();
			const onToggleReaction = jest.fn();
			render(
				<AddReactionButton
					noteId={ uniqueNoteId }
					onToggleReaction={ onToggleReaction }
				/>
			);

			await user.click(
				screen.getByRole( 'button', { name: 'Add reaction' } )
			);
			// The popup is exposed as a named non-modal dialog in the
			// full-picker branch too.
			expect(
				screen.getByRole( 'dialog', { name: 'Add reaction' } )
			).toBeVisible();
			// The full picker opens directly — no quick row, no
			// intermediate "More emojis" step.
			expect(
				screen.queryByRole( 'option', { name: 'Thumbs up' } )
			).not.toBeInTheDocument();
			// The filter-provided emoji is seeded into "Frequently used"
			// and also appears in its Emojibase category; either cell
			// exercises the same selection path.
			await user.click(
				(
					await screen.findAllByRole( 'gridcell', {
						name: 'thumbs up',
					} )
				)[ 0 ]
			);
			expect( onToggleReaction ).toHaveBeenLastCalledWith( 'thumbs-up' );
			expect( onToggleReaction ).toHaveBeenCalledTimes( 1 );
		} finally {
			global.fetch = originalFetch;
			act( () => {
				dispatch( blockEditorStore ).updateSettings( {
					noteEmojibaseUrl: undefined,
					noteReactionEmojis: undefined,
				} );
			} );
		}
	} );

	it( 'falls back to the curated picker with a retry path when the dataset fails', async () => {
		// A distinct base URL keeps the module-level dataset cache from
		// other tests out of the way; rejected loads are never cached, so
		// the retry below triggers a fresh fetch.
		dispatch( blockEditorStore ).updateSettings( {
			noteEmojibaseUrl: 'https://example.test/emojibase-down',
		} );
		const originalFetch = global.fetch;
		let failRequests = true;
		global.fetch = jest.fn( ( url ) =>
			failRequests
				? Promise.reject( new Error( 'network down' ) )
				: Promise.resolve( {
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
									: {
											groups: [
												{
													order: 0,
													message: 'Smileys',
												},
											],
									  }
							),
				  } )
		);

		try {
			const user = userEvent.setup();
			const onToggleReaction = jest.fn();
			render(
				<AddReactionButton
					noteId={ uniqueNoteId }
					onToggleReaction={ onToggleReaction }
				/>
			);

			await user.click(
				screen.getByRole( 'button', { name: 'Add reaction' } )
			);

			// The dataset failed: the curated quick row takes over so
			// adding a reaction keeps working, with a visible retry
			// affordance…
			expect(
				await screen.findByRole( 'option', { name: 'Rocket' } )
			).toBeVisible();
			expect(
				screen.getByText( 'Couldn’t load the full emoji picker.' )
			).toBeVisible();
			// …and the failure is announced through the a11y announcer,
			// whose live regions exist before the message (a live region
			// mounted together with its content is not reliably announced).
			expect( speak ).toHaveBeenCalledWith(
				'The full emoji picker couldn’t be loaded. Basic reactions are available.',
				'assertive'
			);

			// Curated picks work in the fallback state.
			await user.click(
				screen.getByRole( 'option', { name: 'Rocket' } )
			);
			expect( onToggleReaction ).toHaveBeenCalledWith( 'rocket' );

			// The failure is sticky across popover open/close until
			// retried; once the network recovers, Retry restores the
			// full picker.
			await user.click(
				screen.getByRole( 'button', { name: 'Add reaction' } )
			);
			failRequests = false;
			await user.click( screen.getByRole( 'button', { name: 'Retry' } ) );
			expect(
				await screen.findAllByRole( 'gridcell', { name: 'thumbs up' } )
			).not.toHaveLength( 0 );
		} finally {
			global.fetch = originalFetch;
			act( () => {
				dispatch( blockEditorStore ).updateSettings( {
					noteEmojibaseUrl: undefined,
				} );
			} );
		}
	} );

	it( 'stays focusable but inert when disabled', async () => {
		const user = userEvent.setup();
		render(
			<AddReactionButton
				noteId={ uniqueNoteId }
				disabled
				onToggleReaction={ () => {} }
			/>
		);

		const button = screen.getByRole( 'button', { name: 'Add reaction' } );
		expect( button ).toHaveAttribute( 'aria-disabled', 'true' );

		await user.click( button );
		expect(
			screen.queryByRole( 'option', { name: 'Rocket' } )
		).not.toBeInTheDocument();
	} );
} );
