import { describe, expect, it } from 'vitest';
import {
	REACTION_EMOJIS,
	getNamedHexKeys,
	isReactionEmojiAllowed,
	parseReactionEmojiRules,
	parseReactionEmojis,
} from '../reaction-emojis';

describe( 'parseReactionEmojis', () => {
	it( 'reads the `hex_key` the server sends', () => {
		expect(
			parseReactionEmojis( [
				{ hex_key: '1f984', label: 'Unicorn' },
				{ hex_key: '2764', label: 'Heart' },
			] )
		).toEqual( [
			{ hexKey: '1f984', label: 'Unicorn' },
			{ hexKey: '2764', label: 'Heart' },
		] );
	} );

	it( 'drops malformed entries', () => {
		expect(
			parseReactionEmojis( [
				null,
				{ label: 'No key' },
				{ hex_key: '1f984' },
				{ hex_key: 'not hex', label: 'Broken' },
				{ hex_key: '1F3C6', label: 'Trophy' },
			] )
		).toEqual( [ { hexKey: '1f3c6', label: 'Trophy' } ] );
	} );

	it( 'keeps an emptied list empty', () => {
		expect( parseReactionEmojis( [] ) ).toEqual( [] );
	} );

	it( 'falls back to the curated set when the setting is absent', () => {
		expect( parseReactionEmojis( undefined ) ).toHaveLength(
			REACTION_EMOJIS.length
		);
	} );
} );

describe( 'isReactionEmojiAllowed', () => {
	const named = getNamedHexKeys( [ { hexKey: '2764', label: 'Heart' } ] );

	it( 'rejects an excluded emoji and its skin-tone variants', () => {
		const rules = parseReactionEmojiRules( { exclude: [ '1F44E' ] } );
		expect( isReactionEmojiAllowed( '1f44e', rules, named ) ).toBe( false );
		expect( isReactionEmojiAllowed( '1f44e-1f3fd', rules, named ) ).toBe(
			false
		);
		expect( isReactionEmojiAllowed( '1f44d', rules, named ) ).toBe( true );
	} );

	it( 'accepts only named emoji when unlisted ones are off', () => {
		const rules = parseReactionEmojiRules( { allowUnlisted: false } );
		expect( isReactionEmojiAllowed( '2764', rules, named ) ).toBe( true );
		expect( isReactionEmojiAllowed( '1f44d', rules, named ) ).toBe( false );
	} );

	it( 'lets a named emoji win over an exclusion', () => {
		const rules = parseReactionEmojiRules( { exclude: [ '2764' ] } );
		expect( isReactionEmojiAllowed( '2764', rules, named ) ).toBe( true );
	} );
} );
