import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { EmojibaseEntry } from '../emojibase-data';

const ZERO_WIDTH_SPACE = '\u{200B}';
const ZERO_WIDTH_JOINER = '\u{200D}';

function toEntry( hexcode: string, version: number ): EmojibaseEntry {
	const points = hexcode.split( '-' ).map( ( hex ) => parseInt( hex, 16 ) );
	return { hexcode, emoji: String.fromCodePoint( ...points ), version };
}

const GRINNING = toEntry( '1F600', 1 );
const MELTING = toEntry( '1FAE0', 14 );
const SALUTING = toEntry( '1FAE1', 14 );
const FACE_IN_CLOUDS = toEntry( '1F636-200D-1F32B-FE0F', 13.1 );
const FRANCE = toEntry( '1F1EB-1F1F7', 2 );
const ENGLAND = toEntry( '1F3F4-E0067-E0062-E0065-E006E-E0067-E007F', 5 );
const DATASET: EmojibaseEntry[] = [
	GRINNING,
	MELTING,
	SALUTING,
	FACE_IN_CLOUDS,
	FRANCE,
	ENGLAND,
];

/**
 * Stand in for a system whose font lacks the given emoji: a lone emoji it
 * lacks is drawn in the fill color, like a missing glyph box, and a sequence
 * it lacks is drawn as its parts.
 *
 * @param unsupported Emoji the system can't draw.
 */
function stubSystemFont( unsupported: string[] ) {
	class FakeCanvas {
		width = 2;
		height = 1;
		getContext() {
			let drawn = '';
			return {
				canvas: this,
				fillStyle: '',
				clearRect() {},
				fillText( text: string ) {
					const parts = text
						.replaceAll( ZERO_WIDTH_SPACE, '' )
						.replaceAll( ZERO_WIDTH_JOINER, '' );
					const isMissing = unsupported.some(
						( emoji ) =>
							parts === emoji.replaceAll( ZERO_WIDTH_JOINER, '' )
					);
					if ( Array.from( text ).length === 1 ) {
						drawn = isMissing ? `box:${ this.fillStyle }` : text;
					} else if (
						isMissing ||
						text.includes( ZERO_WIDTH_SPACE )
					) {
						drawn = `parts:${ parts }`;
					} else {
						drawn = text;
					}
				},
				getImageData() {
					let hash = 7;
					for ( const char of drawn ) {
						hash =
							( hash * 31 + char.codePointAt( 0 )! ) % 0xffffff;
					}
					return {
						data: new Uint8ClampedArray(
							new Uint32Array( [ hash, hash ] ).buffer
						),
					};
				},
			};
		}
	}
	vi.stubGlobal( 'OffscreenCanvas', FakeCanvas );
}

async function filterSupportedEmojis( emojis: EmojibaseEntry[] ) {
	const module = await import( '../emoji-support' );
	return module.filterSupportedEmojis( emojis );
}

describe( 'filterSupportedEmojis', () => {
	beforeEach( () => {
		// Support is remembered per module instance.
		vi.resetModules();
	} );

	afterEach( () => {
		vi.unstubAllGlobals();
	} );

	it( 'keeps every emoji the system can draw', async () => {
		stubSystemFont( [] );

		expect( await filterSupportedEmojis( DATASET ) ).toEqual( DATASET );
	} );

	it( 'hides every emoji of a version the system cannot draw', async () => {
		stubSystemFont( [ MELTING.emoji ] );

		expect( await filterSupportedEmojis( DATASET ) ).toEqual( [
			GRINNING,
			FACE_IN_CLOUDS,
			FRANCE,
			ENGLAND,
		] );
	} );

	it( 'hides a version of joined emoji the system draws as separate emoji', async () => {
		stubSystemFont( [ FACE_IN_CLOUDS.emoji ] );

		expect( await filterSupportedEmojis( DATASET ) ).toEqual( [
			GRINNING,
			MELTING,
			SALUTING,
			FRANCE,
			ENGLAND,
		] );
	} );

	it( 'hides country flags the system draws as letters', async () => {
		stubSystemFont( [ FRANCE.emoji ] );

		expect( await filterSupportedEmojis( DATASET ) ).toEqual( [
			GRINNING,
			MELTING,
			SALUTING,
			FACE_IN_CLOUDS,
			ENGLAND,
		] );
	} );

	it( 'hides subdivision flags the system draws as a plain flag', async () => {
		stubSystemFont( [ ENGLAND.emoji ] );

		expect( await filterSupportedEmojis( DATASET ) ).toEqual( [
			GRINNING,
			MELTING,
			SALUTING,
			FACE_IN_CLOUDS,
			FRANCE,
		] );
	} );

	it( 'keeps every emoji when the system has no color emoji font', async () => {
		stubSystemFont( DATASET.map( ( entry ) => entry.emoji ) );

		expect( await filterSupportedEmojis( DATASET ) ).toEqual( DATASET );
	} );

	it( 'keeps every emoji when there is no canvas to test with', async () => {
		expect( await filterSupportedEmojis( DATASET ) ).toEqual( DATASET );
	} );
} );
