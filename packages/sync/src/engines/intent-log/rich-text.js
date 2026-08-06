/**
 * Rich-text codec: inline HTML ↔ { text, formats } fields.
 *
 * THE text coordinate space contract: engine text intents carry offsets in
 * UTF-16 code units over a field's PLAIN text. This codec converts a block's
 * inline HTML (the editor's attribute form) into that plain text plus format
 * spans, and back. Both the client bridge and the server's genesis /
 * materialization run it — the PHP twin (WP_Intent_Log_Rich_Text) must match
 * byte-for-byte, and `test-vectors/rich-text.json` freezes the contract.
 *
 * Design rules:
 * - Formatting elements (em, strong, a, code, …) become spans
 *   { start, end, format } where `format` encodes the tag and its
 *   attributes: `tag` alone, or `tag|{"attr":"value",…}` with keys sorted.
 *   The engine treats format strings as opaque; spans shift with text edits.
 * - `<br>` becomes a newline character.
 * - Any other element (img, iframe, unknown tags, comments) becomes ONE
 *   object replacement character (U+FFFC) whose span format carries the raw
 *   source (`obj|{"html":"…"}`), re-emitted verbatim on serialization —
 *   unknown markup is never lost and never diffed into.
 * - Entities: a fixed named subset (amp, lt, gt, quot, apos, nbsp) plus
 *   numeric references. Anything else makes the input UNSUPPORTED.
 * - Unsupported or malformed input degrades to a WHOLE-FIELD object: the
 *   field is one U+FFFC carrying the full source. Round-trip exact, opaque
 *   to text merging — safe, never wrong.
 *
 * See SPEC.md ("Rich-text codec").
 */

const OBJECT_CHAR = '\ufffc';

/**
 * Inline formatting elements that map to spans. Everything else is opaque.
 */
const FORMAT_TAGS = new Set( [
	'a',
	'abbr',
	'b',
	'bdo',
	'cite',
	'code',
	'data',
	'del',
	'dfn',
	'em',
	'i',
	'ins',
	'kbd',
	'mark',
	'q',
	's',
	'samp',
	'small',
	'span',
	'strong',
	'sub',
	'sup',
	'time',
	'u',
	'var',
] );

/**
 * Elements that never have content or a closing tag.
 */
const VOID_TAGS = new Set( [
	'area',
	'base',
	'col',
	'embed',
	'hr',
	'img',
	'input',
	'link',
	'meta',
	'source',
	'track',
	'wbr',
] );

const NAMED_ENTITIES = {
	amp: '&',
	lt: '<',
	gt: '>',
	quot: '"',
	apos: "'",
	nbsp: '\u00a0',
};

class UnsupportedHtml extends Error {}

/**
 * Decodes the supported entity subset. Throws UnsupportedHtml on anything
 * else so the caller can fall back to the whole-field object.
 *
 * @param {string} raw Raw text content.
 * @return {string} Decoded text.
 */
function decodeEntities( raw ) {
	return raw.replace( /&([a-zA-Z]+|#x?[0-9a-fA-F]+);?/g, ( match, body ) => {
		if ( ! match.endsWith( ';' ) ) {
			// A bare ampersand run without a terminating semicolon is not an
			// entity; keep it verbatim.
			return match;
		}
		if ( body.startsWith( '#' ) ) {
			const code =
				'x' === body[ 1 ] || 'X' === body[ 1 ]
					? parseInt( body.slice( 2 ), 16 )
					: parseInt( body.slice( 1 ), 10 );
			if (
				! Number.isFinite( code ) ||
				code <= 0 ||
				code > 0x10ffff ||
				// Surrogate halves: PHP cannot produce lone surrogates, so
				// both twins treat them as unsupported (identical fallback).
				( code >= 0xd800 && code <= 0xdfff )
			) {
				throw new UnsupportedHtml( `bad numeric entity ${ match }` );
			}
			return String.fromCodePoint( code );
		}
		const named = NAMED_ENTITIES[ body.toLowerCase() ];
		if ( undefined === named ) {
			throw new UnsupportedHtml( `unsupported entity ${ match }` );
		}
		return named;
	} );
}

/**
 * Encodes text for HTML output (the inverse of the decode subset; only the
 * characters that MUST be escaped are).
 *
 * @param {string} text Plain text.
 * @return {string} HTML-safe text.
 */
function encodeText( text ) {
	return text
		.replace( /&/g, '&amp;' )
		.replace( /</g, '&lt;' )
		.replace( />/g, '&gt;' )
		.replace( /\u00a0/g, '&nbsp;' );
}

/**
 * Encodes an attribute value.
 *
 * @param {string} value Attribute value.
 * @return {string} HTML-safe attribute value.
 */
function encodeAttribute( value ) {
	return encodeText( value ).replace( /"/g, '&quot;' );
}

/**
 * The canonical span format id for a tag + attributes.
 *
 * @param {string} tag   Lowercase tag name.
 * @param {Object} attrs Attribute map.
 * @return {string} Format id.
 */
export function encodeFormat( tag, attrs ) {
	const keys = Object.keys( attrs ).sort();
	if ( 0 === keys.length ) {
		return tag;
	}
	const sorted = {};
	for ( const key of keys ) {
		sorted[ key ] = attrs[ key ];
	}
	return `${ tag }|${ JSON.stringify( sorted ) }`;
}

/**
 * Decodes a span format id back to tag + attributes. Returns null for the
 * object format (raw HTML pass-through).
 *
 * @param {string} format Format id.
 * @return {Object|null} { tag, attrs }, or null for object formats.
 */
export function decodeFormat( format ) {
	const pipe = format.indexOf( '|' );
	if ( -1 === pipe ) {
		return { tag: format, attrs: {} };
	}
	const tag = format.slice( 0, pipe );
	if ( 'obj' === tag ) {
		return null;
	}
	return { tag, attrs: JSON.parse( format.slice( pipe + 1 ) ) };
}

const TAG_RE =
	/^<(\/?)([a-zA-Z][a-zA-Z0-9-]*)((?:\s+[a-zA-Z_:][-a-zA-Z0-9_:.]*(?:\s*=\s*(?:"[^"]*"|'[^']*'|[^\s"'>]+))?)*)\s*(\/?)>/;
const ATTR_RE =
	/([a-zA-Z_:][-a-zA-Z0-9_:.]*)(?:\s*=\s*("[^"]*"|'[^']*'|[^\s"'>]+))?/g;

/**
 * Parses a tag's attribute string.
 *
 * @param {string} raw Raw attribute source.
 * @return {Object} Attribute map (values entity-decoded).
 */
function parseAttributes( raw ) {
	const attrs = {};
	for ( const match of raw.matchAll( ATTR_RE ) ) {
		const name = match[ 1 ].toLowerCase();
		let value = match[ 2 ] ?? '';
		if (
			( value.startsWith( '"' ) && value.endsWith( '"' ) ) ||
			( value.startsWith( "'" ) && value.endsWith( "'" ) )
		) {
			value = value.slice( 1, -1 );
		}
		attrs[ name ] = decodeEntities( value );
	}
	return attrs;
}

/**
 * Captures a balanced opaque element (or void/self-closing tag) starting at
 * `index`, returning its full source and the index after it.
 *
 * @param {string}  html       Full input.
 * @param {number}  index      Index of the opening '<'.
 * @param {string}  tag        Lowercase tag name.
 * @param {number}  after      Index after the opening tag.
 * @param {boolean} selfClosed Whether the opening tag self-closed.
 * @return {Object} { source, next }.
 */
function captureOpaque( html, index, tag, after, selfClosed ) {
	if ( selfClosed || VOID_TAGS.has( tag ) ) {
		return { source: html.slice( index, after ), next: after };
	}
	let depth = 1;
	let cursor = after;
	while ( depth > 0 ) {
		const nextTag = html.indexOf( '<', cursor );
		if ( -1 === nextTag ) {
			throw new UnsupportedHtml( `unclosed <${ tag }>` );
		}
		const match = TAG_RE.exec( html.slice( nextTag ) );
		if ( ! match ) {
			cursor = nextTag + 1;
			continue;
		}
		const [ full, closing, name, , selfClose ] = match;
		cursor = nextTag + full.length;
		if ( name.toLowerCase() !== tag ) {
			continue;
		}
		if ( closing ) {
			depth--;
		} else if ( ! selfClose && ! VOID_TAGS.has( tag ) ) {
			depth++;
		}
	}
	return { source: html.slice( index, cursor ), next: cursor };
}

/**
 * Parses inline HTML into a field. Never throws: unsupported or malformed
 * input degrades to a whole-field object (see module docs).
 *
 * @param {string} html Inline HTML (a block's attribute-form content).
 * @return {Object} { text, formats } field.
 */
export function htmlToField( html ) {
	try {
		return parseStrict( html );
	} catch ( error ) {
		if ( error instanceof UnsupportedHtml ) {
			if ( '' === html ) {
				return { text: '', formats: [] };
			}
			return {
				text: OBJECT_CHAR,
				formats: [
					{
						start: 0,
						end: 1,
						format: `obj|${ JSON.stringify( { html } ) }`,
					},
				],
			};
		}
		throw error;
	}
}

function parseStrict( html ) {
	let text = '';
	const formats = [];
	const stack = []; // { tag, attrs, start }
	let index = 0;

	while ( index < html.length ) {
		const lt = html.indexOf( '<', index );
		if ( -1 === lt ) {
			text += decodeEntities( html.slice( index ) );
			break;
		}
		if ( lt > index ) {
			text += decodeEntities( html.slice( index, lt ) );
		}
		if ( html.startsWith( '<!--', lt ) ) {
			const end = html.indexOf( '-->', lt );
			if ( -1 === end ) {
				throw new UnsupportedHtml( 'unclosed comment' );
			}
			const source = html.slice( lt, end + 3 );
			formats.push( {
				start: text.length,
				end: text.length + 1,
				format: `obj|${ JSON.stringify( { html: source } ) }`,
			} );
			text += OBJECT_CHAR;
			index = end + 3;
			continue;
		}
		const match = TAG_RE.exec( html.slice( lt ) );
		if ( ! match ) {
			throw new UnsupportedHtml( `stray < at ${ lt }` );
		}
		const [ full, closing, rawName, rawAttrs, selfClose ] = match;
		const tag = rawName.toLowerCase();
		const afterTag = lt + full.length;

		if ( closing ) {
			const top = stack.pop();
			if ( ! top || top.tag !== tag ) {
				throw new UnsupportedHtml( `mismatched </${ tag }>` );
			}
			if ( top.start < text.length ) {
				formats.push( {
					start: top.start,
					end: text.length,
					format: encodeFormat( tag, top.attrs ),
				} );
			}
			index = afterTag;
			continue;
		}

		if ( 'br' === tag ) {
			text += '\n';
			index = afterTag;
			continue;
		}

		if ( FORMAT_TAGS.has( tag ) && ! selfClose ) {
			stack.push( {
				tag,
				attrs: parseAttributes( rawAttrs ),
				start: text.length,
			} );
			index = afterTag;
			continue;
		}

		// Opaque element: captured whole, one object character.
		const { source, next } = captureOpaque(
			html,
			lt,
			tag,
			afterTag,
			'' !== selfClose
		);
		formats.push( {
			start: text.length,
			end: text.length + 1,
			format: `obj|${ JSON.stringify( { html: source } ) }`,
		} );
		text += OBJECT_CHAR;
		index = next;
	}

	if ( stack.length > 0 ) {
		throw new UnsupportedHtml( `unclosed <${ stack[ 0 ].tag }>` );
	}

	// Canonical span order: start, then end, then format — matching the
	// document model's canonical form.
	formats.sort(
		( a, b ) =>
			a.start - b.start ||
			a.end - b.end ||
			( a.format < b.format ? -1 : 1 )
	);
	return { text, formats };
}

/**
 * Serializes a field back to inline HTML.
 *
 * Object spans re-emit their captured raw source; format spans nest
 * deterministically (longer spans outside, ties by format id), with
 * partially overlapping spans closed and reopened as needed to stay
 * well-formed.
 *
 * @param {Object} field { text, formats }.
 * @return {string} Inline HTML.
 */
export function fieldToHtml( field ) {
	const text = field.text ?? '';
	const spans = field.formats ?? [];
	const objectAt = new Map();
	const formatSpans = [];
	for ( const span of spans ) {
		if ( span.format.startsWith( 'obj|' ) ) {
			objectAt.set( span.start, span );
		} else if ( span.end > span.start ) {
			formatSpans.push( span );
		}
	}
	// Deterministic opening order at a position: earlier start first, then
	// longer span, then format id.
	const order = ( a, b ) =>
		a.start - b.start || b.end - a.end || ( a.format < b.format ? -1 : 1 );
	formatSpans.sort( order );

	let html = '';
	const stack = [];
	const openTag = ( span ) => {
		const decoded = decodeFormat( span.format );
		if ( ! decoded ) {
			return;
		}
		const attrKeys = Object.keys( decoded.attrs ).sort();
		const attrText = attrKeys
			.map(
				( key ) =>
					` ${ key }="${ encodeAttribute(
						String( decoded.attrs[ key ] )
					) }"`
			)
			.join( '' );
		html += `<${ decoded.tag }${ attrText }>`;
		stack.push( span );
	};
	const closeTag = ( span ) => {
		const decoded = decodeFormat( span.format );
		if ( decoded ) {
			html += `</${ decoded.tag }>`;
		}
	};

	for ( let position = 0; position <= text.length; position++ ) {
		// Close spans that end here (and close/reopen any opened later that
		// must stay open — stack discipline).
		const reopen = [];
		while ( stack.length > 0 ) {
			const innermostEnding = stack.some(
				( span ) => span.end === position
			);
			if ( ! innermostEnding ) {
				break;
			}
			const span = stack.pop();
			closeTag( span );
			if ( span.end !== position ) {
				reopen.push( span );
			}
		}
		for ( let i = reopen.length - 1; i >= 0; i-- ) {
			openTag( reopen[ i ] );
		}
		if ( position === text.length ) {
			break;
		}
		// Open spans starting here.
		for ( const span of formatSpans ) {
			if ( span.start === position ) {
				openTag( span );
			}
		}
		const char = text[ position ];
		const objectSpan = objectAt.get( position );
		if ( OBJECT_CHAR === char && objectSpan ) {
			html += JSON.parse( objectSpan.format.slice( 4 ) ).html;
		} else if ( '\n' === char ) {
			html += '<br>';
		} else {
			html += encodeText( char );
		}
	}
	return html;
}
