import { describe, expect, it, vi } from 'vitest';
import {
	getReactionEmojisFromSetting,
	hexKeyToEmoji,
} from '../reaction-emojis';

vi.hoisted( () => globalThis.wpVitest.mockMatchMedia() );

describe( 'hexKeyToEmoji', () => {
	it( 'adds U+FE0F back to a single code point', () => {
		expect( hexKeyToEmoji( '2764' ) ).toBe( '❤️' );
		expect( hexKeyToEmoji( '1f984' ) ).toBe( '🦄️' );
	} );

	it( 'joins a sequence as is', () => {
		expect( hexKeyToEmoji( '1f468-200d-1f4bb' ) ).toBe( '👨‍💻' );
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
			{ hexKey: '1f984', label: 'unicorn' },
			{ hexKey: 'nope', label: 'broken' },
			{ hexKey: '1f44d' },
			null,
			{ hexKey: '1f680', label: 'rocket' },
		];

		expect( getReactionEmojisFromSetting( setting ) ).toEqual( [
			{ emoji: '🦄️', hexKey: '1f984', label: 'unicorn' },
			{ emoji: '🚀️', hexKey: '1f680', label: 'rocket' },
		] );
	} );

	it( 'returns the same list for the same setting', () => {
		const setting = [ { hexKey: '1f984', label: 'unicorn' } ];

		expect( getReactionEmojisFromSetting( setting ) ).toBe(
			getReactionEmojisFromSetting( setting )
		);
	} );
} );
