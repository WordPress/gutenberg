import { afterEach, describe, expect, it, vi } from 'vitest';
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
	getNamedHexKeys,
	isReactionEmojiAllowed,
	parseReactionEmojiRules,
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
	it( 'renders a labelled group with one button per curated emoji', async () => {
		render( <ReactionEmojiPicker onSelect={ () => {} } /> );

		// Composite settles its active item after mount, so the first query
		// awaits that update instead of letting it land outside the test.
		expect(
			await screen.findByRole( 'group', {
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
		const onSelect = vi.fn();
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

		it( 'renders the list from editor settings when present', async () => {
			dispatch( blockEditorStore ).updateSettings( {
				noteReactionEmojis: [
					...REACTION_EMOJIS,
					{ emoji: '👍', label: 'Thumbs up', value: 'thumbs-up' },
				],
			} );
			render( <ReactionEmojiPicker onSelect={ () => {} } /> );

			expect( await screen.findAllByRole( 'button' ) ).toHaveLength(
				REACTION_EMOJIS.length + 1
			);
			expect(
				screen.getByRole( 'button', { name: 'Thumbs up' } )
			).toBeVisible();
		} );

		it( 'drops malformed entries without restoring the defaults', async () => {
			dispatch( blockEditorStore ).updateSettings( {
				noteReactionEmojis: [
					null,
					{ emoji: '👍' },
					{ label: 'No emoji', value: 'no-emoji' },
				],
			} );
			const { unmount } = render(
				<ReactionEmojiPicker onSelect={ () => {} } />
			);

			expect(
				screen.getByRole( 'group', {
					name: 'Add an emoji reaction',
				} )
			).toBeInTheDocument();
			expect( screen.queryAllByRole( 'button' ) ).toHaveLength( 0 );
			// Unmount before `afterEach` restores the defaults, which would
			// otherwise mount items whose Composite updates escape act().
			unmount();
		} );

		it( 'keeps an explicitly empty filtered list empty', async () => {
			// The server validates against the filtered list, so offering
			// the defaults here would produce slugs it rejects.
			dispatch( blockEditorStore ).updateSettings( {
				noteReactionEmojis: [],
			} );
			const { unmount } = render(
				<ReactionEmojiPicker onSelect={ () => {} } />
			);

			expect(
				screen.getByRole( 'group', {
					name: 'Add an emoji reaction',
				} )
			).toBeInTheDocument();
			expect( screen.queryAllByRole( 'button' ) ).toHaveLength( 0 );
			// Unmount before `afterEach` restores the defaults, which would
			// otherwise mount items whose Composite updates escape act().
			unmount();
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

	it( 'uses the hex key for a default emoji missing from the list', () => {
		expect( emojiToStorageKey( '🎉', [] ) ).toBe( '1f389' );
	} );

	it( 'falls back to the padded hex key for other emoji', () => {
		expect( emojiToStorageKey( '👍' ) ).toBe( '1f44d' );
		expect( emojiToStorageKey( '©️' ) ).toBe( '00a9' );
	} );
} );

describe( 'parseReactionEmojiRules', () => {
	it( 'allows any emoji when the setting is absent or malformed', () => {
		const any = { allowUnlisted: true, exclude: [] };
		expect( parseReactionEmojiRules( undefined ) ).toEqual( any );
		expect( parseReactionEmojiRules( 'strict' ) ).toEqual( any );
	} );

	it( 'keeps string exclusions, lowercased', () => {
		expect(
			parseReactionEmojiRules( {
				allowUnlisted: false,
				exclude: [ '1F595', 42, null ],
			} )
		).toEqual( { allowUnlisted: false, exclude: [ '1f595' ] } );
	} );
} );

describe( 'isReactionEmojiAllowed', () => {
	const named = getNamedHexKeys( REACTION_EMOJIS );

	it( 'rejects an excluded emoji and its skin-tone variants', () => {
		const rules = { allowUnlisted: true, exclude: [ '1f44d' ] };
		expect( isReactionEmojiAllowed( '1f44d', rules, named ) ).toBe( false );
		expect( isReactionEmojiAllowed( '1f44d-1f3fd', rules, named ) ).toBe(
			false
		);
		expect( isReactionEmojiAllowed( '1f600', rules, named ) ).toBe( true );
	} );

	it( 'accepts only named emoji when unlisted emoji are not allowed', () => {
		const rules = { allowUnlisted: false, exclude: [] };
		expect( isReactionEmojiAllowed( '2764', rules, named ) ).toBe( true );
		expect( isReactionEmojiAllowed( '1f600', rules, named ) ).toBe( false );
	} );

	it( 'accepts a named emoji even when it is excluded', () => {
		const rules = { allowUnlisted: true, exclude: [ '2764' ] };
		expect( isReactionEmojiAllowed( '2764', rules, named ) ).toBe( true );
	} );
} );
