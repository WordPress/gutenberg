import { act, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import apiFetch from '@wordpress/api-fetch';
import { speak } from '@wordpress/a11y';
import { dispatch } from '@wordpress/data';
// @ts-expect-error - No type declarations available for @wordpress/block-editor.
import { store as blockEditorStore } from '@wordpress/block-editor';
import { AddReactionButton } from '../add-reaction-picker';

jest.mock( '@wordpress/api-fetch', () => jest.fn() );
jest.mock( '@wordpress/a11y', () => ( { speak: jest.fn() } ) );

const mockApiFetch = jest.mocked( apiFetch );
const mockSpeak = jest.mocked( speak );

/*
 * The tooltip name cache in reaction-display.tsx is module-level and
 * keyed by `noteId:slug`, so each test uses a distinct noteId to stay
 * isolated.
 */
let uniqueNoteId = 100;

describe( 'AddReactionButton', () => {
	beforeEach( () => {
		uniqueNoteId += 1;
		mockApiFetch.mockReset();
		mockApiFetch.mockRejectedValue( new Error( 'not mocked' ) );
		mockSpeak.mockClear();
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
		// The curated options wrap into rows once the set grows past one
		// row, and a narrow popover can stack them into a column, so the
		// group deliberately reports no orientation and both axes move
		// the roving tab index.
		expect(
			screen.getByRole( 'group', {
				name: 'Add an emoji reaction',
			} )
		).not.toHaveAttribute( 'aria-orientation' );
		await user.click(
			await screen.findByRole( 'button', { name: 'Rocket' } )
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
		global.fetch = jest.fn( ( url: RequestInfo | URL ) =>
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
			} as unknown as Response )
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
				screen.queryByRole( 'button', { name: 'Thumbs up' } )
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
		global.fetch = jest.fn( ( url: RequestInfo | URL ) =>
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
				  } as unknown as Response )
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
				await screen.findByRole( 'button', { name: 'Rocket' } )
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
				screen.getByRole( 'button', { name: 'Rocket' } )
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
			screen.queryByRole( 'button', { name: 'Rocket' } )
		).not.toBeInTheDocument();
	} );
} );
