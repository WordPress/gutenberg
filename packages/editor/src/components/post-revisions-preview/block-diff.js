/**
 * External dependencies
 */
import { diffArrays } from 'diff/lib/diff/array';
import { diffWords } from 'diff/lib/diff/word';

/**
 * WordPress dependencies
 */
import { parse as grammarParse } from '@wordpress/block-serialization-default-parser';
import {
	privateApis as blocksPrivateApis,
	getBlockType,
} from '@wordpress/blocks';
import {
	RichTextData,
	create,
	slice,
	concat,
	applyFormat,
} from '@wordpress/rich-text';

/**
 * Internal dependencies
 */
import { unlock } from '../../lock-unlock';

const { parseRawBlock } = unlock( blocksPrivateApis );

/**
 * Create a signature for block comparison.
 * Uses blockName + attrs for container matching, innerHTML for leaf content.
 *
 * @param {Object} rawBlock Raw block from grammar parse.
 * @return {string} JSON signature for comparison.
 */
function createBlockSignature( rawBlock ) {
	const hasInnerBlocks =
		rawBlock.innerBlocks && rawBlock.innerBlocks.length > 0;

	// For container blocks, match by structure (name + attrs).
	// innerHTML for containers includes serialized inner blocks, which we diff separately.
	if ( hasInnerBlocks ) {
		return JSON.stringify( {
			name: rawBlock.blockName,
			attrs: rawBlock.attrs,
		} );
	}

	// For leaf blocks, include innerHTML in signature.
	return JSON.stringify( {
		name: rawBlock.blockName,
		attrs: rawBlock.attrs,
		html: rawBlock.innerHTML,
	} );
}

/**
 * Inject diff status into raw block as special attribute.
 * Also recursively mark innerBlocks with same status.
 *
 * @param {Object} rawBlock Raw block to inject status into.
 * @param {string} status   Diff status ('added' or 'removed').
 * @return {Object} Raw block with injected status.
 */
function injectDiffStatus( rawBlock, status ) {
	if ( ! status ) {
		return rawBlock;
	}

	return {
		...rawBlock,
		attrs: {
			...rawBlock.attrs,
			__revisionDiffStatus: status,
		},
		innerBlocks:
			rawBlock.innerBlocks?.map( ( inner ) =>
				injectDiffStatus( inner, status )
			) || [],
	};
}

/**
 * Diff raw block arrays using LCS, recursively handling innerBlocks.
 * Detects modifications when exactly 1 block is removed and 1 is added
 * with the same blockName (1:1 replacement = modification).
 *
 * @param {Array} currentRaw  Current revision's raw blocks.
 * @param {Array} previousRaw Previous revision's raw blocks.
 * @return {Array} Merged raw blocks with diff status injected.
 */
function diffRawBlocks( currentRaw, previousRaw ) {
	const currentSigs = currentRaw.map( createBlockSignature );
	const previousSigs = previousRaw.map( createBlockSignature );

	const diff = diffArrays( previousSigs, currentSigs );

	const result = [];
	let currIdx = 0;
	let prevIdx = 0;

	for ( let partIdx = 0; partIdx < diff.length; partIdx++ ) {
		const part = diff[ partIdx ];
		const nextPart = diff[ partIdx + 1 ];

		if ( part.added ) {
			for ( let i = 0; i < part.count; i++ ) {
				result.push(
					injectDiffStatus( currentRaw[ currIdx++ ], 'added' )
				);
			}
		} else if ( part.removed ) {
			// Check for 1:1 modification pattern: exactly 1 removed followed by exactly 1 added.
			if (
				part.count === 1 &&
				nextPart?.added &&
				nextPart.count === 1 &&
				previousRaw[ prevIdx ].blockName ===
					currentRaw[ currIdx ].blockName
			) {
				// Single block modification - merge into modified.
				const prevBlock = previousRaw[ prevIdx++ ];
				const currBlock = currentRaw[ currIdx++ ];

				// Recursively diff inner blocks.
				const diffedInnerBlocks = diffRawBlocks(
					currBlock.innerBlocks || [],
					prevBlock.innerBlocks || []
				);

				// Store previous raw block for rich text diff after parsing.
				// Don't modify innerHTML here - apply diff after parsing.
				result.push( {
					...currBlock,
					attrs: {
						...currBlock.attrs,
						__revisionDiffStatus: 'modified',
					},
					innerBlocks: diffedInnerBlocks,
					__previousRawBlock: prevBlock,
				} );

				partIdx++; // Skip the next 'added' part.
			} else {
				// Multiple removals or no matching addition - mark all as removed.
				for ( let i = 0; i < part.count; i++ ) {
					result.push(
						injectDiffStatus( previousRaw[ prevIdx++ ], 'removed' )
					);
				}
			}
		} else {
			// Matched blocks - recursively diff their innerBlocks.
			for ( let i = 0; i < part.count; i++ ) {
				const currBlock = currentRaw[ currIdx++ ];
				const prevBlock = previousRaw[ prevIdx++ ];

				// Recursively diff inner blocks.
				const diffedInnerBlocks = diffRawBlocks(
					currBlock.innerBlocks || [],
					prevBlock.innerBlocks || []
				);

				result.push( {
					...currBlock,
					innerBlocks: diffedInnerBlocks,
				} );
			}
		}
	}

	return result;
}

/**
 * Collect diff statuses from raw block tree into a flat array.
 * The array order matches the order parseRawBlock will produce blocks
 * (depth-first traversal).
 *
 * @param {Object} rawBlock   Raw block to collect from.
 * @param {Array}  statusList Array to collect statuses into.
 */
function collectDiffStatuses( rawBlock, statusList ) {
	statusList.push( rawBlock.attrs?.__revisionDiffStatus || null );

	if ( rawBlock.innerBlocks ) {
		for ( const inner of rawBlock.innerBlocks ) {
			collectDiffStatuses( inner, statusList );
		}
	}
}

/**
 * Apply diff statuses to parsed block tree from a flat array.
 *
 * @param {Object} block      Parsed block to apply statuses to.
 * @param {Array}  statusList Array of statuses (will be shifted/consumed).
 */
function applyDiffStatuses( block, statusList ) {
	const status = statusList.shift();
	if ( status ) {
		block.attributes.__revisionDiffStatus = status;
	}

	if ( block.innerBlocks ) {
		for ( const inner of block.innerBlocks ) {
			applyDiffStatuses( inner, statusList );
		}
	}
}

/**
 * Check if formatting has changed at specific character indices.
 *
 * @param {Array}  currentFormats  Current formats array.
 * @param {Array}  previousFormats Previous formats array.
 * @param {number} currentIndex    Character index in current.
 * @param {number} previousIndex   Character index in previous.
 * @return {boolean} True if formatting changed at these indices.
 */
function hasFormatChangedAtIndex(
	currentFormats,
	previousFormats,
	currentIndex,
	previousIndex
) {
	const currFmts = currentFormats[ currentIndex ] || [];
	const prevFmts = previousFormats[ previousIndex ] || [];

	if ( currFmts.length !== prevFmts.length ) {
		return true;
	}

	// Check if each format in current exists in previous
	for ( const fmt of currFmts ) {
		const match = prevFmts.find(
			( pf ) =>
				pf.type === fmt.type &&
				JSON.stringify( pf.attributes ) ===
					JSON.stringify( fmt.attributes )
		);
		if ( ! match ) {
			return true;
		}
	}

	return false;
}

/**
 * Apply inline diff formatting comparing two RichTextData values.
 * - Text changes: apply revision/diff-removed and revision/diff-added formats
 * - Format-only changes (text unchanged): apply revision/diff-format-changed format
 *
 * @param {RichTextData} currentRichText  Current revision's rich text.
 * @param {RichTextData} previousRichText Previous revision's rich text.
 * @return {RichTextData} New rich text with diff formatting applied.
 */
function applyRichTextDiff( currentRichText, previousRichText ) {
	const currentText = currentRichText.toPlainText();
	const previousText = previousRichText.toPlainText();

	// Diff the plain text (words for cleaner output)
	const textDiff = diffWords( previousText, currentText );

	let result = create( { text: '' } );
	let currentIdx = 0;
	let previousIdx = 0;

	for ( const part of textDiff ) {
		if ( part.removed ) {
			// Text deleted - slice from PREVIOUS, apply <del>
			const removedSlice = slice(
				previousRichText,
				previousIdx,
				previousIdx + part.value.length
			);
			const formatted = applyFormat(
				removedSlice,
				{ type: 'revision/diff-removed' },
				0,
				part.value.length
			);
			result = concat( result, formatted );
			previousIdx += part.value.length;
		} else if ( part.added ) {
			// Text added - slice from CURRENT, apply <ins>
			const addedSlice = slice(
				currentRichText,
				currentIdx,
				currentIdx + part.value.length
			);
			const formatted = applyFormat(
				addedSlice,
				{ type: 'revision/diff-added' },
				0,
				part.value.length
			);
			result = concat( result, formatted );
			currentIdx += part.value.length;
		} else {
			// Text unchanged - check formatting at each character position.
			// Only apply <mark> to specific ranges where formatting differs.
			const currentFormats = currentRichText.formats || [];
			const previousFormats = previousRichText.formats || [];
			const len = part.value.length;

			// Helper to check format change at offset within this unchanged part.
			const checkFormatChanged = ( offset ) =>
				hasFormatChangedAtIndex(
					currentFormats,
					previousFormats,
					currentIdx + offset,
					previousIdx + offset
				);

			// Find ranges of characters grouped by whether format changed.
			let rangeStart = 0;
			let rangeFormatChanged = checkFormatChanged( 0 );

			for ( let i = 1; i <= len; i++ ) {
				const formatChanged = i < len && checkFormatChanged( i );

				// When format-changed status changes or we reach the end, emit range.
				if ( i === len || formatChanged !== rangeFormatChanged ) {
					const rangeSlice = slice(
						currentRichText,
						currentIdx + rangeStart,
						currentIdx + i
					);

					if ( rangeFormatChanged ) {
						const marked = applyFormat(
							rangeSlice,
							{ type: 'revision/diff-format-changed' },
							0,
							i - rangeStart
						);
						result = concat( result, marked );
					} else {
						result = concat( result, rangeSlice );
					}

					rangeStart = i;
					rangeFormatChanged = formatChanged;
				}
			}

			currentIdx += part.value.length;
			previousIdx += part.value.length;
		}
	}

	return new RichTextData( result );
}

/**
 * Apply rich text diff to all rich-text attributes of a block.
 * Compares each rich-text attribute between current and previous parsed blocks.
 *
 * @param {Object} currentBlock  Current parsed block.
 * @param {Object} previousBlock Previous parsed block.
 */
function applyRichTextDiffToBlock( currentBlock, previousBlock ) {
	const blockType = getBlockType( currentBlock.name );
	if ( ! blockType ) {
		return;
	}

	// Find rich-text attributes and compare
	for ( const [ attrName, attrDef ] of Object.entries(
		blockType.attributes
	) ) {
		if ( attrDef.source === 'rich-text' ) {
			const currentRichText = currentBlock.attributes[ attrName ];
			const previousRichText = previousBlock.attributes[ attrName ];

			if (
				currentRichText instanceof RichTextData &&
				previousRichText instanceof RichTextData
			) {
				currentBlock.attributes[ attrName ] = applyRichTextDiff(
					currentRichText,
					previousRichText
				);
			}
		}
	}
}

/**
 * Recursively apply rich text diff to modified blocks in the tree.
 * Matches parsed blocks with their corresponding raw blocks to find
 * __previousRawBlock references and apply diffs.
 *
 * @param {Object} parsedBlock Parsed block (with inner blocks).
 * @param {Object} rawBlock    Raw block (with __previousRawBlock references).
 */
function applyRichTextDiffRecursively( parsedBlock, rawBlock ) {
	// Apply diff to this block if it's modified and has a previous raw block.
	if (
		parsedBlock.attributes.__revisionDiffStatus === 'modified' &&
		rawBlock.__previousRawBlock
	) {
		const previousParsed = parseRawBlock( rawBlock.__previousRawBlock );
		if ( previousParsed ) {
			applyRichTextDiffToBlock( parsedBlock, previousParsed );
		}
	}

	// Recursively process inner blocks.
	if ( parsedBlock.innerBlocks && rawBlock.innerBlocks ) {
		for ( let i = 0; i < parsedBlock.innerBlocks.length; i++ ) {
			const parsedInner = parsedBlock.innerBlocks[ i ];
			const rawInner = rawBlock.innerBlocks[ i ];
			if ( parsedInner && rawInner ) {
				applyRichTextDiffRecursively( parsedInner, rawInner );
			}
		}
	}
}

/**
 * Parse a raw block and preserve diff status attributes.
 * The __revisionDiffStatus attribute gets filtered out by parseRawBlock
 * since it's not a registered block attribute, so we collect them before
 * parsing and restore them afterward.
 *
 * @param {Object} rawBlock Raw block with potential diff status.
 * @return {Object|undefined} Parsed block with preserved diff status.
 */
function parseRawBlockWithDiffStatus( rawBlock ) {
	// Collect all diff statuses from the raw block tree (depth-first).
	const statusList = [];
	collectDiffStatuses( rawBlock, statusList );

	// Parse the raw block (this recursively parses inner blocks too).
	const parsed = parseRawBlock( rawBlock );

	if ( ! parsed ) {
		return undefined;
	}

	// Restore diff statuses to the parsed block tree.
	applyDiffStatuses( parsed, statusList );

	// Apply rich text diff to all modified blocks in the tree.
	applyRichTextDiffRecursively( parsed, rawBlock );

	return parsed;
}

/**
 * Diff two revision contents at the grammar level.
 *
 * @param {string} currentContent  Current revision's raw content.
 * @param {string} previousContent Previous revision's raw content.
 * @return {Array} Array of parsed blocks with diff status attributes.
 */
export function diffRevisionContent( currentContent, previousContent ) {
	// Grammar parse both contents.
	const currentRaw = grammarParse( currentContent || '' );
	const previousRaw = grammarParse( previousContent || '' );

	// Diff the raw block arrays.
	const mergedRaw = diffRawBlocks( currentRaw, previousRaw );

	// Convert each raw block to full block, preserving diff status.
	return mergedRaw
		.map( ( rawBlock ) => parseRawBlockWithDiffStatus( rawBlock ) )
		.filter( Boolean );
}
