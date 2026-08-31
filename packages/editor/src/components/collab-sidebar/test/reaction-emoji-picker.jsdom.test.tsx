import { act, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { dispatch } from '@wordpress/data';
// @ts-expect-error - No type declarations available for @wordpress/block-editor.
import { store as blockEditorStore } from '@wordpress/block-editor';
import ReactionEmojiPicker, {
	emojiToHexKey,
	emojiToStorageKey,
	hexKeyToEmoji,
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

describe( 'emojiToHexKey', () => {
	it( 'zero-pads code points to Emojibase hexcode width', () => {
		expect( emojiToHexKey( '©️' ) ).toBe( '00a9' );
		expect( emojiToHexKey( '®️' ) ).toBe( '00ae' );
		expect( emojiToHexKey( '0️⃣' ) ).toBe( '0030-20e3' );
	} );

	it( 'strips the variation selector', () => {
		expect( emojiToHexKey( '❤️' ) ).toBe( '2764' );
		expect( emojiToHexKey( '❤️‍🔥' ) ).toBe( '2764-200d-1f525' );
	} );

	it( 'leaves already wide code points unpadded', () => {
		expect( emojiToHexKey( '👍' ) ).toBe( '1f44d' );
		expect( emojiToHexKey( '👨‍💻' ) ).toBe( '1f468-200d-1f4bb' );
	} );

	it( 'returns an empty string for non-emoji input', () => {
		expect( emojiToHexKey( '' ) ).toBe( '' );
		expect( emojiToHexKey( undefined as unknown as string ) ).toBe( '' );
	} );
} );

describe( 'hexKeyToEmoji', () => {
	it( 're-qualifies text-presentation emoji so they render in colour', () => {
		expect( hexKeyToEmoji( '2764' ) ).toBe( '❤️' );
		expect( hexKeyToEmoji( '263a' ) ).toBe( '☺️' );
		expect( hexKeyToEmoji( '00a9' ) ).toBe( '©️' );
		expect( hexKeyToEmoji( '0030-20e3' ) ).toBe( '0️⃣' );
	} );

	it( 're-qualifies components inside a ZWJ sequence', () => {
		expect( hexKeyToEmoji( '2764-200d-1f525' ) ).toBe( '❤️‍🔥' );
		expect( hexKeyToEmoji( '1f9d4-200d-2642' ) ).toBe( '🧔‍♂️' );
	} );

	it( 'leaves emoji-presentation code points unqualified', () => {
		expect( hexKeyToEmoji( '1f44d' ) ).toBe( '👍' );
		expect( hexKeyToEmoji( '1f468-200d-1f4bb' ) ).toBe( '👨‍💻' );
	} );

	it( 'omits the selector before a skin-tone modifier', () => {
		expect( hexKeyToEmoji( '270c-1f3fb' ) ).toBe( '✌🏻' );
	} );

	it( 'reads legacy unpadded keys', () => {
		expect( hexKeyToEmoji( 'a9' ) ).toBe( '©️' );
	} );

	it( 'returns the input unchanged when it is not a hex key', () => {
		expect( hexKeyToEmoji( 'heart' ) ).toBe( 'heart' );
		expect( hexKeyToEmoji( 'ffffff' ) ).toBe( 'ffffff' );
	} );

	it( 'round-trips every emoji it produces a key for', () => {
		const emojis = [ '❤️', '☺️', '©️', '0️⃣', '❤️‍🔥', '🧔‍♂️', '👍', '✌🏻' ];
		emojis.forEach( ( emoji ) => {
			expect( hexKeyToEmoji( emojiToHexKey( emoji ) ) ).toBe( emoji );
		} );
	} );
} );

describe( 'emojiToStorageKey', () => {
	it( 'collapses a curated emoji to its slug', () => {
		expect( emojiToStorageKey( '❤️' ) ).toBe( 'heart' );
		expect( emojiToStorageKey( '❤' ) ).toBe( 'heart' );
	} );

	it( 'falls back to the padded hex key for other emoji', () => {
		expect( emojiToStorageKey( '👍' ) ).toBe( '1f44d' );
		expect( emojiToStorageKey( '©️' ) ).toBe( '00a9' );
	} );
} );
