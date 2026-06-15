/**
 * External dependencies
 */
import { readFileSync } from 'node:fs';
import path from 'node:path';

/**
 * Internal dependencies
 */
import {
	EMOJIBASE_LOCALES,
	chunkRows,
	groupEmojis,
	resolveEmojibaseLocale,
	searchEmojis,
} from '../emoji-picker';

describe( 'resolveEmojibaseLocale', () => {
	it( 'falls back to English for empty/invalid input', () => {
		expect( resolveEmojibaseLocale( '' ) ).toBe( 'en' );
		expect( resolveEmojibaseLocale( null ) ).toBe( 'en' );
		expect( resolveEmojibaseLocale( undefined ) ).toBe( 'en' );
		expect( resolveEmojibaseLocale( 42 ) ).toBe( 'en' );
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

describe( 'groupEmojis', () => {
	it( 'returns empty array for empty input', () => {
		expect( groupEmojis( [] ) ).toEqual( [] );
	} );

	it( 'skips entries without a numeric group', () => {
		const data = [
			{ hexcode: '1F44B', emoji: '👋', group: 1 },
			{ hexcode: '1F3FB', emoji: '🏻' }, // Skin-tone component, no group.
		];
		const out = groupEmojis( data );
		expect( out ).toHaveLength( 1 );
		expect( out[ 0 ].emojis ).toHaveLength( 1 );
		expect( out[ 0 ].emojis[ 0 ].hexcode ).toBe( '1F44B' );
	} );

	it( 'buckets emojis by group and sorts groups numerically', () => {
		const data = [
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

describe( 'chunkRows', () => {
	it( 'returns empty array for empty input', () => {
		expect( chunkRows( [] ) ).toEqual( [] );
	} );

	it( 'splits into rows of 8 with a final partial row', () => {
		const input = Array.from( { length: 10 }, ( _, i ) => ( { i } ) );
		const rows = chunkRows( input );
		expect( rows ).toHaveLength( 2 );
		expect( rows[ 0 ] ).toHaveLength( 8 );
		expect( rows[ 1 ] ).toHaveLength( 2 );
	} );

	it( 'uses one row when input fits in a single row', () => {
		const input = Array.from( { length: 5 }, ( _, i ) => ( { i } ) );
		expect( chunkRows( input ) ).toHaveLength( 1 );
	} );
} );

describe( 'searchEmojis', () => {
	const sample = [
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

	it( 'returns an empty array when nothing matches', () => {
		expect( searchEmojis( sample, 'submarine', null ) ).toEqual( [] );
	} );

	it( 'tolerates emoji entries missing labels or tags', () => {
		const odd = [ { hexcode: 'X', emoji: '?' } ];
		expect( () => searchEmojis( odd, 'foo', null ) ).not.toThrow();
		expect( searchEmojis( odd, 'foo', null ) ).toEqual( [] );
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
			[ ...localesArray.matchAll( /'([^']+)'/g ) ].map( ( m ) => m[ 1 ] )
		);

		expect( buildLocales ).toEqual( EMOJIBASE_LOCALES );
	} );
} );
