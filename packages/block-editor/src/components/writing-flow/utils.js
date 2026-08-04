/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { __unstableStripHTML as stripHTML } from '@wordpress/dom';
import {
	serialize,
	createBlock,
	pasteHandler,
	findTransform,
	getBlockTransforms,
	store as blocksStore,
} from '@wordpress/blocks';

/**
 * Internal dependencies
 */
import { getPasteEventData } from '../../utils/pasting';
import { store as blockEditorStore } from '../../store';

export const requiresWrapperOnCopy = Symbol( 'requiresWrapperOnCopy' );

/**
 * Sets the clipboard data for the provided blocks, with both HTML and plain
 * text representations.
 *
 * @param {ClipboardEvent} event    Clipboard event.
 * @param {WPBlock[]}      blocks   Blocks to set as clipboard data.
 * @param {Object}         registry The registry to select from.
 */
export function setClipboardBlocks( event, blocks, registry ) {
	let _blocks = blocks;

	const [ firstBlock ] = blocks;

	if ( firstBlock ) {
		const firstBlockType = registry
			.select( blocksStore )
			.getBlockType( firstBlock.name );

		if ( firstBlockType[ requiresWrapperOnCopy ] ) {
			const { getBlockRootClientId, getBlockName, getBlockAttributes } =
				registry.select( blockEditorStore );
			const wrapperBlockClientId = getBlockRootClientId(
				firstBlock.clientId
			);
			const wrapperBlockName = getBlockName( wrapperBlockClientId );

			if ( wrapperBlockName ) {
				_blocks = createBlock(
					wrapperBlockName,
					getBlockAttributes( wrapperBlockClientId ),
					_blocks
				);
			}
		}
	}

	const serialized = serialize( _blocks );

	event.clipboardData.setData( 'text/plain', toPlainText( serialized ) );
	event.clipboardData.setData( 'text/html', serialized );
}

/**
 * Returns the blocks to be pasted from the clipboard event.
 *
 * @param {ClipboardEvent} event                    The clipboard event.
 * @param {boolean}        canUserUseUnfilteredHTML Whether the user can or can't post unfiltered HTML.
 * @return {Array|string} A list of blocks or a string, depending on `handlerMode`.
 */
export function getPasteBlocks( event, canUserUseUnfilteredHTML ) {
	const { plainText, html, files } = getPasteEventData( event );
	let blocks = [];

	if ( files.length ) {
		const fromTransforms = getBlockTransforms( 'from' );
		blocks = files
			.reduce( ( accumulator, file ) => {
				const transformation = findTransform(
					fromTransforms,
					( transform ) =>
						transform.type === 'files' &&
						transform.isMatch( [ file ] )
				);
				if ( transformation ) {
					accumulator.push( transformation.transform( [ file ] ) );
				}
				return accumulator;
			}, [] )
			.flat();
	} else {
		blocks = pasteHandler( {
			HTML: html,
			plainText,
			mode: 'BLOCKS',
			canUserUseUnfilteredHTML,
		} );
	}

	return blocks;
}

/**
 * Given a string of HTML representing serialized blocks, returns the plain
 * text extracted after stripping the HTML of any tags and fixing line breaks.
 *
 * @param {string} html Serialized blocks.
 * @return {string} The plain-text content with any html removed.
 */
function toPlainText( html ) {
	// Manually handle BR tags as line breaks prior to `stripHTML` call
	html = html.replace( /<br>/g, '\n' );

	const plainText = stripHTML( html ).trim();

	// Merge any consecutive line breaks
	return plainText.replace( /\n\n+/g, '\n\n' );
}

/**
 * Makes the wrapper element an editing host, or stops it from being one. The
 * ARIA attributes travel with the editability: while the wrapper is the
 * active editing host it must present as a named multiline textbox, per the
 * WAI-ARIA textbox role, which requires an accessible name.
 *
 * @param {HTMLElement} node          Wrapper element.
 * @param {boolean}     value         Whether the wrapper should be an
 *                                    editing host.
 * @param {Object}      options
 * @param {boolean}     options.focus Move focus to the wrapper when it
 *                                    becomes an editing host (Firefox does
 *                                    not automatically move it). Default
 *                                    true.
 *
 * @return {boolean} Whether the wrapper is an editing host now.
 */
const editableRootElements = new WeakMap();

/**
 * Returns the element currently acting as the editing host for the wrapper,
 * or null when none is engaged.
 *
 * @param {HTMLElement} node Wrapper element.
 *
 * @return {?HTMLElement} The engaged editing host.
 */
export function getEditableRootElement( node ) {
	return editableRootElements.get( node ) ?? null;
}

/**
 * Resolves the element that should act as the editing host: the closest
 * block list container of the current selection, so the host wraps only
 * block content (never e.g. the post title), and nests with the block
 * structure. Falls back to the root block list container, then the wrapper.
 *
 * @param {HTMLElement} node Wrapper element.
 *
 * @return {HTMLElement} The element to make the editing host.
 */
function resolveEditableRootElement( node ) {
	const selection = node.ownerDocument.defaultView.getSelection();

	if ( ! selection.rangeCount ) {
		return node;
	}

	const closestBlock = ( selectionNode ) => {
		const element =
			selectionNode?.nodeType === selectionNode?.ELEMENT_NODE
				? selectionNode
				: selectionNode?.parentElement;
		return element?.closest( '[data-block]' ) ?? null;
	};
	const anchorBlock = closestBlock( selection.anchorNode );
	const focusBlock = closestBlock( selection.focusNode ) ?? anchorBlock;

	if ( ! anchorBlock ) {
		return node;
	}

	// A block list is the direct parent of its blocks. Promote to the outer
	// list, through the block wrapping it, until the list contains the whole
	// selection.
	let layout = anchorBlock.parentElement;

	while (
		layout &&
		node.contains( layout ) &&
		! layout.contains( focusBlock )
	) {
		layout =
			layout.parentElement?.closest( '[data-block]' )?.parentElement ??
			null;
	}

	return layout && node.contains( layout ) ? layout : node;
}

export function setContentEditableWrapper(
	node,
	value,
	{ focus = true } = {}
) {
	const engaged = editableRootElements.get( node );

	if ( ! value ) {
		if ( ! engaged ) {
			return false;
		}
		editableRootElements.delete( node );
		engaged.contentEditable = false;
		engaged.removeAttribute( 'contenteditable' );
		engaged.removeAttribute( 'role' );
		engaged.removeAttribute( 'aria-multiline' );
		engaged.removeAttribute( 'aria-label' );
		return false;
	}

	const host = resolveEditableRootElement( node );

	// Check first: this is called on every selection change, and setting
	// contentEditable triggers a style recalculation.
	if ( engaged === host && host.contentEditable === 'true' ) {
		return true;
	}

	if ( engaged && engaged !== host ) {
		setContentEditableWrapper( node, false );
	}

	const target = host;
	editableRootElements.set( node, target );

	target.contentEditable = value;

	// Only act as an editing host if the environment supports it (JSDOM
	// does not implement contentEditable): without editing host semantics
	// the element must not claim focus or textbox semantics.
	if ( ! target.isContentEditable ) {
		target.removeAttribute( 'contenteditable' );
		editableRootElements.delete( node );
		return false;
	}

	// Expose the host as a named multiline textbox so it has a role and
	// accessible name once it takes focus. The label is generic because the
	// host can span several blocks.
	target.setAttribute( 'role', 'textbox' );
	target.setAttribute( 'aria-multiline', 'true' );
	target.setAttribute( 'aria-label', __( 'Editor canvas' ) );

	if ( focus ) {
		// Without preventScroll, focusing the host scrolls the viewport to
		// the top of the host.
		target.focus( { preventScroll: true } );
	}

	return true;
}
