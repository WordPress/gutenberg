import { act, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { dispatch } from '@wordpress/data';
// @ts-expect-error - No type declarations available for @wordpress/block-editor.
import { store as blockEditorStore } from '@wordpress/block-editor';
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
	it( 'renders a labelled group with one button per curated emoji', () => {
		render( <ReactionEmojiPicker onSelect={ () => {} } /> );

		expect(
			screen.getByRole( 'group', {
				name: 'Add an emoji reaction',
			} )
		).toBeVisible();

		const buttons = screen.getAllByRole( 'button' );
		expect( buttons ).toHaveLength( REACTION_EMOJIS.length );
		REACTION_EMOJIS.forEach( ( { label } ) => {
			expect(
				screen.getByRole( 'button', { name: label } )
			).toBeVisible();
		} );
	} );

	it( 'calls onSelect with the storage slug, not the emoji character', async () => {
		const user = userEvent.setup();
		const onSelect = jest.fn();
		render( <ReactionEmojiPicker onSelect={ onSelect } /> );

		await user.click( screen.getByRole( 'button', { name: 'Smile' } ) );

		expect( onSelect ).toHaveBeenCalledTimes( 1 );
		expect( onSelect ).toHaveBeenCalledWith( 'smile' );
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

			expect( screen.getAllByRole( 'button' ) ).toHaveLength(
				REACTION_EMOJIS.length + 1
			);
			expect(
				screen.getByRole( 'button', { name: 'Thumbs up' } )
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

			expect( screen.getAllByRole( 'button' ) ).toHaveLength(
				REACTION_EMOJIS.length
			);
		} );
	} );
} );
