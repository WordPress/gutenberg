import { readFileSync } from 'node:fs';
import path from 'node:path';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { dispatch } from '@wordpress/data';
// @ts-expect-error - No type declarations available for @wordpress/block-editor.
import { store as blockEditorStore } from '@wordpress/block-editor';
import { store as preferencesStore } from '@wordpress/preferences';
import EmojiPicker, {
	chunkRows,
	getGroupLabel,
	groupEmojis,
	searchEmojis,
} from '../emoji-picker';
import { EMOJIBASE_LOCALES, resolveEmojibaseLocale } from '../emojibase-data';
import { FREQUENT_EMOJIS_PREFERENCE_KEY } from '../frequent-emojis';
import type { EmojibaseEntry } from '../emojibase-data';

globalThis.wpVitest.mockMatchMedia();

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

	it( 'splits into rows of 6 with a final partial row', () => {
		const input = makeEntries( 10 );
		const rows = chunkRows( input );
		expect( rows ).toHaveLength( 2 );
		expect( rows[ 0 ] ).toHaveLength( 6 );
		expect( rows[ 1 ] ).toHaveLength( 4 );
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
		dispatch( blockEditorStore ).updateSettings( {
			noteEmojibaseUrl: 'https://example.test/emojibase',
		} );
		// Picks persist in the shared preferences store, and a leftover
		// "Frequently used" row shifts every grid position below it.
		dispatch( preferencesStore ).set(
			'core',
			FREQUENT_EMOJIS_PREFERENCE_KEY,
			[]
		);
		global.fetch = vi.fn( ( url: RequestInfo | URL ) =>
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
			screen.getByRole( 'combobox', { name: 'Search emoji' } ),
			'face'
		);
		await waitFor( () =>
			expect( screen.queryByRole( 'rowgroup' ) ).not.toBeInTheDocument()
		);
		expect( screen.getAllByRole( 'gridcell' ) ).toHaveLength( 2 );
	} );

	it( 'keeps focus in the search field while the arrow keys move through the grid', async () => {
		const user = userEvent.setup();
		const onSelect = vi.fn();
		render( <EmojiPicker onSelect={ onSelect } /> );

		await screen.findAllByRole( 'gridcell' );
		const searchbox = screen.getByRole( 'combobox', {
			name: 'Search emoji',
		} );
		await waitFor( () => expect( searchbox ).toHaveFocus() );

		await user.keyboard( '{ArrowDown}' );
		await waitFor( () =>
			expect( searchbox ).toHaveAttribute(
				'aria-activedescendant',
				screen.getByRole( 'gridcell', { name: 'grinning face' } ).id
			)
		);

		await user.keyboard( '{ArrowRight}' );
		await waitFor( () =>
			expect( searchbox ).toHaveAttribute(
				'aria-activedescendant',
				screen.getByRole( 'gridcell', { name: 'beaming face' } ).id
			)
		);
		expect( searchbox ).toHaveFocus();

		await user.keyboard( '{Enter}' );
		expect( onSelect ).toHaveBeenCalledWith( '😁' );
		// Picking does not copy the emoji into the search field.
		expect( searchbox ).toHaveValue( '' );
	} );

	it( 'picks the top search result with Enter', async () => {
		const user = userEvent.setup();
		const onSelect = vi.fn();
		render( <EmojiPicker onSelect={ onSelect } /> );

		await screen.findAllByRole( 'gridcell' );
		await user.type(
			screen.getByRole( 'combobox', { name: 'Search emoji' } ),
			'beaming'
		);
		await waitFor( () =>
			expect( screen.getAllByRole( 'gridcell' ) ).toHaveLength( 1 )
		);
		await user.keyboard( '{Enter}' );
		expect( onSelect ).toHaveBeenCalledWith( '😁' );
	} );

	it( 'leaves synchronous search results unannounced and reports the empty state', async () => {
		const user = userEvent.setup();
		render( <EmojiPicker onSelect={ () => {} } /> );

		// Wait for the dataset to load before searching.
		await screen.findAllByRole( 'gridcell' );

		const searchbox = screen.getByRole( 'combobox', {
			name: 'Search emoji',
		} );

		await user.type( searchbox, 'face' );
		await waitFor( () =>
			expect( screen.getAllByRole( 'gridcell' ) ).toHaveLength( 2 )
		);
		expect(
			screen.queryByText( /found|available/ )
		).not.toBeInTheDocument();

		await user.clear( searchbox );
		await user.type( searchbox, 'zzz' );
		expect( await screen.findByText( 'No emoji found.' ) ).toBeVisible();
		expect( screen.queryAllByRole( 'gridcell' ) ).toHaveLength( 0 );
		// The grid stays mounted while empty, as the Autocomplete expects.
		expect( screen.getByRole( 'grid', { name: 'Emoji' } ) ).toBeVisible();
	} );

	it( 'announces once when a pending load fills the grid, but not for a cached opening', async () => {
		// The dataset cache is module-wide, so use a URL no other test loads.
		dispatch( blockEditorStore ).updateSettings( {
			noteEmojibaseUrl: 'https://example.test/emojibase-pending-load',
		} );
		const { unmount } = render( <EmojiPicker onSelect={ () => {} } /> );

		expect(
			await screen.findByText( '2 emojis available.' )
		).toHaveAttribute( 'data-visually-hidden' );

		unmount();
		render( <EmojiPicker onSelect={ () => {} } /> );

		await screen.findAllByRole( 'gridcell' );
		expect( screen.queryByText( /available/ ) ).not.toBeInTheDocument();
	} );

	it( 'drops the load announcement once the user searches', async () => {
		const user = userEvent.setup();
		dispatch( blockEditorStore ).updateSettings( {
			noteEmojibaseUrl:
				'https://example.test/emojibase-search-after-load',
		} );
		render( <EmojiPicker onSelect={ () => {} } /> );

		await screen.findByText( '2 emojis available.' );

		const searchbox = screen.getByRole( 'combobox', {
			name: 'Search emoji',
		} );
		await user.type( searchbox, 'grinning' );
		await user.clear( searchbox );

		// Restoring the full grid is synchronous, so nothing is announced.
		expect( screen.queryByText( /available/ ) ).not.toBeInTheDocument();
	} );
} );

describe( 'EmojiPicker emoji rules', () => {
	const originalFetch = global.fetch;

	beforeEach( () => {
		dispatch( preferencesStore ).set(
			'core',
			FREQUENT_EMOJIS_PREFERENCE_KEY,
			[]
		);
		global.fetch = vi.fn( ( url: RequestInfo | URL ) =>
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
										hexcode: '1F389',
										emoji: '🎉',
										label: 'party popper',
										group: 6,
									},
									{
										hexcode: '1F595',
										emoji: '🖕',
										label: 'middle finger',
										group: 1,
									},
								]
							: {}
					),
			} as unknown as Response )
		);
	} );

	afterEach( () => {
		global.fetch = originalFetch;
		act( () => {
			dispatch( blockEditorStore ).updateSettings( {
				noteEmojibaseUrl: undefined,
				noteReactionEmojiRules: undefined,
			} );
		} );
	} );

	it( 'drops excluded emoji from the grid', async () => {
		dispatch( blockEditorStore ).updateSettings( {
			// A distinct URL keeps the module-level dataset cache apart.
			noteEmojibaseUrl: 'https://example.test/rules-exclude',
			noteReactionEmojiRules: {
				allowUnlisted: true,
				exclude: [ '1f595' ],
			},
		} );
		render( <EmojiPicker onSelect={ () => {} } /> );

		expect(
			await screen.findByRole( 'gridcell', { name: 'grinning face' } )
		).toBeVisible();
		expect(
			screen.queryByRole( 'gridcell', { name: 'middle finger' } )
		).not.toBeInTheDocument();
	} );

	it( 'offers only the named list when unlisted emoji are not allowed', async () => {
		dispatch( blockEditorStore ).updateSettings( {
			noteEmojibaseUrl: 'https://example.test/rules-named-only',
			noteReactionEmojiRules: { allowUnlisted: false, exclude: [] },
		} );
		render( <EmojiPicker onSelect={ () => {} } /> );

		// 🎉 is in the default named list; it also seeds "Frequently used".
		expect(
			( await screen.findAllByRole( 'gridcell' ) ).map( ( cell ) =>
				cell.getAttribute( 'aria-label' )
			)
		).not.toContain( 'grinning face' );
		expect(
			screen.getAllByRole( 'gridcell', { name: 'party popper' } ).length
		).toBeGreaterThan( 0 );
		expect(
			screen.queryByRole( 'gridcell', { name: 'middle finger' } )
		).not.toBeInTheDocument();
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
