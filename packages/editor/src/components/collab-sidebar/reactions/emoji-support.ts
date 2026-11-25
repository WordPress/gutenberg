import type { EmojibaseEntry } from './emojibase-data';

/*
 * The system font draws the emoji and can be older than the dataset. One
 * emoji per Emoji version, plus one flag of each kind, is test-drawn on a
 * canvas so the picker can hide what would show as an empty box.
 */

type Context = OffscreenCanvasRenderingContext2D;

const ZERO_WIDTH_JOINER = '\u{200D}';
const ZERO_WIDTH_SPACE = '\u{200B}';

// In every color emoji font, so when it fails the results can't be trusted.
const BASELINE = '\u{1F600}';
const BASELINE_KEY = 'baseline';

// The system font doesn't change within a session.
const results = new Map< string, boolean >();
let context: Context | null | undefined;

function getContext(): Context | null {
	if ( context !== undefined ) {
		return context;
	}
	context = null;
	if ( typeof OffscreenCanvas === 'undefined' ) {
		return context;
	}
	try {
		context = new OffscreenCanvas( 160, 40 ).getContext( '2d', {
			willReadFrequently: true,
		} );
	} catch {
		return context;
	}
	if ( context ) {
		context.textBaseline = 'top';
		context.font = '32px sans-serif';
	}
	return context;
}

function draw( ctx: Context, text: string, color = '#000' ): Uint32Array {
	const { width, height } = ctx.canvas;
	ctx.clearRect( 0, 0, width, height );
	ctx.fillStyle = color;
	ctx.fillText( text, 0, 0 );
	return new Uint32Array(
		ctx.getImageData( 0, 0, width, height ).data.buffer
	);
}

function isSameDrawing( a: Uint32Array, b: Uint32Array ): boolean {
	return a.every( ( pixel, index ) => pixel === b[ index ] );
}

function canDraw( ctx: Context, emoji: string ): boolean {
	const points = Array.from( emoji );
	if ( points.length === 1 ) {
		// A missing glyph is blank or takes the fill color; an emoji ignores it.
		const black = draw( ctx, emoji, '#000' );
		return (
			black.some( Boolean ) &&
			isSameDrawing( black, draw( ctx, emoji, '#fff' ) )
		);
	}
	/*
	 * An unsupported sequence is drawn as its separate parts, which is also
	 * how it is drawn with zero-width spaces between them.
	 */
	const parts = emoji.includes( ZERO_WIDTH_JOINER )
		? emoji.split( ZERO_WIDTH_JOINER )
		: points;
	return ! isSameDrawing(
		draw( ctx, emoji ),
		draw( ctx, parts.join( ZERO_WIDTH_SPACE ) )
	);
}

function isRegionalIndicator( point: number ): boolean {
	return point >= 0x1f1e6 && point <= 0x1f1ff;
}

function isTag( point: number ): boolean {
	return point >= 0xe0020 && point <= 0xe007f;
}

/**
 * The group of emoji a system supports or lacks together: country flags and
 * subdivision flags each on their own, and everything else by the Emoji
 * version that introduced it.
 *
 * @param points  The emoji's code points.
 * @param version The Emoji version that introduced it.
 * @return The group's key, or null when the emoji can't be placed in one.
 */
function getSupportKey(
	points: number[],
	version: number | undefined
): string | null {
	if ( points.length === 2 && points.every( isRegionalIndicator ) ) {
		return 'country-flag';
	}
	if ( points.some( isTag ) ) {
		return 'subdivision-flag';
	}
	return typeof version === 'number' ? `version-${ version }` : null;
}

function getCodePoints( entry: EmojibaseEntry ): number[] {
	return entry.hexcode.split( '-' ).map( ( hex ) => parseInt( hex, 16 ) );
}

/**
 * Drop the emoji the system can't draw. Returns the list untouched when
 * support can't be detected, such as without a canvas or a color emoji font.
 *
 * @param emojis Emoji records.
 * @return The records the system can draw.
 */
export function filterSupportedEmojis(
	emojis: EmojibaseEntry[]
): EmojibaseEntry[] {
	const ctx = getContext();
	if ( ! ctx ) {
		return emojis;
	}
	if ( ! results.has( BASELINE_KEY ) ) {
		results.set( BASELINE_KEY, canDraw( ctx, BASELINE ) );
	}
	if ( ! results.get( BASELINE_KEY ) ) {
		return emojis;
	}

	const keys = emojis.map( ( entry ) =>
		getSupportKey( getCodePoints( entry ), entry.version )
	);

	/*
	 * A lone code point with no variation selector is always a color glyph,
	 * so it is the surest test of a version. Some versions only added joined
	 * sequences, so one of those is the fallback.
	 */
	const probes = new Map< string, string >();
	const fallbackProbes = new Map< string, string >();
	emojis.forEach( ( entry, index ) => {
		const key = keys[ index ];
		if ( ! key || results.has( key ) || probes.has( key ) ) {
			return;
		}
		if (
			Array.from( entry.emoji ).length === 1 ||
			! key.startsWith( 'version-' )
		) {
			probes.set( key, entry.emoji );
		} else if (
			entry.emoji.includes( ZERO_WIDTH_JOINER ) &&
			! fallbackProbes.has( key )
		) {
			fallbackProbes.set( key, entry.emoji );
		}
	} );
	for ( const [ key, emoji ] of new Map( [
		...fallbackProbes,
		...probes,
	] ) ) {
		results.set( key, canDraw( ctx, emoji ) );
	}

	return emojis.filter( ( _entry, index ) => {
		const key = keys[ index ];
		return ! key || results.get( key ) !== false;
	} );
}
