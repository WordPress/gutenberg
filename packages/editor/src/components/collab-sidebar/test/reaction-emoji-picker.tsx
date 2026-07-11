/**
 * External dependencies
 */
import { act, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

/**
 * WordPress dependencies
 */
import { dispatch } from '@wordpress/data';
import { store as blockEditorStore } from '@wordpress/block-editor';

/**
 * Internal dependencies
 */
import ReactionEmojiPicker, {
	REACTION_EMOJIS,
	buildEmojiBySlugMap,
} from '../reaction-emoji-picker';

describe( 'buildEmojiBySlugMap', () => {
	it( 'indexes every curated emoji by its slug', () => {
		const map = buildEmojiBySlugMap();

		expect( map.size ).toBe( REACTION_EMOJIS.length );
		REACTION_EMOJIS.forEach( ( entry ) => {
			expect( map.get( entry.value ) ).toBe( entry );
		} );
	} );

	it( 'indexes a custom emoji list when provided', () => {
		const custom = [ { emoji: '⭐', label: 'Star', value: 'star' } ];
		const map = buildEmojiBySlugMap( custom );

		expect( map.size ).toBe( 1 );
		expect( map.get( 'star' ) ).toEqual( custom[ 0 ] );
		expect( map.get( 'heart' ) ).toBeUndefined();
	} );
} );

describe( 'ReactionEmojiPicker', () => {
	it( 'renders a labelled listbox with one option per curated emoji', () => {
		render( <ReactionEmojiPicker onSelect={ () => {} } /> );

		expect(
			screen.getByRole( 'listbox', {
				name: 'Select an emoji reaction',
			} )
		).toBeVisible();

		const options = screen.getAllByRole( 'option' );
		expect( options ).toHaveLength( REACTION_EMOJIS.length );
		REACTION_EMOJIS.forEach( ( { label } ) => {
			expect(
				screen.getByRole( 'option', { name: label } )
			).toBeVisible();
		} );
	} );

	it( 'calls onSelect with the storage slug, not the emoji character', async () => {
		const user = userEvent.setup();
		const onSelect = jest.fn();
		render( <ReactionEmojiPicker onSelect={ onSelect } /> );

		await user.click( screen.getByRole( 'option', { name: 'Smile' } ) );

		expect( onSelect ).toHaveBeenCalledTimes( 1 );
		expect( onSelect ).toHaveBeenCalledWith( 'smile' );
	} );

	it( 'omits the "More emojis" trigger unless onMore is provided', () => {
		render( <ReactionEmojiPicker onSelect={ () => {} } /> );

		expect(
			screen.queryByRole( 'button', { name: 'More emojis' } )
		).not.toBeInTheDocument();
	} );

	it( 'renders the "More emojis" trigger outside the listbox and calls onMore', async () => {
		const user = userEvent.setup();
		const onMore = jest.fn();
		render(
			<ReactionEmojiPicker onSelect={ () => {} } onMore={ onMore } />
		);

		// The trigger is an action, not a selectable value, so it must not
		// be one of the listbox options.
		expect( screen.getAllByRole( 'option' ) ).toHaveLength(
			REACTION_EMOJIS.length
		);

		await user.click(
			screen.getByRole( 'button', { name: 'More emojis' } )
		);

		expect( onMore ).toHaveBeenCalledTimes( 1 );
	} );

	describe( 'settings-provided emoji list', () => {
		afterEach( () => {
			// The picker may still be mounted when the settings reset
			// lands, so the resulting re-render must be act()-wrapped.
			act( () => {
				dispatch( blockEditorStore ).updateSettings( {
					noteReactionEmojis: undefined,
				} );
			} );
		} );

		it( 'renders the list from editor settings when present', () => {
			dispatch( blockEditorStore ).updateSettings( {
				noteReactionEmojis: [
					...REACTION_EMOJIS,
					{ emoji: '👍', label: 'Thumbs up', value: 'thumbs-up' },
				],
			} );
			render( <ReactionEmojiPicker onSelect={ () => {} } /> );

			expect( screen.getAllByRole( 'option' ) ).toHaveLength(
				REACTION_EMOJIS.length + 1
			);
			expect(
				screen.getByRole( 'option', { name: 'Thumbs up' } )
			).toBeVisible();
		} );

		it( 'drops malformed entries and falls back to defaults when none survive', () => {
			dispatch( blockEditorStore ).updateSettings( {
				noteReactionEmojis: [
					null,
					{ emoji: '👍' },
					{ label: 'No emoji', value: 'no-emoji' },
				],
			} );
			render( <ReactionEmojiPicker onSelect={ () => {} } /> );

			expect( screen.getAllByRole( 'option' ) ).toHaveLength(
				REACTION_EMOJIS.length
			);
		} );
	} );
} );
