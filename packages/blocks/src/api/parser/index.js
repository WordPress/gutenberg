/**
 * WordPress dependencies
 */
import { parse as grammarParse } from '@wordpress/block-serialization-default-parser';
import { autop } from '@wordpress/autop';

/**
 * Internal dependencies
 */
import {
	getFreeformContentHandlerName,
	getUnregisteredTypeHandlerName,
	getBlockType,
} from '../registration';
import { getSaveContent } from '../serializer';
import { validateBlock } from '../validation';
import { createBlock } from '../factory';
import { convertLegacyBlockNameAndAttributes } from './convert-legacy-block';
import { serializeRawBlock } from './serialize-raw-block';
import { getBlockAttributes } from './get-block-attributes';
import { applyBlockDeprecatedVersions } from './apply-block-deprecated-versions';
import { applyBuiltInValidationFixes } from './apply-built-in-validation-fixes';

/**
 * The "block node" represents a transition from serialized block data
 * into a fully-loaded block with its implementation. It contains the
 * information parsed from the input document; be that serialized HTML
 * as is the default case in WordPress, or directly loaded from a
 * structured data store.
 *
 * Block nodes do not indicate all of a block's attributes, as some of
 * its attributes may be sourced later on from the `innerHTML` by the
 * block implementation. This is one example of where the block node
 * is not a complete "block" and requires further processing.
 *
 * Block validation only examines `innerHTML` and delegates the validation
 * of any inner blocks to the block loading process for those blocks.
 * This prevents an issue with a potentially deeply-nested inner block
 * from cascading up and invalidating all of its parent blocks.
 *
 * @typedef {Object} BlockNode
 *
 * @property {string|null}     blockName    Name indicating namespaced block type, e.g. "my-plugin/my-block".
 *                                          A `null` block name is given to a section of freeform HTML content.
 * @property {Object|null}     attrs        Attributes sourced from parsed JSON in the block comment delimiters.
 *                                          When unable to parse block comment attributes, `attrs` will be `null`.
 * @property {BlockNode[]}     innerBlocks  Nested block nodes; may be empty.
 * @property {(string|null)[]} innerContent Indicates arrangement of text chunks and inner blocks.
 * @property {string}          innerHTML    Full text inside block boundaries excluding inner block content.
 */

/**
 * Fully parsed and runnable Gutenberg block.
 *
 * A runnable block combines a parsed block node with a matching
 * block implementation. The implementation provides an `edit`
 * (and possibly a `save`) function used to interact with the
 * block node inside the editor and to serialize its contents
 * on save.
 *
 * These blocks may be substantially different from parsed block
 * nodes which created them as the loading process may run the
 * block through a pipeline of automatic fixes, normalization,
 * and upgrade through the deprecation process.
 *
 * It's possible that the editor was unable to recognize a block
 * during the loading process. In such a case the block object
 * may be an entirely different block than one expects from the
 * block node which created it.
 *
 * Unrecognizable blocks exist for a few different reasons:
 *  - Raw HTML was found in the input document and wrapped in
 *    a "freeform" block to represent that non-block content.
 *  - A block node specifies a block type that isn't registered
 *    in the editor and is wrapped in a "missing" block.
 *  - Blocks which fail validation will be tagged with a `false`
 *    value for `isValid`.
 *
 * Except for freeform HTML content, the editor is unable to
 * interact with unrecognizable blocks and will be inert in
 * the editor unless converted into a recognizable block.
 *
 * @typedef {Object} WPBlock
 *
 * @property {string}    name                    Name indicating namespaced block type, e.g. "my-plugin/my-block".
 * @property {Object}    attributes              All block attributes, combining those present in the associated
 *                                               block node which created this block, and those which the block
 *                                               implementation sourced from the block's `innerHTML`.
 * @property {WPBlock[]} innerBlocks             Nested inner blocks; may be empty.
 * @property {string}    originalContent         Original content of the block before validation fixes.
 * @property {boolean}   isValid                 Whether the editor recognizes the block and can interact with it.
 * @property {Object[]}  validationIssues        Validation issues.
 * @property {BlockNode} [__unstableBlockSource] Original unprocessed block node which created this block, if available.
 */

/**
 * @typedef  {Object}  ParseOptions
 * @property {boolean?} __unstableSkipMigrationLogs If a block is migrated from a deprecated version, skip logging the migration details.
 * @property {boolean?} __unstableSkipAutop         Whether to skip autop when processing freeform content.
 */

/**
 * Convert legacy blocks to their canonical form. This function is used
 * both in the parser level for previous content and to convert such blocks
 * used in Custom Post Types templates.
 *
 * @param {BlockNode} block
 *
 * @return {BlockNode} The block's name and attributes, changed accordingly if a match was found
 */
function convertLegacyBlocks( block ) {
	const { blockName: rawBlockName, attrs: rawAttrs } = block;

	const [ blockName, attrs ] = convertLegacyBlockNameAndAttributes(
		rawBlockName,
		rawAttrs
	);

	const needsCorrection = blockName !== rawBlockName || attrs !== rawAttrs;

	// Avoid cloning block data if no conversion was performed.
	return needsCorrection ? { ...block, blockName, attrs } : block;
}

/**
 * Normalize the raw block by applying the fallback block name if none given,
 * sanitize the parsed HTML...
 *
 * @param {BlockNode}     rawBlock The raw block object.
 * @param {ParseOptions?} options  Extra options for handling block parsing.
 *
 * @return {BlockNode} The normalized block object.
 */
export function normalizeRawBlock( rawBlock, options ) {
	const fallbackBlockName = getFreeformContentHandlerName();

	// If the grammar parsing don't produce any block name, use the freeform block.
	const rawBlockName = rawBlock.blockName || getFreeformContentHandlerName();
	const rawAttributes = rawBlock.attrs || {};
	const rawInnerBlocks = rawBlock.innerBlocks || [];
	let rawInnerHTML = rawBlock.innerHTML.trim();

	// Fallback content may be upgraded from classic content expecting implicit
	// automatic paragraphs, so preserve them. Assumes wpautop is idempotent,
	// meaning there are no negative consequences to repeated autop calls.
	if (
		rawBlockName === fallbackBlockName &&
		! options?.__unstableSkipAutop
	) {
		// @TODO: Should we be running autop on all of the text chunks of innerContents?
		rawInnerHTML = autop( rawInnerHTML ).trim();
	}

	return {
		...rawBlock,
		blockName: rawBlockName,
		attrs: rawAttributes,
		innerHTML: rawInnerHTML,
		innerBlocks: rawInnerBlocks,
	};
}

/**
 * Uses the "unregistered blockType" to create a block object.
 *
 * @param {BlockNode} rawBlock block.
 *
 * @return {BlockNode} The unregistered block object.
 */
function createMissingBlockType( rawBlock ) {
	const unregisteredFallbackBlock =
		getUnregisteredTypeHandlerName() || getFreeformContentHandlerName();

	// Preserve undelimited content for use by the unregistered type
	// handler. A block node's `innerHTML` isn't enough, as that field only
	// carries the block's own HTML and not its nested blocks.
	const originalUndelimitedContent = serializeRawBlock( rawBlock, {
		isCommentDelimited: false,
	} );

	// Preserve full block content for use by the unregistered type
	// handler, block boundaries included.
	const originalContent = serializeRawBlock( rawBlock, {
		isCommentDelimited: true,
	} );

	return {
		blockName: unregisteredFallbackBlock,
		attrs: {
			originalName: rawBlock.blockName,
			originalContent,
			originalUndelimitedContent,
		},
		innerHTML: rawBlock.blockName ? originalContent : rawBlock.innerHTML,
		innerBlocks: rawBlock.innerBlocks,
		innerContent: rawBlock.innerContent,
	};
}

/**
 * Validates a block and wraps with validation meta.
 *
 * The name here is regrettable but `validateBlock` is already taken.
 *
 * @param {WPBlock}                               unvalidatedBlock
 * @param {import('../registration').WPBlockType} blockType
 * @return {WPBlock}                              validated block, with auto-fixes if initially invalid
 */
function applyBlockValidation( unvalidatedBlock, blockType ) {
	// Attempt to validate the block.
	const [ isValid ] = validateBlock( unvalidatedBlock, blockType );

	if ( isValid ) {
		return { ...unvalidatedBlock, isValid, validationIssues: [] };
	}

	// If the block is invalid, attempt some built-in fixes
	// like custom classNames handling.
	const fixedBlock = applyBuiltInValidationFixes(
		unvalidatedBlock,
		blockType
	);
	// Attempt to validate the block once again after the built-in fixes.
	const [ isFixedValid, validationIssues ] = validateBlock(
		unvalidatedBlock,
		blockType
	);

	return { ...fixedBlock, isValid: isFixedValid, validationIssues };
}

/**
 * Given a raw block returned by grammar parsing, returns a fully parsed block.
 *
 * @param {BlockNode}    rawBlock The raw block object.
 * @param {ParseOptions} options  Extra options for handling block parsing.
 *
 * @return {WPBlock|undefined} Fully parsed block.
 */
export function parseRawBlock( rawBlock, options ) {
	let normalizedBlock = normalizeRawBlock( rawBlock, options );

	// During the lifecycle of the project, we renamed some old blocks
	// and transformed others to new blocks. To avoid breaking existing content,
	// we added this function to properly parse the old content.
	normalizedBlock = convertLegacyBlocks( normalizedBlock );

	// Try finding the type for known block name.
	let blockType = getBlockType( normalizedBlock.blockName );

	// If not blockType is found for the specified name, fallback to the "unregistedBlockType".
	if ( ! blockType ) {
		normalizedBlock = createMissingBlockType( normalizedBlock );
		blockType = getBlockType( normalizedBlock.blockName );
	}

	// If it's an empty freeform block or there's no blockType (no missing block handler)
	// Then, just ignore the block.
	// It might be a good idea to throw a warning here.
	// TODO: I'm unsure about the unregisteredFallbackBlock check,
	// it might ignore some dynamic unregistered third party blocks wrongly.
	const isFallbackBlock =
		normalizedBlock.blockName === getFreeformContentHandlerName() ||
		normalizedBlock.blockName === getUnregisteredTypeHandlerName();
	if ( ! blockType || ( ! normalizedBlock.innerHTML && isFallbackBlock ) ) {
		return;
	}

	/*
	 * Parse inner blocks recursively.
	 *
	 * Once we can asynchronously load blocks we'll store
	 * a Promise for each parse. We need to insert these
	 * Promises in sequence here to avoid the possibility
	 * of re-ordering the blocks due to data races in the
	 * parsing and loading.
	 */
	const parsedInnerBlocks = [];
	for ( const innerBlock of normalizedBlock.innerBlocks ) {
		parsedInnerBlocks.push( parseRawBlock( innerBlock, options ) );
	}

	/*
	 * Once these are also resolved promises, we will then
	 * need to run through the list and prune any blocks
	 * which were removed; for example, an empty freeform
	 * block. We will need to `await Promise.all( blocks )`
	 * when that time comes before moving on to this step.
	 *
	 * Note: We normally expect few or no removed blocks,
	 *       particularly as a ratio of all blocks. Because
	 *       of that we'll optimize for the normal case with
	 *       the use of `splice`, which will collapse this
	 *       step into a quick scan through the array.
	 */
	for ( let i = 0; i < parsedInnerBlocks.length; i++ ) {
		if ( ! parsedInnerBlocks[ i ] ) {
			/*
			 * Some inner blocks might be removed during parsing,
			 * e.g. an empty freeform block. We have to remove
			 * these from the final array.
			 *
			 * @See https://github.com/WordPress/gutenberg/pull/17164.
			 */
			parsedInnerBlocks.splice( i--, 1 );
		}
	}

	// Get the fully parsed block.
	const parsedBlock = createBlock(
		normalizedBlock.blockName,
		getBlockAttributes(
			blockType,
			normalizedBlock.innerHTML,
			normalizedBlock.attrs
		),
		parsedInnerBlocks
	);
	parsedBlock.originalContent = normalizedBlock.innerHTML;

	const validatedBlock = applyBlockValidation( parsedBlock, blockType );
	const { validationIssues } = validatedBlock;

	// Run the block deprecation and migrations.
	// This is performed on both invalid and valid blocks because
	// migration using the `migrate` functions should run even
	// if the output is deemed valid.
	const updatedBlock = applyBlockDeprecatedVersions(
		validatedBlock,
		normalizedBlock,
		blockType
	);

	if ( ! updatedBlock.isValid ) {
		// Preserve the original unprocessed version of the block
		// that we received (no fixes, no deprecations) so that
		// we can save it as close to exactly the same way as
		// we loaded it. This is important to avoid corruption
		// and data loss caused by block implementations trying
		// to process data that isn't fully recognized.
		updatedBlock.__unstableBlockSource = rawBlock;
	}

	if (
		! validatedBlock.isValid &&
		updatedBlock.isValid &&
		! options?.__unstableSkipMigrationLogs
	) {
		/* eslint-disable no-console */
		console.groupCollapsed( 'Updated Block: %s', blockType.name );
		console.info(
			'Block successfully updated for `%s` (%o).\n\nNew content generated by `save` function:\n\n%s\n\nContent retrieved from post body:\n\n%s',
			blockType.name,
			blockType,
			getSaveContent( blockType, updatedBlock.attributes ),
			updatedBlock.originalContent
		);
		console.groupEnd();
		/* eslint-enable no-console */
	} else if ( ! validatedBlock.isValid && ! updatedBlock.isValid ) {
		validationIssues.forEach( ( { log, args } ) => log( ...args ) );
	}

	return updatedBlock;
}

/**
 * Utilizes an optimized token-driven parser based on the Gutenberg grammar spec
 * defined through a parsing expression grammar to take advantage of the regular
 * cadence provided by block delimiters -- composed syntactically through HTML
 * comments -- which, given a general HTML document as an input, returns a block
 * list array representation.
 *
 * This is a recursive-descent parser that scans linearly once through the input
 * document. Instead of directly recursing it utilizes a trampoline mechanism to
 * prevent stack overflow. This initial pass is mainly interested in separating
 * and isolating the blocks serialized in the document and manifestly not in the
 * content within the blocks.
 *
 * @see https://developer.wordpress.org/block-editor/packages/packages-block-serialization-default-parser/
 *
 * @param {string}       content The post content.
 * @param {ParseOptions} options Extra options for handling block parsing.
 *
 * @return {WPBlock[]} Block list.
 */
export default function parse( content, options ) {
	const blockNodes = grammarParse( content );
	const blocks = [];

	/*
	 * When we can asynchronously load blocks we will store
	 * a Promise for each parse. We need to insert these
	 * Promises in sequence here to avoid the possibility
	 * of re-ordering the blocks due to data races in the
	 * parsing and loading.
	 */
	for ( const blockNode of blockNodes ) {
		blocks.push( parseRawBlock( blockNode, options ) );
	}

	/*
	 * Once these are also resolved promises, we will then
	 * need to run through the list and prune any blocks
	 * which were removed; for example, an empty freeform
	 * block. We will need to `await Promise.all( blocks )`
	 * when that time comes before moving on to this step.
	 *
	 * Note: We normally expect few or no removed blocks,
	 *       particularly as a ratio of all blocks. Because
	 *       of that we'll optimize for the normal case with
	 *       the use of `splice`, which will collapse this
	 *       step into a quick scan through the array.
	 */
	for ( let i = 0; i < blocks.length; i++ ) {
		if ( ! blocks[ i ] ) {
			blocks.splice( i--, 1 );
		}
	}

	return blocks;
}
