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
import type { Block, BlockFilesTransform } from '@wordpress/blocks';
import type { DataRegistry } from '@wordpress/data';
import type { ClipboardEvent as ReactClipboardEvent } from 'react';
import { getPasteEventData } from '../../utils/pasting';
import { store as blockEditorStore } from '../../store';
import { getBoundAttributesForCopy } from '../provider/block-refs-provider';
import type { AttributesForCopy } from '../provider/types';

export const requiresWrapperOnCopy = Symbol( 'requiresWrapperOnCopy' );

export function getBoundPartialBlockForCopy(
	block: Block,
	partialBlock: Block,
	attributesForCopy: AttributesForCopy | undefined,
	{
		attributeKey,
		startOffset = 0,
		endOffset,
	}: { attributeKey?: string; startOffset?: number; endOffset?: number }
) {
	const boundAttributes = getBoundAttributesForCopy(
		block,
		attributesForCopy
	);
	if ( ! boundAttributes ) {
		return partialBlock;
	}
	const attributes = { ...partialBlock.attributes, ...boundAttributes };
	if ( Object.hasOwn( boundAttributes, attributeKey! ) ) {
		const value = create( {
			html: boundAttributes[ attributeKey! ] as string,
		} );
		attributes[ attributeKey! ] = toHTMLString( {
			value: slice( value, startOffset, endOffset ?? value.text.length ),
		} );
	}
	return { ...partialBlock, attributes };
}

export function getClipboardBlocksContent(
	blocks: Block[],
	registry: Pick< DataRegistry, 'select' >,
	attributesForCopy?: AttributesForCopy,
	{ addWrapper = false } = {}
) {
	let hasBoundAttributes = false;
	function resolveBlockForCopy( block: Block ): Block {
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

	let blocksForCopy: Block | Block[] = blocks.map( resolveBlockForCopy );

	const [ firstBlock ] = blocks;

	if ( addWrapper && firstBlock ) {
		const firstBlockType = registry
			.select( blocksStore )
			.getBlockType( firstBlock.name );

		// Block types opt in through a private symbol key.
		if (
			( firstBlockType as unknown as Record< symbol, unknown > )[
				requiresWrapperOnCopy
			]
		) {
			const { getBlockRootClientId, getBlockName, getBlockAttributes } =
				registry.select( blockEditorStore );
			const wrapperBlockClientId = getBlockRootClientId(
				firstBlock.clientId
			);
			const wrapperBlockName = getBlockName( wrapperBlockClientId );

			if ( wrapperBlockName ) {
				blocksForCopy = createBlock(
					wrapperBlockName,
					getBlockAttributes( wrapperBlockClientId! )!,
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
 * @param event             Clipboard event.
 * @param blocks            Blocks to set as clipboard data.
 * @param registry          The registry to select from.
 * @param attributesForCopy Resolved bound attributes by block instance.
 */
export function setClipboardBlocks(
	event: ClipboardEvent | ReactClipboardEvent,
	blocks: Block[],
	registry: Pick< DataRegistry, 'select' >,
	attributesForCopy?: AttributesForCopy
) {
	const { html, plainText } = getClipboardBlocksContent(
		blocks,
		registry,
		attributesForCopy,
		{ addWrapper: true }
	);

	event.clipboardData!.setData( 'text/plain', plainText );
	event.clipboardData!.setData( 'text/html', html );
}

/**
 * Returns the blocks to be pasted from the clipboard event.
 *
 * @param event                    The clipboard event.
 * @param event.clipboardData
 * @param canUserUseUnfilteredHTML Whether the user can or can't post unfiltered HTML.
 * @return A list of blocks.
 */
export function getPasteBlocks(
	event: { clipboardData: DataTransfer },
	canUserUseUnfilteredHTML?: boolean
): Block[] {
	// Callers pass paste events, whose clipboard data can be read.
	const { plainText, html, files } = getPasteEventData( event )!;
	let blocks: Block[] = [];

	if ( files.length ) {
		const fromTransforms = getBlockTransforms( 'from' );
		blocks = files
			.reduce< ( Block | Block[] )[] >( ( accumulator, file ) => {
				const transformation = findTransform(
					fromTransforms,
					( transform ) =>
						transform.type === 'files' &&
						// Files transforms define a matcher.
						transform.isMatch!( [ file ] )
				);
				if ( transformation ) {
					accumulator.push(
						// The predicate only matches files transforms, which transform.
						( transformation as BlockFilesTransform ).transform!( [
							file,
						] )
					);
				}
				return accumulator;
			}, [] )
			.flat();
	} else {
		// The `BLOCKS` mode returns blocks.
		blocks = pasteHandler( {
			HTML: html,
			plainText,
			mode: 'BLOCKS',
			// @ts-expect-error `pasteHandler` ignores this option.
			canUserUseUnfilteredHTML,
		} ) as Block[];
	}

	return blocks;
}

/**
 * Given a string of HTML representing serialized blocks, returns the plain
 * text extracted after stripping the HTML of any tags and fixing line breaks.
 *
 * @param html Serialized blocks.
 * @return The plain-text content with any html removed.
 */
function toPlainText( html: string ): string {
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
 * @param node          Wrapper element.
 * @param value         Whether the wrapper should be an
 *                      editing host.
 * @param options
 * @param options.focus Move focus to the wrapper when it
 *                      becomes an editing host (Firefox does
 *                      not automatically move it). Default
 *                      true.
 *
 * @return Whether the wrapper is an editing host now.
 */
export function setContentEditableWrapper(
	node: HTMLElement,
	value: boolean,
	{ focus = true }: { focus?: boolean } = {}
): boolean {
	// Check first: this is called on every selection change, and setting
	// contentEditable triggers a style recalculation.
	if ( node.contentEditable === String( value ) ) {
		return value;
	}

	// The DOM stringifies the boolean.
	node.contentEditable = value as unknown as string;

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
