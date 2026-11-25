import { describe, expect, it, vi } from 'vitest';
import {
	getReactionEmojisFromSetting,
	hexKeyToEmoji,
} from '../reaction-emojis';

vi.hoisted( () => globalThis.wpVitest.mockMatchMedia() );

describe( 'hexKeyToEmoji', () => {
	it( 'adds U+FE0F back to a code point that defaults to text', () => {
		expect( hexKeyToEmoji( '2764' ) ).toBe( '\u{2764}\u{FE0F}' );
	} );

	it( 'leaves a code point that defaults to emoji as is', () => {
		expect( hexKeyToEmoji( '1f984' ) ).toBe( '\u{1F984}' );
	} );

	it.each( [
		[ 'ZWJ sequence', '1f468-200d-1f4bb', '\u{1F468}\u{200D}\u{1F4BB}' ],
		[ 'keycap', '0023-20e3', '#\u{FE0F}\u{20E3}' ],
		[
			'rainbow flag',
			'1f3f3-200d-1f308',
			'\u{1F3F3}\u{FE0F}\u{200D}\u{1F308}',
		],
		[
			'heart on fire',
			'2764-200d-1f525',
			'\u{2764}\u{FE0F}\u{200D}\u{1F525}',
		],
		[ 'skin tone', '261d-1f3fd', '\u{261D}\u{1F3FD}' ],
	] )( 'fully qualifies a %s', ( _name, hexKey, emoji ) => {
		expect( hexKeyToEmoji( hexKey ) ).toBe( emoji );
	} );

	it.each( [ '', '27', '1F984', '110000', 'zzzz', '2764-' ] )(
		'rejects the malformed key %j',
		( hexKey ) => {
			expect( hexKeyToEmoji( hexKey ) ).toBe( '' );
		}
	);
} );

describe( 'getReactionEmojisFromSetting', () => {
	it( 'offers no emoji when the setting is missing', () => {
		expect( getReactionEmojisFromSetting( undefined ) ).toEqual( [] );
	} );

	it( 'keeps an empty list, which turns adding reactions off', () => {
		expect( getReactionEmojisFromSetting( [] ) ).toEqual( [] );
	} );

	it( 'builds the emoji from each hex key and drops malformed entries', () => {
		const setting = [
			{ hex_key: '1f984', label: 'unicorn' },
			{ hex_key: 'nope', label: 'broken' },
			{ hex_key: '1f44d' },
			null,
			{ hex_key: '1f680', label: 'rocket' },
		];

		expect( getReactionEmojisFromSetting( setting ) ).toEqual( [
			{
				emoji: '🦄',
				hexKey: '1f984',
				label: 'unicorn',
				sentenceLabel: 'unicorn',
			},
			// A default emoji keeps the editor's own labels.
			{
				emoji: '🚀',
				hexKey: '1f680',
				label: 'Rocket',
				sentenceLabel: 'rocket',
			},
		] );
	} );

	it( 'returns the same list for the same setting', () => {
		const setting = [ { hex_key: '1f984', label: 'unicorn' } ];

		expect( getReactionEmojisFromSetting( setting ) ).toBe(
			getReactionEmojisFromSetting( setting )
		);
	} );
} );
