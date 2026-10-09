import { __ } from '@wordpress/i18n';
import { __unstableStripHTML as stripHTML } from '@wordpress/dom';
import { create, slice, toHTMLString } from '@wordpress/rich-text';
import {
	serialize,
	createBlock,
	pasteHandler,
	findTransform,
	getBlockTransforms,
	store as blocksStore,
} from '@wordpress/blocks';
import { getPasteEventData } from '../../utils/pasting';
import { store as blockEditorStore } from '../../store';
import { getBoundAttributesForCopy } from '../provider/block-refs-provider';

export const requiresWrapperOnCopy = Symbol( 'requiresWrapperOnCopy' );

export function getBoundPartialBlockForCopy(
	block,
	partialBlock,
	attributesForCopy,
	{ attributeKey, startOffset = 0, endOffset }
) {
	const boundAttributes = getBoundAttributesForCopy(
		block,
		attributesForCopy
	);
	if ( ! boundAttributes ) {
		return partialBlock;
	}
	const attributes = { ...partialBlock.attributes, ...boundAttributes };
	if ( Object.hasOwn( boundAttributes, attributeKey ) ) {
		const value = create( { html: boundAttributes[ attributeKey ] } );
		attributes[ attributeKey ] = toHTMLString( {
			value: slice( value, startOffset, endOffset ?? value.text.length ),
		} );
	}
	return { ...partialBlock, attributes };
}

export function getClipboardBlocksContent(
	blocks,
	registry,
	attributesForCopy,
	{ addWrapper = false } = {}
) {
	let hasBoundAttributes = false;
	function resolveBlockForCopy( block ) {
		const boundAttributes = getBoundAttributesForCopy(
			block,
			attributesForCopy
		);
		const innerBlocks = block.innerBlocks.map( resolveBlockForCopy );
		const hasChangedInnerBlocks = innerBlocks.some(
			( innerBlock, index ) => innerBlock !== block.innerBlocks[ index ]
		);

		if ( ! boundAttributes && ! hasChangedInnerBlocks ) {
			return block;
		}

		hasBoundAttributes ||= !! boundAttributes;
		return {
			...block,
			attributes: boundAttributes
				? { ...block.attributes, ...boundAttributes }
				: block.attributes,
			innerBlocks,
		};
	}

	let blocksForCopy = blocks.map( resolveBlockForCopy );

	const [ firstBlock ] = blocks;

	if ( addWrapper && firstBlock ) {
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
				blocksForCopy = createBlock(
					wrapperBlockName,
					getBlockAttributes( wrapperBlockClientId ),
					blocksForCopy
				);
			}
		}
	}

	const html = serialize( blocksForCopy );

	return { html, plainText: toPlainText( html ), hasBoundAttributes };
}

/**
 * Sets the clipboard data for the provided blocks, with both HTML and plain
 * text representations.
 *
 * @param {ClipboardEvent} event             Clipboard event.
 * @param {WPBlock[]}      blocks            Blocks to set as clipboard data.
 * @param {Object}         registry          The registry to select from.
 * @param {Map}            attributesForCopy Resolved bound attributes by block instance.
 */
export function setClipboardBlocks(
	event,
	blocks,
	registry,
	attributesForCopy
) {
	const { html, plainText } = getClipboardBlocksContent(
		blocks,
		registry,
		attributesForCopy,
		{ addWrapper: true }
	);

	event.clipboardData.setData( 'text/plain', plainText );
	event.clipboardData.setData( 'text/html', html );
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
export function setContentEditableWrapper(
	node,
	value,
	{ focus = true } = {}
) {
	// Check first: this is called on every selection change, and setting
	// contentEditable triggers a style recalculation.
	if ( node.contentEditable === String( value ) ) {
		return value;
	}

	node.contentEditable = value;

	if ( ! value ) {
		node.removeAttribute( 'role' );
		node.removeAttribute( 'aria-multiline' );
		node.removeAttribute( 'aria-label' );
		return false;
	}

	// Only act as an editing host if the environment supports it (JSDOM
	// does not implement contentEditable): without editing host semantics
	// the wrapper must not claim focus or textbox semantics.
	if ( ! node.isContentEditable ) {
		node.removeAttribute( 'contenteditable' );
		return false;
	}

	// Expose the host as a named multiline textbox so it has a role and
	// accessible name once it takes focus. The label is generic because the
	// host can span several blocks.
	node.setAttribute( 'role', 'textbox' );
	node.setAttribute( 'aria-multiline', 'true' );
	node.setAttribute( 'aria-label', __( 'Editor canvas' ) );

	if ( focus ) {
		// Without preventScroll, focusing the wrapper scrolls the
		// viewport to the top of the wrapper.
		node.focus( { preventScroll: true } );
	}

	return true;
}
