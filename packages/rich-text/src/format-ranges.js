/** @typedef {import('./types').RichTextValue} RichTextValue */
/** @typedef {import('./types').RichTextFormat} RichTextFormat */
/** @typedef {import('./types').RichTextFormatList} RichTextFormatList */

/**
 * Materialise a sparse `formats` array from a `_formats` Map, for the given
 * text length. Each `[format, [start, end]]` entry in the Map fills positions
 * `[start, end)` of the resulting array with that format reference, preserving
 * the Map insertion order so outer formats appear before inner ones at each
 * position.
 *
 * @param {Map<RichTextFormat, [number, number]>} formatsMap Ranges keyed by format reference.
 * @param {number}                                length     Length of the text.
 *
 * @return {Array<RichTextFormatList>} Sparse array of format lists.
 */
// Cache the materialised `formats` array per Map+length pair so repeated
// reads of `value.formats` return the same array reference. This preserves
// the identity-equality contract callers (and tests) rely on, while keeping
// `_formats` the source of truth. Mutating the Map (e.g. via `mergePair`)
// invalidates the cache by replacing the cache key in the entry.
const materializationCache = new WeakMap();

export function materializeFormats( formatsMap, length ) {
	if ( ! formatsMap ) {
		return Array( length );
	}
	const cached = materializationCache.get( formatsMap );
	if (
		cached &&
		cached.length === length &&
		cached.size === formatsMap.size
	) {
		return cached.array;
	}
	if ( formatsMap.size === 0 ) {
		const empty = Array( length );
		materializationCache.set( formatsMap, {
			array: empty,
			length,
			size: 0,
		} );
		return empty;
	}
	// First pass: per-position arrays built from the Map entries.
	const lists = Array( length );
	for ( const [ format, range ] of formatsMap ) {
		const start = range[ 0 ];
		const end = range[ 1 ];
		for ( let i = start; i < end; i++ ) {
			if ( ! lists[ i ] ) {
				lists[ i ] = [];
			}
			lists[ i ].push( format );
		}
	}
	// Second pass: dedupe adjacent identical arrays so consumers can rely on
	// identity comparisons (this is what the legacy `formats` array did to
	// help `toTree` reuse elements across positions).
	const formats = Array( length );
	for ( let i = 0; i < length; i++ ) {
		const list = lists[ i ];
		if ( ! list ) {
			continue;
		}
		const previous = formats[ i - 1 ];
		if ( previous && sameRefList( previous, list ) ) {
			formats[ i ] = previous;
		} else {
			formats[ i ] = list;
		}
	}
	materializationCache.set( formatsMap, {
		array: formats,
		length,
		size: formatsMap.size,
	} );
	return formats;
}

function sameRefList( a, b ) {
	if ( a.length !== b.length ) {
		return false;
	}
	for ( let i = 0; i < a.length; i++ ) {
		if ( a[ i ] !== b[ i ] ) {
			return false;
		}
	}
	return true;
}

/**
 * Build a `_formats` Map from a sparse `formats` array. Uses a depth-based
 * scan: at each position, compare the source array's per-depth references
 * against the currently-open stack. A divergence at depth N closes every
 * currently-open ref at depth >= N (because their *parent* in the nesting
 * is changing) and opens the new refs from depth N. This correctly splits
 * a reference into multiple ranges when its parent format changes — which
 * is what allows `toTree` to emit e.g. `<em><a>x</a></em><strong><a>y</a></strong>`
 * from `[[em, a], [strong, a]]`.
 *
 * The Map iterates in open order, so outer formats appear before inner ones
 * at each position. Non-contiguous runs of the same reference use prototype-
 * wrapped keys so both survive the Map's key-uniqueness constraint.
 *
 * @param {Array<RichTextFormatList>} formats Sparse array of format lists.
 *
 * @return {Map<RichTextFormat, [number, number]>} Range Map.
 */
export function mapFromFormats( formats ) {
	const map = new Map();
	if ( ! formats || formats.length === 0 ) {
		return map;
	}

	const openStack = []; // [ ref, start, key ] tuples in open order.

	for ( let i = 0; i < formats.length; i++ ) {
		const list = formats[ i ] || [];

		let diverge = 0;
		while (
			diverge < openStack.length &&
			diverge < list.length &&
			openStack[ diverge ][ 0 ] === list[ diverge ]
		) {
			diverge++;
		}

		while ( openStack.length > diverge ) {
			const [ , start, key ] = openStack.pop();
			map.set( key, [ start, i ] );
		}

		for ( let j = diverge; j < list.length; j++ ) {
			const ref = list[ j ];
			const key = map.has( ref ) ? { ...ref } : ref;
			openStack.push( [ ref, i, key ] );
			map.set( key, [ i, formats.length ] );
		}
	}

	while ( openStack.length > 0 ) {
		const [ , start, key ] = openStack.pop();
		map.set( key, [ start, formats.length ] );
	}

	return map;
}

/**
 * Slice a `_formats` Map to keep only ranges that overlap `[startIndex,
 * endIndex)`, clipping each surviving range and rebasing it to the new origin
 * at `startIndex`.
 *
 * @param {Map<RichTextFormat, [number, number]>} formats    Source Map.
 * @param {number}                                startIndex Inclusive start.
 * @param {number}                                [endIndex] Exclusive end.
 *
 * @return {Map<RichTextFormat, [number, number]>} Sliced Map.
 */
export function sliceFormats( formats, startIndex, endIndex = Infinity ) {
	const result = new Map();
	if ( ! formats ) {
		return result;
	}
	for ( const [ format, [ start, end ] ] of formats ) {
		if ( start >= endIndex || end <= startIndex ) {
			continue;
		}
		const newStart = Math.max( start, startIndex ) - startIndex;
		const newEnd = Math.min( end, endIndex ) - startIndex;
		result.set( format, [ newStart, newEnd ] );
	}
	return result;
}

/**
 * Merge `b`'s `_formats` Map into `a`'s `_formats` Map, offsetting each range
 * by `a.text.length` so that `b`'s positions become positions in the
 * concatenated result. Mutates `a`.
 *
 * @param {RichTextValue} a Accumulator value to mutate.
 * @param {RichTextValue} b Value whose ranges should be appended.
 */
export function mergeFormatsInto( a, b ) {
	const offset = a.text.length;
	const bFormats = b._formats || mapFromFormats( b.formats );
	for ( const [ format, [ start, end ] ] of bFormats ) {
		const newStart = start + offset;
		const newEnd = end + offset;
		const existing = a._formats.get( format );
		if ( existing && existing[ 1 ] === newStart ) {
			// Adjacent reuse of the same reference — extend in place so the
			// merged range stays one entry (and one element in `toTree`).
			a._formats.set( format, [ existing[ 0 ], newEnd ] );
		} else if ( existing ) {
			// Same reference reappearing after a gap — use a wrapped key so
			// both ranges survive in the Map, since Map keys are unique.
			a._formats.set( { ...format }, [ newStart, newEnd ] );
		} else {
			a._formats.set( format, [ newStart, newEnd ] );
		}
	}
}

/**
 * Read all format references that cover the given index (or the half-open
 * range `[startIndex, endIndex)` if both are provided). Used by
 * `getActiveFormats` and operations that need to inspect formats at a
 * position without materialising the sparse `formats` array.
 *
 * @param {Map<RichTextFormat, [number, number]>} formatsMap Range Map.
 * @param {number}                                startIndex Inclusive start.
 * @param {number}                                [endIndex] Exclusive end.
 *
 * @return {RichTextFormatList} Format references covering the position(s).
 */
export function getFormatsAtSelection( formatsMap, startIndex, endIndex ) {
	const result = [];
	if ( ! formatsMap ) {
		return result;
	}
	const lookupEnd = endIndex === undefined ? startIndex : endIndex - 1;
	for ( const [ format, [ start, end ] ] of formatsMap ) {
		if ( start <= startIndex && end > lookupEnd ) {
			result.push( format );
		}
	}
	return result;
}

/**
 * Install the deprecated `formats` accessor on `value`. The getter
 * materialises a sparse array from `value._formats` (and logs a deprecation
 * once per session); the setter rebuilds `value._formats` from the assigned
 * array. The accessor is enumerable so it appears in spread and
 * `Object.keys`; `_formats` itself is stored non-enumerably so it doesn't
 * leak into deep-equality assertions or spread.
 *
 * Idempotent: if `value` already has a `formats` getter, returns as-is. If
 * `value` has a regular `formats` data property (e.g. a plain object passed
 * by external code or test fixtures), the value is promoted: the array is
 * converted to `_formats` and the getter takes over.
 *
 * @param {Object} value Rich text value to wrap.
 *
 * @return {Object} The same value.
 */
export function defineFormatsAccessor( value ) {
	const descriptor = Object.getOwnPropertyDescriptor( value, 'formats' );
	if ( descriptor && descriptor.get ) {
		return value;
	}

	// Pick up whatever `_formats` Map is currently on `value` (either set
	// explicitly by an operation, or derived from a passed-in `formats`
	// array), then store it non-enumerably so it stays out of `toEqual` and
	// spread.
	let formatsMap;
	if ( value._formats instanceof Map ) {
		formatsMap = value._formats;
	} else if ( descriptor ) {
		formatsMap = mapFromFormats( descriptor.value );
	} else {
		formatsMap = new Map();
	}
	if ( descriptor ) {
		delete value.formats;
	}
	delete value._formats;
	Object.defineProperty( value, '_formats', {
		value: formatsMap,
		writable: true,
		enumerable: false,
		configurable: true,
	} );

	Object.defineProperty( value, 'formats', {
		get() {
			return materializeFormats( this._formats, this.text.length );
		},
		set( newFormats ) {
			this._formats = mapFromFormats( newFormats );
		},
		enumerable: true,
		configurable: true,
	} );

	return value;
}

/**
 * Convenience constructor that returns an empty rich text value with the
 * canonical shape (`_formats` Map, deprecated `formats` accessor,
 * `replacements`, `text`).
 *
 * @return {RichTextValue} An empty rich text value.
 */
export function createValueShell() {
	return defineFormatsAccessor( {
		replacements: [],
		text: '',
	} );
}
