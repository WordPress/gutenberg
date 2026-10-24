import { autop } from '@wordpress/autop';
import { createElement, RawHTML } from '@wordpress/element';
import { TagProcessor } from '@wordpress/html-api';
import type { Span } from '@wordpress/html-api';
import { createBlock } from './factory';
import { applyBuiltInValidationFixes } from './parser/apply-built-in-validation-fixes';
import { htmlToBlocks } from './raw-handling/html-to-blocks';
import { rawHandler } from './raw-handling';
import { getBlockType } from './registration';
import {
	getCommentAttributes,
	getCommentDelimitedContent,
	getSaveContent,
	serializeBlock,
	serializeBlockWithoutSource,
} from './serializer';
import type { Block } from '../types';

/*
 * Experimental: reads HTML without block delimiters as blocks, and saves
 * blocks without delimiters when reading the result back gives the same
 * block. Untouched blocks keep their HTML exactly as written; edited blocks
 * change only what the edit changed.
 */

declare global {
	interface Window {
		__experimentalOptionalBlockDelimiters?: boolean;
	}
}

/**
 * Whether block delimiters are optional.
 */
export function isUndelimitedEnabled(): boolean {
	return (
		typeof window !== 'undefined' &&
		!! window.__experimentalOptionalBlockDelimiters
	);
}

// Elements WordPress treats as blocks when adding paragraphs (`wpautop`).
// Anything else at the top level is inline content of a paragraph.
const BLOCK_ELEMENTS = new Set(
	(
		'TABLE THEAD TFOOT CAPTION COL COLGROUP TBODY TR TD TH DIV DL DD DT UL ' +
		'OL LI PRE FORM MAP AREA BLOCKQUOTE ADDRESS STYLE P H1 H2 H3 H4 H5 H6 ' +
		'HR FIELDSET LEGEND SECTION ARTICLE ASIDE HGROUP HEADER FOOTER NAV ' +
		'FIGURE FIGCAPTION DETAILS MENU SUMMARY'
	).split( ' ' )
);

const VOID_ELEMENTS = new Set(
	'AREA BASE BR COL EMBED HR IMG INPUT LINK META SOURCE TRACK WBR'.split(
		' '
	)
);

// Elements whose contents the tokenizer reads as part of the opening tag.
const RAW_TEXT_ELEMENTS = new Set(
	'SCRIPT STYLE TEXTAREA TITLE IFRAME NOEMBED NOFRAMES XMP'.split( ' ' )
);

// A blank line ends a paragraph of text.
const BLANK_LINE = /\n[ \t]*\n/;

class SpanProcessor extends TagProcessor {
	getSpan(): Span {
		this.setBookmark( 'here' );
		return { ...( this.bookmarks.get( 'here' ) as Span ) };
	}
}

interface Piece {
	html: string;
	before: string;
	bare: boolean;
}

/**
 * Splits HTML into top-level pieces: block elements, and paragraphs of text
 * and inline elements separated by blank lines.
 *
 * @param html HTML without delimiters.
 */
function splitPieces( html: string ): { pieces: Piece[]; after: string } {
	const processor = new SpanProcessor( html );
	const pieces: Piece[] = [];
	const openElements: string[] = [];
	// Where the piece being read starts, and whether it is inline content.
	let pieceStart: number | null = null;
	let isBare = false;
	let wasAt = 0;
	let lastEnd = 0;

	// Ends the piece at `end`, leaving out whitespace before it.
	const endPiece = ( end: number ) => {
		if ( pieceStart === null ) {
			return;
		}
		const trimmedEnd = Math.max(
			pieceStart,
			end -
				( /\s*$/.exec( html.slice( pieceStart, end ) )?.[ 0 ].length ??
					0 )
		);
		pieces.push( {
			before: html.slice( wasAt, pieceStart ),
			html: html.slice( pieceStart, trimmedEnd ),
			bare: isBare,
		} );
		wasAt = trimmedEnd;
		pieceStart = null;
	};

	const startPiece = ( start: number, bare: boolean ) => {
		if ( pieceStart === null ) {
			pieceStart = start;
			isBare = bare;
		}
	};

	while ( processor.nextToken() ) {
		const { start, length } = processor.getSpan();
		const end = start + length;
		lastEnd = end;
		const type = processor.getTokenType();
		const tag = processor.getTag() ?? '';
		const isOpener = type === '#tag' && ! processor.isTagCloser();
		// Void elements, and elements like SCRIPT whose contents are part of
		// the same token, don't stay open.
		const staysOpen =
			isOpener &&
			! VOID_ELEMENTS.has( tag ) &&
			! RAW_TEXT_ELEMENTS.has( tag );

		if ( openElements.length ) {
			// A block element closes an open paragraph, as in `<p>a<div>`.
			if (
				isOpener &&
				BLOCK_ELEMENTS.has( tag ) &&
				openElements[ openElements.length - 1 ] === 'P'
			) {
				openElements.pop();
			}
			if ( ! openElements.length ) {
				endPiece( start );
			} else {
				if ( type === '#tag' && processor.isTagCloser() ) {
					const at = openElements.lastIndexOf( tag );
					if ( at !== -1 ) {
						openElements.length = at;
					}
				} else if ( staysOpen ) {
					openElements.push( tag );
				}
				if ( ! openElements.length && ! isBare ) {
					endPiece( end );
				}
				continue;
			}
		}

		if ( type === '#text' ) {
			// Text ends a paragraph at each blank line.
			let at = start;
			for ( const part of html
				.slice( start, end )
				.split( /(\n[ \t]*\n\s*)/ ) ) {
				if ( BLANK_LINE.test( part ) ) {
					endPiece( at );
				} else if ( part.trim() ) {
					startPiece(
						at + ( /^\s*/.exec( part )?.[ 0 ].length ?? 0 ),
						true
					);
				}
				at += part.length;
			}
			continue;
		}

		// Block elements, and comments outside a paragraph, are pieces of
		// their own and end the paragraph before them. Stray closers are
		// inline content.
		if (
			( isOpener &&
				( BLOCK_ELEMENTS.has( tag ) ||
					RAW_TEXT_ELEMENTS.has( tag ) ) ) ||
			( type === '#comment' && pieceStart === null )
		) {
			endPiece( start );
			startPiece( start, false );
			if ( staysOpen ) {
				openElements.push( tag );
			} else {
				endPiece( end );
			}
			continue;
		}

		// Anything else is inline content of a paragraph.
		startPiece( start, true );
		if ( staysOpen ) {
			openElements.push( tag );
		}
	}

	// Keep whatever the tokenizer couldn't finish reading.
	if ( processor.pausedAtIncompleteToken() ) {
		startPiece(
			lastEnd +
				( /^\s*/.exec( html.slice( lastEnd ) )?.[ 0 ].length ?? 0 ),
			false
		);
	}
	endPiece( html.length );

	return { pieces, after: html.slice( wasAt ) };
}

/**
 * Returns the block a piece of HTML reads as, if any block reads it.
 *
 * @param html Piece of HTML.
 */
function readBlock( html: string ): Block | null {
	// Only read the piece as a block if the browser also sees one element.
	const doc = document.implementation.createHTMLDocument( '' );
	doc.body.innerHTML = html.trim();
	if (
		doc.body.childNodes.length !== 1 ||
		doc.body.firstChild?.nodeType !== doc.ELEMENT_NODE
	) {
		return null;
	}

	const blocks = htmlToBlocks( html, rawHandler );
	const blockType = getBlockType( blocks[ 0 ]?.name );
	if (
		blocks.length !== 1 ||
		! blockType ||
		blockType.name === 'core/html'
	) {
		return null;
	}
	// Read custom classes and global attributes, like the anchor, the way
	// the parser does for delimited blocks.
	return applyBuiltInValidationFixes(
		{ ...blocks[ 0 ], originalContent: html.trim() },
		blockType
	);
}

interface Element {
	tag: string;
	start: number;
	end?: number;
	children: Element[];
}

/**
 * Finds the outermost elements in HTML that a block reads, keeping each
 * block's HTML as written.
 *
 * @param html HTML, possibly with elements opened or closed outside it.
 */
function findBlocks(
	html: string
): Array< { start: number; end: number; block: Block } > {
	const processor = new SpanProcessor( html );
	const root: Element = { tag: '', start: 0, children: [] };
	const open = [ root ];
	while ( processor.nextToken() ) {
		if ( processor.getTokenType() !== '#tag' ) {
			continue;
		}
		const tag = processor.getTag() as string;
		const { start, length } = processor.getSpan();
		if ( processor.isTagCloser() ) {
			const at = open
				.map( ( element ) => element.tag )
				.lastIndexOf( tag );
			if ( at > 0 ) {
				open[ at ].end = start + length;
				open.length = at;
			}
			continue;
		}
		// A block element closes an open paragraph, as in `<p>a<div>`.
		if (
			BLOCK_ELEMENTS.has( tag ) &&
			open[ open.length - 1 ].tag === 'P'
		) {
			open.pop();
		}
		const element: Element = { tag, start, children: [] };
		open[ open.length - 1 ].children.push( element );
		if ( ! VOID_ELEMENTS.has( tag ) && ! RAW_TEXT_ELEMENTS.has( tag ) ) {
			open.push( element );
		}
	}

	const found: Array< { start: number; end: number; block: Block } > = [];
	const visit = ( { children }: Element ) => {
		for ( const element of children ) {
			const { start, end } = element;
			const block =
				end !== undefined && BLOCK_ELEMENTS.has( element.tag )
					? readBlock( html.slice( start, end ) )
					: null;
			if ( block ) {
				found.push( { start, end: end as number, block } );
			} else {
				visit( element );
			}
		}
	};
	visit( root );
	return found;
}

/**
 * Turns the elements in an HTML block's static HTML that blocks read into
 * inner blocks, kept without delimiters.
 *
 * @param innerContent Static HTML, with `null` where inner blocks are.
 * @param innerBlocks  Inner blocks.
 */
export function splitInnerBlocks(
	innerContent: Array< string | null >,
	innerBlocks: Block[]
): { innerContent: Array< string | null >; innerBlocks: Block[] } {
	const split: {
		innerContent: Array< string | null >;
		innerBlocks: Block[];
	} = { innerContent: [], innerBlocks: [] };
	let index = 0;
	for ( const part of innerContent ) {
		if ( part === null ) {
			split.innerContent.push( null );
			split.innerBlocks.push( innerBlocks[ index++ ] );
			continue;
		}
		let wasAt = 0;
		for ( const { start, end, block } of findBlocks( part ) ) {
			const html = part.slice( start, end );
			split.innerContent.push( part.slice( wasAt, start ), null );
			split.innerBlocks.push(
				addSource( block, html, html, { isInnerBlocks: true } )
			);
			wasAt = end;
		}
		split.innerContent.push( part.slice( wasAt ) );
	}
	return split;
}

/**
 * Returns the block for a piece of HTML, or an HTML block holding it as is,
 * with the blocks inside it editable.
 *
 * @param piece Piece of HTML.
 */
function pieceToBlock( piece: Piece ): Block {
	// Paragraphs of text get their `<p>` the way WordPress adds it.
	const block = readBlock( piece.bare ? autop( piece.html ) : piece.html );
	if ( block ) {
		return block;
	}
	const { innerContent, innerBlocks } = splitInnerBlocks(
		[ piece.html ],
		[]
	);
	return createBlock( 'core/html', {}, innerBlocks, innerContent );
}

/**
 * Returns a block's `save` output, with its inner blocks saved without
 * delimiters.
 *
 * @param block      Block.
 * @param innerHTMLs HTML for each inner block.
 */
function getSavedHTML( block: Block, innerHTMLs: string[] ): string {
	if ( block.name === 'core/html' ) {
		let index = 0;
		return ( block.innerContent ?? [] )
			.map( ( part ) => part ?? innerHTMLs[ index++ ] ?? '' )
			.join( '' )
			.trim();
	}
	return getSaveContent(
		block.name,
		block.attributes,
		createElement( RawHTML, { children: innerHTMLs.join( '' ) } ) as never
	);
}

/**
 * Returns a block's `save` output, with all inner blocks saved as they would
 * be without any source.
 *
 * @param block Block.
 */
function getPlainSavedHTML( block: Block ): string {
	return getSavedHTML( block, block.innerBlocks.map( getPlainSavedHTML ) );
}

/**
 * Reads HTML without delimiters as blocks.
 *
 * @param html HTML without delimiters.
 */
export function parseUndelimited( html: string ): Block[] {
	const { pieces, after } = splitPieces( html );
	return pieces.map( ( piece, index ) => {
		const block = pieceToBlock( piece );
		block.undelimitedSource = {
			html: piece.html,
			content: piece.html,
			before: piece.before,
			after: index === pieces.length - 1 ? after : '',
			bare: piece.bare,
			savedHTML: getPlainSavedHTML( block ),
			fingerprint: serializeBlockWithoutSource( block ),
		};
		return block;
	} );
}

interface Root {
	tag: string;
	attributes: Map< string, string | true >;
	classes: string[];
	openerEnd: number;
	closerStart: number;
	closerEnd: number;
}

/**
 * Reads the root element of a piece of HTML.
 *
 * @param html HTML of one element.
 */
function readRoot( html: string ): Root | null {
	const processor = new SpanProcessor( html );
	if ( ! processor.nextToken() || processor.getTokenType() !== '#tag' ) {
		return null;
	}

	const tag = processor.getTag() as string;
	const attributes = new Map< string, string | true >();
	for ( const name of processor.getAttributeNamesWithPrefix( '' ) ?? [] ) {
		attributes.set( name, processor.getAttribute( name ) as string | true );
	}
	const classes = [ ...processor.classList() ];
	const opener = processor.getSpan();
	const openerEnd = opener.start + opener.length;

	let closerStart = html.length;
	let closerEnd = html.length;
	while ( processor.nextToken() ) {
		const span = processor.getSpan();
		closerStart = html.length;
		closerEnd = html.length;
		if ( processor.isTagCloser() && processor.getTag() === tag ) {
			closerStart = span.start;
			closerEnd = span.start + span.length;
		}
	}

	return { tag, attributes, classes, openerEnd, closerStart, closerEnd };
}

/**
 * Splits an inline style into declarations, keyed by property name.
 *
 * @param style Value of a `style` attribute.
 */
export function readStyle( style: string ): Map< string, string > {
	const declarations = new Map< string, string >();
	for ( const declaration of style.split( ';' ) ) {
		const colonAt = declaration.indexOf( ':' );
		if ( colonAt !== -1 ) {
			declarations.set(
				declaration.slice( 0, colonAt ).trim().toLowerCase(),
				declaration.slice( colonAt + 1 ).trim()
			);
		}
	}
	return declarations;
}

/**
 * Applies the change between two style values to a third, keeping the
 * declarations the change didn't touch as written.
 *
 * @param style  Style to change.
 * @param before Style before the change.
 * @param after  Style after the change.
 */
function patchStyle( style: string, before: string, after: string ): string {
	const beforeDeclarations = readStyle( before );
	const afterDeclarations = readStyle( after );
	const declarations = style.split( ';' ).filter( ( declaration ) => {
		const name = declaration.split( ':' )[ 0 ].trim().toLowerCase();
		return (
			! (
				beforeDeclarations.has( name ) &&
				! afterDeclarations.has( name )
			) &&
			! (
				afterDeclarations.has( name ) &&
				afterDeclarations.get( name ) !== beforeDeclarations.get( name )
			)
		);
	} );
	for ( const [ name, value ] of afterDeclarations ) {
		if ( value !== beforeDeclarations.get( name ) ) {
			declarations.push( `${ name }:${ value }` );
		}
	}
	return declarations
		.filter( ( declaration ) => declaration.trim() )
		.join( ';' );
}

/**
 * Applies the change between a block's old and new `save` output to its
 * original HTML, keeping everything the change didn't touch as written.
 *
 * @param source Original HTML.
 * @param before `save` output when the block was read.
 * @param after  `save` output now.
 * @param bare   Whether the original is text without a wrapping element.
 */
function patch(
	source: string,
	before: string,
	after: string,
	bare: boolean
): string {
	const beforeRoot = readRoot( before );
	const afterRoot = readRoot( after );
	if ( ! beforeRoot || ! afterRoot || ( ! bare && ! readRoot( source ) ) ) {
		return after;
	}

	const innerAfter = after.slice(
		afterRoot.openerEnd,
		afterRoot.closerStart
	);

	// Text without a wrapping element stays that way if only the text changed.
	if ( bare ) {
		return before.slice( 0, beforeRoot.openerEnd ) ===
			after.slice( 0, afterRoot.openerEnd )
			? innerAfter
			: after;
	}

	const innerBefore = before.slice(
		beforeRoot.openerEnd,
		beforeRoot.closerStart
	);

	const processor = new TagProcessor( source );
	processor.nextToken();
	for ( const name of new Set( [
		...beforeRoot.attributes.keys(),
		...afterRoot.attributes.keys(),
	] ) ) {
		const beforeValue = beforeRoot.attributes.get( name );
		const afterValue = afterRoot.attributes.get( name );
		if ( name === 'class' || beforeValue === afterValue ) {
			continue;
		}
		if ( name === 'style' ) {
			const style = processor.getAttribute( 'style' );
			const patched = patchStyle(
				typeof style === 'string' ? style : '',
				typeof beforeValue === 'string' ? beforeValue : '',
				typeof afterValue === 'string' ? afterValue : ''
			);
			if ( patched ) {
				processor.setAttribute( 'style', patched );
			} else {
				processor.removeAttribute( 'style' );
			}
		} else if ( afterValue === undefined ) {
			processor.removeAttribute( name );
		} else {
			processor.setAttribute( name, afterValue );
		}
	}
	for ( const className of beforeRoot.classes ) {
		if ( ! afterRoot.classes.includes( className ) ) {
			processor.removeClass( className );
		}
	}
	for ( const className of afterRoot.classes ) {
		if ( ! beforeRoot.classes.includes( className ) ) {
			processor.addClass( className );
		}
	}

	let html = processor.getUpdatedHtml();
	const root = readRoot( html ) as Root;
	const inner =
		innerBefore === innerAfter
			? html.slice( root.openerEnd, root.closerStart )
			: innerAfter;
	const tagName = afterRoot.tag.toLowerCase();
	const opener =
		beforeRoot.tag === afterRoot.tag
			? html.slice( 0, root.openerEnd )
			: `<${ tagName }` +
				html.slice( 1 + root.tag.length, root.openerEnd );
	const closer =
		beforeRoot.tag === afterRoot.tag || root.closerStart === root.closerEnd
			? html.slice( root.closerStart )
			: `</${ tagName }>` + html.slice( root.closerEnd );
	html = opener + inner + closer;
	return html;
}

/**
 * Remembers the HTML a delimited block was read from, so it can be saved
 * that way unless it's edited.
 *
 * @param block                 Parsed block.
 * @param html                  The block as written, with delimiters.
 * @param content               HTML to apply edits to; defaults to the
 *                              block's `save` output.
 * @param options               Serialization options.
 * @param options.isInnerBlocks Whether the block is an inner block.
 */
export function addSource(
	block: Block,
	html: string,
	content: string | undefined,
	options: { isInnerBlocks: boolean }
): Block {
	let savedHTML = '';
	try {
		savedHTML = getPlainSavedHTML( block );
	} catch {}
	block.undelimitedSource = {
		html,
		content: content ?? savedHTML,
		before: '',
		after: '',
		bare: false,
		savedHTML,
		fingerprint: serializeBlockWithoutSource( block, options ),
	};
	return block;
}

/**
 * Returns a block and its inner blocks without the HTML they were read from.
 *
 * @param block Block.
 */
function withoutSources( block: Block ): Block {
	return {
		...block,
		undelimitedSource: undefined,
		innerBlocks: block.innerBlocks.map( withoutSources ),
	};
}

/**
 * Returns the HTML to save for a block. A block that had delimiters keeps
 * them; any other block gets them only if reading it back without them
 * wouldn't give the same block.
 *
 * @param block Block.
 */
function getBlockHTML( block: Block ): { html: string; delimited: boolean } {
	const source = block.undelimitedSource;
	const serialized = serializeBlockWithoutSource( block );
	if ( source && serialized === source.fingerprint ) {
		return { html: source.html, delimited: source.html !== source.content };
	}

	const blockType = getBlockType( block.name );
	const hadDelimiters = !! source && source.html !== source.content;
	const inner = block.innerBlocks.map( getBlockHTML );
	const hasDelimitedInner = inner.some( ( { delimited } ) => delimited );
	// The HTML block's static HTML can hold inner blocks with or without
	// delimiters.
	const isHTMLBlock = block.name === 'core/html';
	if (
		! blockType ||
		( ! isHTMLBlock &&
			( hasDelimitedInner ||
				( hadDelimiters && block.innerBlocks.length ) ) )
	) {
		return { html: serializeBlock( block ), delimited: true };
	}

	let saved: string;
	try {
		saved = getSavedHTML(
			block,
			inner.map( ( innerBlock ) => innerBlock.html )
		);
	} catch {
		return { html: serializeBlock( block ), delimited: true };
	}
	// The HTML block's static HTML is already as written.
	const html =
		source && ! isHTMLBlock
			? patch( source.content, source.savedHTML, saved, source.bare )
			: saved;

	if ( ! hadDelimiters && ! hasDelimitedInner ) {
		const [ readBack, ...rest ] = parseUndelimited( html );
		if (
			! rest.length &&
			readBack &&
			serializeBlockWithoutSource( withoutSources( readBack ) ) ===
				serializeBlockWithoutSource( withoutSources( block ) )
		) {
			return { html, delimited: false };
		}
	}

	// Keep the edited HTML, with a delimiter for what it can't hold. Text
	// without its element can't go inside a delimiter.
	return {
		html: getCommentDelimitedContent(
			block.name,
			getCommentAttributes( blockType, block.attributes ),
			source?.bare ? saved : html
		),
		delimited: true,
	};
}

/**
 * Saves blocks, leaving out delimiters wherever they aren't needed.
 *
 * @param blocks Blocks.
 */
export function serializeUndelimited( blocks: Block[] ): string {
	let content = '';
	let previous: Block | undefined;
	let previousIsBare = false;
	blocks.forEach( ( block ) => {
		const source = block.undelimitedSource;
		const { html, delimited } = getBlockHTML( block );
		const isBare =
			! delimited && !! source?.bare && ! html.startsWith( '<' );
		// Keep the whitespace that was written between blocks; new blocks
		// get a blank line.
		let before =
			( previous?.undelimitedSource?.after ?? '' ) +
			( source?.before ?? '' );
		if (
			previous &&
			( ! source || ! previous.undelimitedSource ) &&
			! before.includes( '\n' )
		) {
			before = '\n\n';
		}
		// Two paragraphs of text need a blank line to stay apart.
		if ( isBare && previousIsBare && ! BLANK_LINE.test( before ) ) {
			before = '\n\n';
		}
		content += before + html;
		previous = block;
		previousIsBare = isBare;
	} );
	return content + ( previous?.undelimitedSource?.after ?? '' );
}
