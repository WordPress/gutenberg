import { autop } from '@wordpress/autop';
import { createElement, RawHTML } from '@wordpress/element';
import { createBlock } from './factory';
import parse from './parser';
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
 * Reads HTML without block delimiters as blocks, and saves
 * blocks without delimiters when reading the result back gives the same
 * block. HTML outside delimiters is read and written by the browser, so it
 * comes back tidied, but blocks add nothing to it unless they're edited, and
 * then change only what the edit changed.
 */

/**
 * Whether HTML can be read as blocks: that needs the browser's parser, for
 * the blocks' raw transforms, and the HTML block, for HTML no other block
 * reads. Without them, HTML is read and saved as before.
 */
export function canReadHTML(): boolean {
	return typeof document !== 'undefined' && !! getBlockType( 'core/html' );
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

// Elements that are pieces of their own, like block elements.
const RAW_TEXT_ELEMENTS = new Set(
	'SCRIPT STYLE TEXTAREA TITLE IFRAME NOEMBED NOFRAMES XMP'.split( ' ' )
);

// Marks where a delimited block sits in HTML without delimiters.
const SLOT = '<!--wp-delimited-block-->';

// A blank line ends a paragraph of text.
const BLANK_LINE = /\n[ \t]*\n/;

/**
 * Returns the body of a new document holding some HTML.
 *
 * @param html HTML.
 */
function getBody( html: string ): HTMLElement {
	const { body } = document.implementation.createHTMLDocument( '' );
	body.innerHTML = html;
	return body;
}

/**
 * Returns the HTML of some nodes, as the browser writes it.
 *
 * @param nodes Nodes.
 */
function getHTML( nodes: Node[] ): string {
	const container = document.createElement( 'div' );
	container.append( ...nodes );
	return container.innerHTML;
}

/**
 * Returns the element a piece of HTML is, if it's exactly one element.
 *
 * @param html HTML.
 */
export function getRootElement( html: string ): Element | null {
	const body = getBody( html.trim() );
	return body.childNodes.length === 1 ? body.firstElementChild : null;
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
	const pieces: Piece[] = [];
	// Whitespace since the last piece, and the inline nodes of a paragraph.
	let whitespace = '';
	let paragraph: { before: string; nodes: Node[] } | null = null;

	const endParagraph = () => {
		if ( ! paragraph ) {
			return;
		}
		const paragraphHTML = getHTML( paragraph.nodes );
		const trimmed = paragraphHTML.trimEnd();
		pieces.push( { before: paragraph.before, html: trimmed, bare: true } );
		whitespace = paragraphHTML.slice( trimmed.length );
		paragraph = null;
	};

	const addInline = ( node: Node ) => {
		paragraph ??= { before: whitespace, nodes: [] };
		whitespace = '';
		paragraph.nodes.push( node );
	};

	for ( const node of Array.from( getBody( html ).childNodes ) ) {
		if ( node.nodeType === node.TEXT_NODE ) {
			// Text ends a paragraph at each blank line.
			for ( const part of ( node.textContent ?? '' ).split(
				/(\n[ \t]*\n\s*)/
			) ) {
				if ( BLANK_LINE.test( part ) ) {
					endParagraph();
					whitespace += part;
				} else if ( part.trim() || paragraph ) {
					const leading = paragraph ? '' : /^\s*/.exec( part )![ 0 ];
					whitespace += leading;
					addInline(
						document.createTextNode( part.slice( leading.length ) )
					);
				} else {
					whitespace += part;
				}
			}
			continue;
		}

		// Block elements, and comments outside a paragraph, are pieces of
		// their own and end the paragraph before them.
		const tag = ( node as Element ).tagName;
		if (
			BLOCK_ELEMENTS.has( tag ) ||
			RAW_TEXT_ELEMENTS.has( tag ) ||
			( node.nodeType === node.COMMENT_NODE &&
				( ! paragraph || getHTML( [ node.cloneNode() ] ) === SLOT ) )
		) {
			endParagraph();
			pieces.push( {
				before: whitespace,
				html: getHTML( [ node ] ),
				bare: false,
			} );
			whitespace = '';
			continue;
		}

		// Anything else is inline content of a paragraph.
		addInline( node );
	}
	endParagraph();

	return { pieces, after: whitespace };
}

/**
 * Returns the block a piece of HTML reads as, if any block reads it.
 *
 * @param html Piece of HTML.
 */
function readBlock( html: string ): Block | null {
	// Only read the piece as a block if the browser also sees one element.
	if ( ! getRootElement( html ) ) {
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

// Marks where found inner blocks are in an HTML block's static HTML.
const FOUND = '<!--wp-inner-block-->';

/**
 * Returns the block for a piece of HTML, or an HTML block holding it, with
 * the elements in it that blocks read, and the delimited blocks in it, as
 * inner blocks.
 *
 * @param piece     Piece of HTML.
 * @param delimited Delimited blocks still to place, in order.
 */
function pieceToBlock( piece: Piece, delimited: Block[] ): Block {
	if ( piece.html === SLOT ) {
		return delimited.shift() as Block;
	}

	// Paragraphs of text get their `<p>` the way WordPress adds it.
	const block = piece.html.includes( SLOT )
		? null
		: readBlock( piece.bare ? autop( piece.html ) : piece.html );
	if ( block ) {
		return block;
	}

	const body = getBody( piece.html );
	const found: Block[] = [];
	const visit = ( parent: Element ) => {
		for ( const element of Array.from( parent.children ) ) {
			const html = element.outerHTML;
			const innerBlock =
				BLOCK_ELEMENTS.has( element.tagName ) && ! html.includes( SLOT )
					? readBlock( html )
					: null;
			if ( innerBlock ) {
				found.push(
					addSource( innerBlock, html, html, { isInnerBlocks: true } )
				);
				element.replaceWith( getBody( FOUND ).firstChild as Comment );
			} else {
				visit( element );
			}
		}
	};
	visit( body );

	// Inner blocks, found and delimited, in the order they appear.
	const innerContent: Array< string | null > = [];
	const innerBlocks: Block[] = [];
	body.innerHTML
		.split( new RegExp( `(${ FOUND }|${ SLOT })` ) )
		.forEach( ( part, index ) => {
			if ( index % 2 ) {
				innerContent.push( null );
				innerBlocks.push(
					( part === FOUND ? found : delimited ).shift() as Block
				);
			} else {
				innerContent.push( part );
			}
		} );
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
 * Reads HTML outside delimiters as blocks. Delimited blocks inside an element
 * of it become inner blocks of an HTML block.
 *
 * @param parts HTML outside delimiters, and the delimited blocks between it.
 */
export function parseUndelimited( parts: Array< string | Block > ): Block[] {
	const delimited = parts.filter(
		( part ): part is Block => typeof part !== 'string'
	);
	const { pieces, after } = splitPieces(
		parts
			.map( ( part ) => ( typeof part === 'string' ? part : SLOT ) )
			.join( '' )
	);
	return pieces.map( ( piece, index ) => {
		const block = pieceToBlock( piece, delimited );
		const whitespace = {
			before: piece.before,
			after: index === pieces.length - 1 ? after : '',
			isFirst: index === 0,
		};
		if ( piece.html === SLOT ) {
			Object.assign( block.undelimitedSource ?? {}, whitespace );
			return block;
		}
		// The HTML as written, with any delimited blocks in it as written.
		const html = piece.html.includes( SLOT )
			? getSavedHTML(
					block,
					block.innerBlocks.map(
						( innerBlock ) =>
							innerBlock.undelimitedSource?.html ?? ''
					)
				)
			: piece.html;
		block.undelimitedSource = {
			html,
			content: html,
			...whitespace,
			bare: piece.bare,
			savedHTML: getPlainSavedHTML( block ),
			fingerprint: serializeBlockWithoutSource( block ),
		};
		return block;
	} );
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
	const beforeRoot = getRootElement( before );
	const afterRoot = getRootElement( after );
	const root = bare ? null : getRootElement( source );
	if ( ! beforeRoot || ! afterRoot || ( ! bare && ! root ) ) {
		return after;
	}

	// Text without a wrapping element stays that way if only the text changed.
	if ( ! root ) {
		return getHTML( [ beforeRoot.cloneNode() ] ) ===
			getHTML( [ afterRoot.cloneNode() ] )
			? afterRoot.innerHTML
			: after;
	}

	for ( const name of new Set( [
		...beforeRoot.getAttributeNames(),
		...afterRoot.getAttributeNames(),
	] ) ) {
		const beforeValue = beforeRoot.getAttribute( name );
		const afterValue = afterRoot.getAttribute( name );
		if ( name === 'class' || beforeValue === afterValue ) {
			continue;
		}
		if ( name === 'style' ) {
			const patched = patchStyle(
				root.getAttribute( 'style' ) ?? '',
				beforeValue ?? '',
				afterValue ?? ''
			);
			if ( patched ) {
				root.setAttribute( 'style', patched );
			} else {
				root.removeAttribute( 'style' );
			}
		} else if ( afterValue === null ) {
			root.removeAttribute( name );
		} else {
			root.setAttribute( name, afterValue );
		}
	}
	for ( const className of beforeRoot.classList ) {
		if ( ! afterRoot.classList.contains( className ) ) {
			root.classList.remove( className );
		}
	}
	for ( const className of afterRoot.classList ) {
		if ( ! beforeRoot.classList.contains( className ) ) {
			root.classList.add( className );
		}
	}
	if ( ! root.classList.length ) {
		root.removeAttribute( 'class' );
	}
	if ( beforeRoot.innerHTML !== afterRoot.innerHTML ) {
		root.innerHTML = afterRoot.innerHTML;
	}
	if ( beforeRoot.tagName === afterRoot.tagName ) {
		return root.outerHTML;
	}
	const renamed = document.createElement( afterRoot.localName );
	for ( const { name, value } of Array.from( root.attributes ) ) {
		renamed.setAttribute( name, value );
	}
	renamed.append( ...root.childNodes );
	return renamed.outerHTML;
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
		isFirst: false,
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
 * Returns the HTML to save for a block. New blocks, and blocks that had
 * delimiters, get them; blocks written without get them only if reading them
 * back without would give a different block.
 *
 * @param block    Block.
 * @param isInside Whether the block is inside another block's `save`, which
 *                 is read back as a whole.
 */
function getBlockHTML(
	block: Block,
	isInside = false
): { html: string; delimited: boolean } {
	const source = block.undelimitedSource;
	const serialized = serializeBlockWithoutSource( block );
	if ( source && serialized === source.fingerprint ) {
		return { html: source.html, delimited: source.html !== source.content };
	}

	// Invalid blocks keep the HTML they were read from, and without a way to
	// read HTML back there's no telling whether a delimiter is needed.
	if ( ! block.isValid || ! canReadHTML() ) {
		return { html: serializeBlock( block ), delimited: true };
	}

	// New blocks get delimiters, classic blocks too. Blocks inside another
	// block follow it.
	if ( ! source && ! isInside ) {
		return {
			html: serializeBlock( block, { isInnerBlocks: true } ),
			delimited: true,
		};
	}

	const blockType = getBlockType( block.name );
	const hadDelimiters = !! source && source.html !== source.content;
	// The HTML block's static HTML can hold inner blocks with or without
	// delimiters.
	const isHTMLBlock = block.name === 'core/html';
	const inner = block.innerBlocks.map( ( innerBlock ) =>
		getBlockHTML( innerBlock, ! isHTMLBlock )
	);
	const hasDelimitedInner = inner.some( ( { delimited } ) => delimited );
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

	// The HTML block can hold delimited inner blocks without a delimiter.
	if ( ! hadDelimiters && ( isHTMLBlock || ! hasDelimitedInner ) ) {
		if ( isInside ) {
			return { html, delimited: false };
		}
		const [ readBack, ...rest ] = parse( html );
		if (
			! rest.length &&
			readBack &&
			serializeBlockWithoutSource( withoutSources( readBack ) ) ===
				serializeBlockWithoutSource( withoutSources( block ) )
		) {
			return { html, delimited: false };
		}
	}

	// Inner blocks without delimiters can't go inside one.
	if ( ! isHTMLBlock && block.innerBlocks.length ) {
		return { html: serializeBlock( block ), delimited: true };
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
			( previous || source?.isFirst ? ( source?.before ?? '' ) : '' );
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
