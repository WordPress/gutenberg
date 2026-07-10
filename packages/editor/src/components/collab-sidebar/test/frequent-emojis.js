/**
 * Internal dependencies
 */
import {
	DEFAULT_FREQUENT_EMOJI_KEYS,
	MAX_FREQUENT_EMOJIS,
	getFrequentEmojiKeys,
	recordEmojiUse,
} from '../frequent-emojis';

describe( 'DEFAULT_FREQUENT_EMOJI_KEYS', () => {
	it( 'maps the curated reaction set to normalized hex keys', () => {
		// ❤️ 🎉 😄 👀 🚀 with variation selectors stripped.
		expect( DEFAULT_FREQUENT_EMOJI_KEYS ).toEqual( [
			'2764',
			'1f389',
			'1f604',
			'1f440',
			'1f680',
		] );
	} );
} );

describe( 'recordEmojiUse', () => {
	it( 'adds a first use with count 1', () => {
		expect( recordEmojiUse( [], '1f44d' ) ).toEqual( [
			{ key: '1f44d', count: 1 },
		] );
	} );

	it( 'tolerates missing or malformed stored values', () => {
		expect( recordEmojiUse( undefined, '1f44d' ) ).toEqual( [
			{ key: '1f44d', count: 1 },
		] );
		expect( recordEmojiUse( 'corrupt', '1f44d' ) ).toEqual( [
			{ key: '1f44d', count: 1 },
		] );
		expect(
			recordEmojiUse(
				[ null, { key: 42 }, { key: 'ok', count: 'NaN' } ],
				'1f44d'
			)
		).toEqual( [ { key: '1f44d', count: 1 } ] );
	} );

	it( 'returns the sanitized list unchanged when the key is empty', () => {
		const entries = [ { key: '2764', count: 3 } ];
		expect( recordEmojiUse( entries, '' ) ).toEqual( entries );
		expect( recordEmojiUse( entries, undefined ) ).toEqual( entries );
	} );

	it( 'increments an existing entry and reorders by count', () => {
		const entries = [
			{ key: '2764', count: 2 },
			{ key: '1f44d', count: 2 },
		];
		expect( recordEmojiUse( entries, '1f44d' ) ).toEqual( [
			{ key: '1f44d', count: 3 },
			{ key: '2764', count: 2 },
		] );
	} );

	it( 'ranks the just-used emoji first among equal counts', () => {
		const entries = [
			{ key: '2764', count: 1 },
			{ key: '1f389', count: 1 },
		];
		expect( recordEmojiUse( entries, '1f680' ) ).toEqual( [
			{ key: '1f680', count: 1 },
			{ key: '2764', count: 1 },
			{ key: '1f389', count: 1 },
		] );
	} );

	it( 'keeps more frequent entries ahead of a new pick', () => {
		const entries = [
			{ key: '2764', count: 5 },
			{ key: '1f389', count: 2 },
		];
		expect( recordEmojiUse( entries, '1f680' ) ).toEqual( [
			{ key: '2764', count: 5 },
			{ key: '1f389', count: 2 },
			{ key: '1f680', count: 1 },
		] );
	} );

	it( 'discards the least used entry once the cap is reached', () => {
		const entries = Array.from(
			{ length: MAX_FREQUENT_EMOJIS },
			( _, i ) => ( {
				key: `key-${ i }`,
				count: MAX_FREQUENT_EMOJIS - i,
			} )
		);
		const next = recordEmojiUse( entries, '1f680' );
		expect( next ).toHaveLength( MAX_FREQUENT_EMOJIS );
		// The lowest-count entry was evicted…
		expect(
			next.find( ( e ) => e.key === `key-${ MAX_FREQUENT_EMOJIS - 1 }` )
		).toBeUndefined();
		// …and the new pick survives at the tail, even though it has the
		// lowest count.
		expect( next[ next.length - 1 ] ).toEqual( {
			key: '1f680',
			count: 1,
		} );
	} );

	it( 'does not evict anything when bumping an existing entry at the cap', () => {
		const entries = Array.from(
			{ length: MAX_FREQUENT_EMOJIS },
			( _, i ) => ( { key: `key-${ i }`, count: 2 } )
		);
		const next = recordEmojiUse( entries, 'key-7' );
		expect( next ).toHaveLength( MAX_FREQUENT_EMOJIS );
		expect( next[ 0 ] ).toEqual( { key: 'key-7', count: 3 } );
	} );
} );

describe( 'getFrequentEmojiKeys', () => {
	it( 'returns the curated defaults when nothing is stored', () => {
		expect( getFrequentEmojiKeys( undefined ) ).toEqual(
			DEFAULT_FREQUENT_EMOJI_KEYS
		);
		expect( getFrequentEmojiKeys( [] ) ).toEqual(
			DEFAULT_FREQUENT_EMOJI_KEYS
		);
	} );

	it( 'lists recorded usage first, then unseen defaults', () => {
		const keys = getFrequentEmojiKeys( [ { key: '1f44d', count: 2 } ] );
		expect( keys ).toEqual( [ '1f44d', ...DEFAULT_FREQUENT_EMOJI_KEYS ] );
	} );

	it( 'does not repeat a default that already has recorded usage', () => {
		const keys = getFrequentEmojiKeys( [ { key: '2764', count: 2 } ] );
		expect( keys[ 0 ] ).toBe( '2764' );
		expect( keys.filter( ( key ) => key === '2764' ) ).toHaveLength( 1 );
	} );

	it( 'caps the list at the maximum', () => {
		const entries = Array.from(
			{ length: MAX_FREQUENT_EMOJIS },
			( _, i ) => ( {
				key: `key-${ i }`,
				count: 1,
			} )
		);
		const keys = getFrequentEmojiKeys( entries );
		expect( keys ).toHaveLength( MAX_FREQUENT_EMOJIS );
		// The defaults no longer fit once real usage fills the list.
		expect( keys ).not.toContain( '2764' );
	} );
} );
