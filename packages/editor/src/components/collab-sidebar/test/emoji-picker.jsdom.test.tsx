import { readFileSync } from 'node:fs';
import path from 'node:path';
import { act, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { speak } from '@wordpress/a11y';
import { dispatch } from '@wordpress/data';
// @ts-expect-error - No type declarations available for @wordpress/block-editor.
import { store as blockEditorStore } from '@wordpress/block-editor';
import EmojiPicker, {
	chunkRows,
	getGroupLabel,
	groupEmojis,
	searchEmojis,
} from '../emoji-picker';
import { EMOJIBASE_LOCALES, resolveEmojibaseLocale } from '../emojibase-data';
import type { EmojibaseEntry } from '../emojibase-data';

jest.mock( '@wordpress/a11y', () => ( { speak: jest.fn() } ) );

const mockSpeak = jest.mocked( speak );

describe( 'resolveEmojibaseLocale', () => {
	it( 'falls back to English for empty/invalid input', () => {
		expect( resolveEmojibaseLocale( '' ) ).toBe( 'en' );
		// Values outside the declared signature: `<html lang>` and
		// `navigator.language` are page data, so the runtime guard has to
		// hold even when they are missing or not a string.
		const invalid = [ null, undefined, 42 ] as unknown as string[];
		for ( const value of invalid ) {
			expect( resolveEmojibaseLocale( value ) ).toBe( 'en' );
		}
	} );

	it( 'returns supported locales unchanged', () => {
		expect( resolveEmojibaseLocale( 'fr' ) ).toBe( 'fr' );
		expect( resolveEmojibaseLocale( 'de' ) ).toBe( 'de' );
		expect( resolveEmojibaseLocale( 'ja' ) ).toBe( 'ja' );
	} );

	it( 'normalizes case and underscore separators', () => {
		expect( resolveEmojibaseLocale( 'FR' ) ).toBe( 'fr' );
		expect( resolveEmojibaseLocale( 'fr_FR' ) ).toBe( 'fr' );
		expect( resolveEmojibaseLocale( 'pt_BR' ) ).toBe( 'pt' );
	} );

	it( 'matches regional variants Emojibase ships', () => {
		expect( resolveEmojibaseLocale( 'en-GB' ) ).toBe( 'en-gb' );
		expect( resolveEmojibaseLocale( 'es-MX' ) ).toBe( 'es-mx' );
	} );

	it( 'falls back to language portion when full tag is unsupported', () => {
		expect( resolveEmojibaseLocale( 'fr-CA' ) ).toBe( 'fr' );
		expect( resolveEmojibaseLocale( 'de-AT' ) ).toBe( 'de' );
		expect( resolveEmojibaseLocale( 'pt-PT' ) ).toBe( 'pt' );
	} );

	it( 'maps Traditional Chinese variants to zh-hant', () => {
		expect( resolveEmojibaseLocale( 'zh-TW' ) ).toBe( 'zh-hant' );
		expect( resolveEmojibaseLocale( 'zh-HK' ) ).toBe( 'zh-hant' );
		expect( resolveEmojibaseLocale( 'zh-MO' ) ).toBe( 'zh-hant' );
		expect( resolveEmojibaseLocale( 'zh-Hant' ) ).toBe( 'zh-hant' );
	} );

	it( 'falls back to English for fully unsupported locales', () => {
		expect( resolveEmojibaseLocale( 'xx' ) ).toBe( 'en' );
		expect( resolveEmojibaseLocale( 'klingon' ) ).toBe( 'en' );
	} );
} );

describe( 'getGroupLabel', () => {
	/*
	 * Verbatim from the `# group:` lines of Unicode's `emoji-test.txt`,
	 * in its order. Component (2) is omitted: `groupEmojis` drops it.
	 */
	it( "uses Unicode's own category names", () => {
		expect( [ 0, 1, 3, 4, 5, 6, 7, 8, 9 ].map( getGroupLabel ) ).toEqual( [
			'Smileys & Emotion',
			'People & Body',
			'Animals & Nature',
			'Food & Drink',
			'Travel & Places',
			'Activities',
			'Objects',
			'Symbols',
			'Flags',
		] );
	} );

	it( 'returns an empty heading for an unknown group', () => {
		expect( getGroupLabel( 42 ) ).toBe( '' );
	} );
} );

describe( 'groupEmojis', () => {
	it( 'returns empty array for empty input', () => {
		expect( groupEmojis( [] ) ).toEqual( [] );
	} );

	it( 'skips entries without a numeric group', () => {
		const data: EmojibaseEntry[] = [
			{ hexcode: '1F44B', emoji: '👋', group: 1 },
			{ hexcode: '1F3FB', emoji: '🏻' }, // Skin-tone component, no group.
		];
		const out = groupEmojis( data );
		expect( out ).toHaveLength( 1 );
		expect( out[ 0 ].emojis ).toHaveLength( 1 );
		expect( out[ 0 ].emojis[ 0 ].hexcode ).toBe( '1F44B' );
	} );

	it( 'skips the Component group, which is not pickable on its own', () => {
		const data: EmojibaseEntry[] = [
			{ hexcode: '1F44B', emoji: '👋', group: 1 },
			// Skin-tone swatches and hair modifiers only ever combine.
			{ hexcode: '1F3FB', emoji: '🏻', group: 2 },
			{ hexcode: '1F9B0', emoji: '🦰', group: 2 },
		];
		const out = groupEmojis( data );
		expect( out.map( ( g ) => g.key ) ).toEqual( [ 1 ] );
	} );

	it( 'buckets emojis by group and sorts groups numerically', () => {
		const data: EmojibaseEntry[] = [
			{ hexcode: 'B', emoji: '🅱', group: 8 },
			{ hexcode: 'A', emoji: '😀', group: 0 },
			{ hexcode: 'C', emoji: '😺', group: 0 },
			{ hexcode: 'D', emoji: '🌍', group: 3 },
		];
		const out = groupEmojis( data );
		expect( out.map( ( g ) => g.key ) ).toEqual( [ 0, 3, 8 ] );
		expect( out[ 0 ].emojis.map( ( e ) => e.hexcode ) ).toEqual( [
			'A',
			'C',
		] );
	} );
} );

/**
 * Build a run of placeholder emoji records; only the count matters to
 * the row chunker.
 *
 * @param length How many records to build.
 * @return Emoji records.
 */
function makeEntries( length: number ): EmojibaseEntry[] {
	return Array.from( { length }, ( _, i ) => ( {
		hexcode: `${ i }`,
		emoji: '😀',
	} ) );
}

describe( 'chunkRows', () => {
	it( 'returns empty array for empty input', () => {
		expect( chunkRows( [] ) ).toEqual( [] );
	} );

	it( 'splits into rows of 8 with a final partial row', () => {
		const input = makeEntries( 10 );
		const rows = chunkRows( input );
		expect( rows ).toHaveLength( 2 );
		expect( rows[ 0 ] ).toHaveLength( 8 );
		expect( rows[ 1 ] ).toHaveLength( 2 );
	} );

	it( 'uses one row when input fits in a single row', () => {
		expect( chunkRows( makeEntries( 5 ) ) ).toHaveLength( 1 );
	} );
} );

describe( 'searchEmojis', () => {
	const sample: EmojibaseEntry[] = [
		{
			hexcode: '1F600',
			emoji: '😀',
			label: 'grinning face',
			tags: [ 'cheerful', 'happy', 'smile' ],
		},
		{
			hexcode: '2764',
			emoji: '❤️',
			label: 'red heart',
			tags: [ 'love' ],
		},
		{
			hexcode: '1F389',
			emoji: '🎉',
			label: 'party popper',
			tags: [ 'celebration', 'birthday' ],
		},
	];

	it( 'returns the unfiltered list when query is empty/whitespace', () => {
		expect( searchEmojis( sample, '', null ) ).toBe( sample );
		expect( searchEmojis( sample, '   ', null ) ).toBe( sample );
	} );

	it( 'matches against the emoji label case-insensitively', () => {
		const results = searchEmojis( sample, 'GRIN', null );
		expect( results.map( ( e ) => e.hexcode ) ).toEqual( [ '1F600' ] );
	} );

	it( 'matches against the tags array', () => {
		const results = searchEmojis( sample, 'birthday', null );
		expect( results.map( ( e ) => e.hexcode ) ).toEqual( [ '1F389' ] );
	} );

	it( 'matches the override label when one is provided', () => {
		const overrides = { 2764: 'Heart' };
		const results = searchEmojis( sample, 'heart', overrides );
		// Both the override label "Heart" and Emojibase "red heart"
		// match the query — the same emoji, one match.
		expect( results.map( ( e ) => e.hexcode ) ).toEqual( [ '2764' ] );
	} );

	it( 'still matches the original Emojibase label when an override is set', () => {
		const overrides = { 2764: 'Heart' };
		// "red heart" matches via the original Emojibase label even
		// though the override label has replaced the visible name.
		const results = searchEmojis( sample, 'red', overrides );
		expect( results.map( ( e ) => e.hexcode ) ).toEqual( [ '2764' ] );
	} );

	it( 'matches an override keyed the way the server writes it', () => {
		// `gutenberg_emoji_picker_label_overrides` strips U+FE0F and pads
		// to four digits, so the key never equals the raw Emojibase
		// hexcode for the ~quarter of entries that keep the selector.
		const zwj: EmojibaseEntry[] = [
			{
				hexcode: '2764-FE0F-200D-1F525',
				emoji: '❤️‍🔥',
				label: 'heart on fire',
			},
		];
		const results = searchEmojis( zwj, 'flamme', {
			'2764-200D-1F525': 'Flammendes Herz',
		} );
		expect( results.map( ( e ) => e.hexcode ) ).toEqual( [
			'2764-FE0F-200D-1F525',
		] );
	} );

	it( 'returns an empty array when nothing matches', () => {
		expect( searchEmojis( sample, 'submarine', null ) ).toEqual( [] );
	} );

	it( 'tolerates emoji entries missing labels or tags', () => {
		const odd: EmojibaseEntry[] = [ { hexcode: 'X', emoji: '?' } ];
		expect( () => searchEmojis( odd, 'foo', null ) ).not.toThrow();
		expect( searchEmojis( odd, 'foo', null ) ).toEqual( [] );
	} );
} );

describe( 'EmojiPicker search announcements', () => {
	const originalFetch = global.fetch;

	beforeEach( () => {
		mockSpeak.mockClear();
		dispatch( blockEditorStore ).updateSettings( {
			noteEmojibaseUrl: 'https://example.test/emojibase',
		} );
		global.fetch = jest.fn( ( url: RequestInfo | URL ) =>
			Promise.resolve( {
				ok: true,
				json: () =>
					Promise.resolve(
						String( url ).includes( 'data.json' )
							? [
									{
										hexcode: '1F600',
										emoji: '😀',
										label: 'grinning face',
										group: 0,
									},
									{
										hexcode: '1F601',
										emoji: '😁',
										label: 'beaming face',
										group: 0,
									},
							  ]
							: {}
					),
			} as unknown as Response )
		);
	} );

	afterEach( () => {
		global.fetch = originalFetch;
		// The picker may still be mounted here (RTL cleanup runs after
		// this hook), so the settings-driven re-render needs act().
		act( () => {
			dispatch( blockEditorStore ).updateSettings( {
				noteEmojibaseUrl: undefined,
			} );
		} );
	} );

	it( 'exposes categories as labelled rowgroups and flattens search results', async () => {
		const user = userEvent.setup();
		render( <EmojiPicker onSelect={ () => {} } /> );

		await screen.findAllByRole( 'gridcell' );

		// While browsing, each category is a rowgroup labelled by its
		// visible heading, so cell-by-cell navigation has group context.
		// The heading is Unicode's own name for the group.
		expect(
			screen.getByRole( 'rowgroup', { name: 'Smileys & Emotion' } )
		).toBeVisible();

		// While searching, results collapse into one flat grid with no
		// category sections.
		await user.type(
			screen.getByRole( 'searchbox', { name: 'Search emoji' } ),
			'face'
		);
		await waitFor( () =>
			expect( screen.queryByRole( 'rowgroup' ) ).not.toBeInTheDocument()
		);
		expect( screen.getAllByRole( 'gridcell' ) ).toHaveLength( 2 );
	} );

	it( 'announces result counts and the empty state as the query settles', async () => {
		const user = userEvent.setup();
		render( <EmojiPicker onSelect={ () => {} } /> );

		// Wait for the dataset to load before searching.
		await screen.findAllByRole( 'gridcell' );

		const searchbox = screen.getByRole( 'searchbox', {
			name: 'Search emoji',
		} );

		await user.type( searchbox, 'face' );
		// The announcement is debounced, so it fires once the typing
		// settles rather than per keystroke.
		await waitFor( () =>
			expect( mockSpeak ).toHaveBeenCalledWith( '2 emojis found.' )
		);

		await user.clear( searchbox );
		await user.type( searchbox, 'grinning' );
		await waitFor( () =>
			expect( mockSpeak ).toHaveBeenCalledWith( '1 emoji found.' )
		);

		await user.clear( searchbox );
		await user.type( searchbox, 'zzz' );
		await waitFor( () =>
			expect( mockSpeak ).toHaveBeenCalledWith( 'No emoji found.' )
		);
	} );

	it( 'drops a queued count when the query is cleared', async () => {
		const user = userEvent.setup();
		render( <EmojiPicker onSelect={ () => {} } /> );

		await screen.findAllByRole( 'gridcell' );

		const searchbox = screen.getByRole( 'searchbox', {
			name: 'Search emoji',
		} );

		await user.type( searchbox, 'grinning' );
		await user.clear( searchbox );

		// Well past the 500ms debounce window: clearing restored the full
		// grid, so the count queued for "grinning" no longer describes it.
		await new Promise( ( resolve ) => setTimeout( resolve, 800 ) );
		expect( mockSpeak ).not.toHaveBeenCalledWith( '1 emoji found.' );
	} );
} );

describe( 'EMOJIBASE_LOCALES drift detection', () => {
	// `tools/build-scripts/copy-emojibase-data.mjs` hardcodes a parallel `LOCALES`
	// array — when the build runs it copies exactly those locale
	// directories into `build/emojibase-data/`. If the JS set drifts
	// from the build script, the picker either fetches a missing locale
	// (broken UI) or never uses a locale that was needlessly shipped
	// (wasted disk). Pin both here.
	it( 'stays in sync with tools/build-scripts/copy-emojibase-data.mjs', () => {
		const buildScript = readFileSync(
			path.resolve(
				__dirname,
				'../../../../../../tools/build-scripts/copy-emojibase-data.mjs'
			),
			'utf8'
		);
		const localesArray = buildScript.match(
			/const LOCALES = \[([\s\S]*?)\];/
		)?.[ 1 ];
		expect( localesArray ).toBeTruthy();
		const buildLocales = new Set(
			[ ...localesArray!.matchAll( /'([^']+)'/g ) ].map( ( m ) => m[ 1 ] )
		);

		expect( buildLocales ).toEqual( EMOJIBASE_LOCALES );
	} );
} );
