import { parse as grammarParse } from '@wordpress/block-serialization-default-parser';
import { autop } from '@wordpress/autop';
import {
	getFreeformContentHandlerName,
	getUnregisteredTypeHandlerName,
	getBlockType,
} from '../registration';
import { getSaveContent, serializeBlock } from '../serializer';
import { validateBlock } from '../validation';
import { createBlock } from '../factory';
import { convertLegacyBlockNameAndAttributes } from './convert-legacy-block';
import { serializeRawBlock } from './serialize-raw-block';
import { getBlockAttributes } from './get-block-attributes';
import { applyBlockDeprecatedVersions } from './apply-block-deprecated-versions';
import { applyBuiltInValidationFixes } from './apply-built-in-validation-fixes';
import {
	addSource,
	isUndelimitedEnabled,
	parseUndelimited,
	splitInnerBlocks,
} from '../undelimited';
import type { Block, BlockType, RawBlock, ParseOptions } from '../../types';

/**
 * Convert legacy blocks to their canonical form. This function is used
 * both in the parser level for previous content and to convert such blocks
 * used in Custom Post Types templates.
 *
 * @param rawBlock
 *
 * @return The block's name and attributes, changed accordingly if a match was found
 */
function convertLegacyBlocks( rawBlock: RawBlock ): RawBlock {
	const [ correctName, correctedAttributes ] =
		convertLegacyBlockNameAndAttributes(
			rawBlock.blockName,
			rawBlock.attrs ?? {}
		);
	return {
		...rawBlock,
		blockName: correctName,
		attrs: correctedAttributes,
	};
}

/**
 * Normalize the raw block by applying the fallback block name if none given,
 * sanitize the parsed HTML...
 *
 * @param rawBlock The raw block object.
 * @param options  Extra options for handling block parsing.
 *
 * @return The normalized block object.
 */
export function normalizeRawBlock(
	rawBlock: RawBlock,
	options?: ParseOptions
): RawBlock {
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
		rawBlockName === 'core/freeform' &&
		! options?.__unstableSkipAutop
	) {
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
 * @param rawBlock block.
 *
 * @return The unregistered block object.
 */
function createMissingBlockType( rawBlock: RawBlock ): RawBlock {
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
 * @param unvalidatedBlock
 * @param blockType
 * @return validated block, with auto-fixes if initially invalid
 */
function applyBlockValidation(
	unvalidatedBlock: Block,
	blockType: BlockType
): Block {
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
		fixedBlock,
		blockType
	);

	return { ...fixedBlock, isValid: isFixedValid, validationIssues };
}

interface ParseContext {
	isTopLevel?: boolean;
	writtenBlocks?: WeakMap< RawBlock, string >;
}

// The default block parser's pattern for delimiters.
const DELIMITER =
	/<!--\s+(\/)?wp:([a-z][a-z0-9_-]*\/)?([a-z][a-z0-9_-]*)\s+({(?:(?=([^}]+|}+(?=})|(?!}\s+\/?-->)[^])*)\5|[^]*?)}\s+)?(\/)?-->/g;

/**
 * Finds the text each block was written as, so it can be saved exactly that
 * way. The parser doesn't report where blocks start and end, so this walks
 * the delimiters the same way; blocks appear in the order of their openers.
 *
 * @param content   Post content.
 * @param rawBlocks Blocks the parser read from it.
 */
function getWrittenBlocks(
	content: string,
	rawBlocks: RawBlock[]
): WeakMap< RawBlock, string > {
	const written: Array< { name: string; text?: string } > = [];
	const open: Array< { index: number; start: number } > = [];
	for ( const match of content.matchAll( DELIMITER ) ) {
		const [ token, isCloser, namespace, name, , , isVoid ] = match;
		const start = match.index as number;
		if ( isCloser ) {
			const opener = open.pop();
			if ( opener ) {
				written[ opener.index ].text = content.slice(
					opener.start,
					start + token.length
				);
			}
			continue;
		}
		written.push( {
			name: ( namespace ?? 'core/' ) + name,
			text: isVoid ? token : undefined,
		} );
		if ( ! isVoid ) {
			open.push( { index: written.length - 1, start } );
		}
	}

	const writtenBlocks = new WeakMap< RawBlock, string >();
	let index = 0;
	const visit = ( rawBlock: RawBlock ) => {
		if ( rawBlock.blockName ) {
			const { name, text } = written[ index++ ] ?? {};
			if ( text && name === rawBlock.blockName ) {
				writtenBlocks.set( rawBlock, text );
			}
		}
		rawBlock.innerBlocks?.forEach( visit );
	};
	rawBlocks.forEach( visit );
	return writtenBlocks;
}

/**
 * Whether saving a block and reading it back gives the same block.
 *
 * @param block Block.
 */
function isStable( block: Block ): boolean {
	const html = serializeBlock( block );
	const [ rawBlock ] = grammarParse( html );
	const blockType = getBlockType( block.name );
	if ( ! rawBlock || ! blockType ) {
		return false;
	}
	const readBack = createBlock(
		block.name,
		getBlockAttributes(
			blockType,
			rawBlock.innerHTML,
			rawBlock.attrs ?? {}
		)
	);
	return (
		validateBlock( readBack, blockType )[ 0 ] &&
		serializeBlock( readBack ) === html
	);
}

/**
 * Given a raw block returned by grammar parsing, returns a fully parsed block.
 *
 * @param rawBlock The raw block object.
 * @param options  Extra options for handling block parsing.
 * @param context  Whether the block is top level, and the text each block was
 *                 written as, for optional block delimiters.
 *
 * @return Fully parsed block.
 */
export function parseRawBlock(
	rawBlock: RawBlock,
	options?: ParseOptions,
	context: ParseContext = {}
): Block | undefined {
	const { isTopLevel = false, writtenBlocks } = context;
	let normalizedBlock = normalizeRawBlock( rawBlock, options );

	// During the lifecycle of the project, we renamed some old blocks
	// and transformed others to new blocks. To avoid breaking existing content,
	// we added this function to properly parse the old content.
	normalizedBlock = convertLegacyBlocks( normalizedBlock );

	// Try finding the type for known block name.
	let blockType = getBlockType( normalizedBlock.blockName! );

	// If not blockType is found for the specified name, fallback to the "unregisteredBlockType".
	if ( ! blockType ) {
		normalizedBlock = createMissingBlockType( normalizedBlock );
		blockType = getBlockType( normalizedBlock.blockName! );
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

	// Parse inner blocks recursively.
	const parsedInnerBlocks = normalizedBlock.innerBlocks
		.map( ( innerBlock ) =>
			parseRawBlock( innerBlock, options, { writtenBlocks } )
		)
		// See https://github.com/WordPress/gutenberg/pull/17164.
		.filter( ( innerBlock ) => !! innerBlock );

	// With optional delimiters, remember the block as written, so it can be
	// saved that way unless it's edited. `content` is the HTML to apply edits
	// to; a migrated block uses its new `save` output.
	const withSource = ( block: Block, content?: string ) =>
		isUndelimitedEnabled()
			? addSource(
					block,
					writtenBlocks?.get( rawBlock ) ??
						serializeRawBlock( rawBlock ),
					content,
					{
						isInnerBlocks: ! isTopLevel,
					}
				)
			: block;

	// Get the fully parsed block.
	const parsedBlock = createBlock(
		normalizedBlock.blockName!,
		getBlockAttributes(
			blockType,
			normalizedBlock.innerHTML,
			normalizedBlock.attrs
		),
		parsedInnerBlocks
	);
	parsedBlock.originalContent = normalizedBlock.innerHTML;

	// The Custom HTML block keeps the interleaved static HTML fragments as
	// the canonical source of its own markup, so the `save`-based validation
	// and deprecation flows don't apply: serializing the parsed content
	// reproduces the input by construction.
	if ( blockType.name === 'core/html' ) {
		parsedBlock.innerContent = normalizedBlock.innerContent ?? [
			normalizedBlock.innerHTML,
		];
		if ( isUndelimitedEnabled() ) {
			Object.assign(
				parsedBlock,
				splitInnerBlocks(
					parsedBlock.innerContent,
					parsedBlock.innerBlocks
				)
			);
		}
		parsedBlock.isValid = true;
		parsedBlock.validationIssues = [];
		return withSource( parsedBlock, normalizedBlock.innerHTML );
	}

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

	// With optional delimiters, a block keeps HTML its `save` doesn't
	// produce, unless an older version of the block reads it into a block
	// that survives being saved and read again.
	if (
		! validatedBlock.isValid &&
		isTopLevel &&
		! parsedInnerBlocks.length &&
		isUndelimitedEnabled() &&
		! ( updatedBlock.isValid && isStable( updatedBlock ) )
	) {
		return withSource(
			{ ...validatedBlock, isValid: true, validationIssues: [] },
			normalizedBlock.innerHTML
		);
	}

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
		validationIssues!.forEach( ( { log, args } ) => log( ...args ) );
	}

	if ( ! updatedBlock.isValid ) {
		return updatedBlock;
	}
	return withSource(
		updatedBlock,
		updatedBlock === validatedBlock ? normalizedBlock.innerHTML : undefined
	);
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
 * @see
 * https://developer.wordpress.org/block-editor/packages/packages-block-serialization-default-parser/
 *
 * @param content The post content.
 * @param options Extra options for handling block parsing.
 *
 * @return Block list.
 */
export default function parse(
	content: string,
	options?: ParseOptions
): Block[] {
	const blocks: Block[] = [];
	// With optional delimiters, whitespace between blocks is kept with them.
	let whitespace = '';
	const rawBlocks = grammarParse( content ) as unknown as RawBlock[];
	const writtenBlocks = isUndelimitedEnabled()
		? getWrittenBlocks( content, rawBlocks )
		: undefined;
	for ( const rawBlock of rawBlocks ) {
		// HTML outside delimiters is read as blocks, not one Classic block.
		if ( ! rawBlock.blockName && isUndelimitedEnabled() ) {
			const undelimitedBlocks = parseUndelimited( rawBlock.innerHTML );
			if ( ! undelimitedBlocks.length ) {
				whitespace += rawBlock.innerHTML;
			}
			blocks.push( ...undelimitedBlocks );
			continue;
		}
		const block = parseRawBlock( rawBlock, options, {
			isTopLevel: true,
			writtenBlocks,
		} );
		if ( block ) {
			if ( block.undelimitedSource ) {
				block.undelimitedSource.before = whitespace;
				whitespace = '';
			}
			blocks.push( block );
		}
	}
	const lastSource = blocks[ blocks.length - 1 ]?.undelimitedSource;
	if ( lastSource ) {
		lastSource.after += whitespace;
	}
	return blocks;
}
