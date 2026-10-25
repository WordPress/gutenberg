import {
	decodeAttribute,
	decodeTextNode,
	readCharacterReference,
	strcspn,
	strspn,
} from './decoder';

/*
 * A port of WordPress's `WP_HTML_Tag_Processor`. It scans HTML one token at a
 * time and edits it in place: anything that isn't changed is kept exactly as
 * it was written. Offsets count UTF-16 code units, not bytes as in PHP.
 */

const WHITESPACE = ' \t\f\r\n';
const ASCII_ALPHA = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';

export type ParserState =
	| 'STATE_READY'
	| 'STATE_COMPLETE'
	| 'STATE_INCOMPLETE_INPUT'
	| 'STATE_MATCHED_TAG'
	| 'STATE_TEXT_NODE'
	| 'STATE_CDATA_NODE'
	| 'STATE_COMMENT'
	| 'STATE_DOCTYPE'
	| 'STATE_PRESUMPTUOUS_TAG'
	| 'STATE_WP_FUNKY'
	| 'STATE_PROCESSING_INSTRUCTION';

export type CommentType =
	| 'COMMENT_AS_ABRUPTLY_CLOSED_COMMENT'
	| 'COMMENT_AS_CDATA_LOOKALIKE'
	| 'COMMENT_AS_HTML_COMMENT'
	| 'COMMENT_AS_PI_NODE_LOOKALIKE'
	| 'COMMENT_AS_INVALID_HTML';

export type TextNodeClassification =
	'TEXT_IS_GENERIC' | 'TEXT_IS_NULL_SEQUENCE' | 'TEXT_IS_WHITESPACE';

export type ParsingNamespace = 'html' | 'math' | 'svg';

export type TagQuery =
	| string
	| {
			tag_name?: string;
			class_name?: string;
			match_offset?: number;
			tag_closers?: 'visit' | 'skip';
	  };

/**
 * A span of text: where it starts and how long it is.
 */
export interface Span {
	start: number;
	length: number;
}

interface AttributeToken extends Span {
	name: string;
	valueStartsAt: number;
	valueLength: number;
	isTrue: boolean;
}

interface TextReplacement extends Span {
	text: string;
}

const SVG_TAG_NAMES: Record< string, string > = Object.fromEntries(
	[
		'altGlyph',
		'altGlyphDef',
		'altGlyphItem',
		'animateColor',
		'animateMotion',
		'animateTransform',
		'clipPath',
		'feBlend',
		'feColorMatrix',
		'feComponentTransfer',
		'feComposite',
		'feConvolveMatrix',
		'feDiffuseLighting',
		'feDisplacementMap',
		'feDistantLight',
		'feDropShadow',
		'feFlood',
		'feFuncA',
		'feFuncB',
		'feFuncG',
		'feFuncR',
		'feGaussianBlur',
		'feImage',
		'feMerge',
		'feMergeNode',
		'feMorphology',
		'feOffset',
		'fePointLight',
		'feSpecularLighting',
		'feSpotLight',
		'feTile',
		'feTurbulence',
		'foreignObject',
		'glyphRef',
		'linearGradient',
		'radialGradient',
		'textPath',
	].map( ( name ) => [ name.toLowerCase(), name ] )
);

const SVG_ATTRIBUTE_NAMES: Record< string, string > = Object.fromEntries(
	[
		'attributeName',
		'attributeType',
		'baseFrequency',
		'baseProfile',
		'calcMode',
		'clipPathUnits',
		'diffuseConstant',
		'edgeMode',
		'filterUnits',
		'glyphRef',
		'gradientTransform',
		'gradientUnits',
		'kernelMatrix',
		'kernelUnitLength',
		'keyPoints',
		'keySplines',
		'keyTimes',
		'lengthAdjust',
		'limitingConeAngle',
		'markerHeight',
		'markerUnits',
		'markerWidth',
		'maskContentUnits',
		'maskUnits',
		'numOctaves',
		'pathLength',
		'patternContentUnits',
		'patternTransform',
		'patternUnits',
		'pointsAtX',
		'pointsAtY',
		'pointsAtZ',
		'preserveAlpha',
		'preserveAspectRatio',
		'primitiveUnits',
		'refX',
		'refY',
		'repeatCount',
		'repeatDur',
		'requiredExtensions',
		'requiredFeatures',
		'specularConstant',
		'specularExponent',
		'spreadMethod',
		'startOffset',
		'stdDeviation',
		'stitchTiles',
		'surfaceScale',
		'systemLanguage',
		'tableValues',
		'targetX',
		'targetY',
		'textLength',
		'viewBox',
		'viewTarget',
		'xChannelSelector',
		'yChannelSelector',
		'zoomAndPan',
	].map( ( name ) => [ name.toLowerCase(), name ] )
);

const FOREIGN_ATTRIBUTE_NAMES: Record< string, string > = {
	'xlink:actuate': 'xlink actuate',
	'xlink:arcrole': 'xlink arcrole',
	'xlink:href': 'xlink href',
	'xlink:role': 'xlink role',
	'xlink:show': 'xlink show',
	'xlink:title': 'xlink title',
	'xlink:type': 'xlink type',
	'xml:lang': 'xml lang',
	'xml:space': 'xml space',
	xmlns: 'xmlns',
	'xmlns:xlink': 'xmlns xlink',
};

const JAVASCRIPT_TYPES = [
	'application/ecmascript',
	'application/javascript',
	'application/x-ecmascript',
	'application/x-javascript',
	'text/ecmascript',
	'text/javascript',
	'text/javascript1.0',
	'text/javascript1.1',
	'text/javascript1.2',
	'text/javascript1.3',
	'text/javascript1.4',
	'text/javascript1.5',
	'text/jscript',
	'text/livescript',
	'text/x-ecmascript',
	'text/x-javascript',
	'module',
];

const JSON_TYPES = [
	'importmap',
	'speculationrules',
	'application/json',
	'text/json',
];

/**
 * Escapes text for an attribute value or a text node.
 *
 * @param text Plain text.
 */
function escapeText( text: string ): string {
	return text.replace(
		/[<>&"']/g,
		( character ) =>
			( {
				'<': '&lt;',
				'>': '&gt;',
				'&': '&amp;',
				'"': '&quot;',
				"'": '&apos;',
			} )[ character ] as string
	);
}

/**
 * Whether the text contains a Unicode noncharacter.
 *
 * @param text Text to check.
 */
function hasNoncharacters( text: string ): boolean {
	for ( const character of text ) {
		const codePoint = character.codePointAt( 0 ) as number;
		if (
			( codePoint >= 0xfdd0 && codePoint <= 0xfdef ) ||
			codePoint % 0x10000 >= 0xfffe
		) {
			return true;
		}
	}
	return false;
}

/**
 * Compares two strings, ignoring ASCII case.
 *
 * @param a First string.
 * @param b Second string.
 */
function equalsIgnoringCase( a: string, b: string ): boolean {
	return a.length === b.length && a.toLowerCase() === b.toLowerCase();
}

export class TagProcessor {
	static readonly MAX_BOOKMARKS: number = 10;

	static readonly MAX_SEEK_OPS: number = 1000;

	protected html: string;

	private lastQuery: TagQuery | null | undefined;

	private soughtTagName: string | null = null;

	private soughtClassName: string | null = null;

	private soughtMatchOffset = 1;

	private stopOnTagClosers = false;

	protected parserState: ParserState = 'STATE_READY';

	protected compatMode: 'no-quirks-mode' | 'quirks-mode' = 'no-quirks-mode';

	private parsingNamespace: ParsingNamespace = 'html';

	protected commentType: CommentType | null = null;

	protected textNodeClassification: TextNodeClassification =
		'TEXT_IS_GENERIC';

	private bytesAlreadyParsed = 0;

	private tokenStartsAt: number | null = null;

	private tokenLength: number | null = null;

	private selfClosingFlag = false;

	private tagNameStartsAt: number | null = null;

	private tagNameLength: number | null = null;

	private textStartsAt: number | null = 0;

	private textLength = 0;

	private isClosingTag: boolean | null = null;

	private attributes: Map< string, AttributeToken > = new Map();

	private duplicateAttributes: Map< string, Span[] > | null = null;

	// `true` adds a class, `false` removes it.
	private classnameUpdates: Map< string, boolean > = new Map();

	protected bookmarks: Map< string, Span > = new Map();

	// Updates for a named attribute or the modifiable text of the current
	// token, which a later update to the same name replaces.
	protected namedUpdates: Map< string, TextReplacement > = new Map();

	// Updates for tokens the processor has already moved past.
	protected settledUpdates: TextReplacement[] = [];

	protected seekCount = 0;

	private skipNewlineAt: number | null = null;

	constructor( html: string ) {
		this.html = typeof html === 'string' ? html : '';
	}

	/**
	 * Switches the namespace the tokenizer reads tags in.
	 *
	 * @param newNamespace One of `html`, `math` or `svg`.
	 */
	changeParsingNamespace( newNamespace: string ): boolean {
		if ( ! [ 'html', 'math', 'svg' ].includes( newNamespace ) ) {
			return false;
		}
		this.parsingNamespace = newNamespace as ParsingNamespace;
		return true;
	}

	/**
	 * Finds the next tag matching the query.
	 *
	 * @param query Tag name, or a query object.
	 */
	nextTag( query: TagQuery | null = null ): boolean {
		this.parseQuery( query );
		let alreadyFound = 0;

		do {
			if ( false === this.nextToken() ) {
				return false;
			}

			if ( 'STATE_MATCHED_TAG' !== this.parserState ) {
				continue;
			}

			if ( this.matches() ) {
				++alreadyFound;
			}
		} while ( alreadyFound < this.soughtMatchOffset );

		return true;
	}

	/**
	 * Moves to the next token: a tag, text, comment and so on.
	 */
	nextToken(): boolean {
		return this.baseClassNextToken();
	}

	private baseClassNextToken(): boolean {
		const wasAt = this.bytesAlreadyParsed;
		this.afterTag();

		if (
			'STATE_COMPLETE' === this.parserState ||
			'STATE_INCOMPLETE_INPUT' === this.parserState
		) {
			return false;
		}

		this.parserState = 'STATE_READY' as ParserState;

		if ( this.bytesAlreadyParsed >= this.html.length ) {
			this.parserState = 'STATE_COMPLETE';
			return false;
		}

		if ( false === this.parseNextTag() ) {
			if ( 'STATE_INCOMPLETE_INPUT' === this.parserState ) {
				this.bytesAlreadyParsed = wasAt;
			}
			return false;
		}

		if (
			'STATE_INCOMPLETE_INPUT' !== this.parserState &&
			'STATE_COMPLETE' !== this.parserState &&
			'STATE_MATCHED_TAG' !== this.parserState
		) {
			return true;
		}

		while ( this.parseNextAttribute() ) {
			continue;
		}

		if (
			'STATE_INCOMPLETE_INPUT' === this.parserState ||
			this.bytesAlreadyParsed >= this.html.length
		) {
			this.parserState = 'STATE_INCOMPLETE_INPUT';
			this.bytesAlreadyParsed = wasAt;
			return false;
		}

		const tagEndsAt = this.html.indexOf( '>', this.bytesAlreadyParsed );
		if ( -1 === tagEndsAt ) {
			this.parserState = 'STATE_INCOMPLETE_INPUT';
			this.bytesAlreadyParsed = wasAt;
			return false;
		}
		this.parserState = 'STATE_MATCHED_TAG';
		this.bytesAlreadyParsed = tagEndsAt + 1;
		this.tokenLength =
			this.bytesAlreadyParsed - ( this.tokenStartsAt as number );

		// Only some HTML elements hold raw text; check their first letter.
		if (
			this.isClosingTag ||
			'html' !== this.parsingNamespace ||
			1 !==
				strspn(
					this.html,
					'iIlLnNpPsStTxX',
					this.tagNameStartsAt as number,
					1
				)
		) {
			return true;
		}

		const tagName = this.getTag();

		// A newline right after these openers is ignored.
		if ( 'LISTING' === tagName || 'PRE' === tagName ) {
			this.skipNewlineAt = this.bytesAlreadyParsed;
			return true;
		}

		// Keep the opener's details: skipping the contents overwrites them.
		const tagNameStartsAt = this.tagNameStartsAt;
		const tagNameLength = this.tagNameLength;
		const tagEnd =
			( this.tokenStartsAt as number ) + ( this.tokenLength as number );
		const selfClosingFlag = this.selfClosingFlag;
		const attributes = new Map( this.attributes );
		const duplicateAttributes = this.duplicateAttributes
			? new Map( this.duplicateAttributes )
			: null;

		let foundCloser: boolean;
		switch ( tagName ) {
			case 'SCRIPT':
				foundCloser = this.skipScriptData();
				break;

			case 'TEXTAREA':
			case 'TITLE':
				foundCloser = this.skipRcdata( tagName );
				break;

			case 'IFRAME':
			case 'NOEMBED':
			case 'NOFRAMES':
			case 'STYLE':
			case 'XMP':
				foundCloser = this.skipRawtext( tagName );
				break;

			default:
				return true;
		}

		if ( ! foundCloser ) {
			this.parserState = 'STATE_INCOMPLETE_INPUT';
			this.bytesAlreadyParsed = wasAt;
			return false;
		}

		// The whole element, opener to closer, is one token whose
		// modifiable text is its contents.
		this.tokenStartsAt = wasAt;
		this.tokenLength = this.bytesAlreadyParsed - this.tokenStartsAt;
		this.textStartsAt = tagEnd;
		this.textLength = ( this.tagNameStartsAt as number ) - tagEnd;
		this.tagNameStartsAt = tagNameStartsAt;
		this.tagNameLength = tagNameLength;
		this.selfClosingFlag = selfClosingFlag;
		this.attributes = attributes;
		this.duplicateAttributes = duplicateAttributes;

		return true;
	}

	/**
	 * Whether the input ended in the middle of a token.
	 */
	pausedAtIncompleteToken(): boolean {
		return 'STATE_INCOMPLETE_INPUT' === this.parserState;
	}

	/**
	 * Yields each class name on the current tag, once.
	 */
	*classList(): Generator< string > {
		if ( 'STATE_MATCHED_TAG' !== this.parserState ) {
			return;
		}

		const className = this.getAttribute( 'class' );
		if ( typeof className !== 'string' ) {
			return;
		}

		const seen: string[] = [];
		const isQuirks = 'quirks-mode' === this.compatMode;
		let at = 0;
		while ( at < className.length ) {
			at += strspn( className, WHITESPACE, at );
			if ( at >= className.length ) {
				return;
			}

			const length = strcspn( className, WHITESPACE, at );
			if ( 0 === length ) {
				return;
			}

			let name = className.substr( at, length );
			if ( isQuirks ) {
				name = name.toLowerCase();
			}
			at += length;

			if ( seen.includes( name ) ) {
				continue;
			}

			seen.push( name );
			yield name;
		}
	}

	/**
	 * Whether the current tag has the given class.
	 *
	 * @param wantedClass Class name.
	 */
	hasClass( wantedClass: string ): boolean | null {
		if ( 'STATE_MATCHED_TAG' !== this.parserState ) {
			return null;
		}

		const caseInsensitive = 'quirks-mode' === this.compatMode;
		for ( const className of this.classList() ) {
			if (
				caseInsensitive
					? equalsIgnoringCase( className, wantedClass )
					: className === wantedClass
			) {
				return true;
			}
		}

		return false;
	}

	/**
	 * Remembers the current token so the processor can return to it.
	 *
	 * @param name Bookmark name.
	 */
	setBookmark( name: string ): boolean {
		if (
			'STATE_COMPLETE' === this.parserState ||
			'STATE_INCOMPLETE_INPUT' === this.parserState
		) {
			return false;
		}

		if (
			! this.bookmarks.has( name ) &&
			this.bookmarks.size >=
				( this.constructor as typeof TagProcessor ).MAX_BOOKMARKS
		) {
			return false;
		}

		this.bookmarks.set( name, {
			start: this.tokenStartsAt as number,
			length: this.tokenLength as number,
		} );

		return true;
	}

	/**
	 * Forgets a bookmark.
	 *
	 * @param name Bookmark name.
	 */
	releaseBookmark( name: string ): boolean {
		return this.bookmarks.delete( name );
	}

	private skipRawtext( tagName: string ): boolean {
		// Raw text and RCDATA end the same way.
		return this.skipRcdata( tagName );
	}

	private skipRcdata( tagName: string ): boolean {
		const html = this.html;
		const docLength = html.length;
		const tagLength = tagName.length;

		let at = this.bytesAlreadyParsed;

		closerSearch: while ( -1 !== at && at < docLength ) {
			at = html.indexOf( '</', at );
			this.tagNameStartsAt = at;

			// Fail if there's no closer, or no room for one.
			if ( -1 === at || at + 2 + tagLength >= docLength ) {
				return false;
			}

			at += 2;

			for ( let i = 0; i < tagLength; i++ ) {
				const tagChar = tagName[ i ];
				const htmlChar = html[ at + i ];
				if (
					htmlChar !== tagChar &&
					htmlChar.toUpperCase() !== tagChar
				) {
					at += i;
					continue closerSearch;
				}
			}

			at += tagLength;
			this.bytesAlreadyParsed = at;

			if ( at >= html.length ) {
				return false;
			}

			// The tag name must end here, as in `</title>` but not `</titles>`.
			const c = html[ at ];
			if (
				' ' !== c &&
				'\t' !== c &&
				'\r' !== c &&
				'\n' !== c &&
				'/' !== c &&
				'>' !== c
			) {
				continue;
			}

			while ( this.parseNextAttribute() ) {
				continue;
			}

			at = this.bytesAlreadyParsed;
			if ( at >= this.html.length ) {
				return false;
			}

			if ( '>' === html[ at ] ) {
				this.bytesAlreadyParsed = at + 1;
				return true;
			}

			if ( at + 1 >= this.html.length ) {
				return false;
			}

			if ( '/' === html[ at ] && '>' === html[ at + 1 ] ) {
				this.bytesAlreadyParsed = at + 2;
				return true;
			}
		}

		return false;
	}

	private skipScriptData(): boolean {
		let state: 'unescaped' | 'escaped' | 'double-escaped' = 'unescaped';
		const html = this.html;
		const docLength = html.length;
		let at = this.bytesAlreadyParsed;
		let closerPotentiallyStartsAt = 0;

		while ( -1 !== at && at < docLength ) {
			at += strcspn( html, '-<', at );

			// Not enough room left for a closer.
			if ( at + 8 >= docLength ) {
				return false;
			}

			// `-->` ends an escaped section.
			if (
				'-' === html[ at ] &&
				'-' === html[ at + 1 ] &&
				'>' === html[ at + 2 ]
			) {
				at += 3;
				state = 'unescaped';
				continue;
			}

			if ( '<' !== html[ at++ ] ) {
				continue;
			}

			// `<!--` starts an escaped section.
			if (
				'unescaped' === state &&
				'!' === html[ at ] &&
				'-' === html[ at + 1 ] &&
				'-' === html[ at + 2 ]
			) {
				at += 3;
				at += strspn( html, '-', at );

				// `<!-->` and `<!--->` don't start one.
				if ( at < docLength && '>' === html[ at ] ) {
					++at;
					continue;
				}

				state = 'escaped';
				continue;
			}

			let isClosing: boolean;
			if ( '/' === html[ at ] ) {
				closerPotentiallyStartsAt = at - 1;
				isClosing = true;
				++at;
			} else {
				isClosing = false;
			}

			if ( ! equalsIgnoringCase( html.substr( at, 6 ), 'script' ) ) {
				continue;
			}

			at += 6;
			const c = html[ at ];
			if (
				'>' !== c &&
				' ' !== c &&
				'\n' !== c &&
				'/' !== c &&
				'\t' !== c &&
				'\f' !== c &&
				'\r' !== c
			) {
				continue;
			}

			if ( 'escaped' === state && ! isClosing ) {
				state = 'double-escaped';
				continue;
			}

			if ( 'double-escaped' === state && isClosing ) {
				state = 'escaped';
				continue;
			}

			if ( isClosing ) {
				this.bytesAlreadyParsed = closerPotentiallyStartsAt;
				this.tagNameStartsAt = closerPotentiallyStartsAt;
				if ( this.bytesAlreadyParsed >= docLength ) {
					return false;
				}

				while ( this.parseNextAttribute() ) {
					continue;
				}

				if ( this.bytesAlreadyParsed >= docLength ) {
					return false;
				}

				if ( '>' === html[ this.bytesAlreadyParsed ] ) {
					++this.bytesAlreadyParsed;
					return true;
				}
			}

			++at;
		}

		return false;
	}

	private parseNextTag(): boolean {
		this.afterTag();

		const html = this.html;
		const docLength = html.length;
		const wasAt = this.bytesAlreadyParsed;
		let at = wasAt;

		while ( at < docLength ) {
			at = html.indexOf( '<', at );
			if ( -1 === at ) {
				break;
			}

			if ( at > wasAt ) {
				// A `<` not followed by one of these is plain text.
				if ( 1 !== strspn( html, '!/?' + ASCII_ALPHA, at + 1, 1 ) ) {
					++at;
					continue;
				}

				this.parserState = 'STATE_TEXT_NODE';
				this.tokenStartsAt = wasAt;
				this.tokenLength = at - wasAt;
				this.textStartsAt = wasAt;
				this.textLength = this.tokenLength;
				this.bytesAlreadyParsed = at;
				return true;
			}

			this.tokenStartsAt = at;

			if ( at + 1 < docLength && '/' === this.html[ at + 1 ] ) {
				this.isClosingTag = true;
				++at;
			} else {
				this.isClosingTag = false;
			}

			const tagNamePrefixLength = strspn( html, ASCII_ALPHA, at + 1 );
			if ( tagNamePrefixLength > 0 ) {
				++at;
				this.parserState = 'STATE_MATCHED_TAG';
				this.tagNameStartsAt = at;
				this.tagNameLength =
					tagNamePrefixLength +
					strcspn( html, ' \t\f\r\n/>', at + tagNamePrefixLength );
				this.bytesAlreadyParsed = at + this.tagNameLength;
				return true;
			}

			if ( at + 1 >= docLength ) {
				this.parserState = 'STATE_INCOMPLETE_INPUT';
				return false;
			}

			// `<!` starts a comment, a DOCTYPE or a CDATA section.
			if ( ! this.isClosingTag && '!' === html[ at + 1 ] ) {
				if ( html.startsWith( '--', at + 2 ) ) {
					let closerAt = at + 4;
					if ( docLength <= closerAt ) {
						this.parserState = 'STATE_INCOMPLETE_INPUT';
						return false;
					}

					// Abruptly closed empty comments, like `<!-->`.
					const spanOfDashes = strspn( html, '-', closerAt );
					if ( docLength <= spanOfDashes + closerAt ) {
						this.parserState = 'STATE_INCOMPLETE_INPUT';
						return false;
					}

					if ( '>' === html[ closerAt + spanOfDashes ] ) {
						this.parserState = 'STATE_COMMENT';
						this.commentType = 'COMMENT_AS_ABRUPTLY_CLOSED_COMMENT';
						this.tokenLength =
							closerAt + spanOfDashes + 1 - this.tokenStartsAt;

						// `<!---->` is a normal empty comment.
						if ( spanOfDashes >= 2 ) {
							this.commentType = 'COMMENT_AS_HTML_COMMENT';
							this.textStartsAt = this.tokenStartsAt + 4;
							this.textLength = spanOfDashes - 2;
						}

						this.bytesAlreadyParsed = closerAt + spanOfDashes + 1;
						return true;
					}

					// The comment ends at the first `-->` or `--!>`.
					--closerAt;
					while ( ++closerAt < docLength ) {
						closerAt = html.indexOf( '--', closerAt );
						if ( -1 === closerAt ) {
							this.parserState = 'STATE_INCOMPLETE_INPUT';
							return false;
						}

						if (
							closerAt + 2 < docLength &&
							'>' === html[ closerAt + 2 ]
						) {
							this.parserState = 'STATE_COMMENT';
							this.commentType = 'COMMENT_AS_HTML_COMMENT';
							this.tokenLength =
								closerAt + 3 - this.tokenStartsAt;
							this.textStartsAt = this.tokenStartsAt + 4;
							this.textLength = closerAt - this.textStartsAt;
							this.bytesAlreadyParsed = closerAt + 3;
							return true;
						}

						if (
							closerAt + 3 < docLength &&
							'!' === html[ closerAt + 2 ] &&
							'>' === html[ closerAt + 3 ]
						) {
							this.parserState = 'STATE_COMMENT';
							this.commentType = 'COMMENT_AS_HTML_COMMENT';
							this.tokenLength =
								closerAt + 4 - this.tokenStartsAt;
							this.textStartsAt = this.tokenStartsAt + 4;
							this.textLength = closerAt - this.textStartsAt;
							this.bytesAlreadyParsed = closerAt + 4;
							return true;
						}
					}
				}

				if (
					docLength > at + 8 &&
					equalsIgnoringCase( html.substr( at + 2, 7 ), 'DOCTYPE' )
				) {
					const closerAt = html.indexOf( '>', at + 9 );
					if ( -1 === closerAt ) {
						this.parserState = 'STATE_INCOMPLETE_INPUT';
						return false;
					}

					this.parserState = 'STATE_DOCTYPE';
					this.tokenLength = closerAt + 1 - this.tokenStartsAt;
					this.textStartsAt = this.tokenStartsAt + 9;
					this.textLength = closerAt - this.textStartsAt;
					this.bytesAlreadyParsed = closerAt + 1;
					return true;
				}

				// CDATA sections only exist in foreign content.
				if (
					'html' !== this.parsingNamespace &&
					html.length > at + 8 &&
					html.startsWith( '[CDATA[', at + 2 )
				) {
					const closerAt = html.indexOf( ']]>', at + 9 );
					if ( -1 === closerAt ) {
						this.parserState = 'STATE_INCOMPLETE_INPUT';
						return false;
					}

					this.parserState = 'STATE_CDATA_NODE';
					this.textStartsAt = at + 9;
					this.textLength = closerAt - this.textStartsAt;
					this.tokenLength = closerAt + 3 - this.tokenStartsAt;
					this.bytesAlreadyParsed = closerAt + 3;
					return true;
				}

				// Anything else after `<!` is a bogus comment.
				const closerAt = html.indexOf( '>', at + 1 );
				if ( -1 === closerAt ) {
					this.parserState = 'STATE_INCOMPLETE_INPUT';
					return false;
				}

				this.parserState = 'STATE_COMMENT';
				this.commentType = 'COMMENT_AS_INVALID_HTML';
				this.tokenLength = closerAt + 1 - this.tokenStartsAt;
				this.textStartsAt = this.tokenStartsAt + 2;
				this.textLength = closerAt - this.textStartsAt;
				this.bytesAlreadyParsed = closerAt + 1;

				// Bogus comments that look like CDATA sections.
				if (
					this.tokenLength >= 10 &&
					html.startsWith( '[CDATA[', this.tokenStartsAt + 2 ) &&
					']' === html[ closerAt - 1 ] &&
					']' === html[ closerAt - 2 ]
				) {
					this.parserState = 'STATE_COMMENT';
					this.commentType = 'COMMENT_AS_CDATA_LOOKALIKE';
					this.textStartsAt += 7;
					this.textLength -= 9;
				}

				return true;
			}

			// `</>` is skipped entirely; `<>` is plain text.
			if ( '>' === html[ at + 1 ] ) {
				if ( ! this.isClosingTag ) {
					++at;
					continue;
				}

				this.parserState = 'STATE_PRESUMPTUOUS_TAG';
				this.tokenLength = at + 2 - this.tokenStartsAt;
				this.bytesAlreadyParsed = at + 2;
				return true;
			}

			// `<?` starts a processing instruction or a bogus comment.
			if ( ! this.isClosingTag && '?' === html[ at + 1 ] ) {
				const closerAt = html.indexOf( '>', at + 2 );
				if ( -1 === closerAt ) {
					this.parserState = 'STATE_INCOMPLETE_INPUT';
					return false;
				}

				const targetAt = at + 2;
				let targetLength = 0;
				if ( /[a-zA-Z_]/.test( html[ targetAt ] ?? '' ) ) {
					targetLength =
						1 +
						strspn(
							html,
							ASCII_ALPHA + '0123456789_-',
							targetAt + 1
						);
				}

				const isValidPi =
					0 !== targetLength &&
					' \t\f\r\n?>'.includes( html[ targetAt + targetLength ] ) &&
					! (
						3 === targetLength &&
						equalsIgnoringCase( html.substr( targetAt, 3 ), 'xml' )
					) &&
					! (
						14 === targetLength &&
						equalsIgnoringCase(
							html.substr( targetAt, 14 ),
							'xml-stylesheet'
						)
					);

				if ( isValidPi ) {
					let dataAt = targetAt + targetLength;
					dataAt += strspn( html, WHITESPACE, dataAt );
					let dataLength = closerAt - dataAt;
					if ( dataLength > 0 && '?' === html[ closerAt - 1 ] ) {
						--dataLength;
					}

					this.parserState = 'STATE_PROCESSING_INSTRUCTION';
					this.tagNameStartsAt = targetAt;
					this.tagNameLength = targetLength;
					this.tokenLength = closerAt + 1 - this.tokenStartsAt;
					this.textStartsAt = dataAt;
					this.textLength = dataLength;
					this.bytesAlreadyParsed = closerAt + 1;
					return true;
				}

				this.parserState = 'STATE_COMMENT';
				this.commentType = 'COMMENT_AS_INVALID_HTML';
				this.tokenLength = closerAt + 1 - this.tokenStartsAt;
				this.textStartsAt = this.tokenStartsAt + 2;
				this.textLength = closerAt - this.textStartsAt;
				this.bytesAlreadyParsed = closerAt + 1;

				// Bogus comments that look like processing instructions.
				if ( this.tokenLength >= 5 && '?' === html[ closerAt - 1 ] ) {
					const commentText = html.substr(
						this.tokenStartsAt + 2,
						this.tokenLength - 4
					);
					let piTargetLength = strspn(
						commentText,
						ASCII_ALPHA + ':_',
						0
					);
					if ( 0 < piTargetLength ) {
						piTargetLength += strspn(
							commentText,
							ASCII_ALPHA + '0123456789:_-.',
							piTargetLength
						);

						this.commentType = 'COMMENT_AS_PI_NODE_LOOKALIKE';
						this.tagNameStartsAt = this.tokenStartsAt + 2;
						this.tagNameLength = piTargetLength;
						this.textStartsAt += piTargetLength;
						this.textLength -= piTargetLength + 1;
					}
				}

				return true;
			}

			// `</` followed by something other than a letter is a funky
			// comment, which WordPress may use for placeholders.
			if ( this.isClosingTag ) {
				if ( at + 3 > docLength ) {
					this.parserState = 'STATE_INCOMPLETE_INPUT';
					return false;
				}

				const closerAt = html.indexOf( '>', at + 2 );
				if ( -1 === closerAt ) {
					this.parserState = 'STATE_INCOMPLETE_INPUT';
					return false;
				}

				this.parserState = 'STATE_WP_FUNKY';
				this.tokenLength = closerAt + 1 - this.tokenStartsAt;
				this.textStartsAt = this.tokenStartsAt + 2;
				this.textLength = closerAt - this.textStartsAt;
				this.bytesAlreadyParsed = closerAt + 1;
				return true;
			}

			++at;
		}

		// Everything left is text.
		this.parserState = 'STATE_TEXT_NODE';
		this.tokenStartsAt = wasAt;
		this.tokenLength = docLength - wasAt;
		this.textStartsAt = wasAt;
		this.textLength = this.tokenLength;
		this.bytesAlreadyParsed = docLength;
		return true;
	}

	private parseNextAttribute(): boolean {
		const docLength = this.html.length;

		// Skip whitespace and slashes.
		const skippedLength = strspn(
			this.html,
			' \t\f\r\n/',
			this.bytesAlreadyParsed
		);
		this.bytesAlreadyParsed += skippedLength;
		if ( this.bytesAlreadyParsed >= docLength ) {
			this.parserState = 'STATE_INCOMPLETE_INPUT';
			return false;
		}

		if ( '>' === this.html[ this.bytesAlreadyParsed ] ) {
			if (
				skippedLength > 0 &&
				'/' === this.html[ this.bytesAlreadyParsed - 1 ]
			) {
				this.selfClosingFlag = true;
			}
			return false;
		}

		// A leading `=` is part of the attribute name.
		const nameLength =
			'=' === this.html[ this.bytesAlreadyParsed ]
				? 1 +
					strcspn(
						this.html,
						'=/> \t\f\r\n',
						this.bytesAlreadyParsed + 1
					)
				: strcspn( this.html, '=/> \t\f\r\n', this.bytesAlreadyParsed );

		if (
			0 === nameLength ||
			this.bytesAlreadyParsed + nameLength >= docLength
		) {
			return false;
		}

		const attributeStart = this.bytesAlreadyParsed;
		this.bytesAlreadyParsed += nameLength;
		if ( this.bytesAlreadyParsed >= docLength ) {
			this.parserState = 'STATE_INCOMPLETE_INPUT';
			return false;
		}

		this.skipWhitespace();
		if ( this.bytesAlreadyParsed >= docLength ) {
			this.parserState = 'STATE_INCOMPLETE_INPUT';
			return false;
		}

		const hasValue = '=' === this.html[ this.bytesAlreadyParsed ];
		let valueStart: number;
		let valueLength: number;
		let attributeEnd: number;
		if ( hasValue ) {
			++this.bytesAlreadyParsed;
			this.skipWhitespace();
			if ( this.bytesAlreadyParsed >= docLength ) {
				this.parserState = 'STATE_INCOMPLETE_INPUT';
				return false;
			}

			const quote = this.html[ this.bytesAlreadyParsed ];
			if ( "'" === quote || '"' === quote ) {
				valueStart = this.bytesAlreadyParsed + 1;
				let endQuoteAt = this.html.indexOf( quote, valueStart );
				endQuoteAt = -1 === endQuoteAt ? docLength : endQuoteAt;
				valueLength = endQuoteAt - valueStart;
				attributeEnd = endQuoteAt + 1;
				this.bytesAlreadyParsed = attributeEnd;
			} else {
				valueStart = this.bytesAlreadyParsed;
				valueLength = strcspn( this.html, '> \t\f\r\n', valueStart );
				attributeEnd = valueStart + valueLength;
				this.bytesAlreadyParsed = attributeEnd;
			}
		} else {
			valueStart = this.bytesAlreadyParsed;
			valueLength = 0;
			attributeEnd = attributeStart + nameLength;
		}

		if ( attributeEnd >= docLength ) {
			this.parserState = 'STATE_INCOMPLETE_INPUT';
			return false;
		}

		if ( this.isClosingTag ) {
			return true;
		}

		// Only the first of duplicate attributes counts.
		const attributeName = this.html.substr( attributeStart, nameLength );
		const comparableName = attributeName
			.replaceAll( '\x00', '�' )
			.toLowerCase();
		if ( ! this.attributes.has( comparableName ) ) {
			this.attributes.set( comparableName, {
				name: attributeName,
				valueStartsAt: valueStart,
				valueLength,
				start: attributeStart,
				length: attributeEnd - attributeStart,
				isTrue: ! hasValue,
			} );
			return true;
		}

		// Remember duplicates so removing the attribute removes them too.
		const duplicateSpan = {
			start: attributeStart,
			length: attributeEnd - attributeStart,
		};
		if ( null === this.duplicateAttributes ) {
			this.duplicateAttributes = new Map();
		}
		const duplicates = this.duplicateAttributes.get( comparableName );
		if ( duplicates ) {
			duplicates.push( duplicateSpan );
		} else {
			this.duplicateAttributes.set( comparableName, [ duplicateSpan ] );
		}

		return true;
	}

	private skipWhitespace(): void {
		this.bytesAlreadyParsed += strspn(
			this.html,
			WHITESPACE,
			this.bytesAlreadyParsed
		);
	}

	private afterTag(): void {
		// Turn class changes into a `class` attribute update.
		this.classNameUpdatesToAttributesUpdates();

		// Don't let updates pile up.
		if ( 1000 < this.namedUpdates.size + this.settledUpdates.length ) {
			this.getUpdatedHtml();
		}

		// Apply updates after the current token now; settle the rest so a
		// later token's update to the same name doesn't replace them.
		for ( const [ name, update ] of this.namedUpdates ) {
			if ( update.start >= this.bytesAlreadyParsed ) {
				this.getUpdatedHtml();
				break;
			}

			this.settledUpdates.push( update );
			this.namedUpdates.delete( name );
		}

		this.tokenStartsAt = null;
		this.tokenLength = null;
		this.selfClosingFlag = false;
		this.tagNameStartsAt = null;
		this.tagNameLength = null;
		this.textStartsAt = 0;
		this.textLength = 0;
		this.isClosingTag = null;
		this.attributes = new Map();
		this.commentType = null;
		this.textNodeClassification = 'TEXT_IS_GENERIC';
		this.duplicateAttributes = null;
	}

	private classNameUpdatesToAttributesUpdates(): void {
		if ( 0 === this.classnameUpdates.size ) {
			return;
		}

		let existingClass = this.getEnqueuedAttributeValue( 'class' );
		if ( null === existingClass || true === existingClass ) {
			existingClass = '';
		}

		if ( false === existingClass && this.attributes.has( 'class' ) ) {
			existingClass = this.getDecodedAttributeValue(
				this.attributes.get( 'class' ) as AttributeToken
			);
		}

		if ( false === existingClass ) {
			existingClass = '';
		}

		let className = '';
		let at = 0;
		let modified = false;
		const seen: string[] = [];
		const toRemove: string[] = [];
		const isQuirks = 'quirks-mode' === this.compatMode;

		for ( const [ updatedName, add ] of this.classnameUpdates ) {
			if ( ! add ) {
				toRemove.push(
					isQuirks ? updatedName.toLowerCase() : updatedName
				);
			}
		}

		// Keep the existing classes and the whitespace between them.
		while ( at < existingClass.length ) {
			const wsAt = at;
			const wsLength = strspn( existingClass, WHITESPACE, wsAt );
			at += wsLength;

			const nameLength = strcspn( existingClass, WHITESPACE, at );
			if ( 0 === nameLength ) {
				break;
			}

			const name = existingClass.substr( at, nameLength );
			const comparableClassName = isQuirks ? name.toLowerCase() : name;
			at += nameLength;

			if ( toRemove.includes( comparableClassName ) ) {
				modified = true;
				continue;
			}

			if ( seen.includes( comparableClassName ) ) {
				continue;
			}

			seen.push( comparableClassName );

			if ( '' !== className ) {
				className += existingClass.substr( wsAt, wsLength );
			}
			className += name;
		}

		for ( const [ name, add ] of this.classnameUpdates ) {
			const comparableName = isQuirks ? name.toLowerCase() : name;
			if ( add && ! seen.includes( comparableName ) ) {
				modified = true;
				className += className.length > 0 ? ' ' : '';
				className += name;
			}
		}

		this.classnameUpdates = new Map();
		if ( ! modified ) {
			return;
		}

		if ( className.length > 0 ) {
			this.setAttribute( 'class', className );
		} else {
			this.removeAttribute( 'class' );
		}
	}

	private applyAttributesUpdates( shiftThisPoint: number ): number {
		const updates = [
			...this.settledUpdates,
			...this.namedUpdates.values(),
		];
		if ( ! updates.length ) {
			return 0;
		}

		let accumulatedShiftForGivenPoint = 0;

		updates.sort( TagProcessor.sortStartAscending );

		let bytesAlreadyCopied = 0;
		let outputBuffer = '';
		for ( const diff of updates ) {
			const shift = diff.text.length - diff.length;

			// Adjust the cursor for changes before it.
			if ( diff.start < this.bytesAlreadyParsed ) {
				this.bytesAlreadyParsed += shift;
			}

			if ( diff.start < shiftThisPoint ) {
				accumulatedShiftForGivenPoint += shift;
			}

			outputBuffer += this.html.slice( bytesAlreadyCopied, diff.start );
			outputBuffer += diff.text;
			bytesAlreadyCopied = diff.start + diff.length;
		}

		this.html = outputBuffer + this.html.slice( bytesAlreadyCopied );

		// Move bookmarks to follow the text they point at.
		for ( const [ bookmarkName, bookmark ] of this.bookmarks ) {
			const bookmarkEnd = bookmark.start + bookmark.length;
			let headDelta = 0;
			let tailDelta = 0;
			let released = false;

			for ( const diff of updates ) {
				const diffEnd = diff.start + diff.length;

				if ( bookmark.start < diff.start && bookmarkEnd < diff.start ) {
					break;
				}

				// A bookmark inside a replaced span no longer exists.
				if ( bookmark.start >= diff.start && bookmarkEnd < diffEnd ) {
					this.releaseBookmark( bookmarkName );
					released = true;
					break;
				}

				const delta = diff.text.length - diff.length;

				if ( bookmark.start >= diff.start ) {
					headDelta += delta;
				}

				if ( bookmarkEnd >= diffEnd ) {
					tailDelta += delta;
				}
			}

			if ( ! released ) {
				bookmark.start += headDelta;
				bookmark.length += tailDelta - headDelta;
			}
		}

		this.namedUpdates = new Map();
		this.settledUpdates = [];

		return accumulatedShiftForGivenPoint;
	}

	/**
	 * Whether a bookmark exists.
	 *
	 * @param bookmarkName Bookmark name.
	 */
	hasBookmark( bookmarkName: string ): boolean {
		return this.bookmarks.has( bookmarkName );
	}

	/**
	 * Moves back or forward to a bookmarked token.
	 *
	 * @param bookmarkName Bookmark name.
	 */
	seek( bookmarkName: string ): boolean {
		const existingBookmark = this.bookmarks.get( bookmarkName );
		if ( ! existingBookmark ) {
			return false;
		}

		if (
			this.tokenStartsAt === existingBookmark.start &&
			this.tokenLength === existingBookmark.length
		) {
			return true;
		}

		if (
			++this.seekCount >
			( this.constructor as typeof TagProcessor ).MAX_SEEK_OPS
		) {
			return false;
		}

		// Flush updates, then point the parser at the bookmark.
		this.getUpdatedHtml();
		this.bytesAlreadyParsed = (
			this.bookmarks.get( bookmarkName ) as Span
		 ).start;
		this.parserState = 'STATE_READY' as ParserState;
		return this.nextToken();
	}

	private static sortStartAscending(
		a: TextReplacement,
		b: TextReplacement
	): number {
		const byStart = a.start - b.start;
		if ( 0 !== byStart ) {
			return byStart;
		}

		if ( a.text !== b.text ) {
			return a.text < b.text ? -1 : 1;
		}

		return a.length - b.length;
	}

	/**
	 * Returns the pending value of an attribute: `false` if there's no
	 * pending update, `null` if it's being removed, `true` for a boolean
	 * attribute, or the decoded value.
	 *
	 * @param comparableName Lowercase attribute name.
	 */
	private getEnqueuedAttributeValue(
		comparableName: string
	): string | boolean | null {
		if ( 'STATE_MATCHED_TAG' !== this.parserState ) {
			return false;
		}

		const update = this.namedUpdates.get( comparableName );
		if ( ! update ) {
			return false;
		}

		const enqueuedText = update.text;

		// Removed.
		if ( '' === enqueuedText ) {
			return null;
		}

		// A boolean attribute has no `=`.
		const equalsAt = enqueuedText.indexOf( '=' );
		if ( -1 === equalsAt ) {
			return true;
		}

		// Values are always written as `name="value"`.
		return decodeAttribute( enqueuedText.slice( equalsAt + 2, -1 ) );
	}

	/**
	 * Returns the decoded value of an attribute on the current tag: `true`
	 * for an attribute without a value, `null` when it's missing.
	 *
	 * @param name Attribute name, in any case.
	 */
	getAttribute( name: string ): string | true | null {
		if ( 'STATE_MATCHED_TAG' !== this.parserState ) {
			return null;
		}

		const comparable = name.toLowerCase();

		// Pending class changes affect the value.
		if ( 'class' === comparable ) {
			this.classNameUpdatesToAttributesUpdates();
		}

		const enqueuedValue = this.getEnqueuedAttributeValue( comparable );
		if ( false !== enqueuedValue ) {
			return enqueuedValue;
		}

		const attribute = this.attributes.get( comparable );
		if ( ! attribute ) {
			return null;
		}

		if ( attribute.isTrue ) {
			return true;
		}

		return this.getDecodedAttributeValue( attribute );
	}

	private getDecodedAttributeValue( attribute: AttributeToken ): string {
		const rawValue = this.html
			.substr( attribute.valueStartsAt, attribute.valueLength )
			.replaceAll( '\r\n', '\n' )
			.replaceAll( '\r', '\n' )
			.replaceAll( '\x00', '�' );
		return decodeAttribute( rawValue );
	}

	/**
	 * Returns the lowercase names of the attributes starting with a prefix.
	 *
	 * @param prefix Prefix, in any case.
	 */
	getAttributeNamesWithPrefix( prefix: string ): string[] | null {
		if ( 'STATE_MATCHED_TAG' !== this.parserState || this.isClosingTag ) {
			return null;
		}

		const comparable = prefix.toLowerCase();
		return [ ...this.attributes.keys() ].filter( ( name ) =>
			name.startsWith( comparable )
		);
	}

	/**
	 * Returns the namespace the tokenizer is reading tags in.
	 */
	getNamespace(): ParsingNamespace {
		return this.parsingNamespace;
	}

	/**
	 * Returns the uppercase name of the current tag, or the target of a
	 * processing instruction.
	 */
	getTag(): string | null {
		if ( null === this.tagNameStartsAt ) {
			return null;
		}

		const tagName = this.html
			.substr( this.tagNameStartsAt, this.tagNameLength as number )
			.replaceAll( '\x00', '�' );

		if ( 'STATE_MATCHED_TAG' === this.parserState ) {
			return tagName.toUpperCase();
		}

		if (
			'STATE_PROCESSING_INSTRUCTION' === this.parserState ||
			( 'STATE_COMMENT' === this.parserState &&
				'COMMENT_AS_PI_NODE_LOOKALIKE' === this.getCommentType() )
		) {
			return tagName;
		}

		return null;
	}

	/**
	 * Returns the tag name as the DOM would show it, which differs from
	 * `getTag()` in SVG and MathML.
	 */
	getQualifiedTagName(): string | null {
		const tagName = this.getTag();
		if ( null === tagName ) {
			return null;
		}

		if ( 'html' === this.getNamespace() ) {
			return tagName;
		}

		const lowerTagName = tagName.toLowerCase();
		if ( 'svg' === this.getNamespace() ) {
			return SVG_TAG_NAMES[ lowerTagName ] ?? lowerTagName;
		}

		return lowerTagName;
	}

	/**
	 * Returns an attribute name as the DOM would show it.
	 *
	 * @param attributeName Attribute name.
	 */
	getQualifiedAttributeName( attributeName: string ): string | null {
		if ( 'STATE_MATCHED_TAG' !== this.parserState ) {
			return null;
		}

		const namespace = this.getNamespace();
		const lowerName = attributeName.toLowerCase();

		if ( 'math' === namespace && 'definitionurl' === lowerName ) {
			return 'definitionURL';
		}

		if ( 'svg' === namespace && SVG_ATTRIBUTE_NAMES[ lowerName ] ) {
			return SVG_ATTRIBUTE_NAMES[ lowerName ];
		}

		if ( 'html' !== namespace && FOREIGN_ATTRIBUTE_NAMES[ lowerName ] ) {
			return FOREIGN_ATTRIBUTE_NAMES[ lowerName ];
		}

		return attributeName;
	}

	/**
	 * Whether the current tag ends with `/>`.
	 */
	hasSelfClosingFlag(): boolean {
		if ( 'STATE_MATCHED_TAG' !== this.parserState ) {
			return false;
		}

		return this.selfClosingFlag;
	}

	/**
	 * Whether the current tag is a closer. `</br>` counts as an opener.
	 */
	isTagCloser(): boolean {
		return (
			'STATE_MATCHED_TAG' === this.parserState &&
			true === this.isClosingTag &&
			'BR' !== this.getTag()
		);
	}

	/**
	 * Returns the kind of token: `#tag`, `#text`, `#comment` and so on.
	 */
	getTokenType(): string | null {
		switch ( this.parserState ) {
			case 'STATE_MATCHED_TAG':
				return '#tag';

			case 'STATE_DOCTYPE':
				return '#doctype';

			default:
				return this.getTokenName();
		}
	}

	/**
	 * Returns the token's name: the tag name for tags, otherwise its kind.
	 */
	getTokenName(): string | null {
		switch ( this.parserState ) {
			case 'STATE_MATCHED_TAG':
				return this.getTag();

			case 'STATE_TEXT_NODE':
				return '#text';

			case 'STATE_CDATA_NODE':
				return '#cdata-section';

			case 'STATE_COMMENT':
				return '#comment';

			case 'STATE_DOCTYPE':
				return 'html';

			case 'STATE_PRESUMPTUOUS_TAG':
				return '#presumptuous-tag';

			case 'STATE_WP_FUNKY':
				return '#funky-comment';

			case 'STATE_PROCESSING_INSTRUCTION':
				return '#processing-instruction';
		}

		return null;
	}

	/**
	 * Returns how the current comment was written.
	 */
	getCommentType(): CommentType | null {
		if ( 'STATE_COMMENT' !== this.parserState ) {
			return null;
		}

		return this.commentType;
	}

	/**
	 * Returns the text of a comment as the DOM would show it.
	 */
	getFullCommentText(): string | null {
		if ( 'STATE_WP_FUNKY' === this.parserState ) {
			return this.getModifiableText();
		}

		if ( 'STATE_COMMENT' !== this.parserState ) {
			return null;
		}

		switch ( this.getCommentType() ) {
			case 'COMMENT_AS_HTML_COMMENT':
			case 'COMMENT_AS_ABRUPTLY_CLOSED_COMMENT':
				return this.getModifiableText();

			case 'COMMENT_AS_CDATA_LOOKALIKE':
				return `[CDATA[${ this.getModifiableText() }]]`;

			case 'COMMENT_AS_PI_NODE_LOOKALIKE':
				return `?${ this.getTag() }${ this.getModifiableText() }?`;

			case 'COMMENT_AS_INVALID_HTML':
				const precedingCharacter =
					this.html[ ( this.textStartsAt as number ) - 1 ];
				const commentStart = '?' === precedingCharacter ? '?' : '';
				return `${ commentStart }${ this.getModifiableText() }`;
		}

		return null;
	}

	/**
	 * Splits leading null bytes or whitespace off the current text node, so
	 * they can be handled on their own.
	 */
	subdivideTextAppropriately(): boolean {
		if ( 'STATE_TEXT_NODE' !== this.parserState ) {
			return false;
		}

		this.textNodeClassification = 'TEXT_IS_GENERIC';

		const textStartsAt = this.textStartsAt as number;
		const leadingNulls = strspn(
			this.html,
			'\x00',
			textStartsAt,
			this.textLength
		);
		if ( leadingNulls > 0 ) {
			this.tokenLength = leadingNulls;
			this.textLength = leadingNulls;
			this.bytesAlreadyParsed =
				( this.tokenStartsAt as number ) + leadingNulls;
			this.textNodeClassification = 'TEXT_IS_NULL_SEQUENCE';
			return true;
		}

		// Whitespace, including whitespace written as character references.
		let at = textStartsAt;
		const end = textStartsAt + this.textLength;
		while ( at < end ) {
			at += strspn( this.html, WHITESPACE, at, end - at );

			if ( at < end && '&' === this.html[ at ] ) {
				const reference = readCharacterReference(
					'data',
					this.html,
					at
				);
				if (
					reference &&
					1 === strspn( reference.text, WHITESPACE, 0 )
				) {
					at += reference.length;
					continue;
				}
			}

			break;
		}

		if ( at > textStartsAt ) {
			const newLength = at - textStartsAt;
			this.textLength = newLength;
			this.tokenLength = newLength;
			this.bytesAlreadyParsed = at;
			this.textNodeClassification = 'TEXT_IS_WHITESPACE';
			return true;
		}

		return false;
	}

	/**
	 * Returns the decoded text of the current token: a text node, comment,
	 * or the contents of an element like `SCRIPT` or `TEXTAREA`.
	 */
	getModifiableText(): string {
		const enqueuedUpdate = this.namedUpdates.get( 'modifiable text' );
		if (
			! enqueuedUpdate &&
			( null === this.textStartsAt || 0 === this.textLength )
		) {
			return '';
		}

		let text = enqueuedUpdate
			? enqueuedUpdate.text
			: this.html.substr( this.textStartsAt as number, this.textLength );

		if (
			enqueuedUpdate &&
			'STATE_PROCESSING_INSTRUCTION' === this.parserState
		) {
			text = text.slice( strspn( text, WHITESPACE, 0 ), -2 );
		}

		text = text.replaceAll( '\r\n', '\n' ).replaceAll( '\r', '\n' );

		if (
			'STATE_CDATA_NODE' === this.parserState ||
			'STATE_COMMENT' === this.parserState ||
			'STATE_DOCTYPE' === this.parserState ||
			'STATE_WP_FUNKY' === this.parserState ||
			'STATE_PROCESSING_INSTRUCTION' === this.parserState
		) {
			return text.replaceAll( '\x00', '�' );
		}

		const tagName = this.getTokenName();
		if (
			'SCRIPT' === tagName ||
			'IFRAME' === tagName ||
			'NOEMBED' === tagName ||
			'NOFRAMES' === tagName ||
			'STYLE' === tagName ||
			'XMP' === tagName
		) {
			return text.replaceAll( '\x00', '�' );
		}

		let decoded = decodeTextNode( text );

		// Skip the newline that may follow `PRE`, `LISTING` and `TEXTAREA`.
		if (
			'\n' === decoded[ 0 ] &&
			( ( this.skipNewlineAt === this.tokenStartsAt &&
				'#text' === tagName ) ||
				'TEXTAREA' === tagName )
		) {
			decoded = decoded.slice( 1 );
		}

		return '#text' === tagName && 'html' === this.getNamespace()
			? decoded.replaceAll( '\x00', '' )
			: decoded.replaceAll( '\x00', '�' );
	}

	/**
	 * Replaces the text of the current token, escaping it as needed.
	 *
	 * @param plaintextContent New text, not escaped.
	 */
	setModifiableText( plaintextContent: string ): boolean {
		const textStartsAt = this.textStartsAt as number;

		if ( 'STATE_TEXT_NODE' === this.parserState ) {
			this.namedUpdates.set( 'modifiable text', {
				start: textStartsAt,
				length: this.textLength,
				text: escapeText( plaintextContent ),
			} );
			return true;
		}

		if (
			'STATE_COMMENT' === this.parserState &&
			'COMMENT_AS_HTML_COMMENT' === this.commentType
		) {
			if ( /--!?>/.test( plaintextContent ) ) {
				return false;
			}

			this.namedUpdates.set( 'modifiable text', {
				start: textStartsAt,
				length: this.textLength,
				text: plaintextContent,
			} );
			return true;
		}

		if ( 'STATE_PROCESSING_INSTRUCTION' === this.parserState ) {
			if (
				plaintextContent.includes( '>' ) ||
				0 !== strspn( plaintextContent, WHITESPACE, 0 )
			) {
				return false;
			}

			const dataAt =
				( this.tagNameStartsAt as number ) +
				( this.tagNameLength as number );
			this.namedUpdates.set( 'modifiable text', {
				start: dataAt,
				length:
					( this.tokenStartsAt as number ) +
					( this.tokenLength as number ) -
					dataAt,
				text: ` ${ plaintextContent }?>`,
			} );
			return true;
		}

		if (
			'STATE_MATCHED_TAG' !== this.parserState ||
			'html' !== this.getNamespace()
		) {
			return false;
		}

		const tagName = this.getTag() as string;
		let text = plaintextContent;
		switch ( tagName ) {
			case 'SCRIPT':
				const scriptContentType = this.getScriptContentType();
				if (
					'javascript' === scriptContentType ||
					'json' === scriptContentType
				) {
					text = TagProcessor.escapeJavascriptScriptContents( text );
					break;
				}

				if ( /<\/?script/i.test( text ) ) {
					return false;
				}
				break;

			case 'IFRAME':
			case 'NOEMBED':
			case 'NOFRAMES':
			case 'XMP':
				if (
					text
						.toLowerCase()
						.includes( `</${ tagName.toLowerCase() }` )
				) {
					return false;
				}
				break;

			case 'STYLE':
				text = text.replace(
					/<\/(style)/gi,
					( _match, name ) => `\\3c\\2f${ name }`
				);
				break;

			case 'TEXTAREA':
			case 'TITLE':
				text = text.replace(
					new RegExp( `</(${ tagName })`, 'gi' ),
					( _match, name ) => `&lt;/${ name }`
				);

				// Keep a leading newline, which would otherwise be dropped.
				if ( 'TEXTAREA' === tagName && /^[\n\r]/.test( text ) ) {
					text = `\n${ text }`;
				}
				break;

			default:
				return false;
		}

		this.namedUpdates.set( 'modifiable text', {
			start: textStartsAt,
			length: this.textLength,
			text,
		} );
		return true;
	}

	private getScriptContentType(): 'javascript' | 'json' | null {
		if ( 'SCRIPT' !== this.getTag() || this.getNamespace() !== 'html' ) {
			return null;
		}

		const type = this.getAttribute( 'type' );

		if ( true === type || '' === type ) {
			return 'javascript';
		}

		const lang = this.getAttribute( 'language' );

		if (
			null === type &&
			( null === lang || true === lang || '' === lang )
		) {
			return 'javascript';
		}

		const typeString = (
			typeof type === 'string'
				? type.replace( /^[ \t\f\r\n]+|[ \t\f\r\n]+$/g, '' )
				: `text/${ lang }`
		).toLowerCase();

		if ( JAVASCRIPT_TYPES.includes( typeString ) ) {
			return 'javascript';
		}

		if ( JSON_TYPES.includes( typeString ) ) {
			return 'json';
		}

		return null;
	}

	/**
	 * Escapes `<script` and `</script` in JavaScript or JSON so it can't end
	 * the element, by writing the `s` as a Unicode escape.
	 *
	 * @param sourcecode Script contents.
	 */
	private static escapeJavascriptScriptContents(
		sourcecode: string
	): string {
		return sourcecode.replace(
			/(<\/?)([sS])(cript[ \t\f\r\n/>])/gi,
			( _match, opener, s, rest ) =>
				`${ opener }${ 's' === s ? '\\u0073' : '\\u0053' }${ rest }`
		);
	}

	/**
	 * Sets an attribute on the current tag. `true` writes it without a
	 * value; `false` removes it.
	 *
	 * @param name  Attribute name.
	 * @param value Attribute value.
	 */
	setAttribute( name: string, value: string | boolean ): boolean {
		if ( 'STATE_MATCHED_TAG' !== this.parserState || this.isClosingTag ) {
			return false;
		}

		if (
			0 === name.length ||
			/["'>&</ =\x00-\x1F]/.test( name ) ||
			hasNoncharacters( name )
		) {
			return false;
		}

		if ( false === value ) {
			return this.removeAttribute( name );
		}

		const updatedAttribute =
			true === value ? name : `${ name }="${ escapeText( value ) }"`;

		const comparableName = name.toLowerCase();
		const existingAttribute = this.attributes.get( comparableName );
		if ( existingAttribute ) {
			this.namedUpdates.set( comparableName, {
				start: existingAttribute.start,
				length: existingAttribute.length,
				text: updatedAttribute,
			} );
		} else {
			// Add it right after the tag name.
			this.namedUpdates.set( comparableName, {
				start:
					( this.tagNameStartsAt as number ) +
					( this.tagNameLength as number ),
				length: 0,
				text: ' ' + updatedAttribute,
			} );
		}

		// Setting `class` replaces any pending class changes.
		if ( 'class' === comparableName ) {
			this.classnameUpdates = new Map();
		}

		return true;
	}

	/**
	 * Removes an attribute, and any duplicates of it, from the current tag.
	 *
	 * @param name Attribute name.
	 */
	removeAttribute( name: string ): boolean {
		if ( 'STATE_MATCHED_TAG' !== this.parserState || this.isClosingTag ) {
			return false;
		}

		const comparableName = name.toLowerCase();

		// Removing `class` cancels any pending class changes.
		if ( 'class' === comparableName ) {
			this.classnameUpdates = new Map();
		}

		const attribute = this.attributes.get( comparableName );
		if ( ! attribute ) {
			// Cancel a pending addition.
			this.namedUpdates.delete( comparableName );
			return false;
		}

		this.namedUpdates.set( comparableName, {
			start: attribute.start,
			length: attribute.length,
			text: '',
		} );

		for ( const duplicate of this.duplicateAttributes?.get(
			comparableName
		) ?? [] ) {
			this.settledUpdates.push( { ...duplicate, text: '' } );
		}

		return true;
	}

	/**
	 * Adds a class to the current tag.
	 *
	 * @param className Class name.
	 */
	addClass( className: string ): boolean {
		return this.updateClass( className, true );
	}

	/**
	 * Removes a class from the current tag.
	 *
	 * @param className Class name.
	 */
	removeClass( className: string ): boolean {
		return this.updateClass( className, false );
	}

	private updateClass( className: string, add: boolean ): boolean {
		if ( 'STATE_MATCHED_TAG' !== this.parserState || this.isClosingTag ) {
			return false;
		}

		// In quirks mode, class names ignore case.
		if ( 'quirks-mode' === this.compatMode ) {
			for ( const updatedName of this.classnameUpdates.keys() ) {
				if ( equalsIgnoringCase( updatedName, className ) ) {
					this.classnameUpdates.set( updatedName, add );
					return true;
				}
			}
		}

		this.classnameUpdates.set( className, add );
		return true;
	}

	toString(): string {
		return this.getUpdatedHtml();
	}

	/**
	 * Applies the pending changes and returns the updated HTML.
	 */
	getUpdatedHtml(): string {
		const requiresNoUpdating =
			0 === this.classnameUpdates.size &&
			0 === this.namedUpdates.size &&
			0 === this.settledUpdates.length;
		if ( requiresNoUpdating ) {
			return this.html;
		}

		// Remember where the current tag starts, apply the updates, and
		// parse the tag again so its details match the new HTML.
		let beforeCurrentTag = this.tokenStartsAt ?? 0;
		this.classNameUpdatesToAttributesUpdates();
		beforeCurrentTag += this.applyAttributesUpdates( beforeCurrentTag );
		this.bytesAlreadyParsed = beforeCurrentTag;
		this.baseClassNextToken();

		return this.html;
	}

	private parseQuery( query: TagQuery | null ): void {
		if ( null !== query && query === this.lastQuery ) {
			return;
		}

		this.lastQuery = query;
		this.soughtTagName = null;
		this.soughtClassName = null;
		this.soughtMatchOffset = 1;
		this.stopOnTagClosers = false;

		if ( typeof query === 'string' ) {
			this.soughtTagName = query;
			return;
		}

		if ( null === query || typeof query !== 'object' ) {
			return;
		}

		if ( typeof query.tag_name === 'string' ) {
			this.soughtTagName = query.tag_name;
		}

		if ( typeof query.class_name === 'string' ) {
			this.soughtClassName = query.class_name;
		}

		if (
			Number.isInteger( query.match_offset ) &&
			( query.match_offset as number ) > 0
		) {
			this.soughtMatchOffset = query.match_offset as number;
		}

		if ( query.tag_closers !== undefined ) {
			this.stopOnTagClosers = 'visit' === query.tag_closers;
		}
	}

	private matches(): boolean {
		if ( this.isClosingTag && ! this.stopOnTagClosers ) {
			return false;
		}

		if (
			null !== this.soughtTagName &&
			! equalsIgnoringCase( this.getTag() as string, this.soughtTagName )
		) {
			return false;
		}

		if (
			null !== this.soughtClassName &&
			! this.hasClass( this.soughtClassName )
		) {
			return false;
		}

		return true;
	}
}
