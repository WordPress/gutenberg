/**
 * External dependencies
 */
/*
 * `diffWordsWithSpace` preserves the v4-style per-word output. v6+
 * stopped treating whitespace as a token in `diffWords`, which coalesces
 * adjacent word changes into a single removed/added pair.
 */
import { diffArrays, diffWordsWithSpace } from 'diff';

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
import { __, _n, sprintf } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import { unlock } from '../../lock-unlock';

const { parseRawBlock } = unlock( blocksPrivateApis );

/**
 * Whether a grammar-parsed raw block is a whitespace-only freeform pseudo-block
 * (the `\n\n` between block markers, etc). These are stripped from both arrays
 * before LCS to keep the matching pivot stable: under `diff` v6's tie-breaker,
 * a whitespace block could otherwise be selected as the LCS anchor in
 * `[paragraph, whitespace, paragraph]` swaps, mis-pairing the surrounding
 * paragraphs in `pairSimilarBlocks`. Whitespace pseudo-blocks don't render
 * anyway (`parseRawBlock` returns undefined for them), so dropping them
 * before the diff has no user-visible effect.
 *
 * @param {Object} rawBlock A raw block from `@wordpress/block-serialization-default-parser`.
 * @return {boolean} True if the block should be excluded from LCS matching.
 */
function isWhitespaceRawBlock( rawBlock ) {
	return (
		rawBlock.blockName === null &&
		( ! rawBlock.innerHTML || ! rawBlock.innerHTML.trim() )
	);
}

/**
 * Safely stringifies a value for display and comparison.
 *
 * @param {*} value The value to stringify.
 * @return {string} The stringified value.
 */
function stringifyValue( value ) {
	if ( value === null || value === undefined ) {
		return '';
	}
	if ( typeof value === 'object' ) {
		return JSON.stringify( value, null, 2 );
	}
	return String( value );
}

/**
 * Calculate text similarity using word-set overlap.
 *
 * Uses a variant of the Jaccard index (https://en.wikipedia.org/wiki/Jaccard_index)
 * called the overlap coefficient (https://en.wikipedia.org/wiki/Overlap_coefficient)
 * where we divide by the larger set size rather than the union. This ensures that
 * a small edit to a long paragraph scores high — the few changed words don't
 * dilute the score.
 *
 * This replaces the previous diffWords-based similarity which was O(n*m) per pair.
 * The word-set approach is O(n) where n is the number of words.
 *
 * Words are extracted using Intl.Segmenter for proper multilingual support
 * (CJK, Thai, etc.) rather than splitting on whitespace.
 *
 * @param {string} text1 First text to compare.
 * @param {string} text2 Second text to compare.
 * @return {number} Similarity score between 0 and 1.
 */
function textSimilarity( text1, text2 ) {
	if ( ! text1 && ! text2 ) {
		return 1;
	}
	if ( ! text1 || ! text2 ) {
		return 0;
	}

	const segmenter = new Intl.Segmenter( undefined, {
		granularity: 'word',
	} );
	// Safari's Intl.Segmenter returns isWordLike: false for numeric segments,
	// so fall back to a Unicode-aware regex for letters and numbers.
	const wordLikeRegex = /[\p{L}\p{N}]/u;
	const getWords = ( text ) => {
		const words = [];
		for ( const { segment, isWordLike } of segmenter.segment( text ) ) {
			if ( isWordLike || wordLikeRegex.test( segment ) ) {
				words.push( segment );
			}
		}
		return words;
	};
	const words1 = getWords( text1 );
	const words2 = getWords( text2 );

	if ( words1.length === 0 && words2.length === 0 ) {
		return 1;
	}

	const set1 = new Set( words1 );
	let intersection = 0;
	for ( const word of words2 ) {
		if ( set1.has( word ) ) {
			intersection++;
		}
	}

	const total = Math.max( words1.length, words2.length );
	return total > 0 ? intersection / total : 0;
}

/**
 * Post-process diff result to pair similar removed/added blocks as modifications.
 *
 * After LCS diffing, a block whose content changed appears as a separate "removed"
 * and "added" entry (since the full block signature differs). This function detects
 * such pairs and merges them into a single "modified" block with inline diff.
 *
 * Two pairing strategies are used:
 * 1. When exactly one block of a given type was removed and one was added,
 *    they are paired directly — no ambiguity, no similarity check needed.
 * 2. When multiple candidates exist, textSimilarity (overlap coefficient) is
 *    used to find the best match. Blocks must share at least 50% of their
 *    words to be paired, preventing unrelated paragraphs from being merged.
 *
 * @param {Array} blocks Raw blocks with diff status.
 * @return {Array} Blocks with similar pairs converted to modifications.
 */
function pairSimilarBlocks( blocks ) {
	const removed = [];
	const added = [];

	// Separate blocks by status, tracking original indices.
	blocks.forEach( ( block, index ) => {
		const status = block.__revisionDiffStatus?.status;
		if ( status === 'removed' ) {
			removed.push( { block, index } );
		} else if ( status === 'added' ) {
			added.push( { block, index } );
		}
	} );

	// If no removed or no added, nothing to pair.
	if ( removed.length === 0 || added.length === 0 ) {
		return blocks;
	}

	const pairedRemoved = new Set(); // Indices of removed blocks filtered out.
	const pairedAdded = new Set(); // Indices of added blocks filtered out.
	const modifications = new Map(); // Index → modified block.
	const SIMILARITY_THRESHOLD = 0.5;

	// Group candidates by block name for efficient lookup.
	const addedByName = new Map();
	for ( const add of added ) {
		const name = add.block.blockName;
		if ( ! addedByName.has( name ) ) {
			addedByName.set( name, [] );
		}
		addedByName.get( name ).push( add );
	}
	const removedByName = new Map();
	for ( const rem of removed ) {
		const name = rem.block.blockName;
		if ( ! removedByName.has( name ) ) {
			removedByName.set( name, [] );
		}
		removedByName.get( name ).push( rem );
	}

	// For each removed block, find best matching added block.
	// Track the highest added index paired so far — new pairings must
	// not go backwards, or the removed/added text order would break.
	let maxPairedAddedIndex = -1;

	for ( const rem of removed ) {
		const candidates = addedByName.get( rem.block.blockName ) || [];
		const sameNameRemoved = removedByName.get( rem.block.blockName ) || [];
		const unpaired = candidates.filter(
			( add ) =>
				! modifications.has( add.index ) &&
				add.index > maxPairedAddedIndex
		);

		if ( unpaired.length === 0 ) {
			continue;
		}

		let bestMatch = null;

		// If there's exactly one removed and one added of this type,
		// pair them directly — no ambiguity, no similarity check needed.
		if ( sameNameRemoved.length === 1 && unpaired.length === 1 ) {
			const add = unpaired[ 0 ];
			const attrsMatch =
				JSON.stringify( rem.block.attrs ) ===
				JSON.stringify( add.block.attrs );
			// Only skip pairing if both content and attrs are identical
			// (position swap, not a modification).
			const contentMatch =
				( rem.block.innerHTML || '' ) === ( add.block.innerHTML || '' );
			if ( ! contentMatch || ! attrsMatch ) {
				bestMatch = add;
			}
		} else {
			// Multiple candidates — use similarity to find best match.
			let bestScore = 0;
			for ( const add of unpaired ) {
				const score = textSimilarity(
					rem.block.innerHTML || '',
					add.block.innerHTML || ''
				);
				// Skip identical blocks (score=1 with same attrs) — those
				// are position swaps, not modifications. They should show
				// as separate removed + added, not as a no-op "modified".
				const attrsMatch =
					JSON.stringify( rem.block.attrs ) ===
					JSON.stringify( add.block.attrs );
				if (
					score > bestScore &&
					score > SIMILARITY_THRESHOLD &&
					( score < 1 || ! attrsMatch )
				) {
					bestScore = score;
					bestMatch = add;
				}
			}
		}

		if ( bestMatch ) {
			maxPairedAddedIndex = bestMatch.index;

			const modifiedBlock = {
				...bestMatch.block,
				__revisionDiffStatus: { status: 'modified' },
				__previousRawBlock: rem.block,
			};

			// Decide where to place the modified block by checking
			// what's between the removed and added positions. If any
			// block between them is in the current revision (an
			// unchanged block, or an unpaired added block), placing
			// the modification at the removed position would put it
			// before content that already comes before it in the
			// current revision — so use the added position instead.
			// Otherwise, use the removed position to keep the previous
			// revision's reading order intact.
			//
			// 'removed' blocks (and added blocks already absorbed via
			// `pairedAdded`) aren't checked because they aren't in the
			// current revision and so don't count as crossing it.
			const lo = Math.min( rem.index, bestMatch.index );
			const hi = Math.max( rem.index, bestMatch.index );
			let crossesCurrentContent = false;
			for ( let i = lo + 1; i < hi; i++ ) {
				const status = blocks[ i ].__revisionDiffStatus?.status;
				if ( status === undefined ) {
					crossesCurrentContent = true;
					break;
				}
				if ( status === 'added' && ! pairedAdded.has( i ) ) {
					crossesCurrentContent = true;
					break;
				}
			}

			if ( crossesCurrentContent ) {
				// Use the added position — don't jump before
				// current-revision content.
				modifications.set( bestMatch.index, modifiedBlock );
				pairedRemoved.add( rem.index );
			} else {
				// Use the removed position — keep the previous
				// revision's reading order.
				modifications.set( rem.index, modifiedBlock );
				pairedAdded.add( bestMatch.index );
			}
		}
	}

	// Rebuild result: replace modification targets, filter out
	// their paired counterparts.
	return blocks
		.map( ( block, index ) => {
			if ( pairedRemoved.has( index ) || pairedAdded.has( index ) ) {
				return null;
			}
			if ( modifications.has( index ) ) {
				return modifications.get( index );
			}
			return block;
		} )
		.filter( Boolean );
}

/**
 * Diff raw block arrays using LCS, recursively handling innerBlocks.
 * Detects modifications when exactly 1 block is removed and 1 is added
 * with the same blockName (1:1 replacement = modification).
 *
 * Whitespace-only freeform pseudo-blocks are filtered at every recursive
 * level so this function is safe to call directly with raw output from
 * `@wordpress/block-serialization-default-parser`. The duplicate work for
 * inner-block recursion is negligible and keeps the contract self-contained.
 *
 * @param {Array} currentRaw  Current revision's raw blocks.
 * @param {Array} previousRaw Previous revision's raw blocks.
 * @return {Array} Merged raw blocks with diff status injected.
 */
function diffRawBlocks( currentRaw, previousRaw ) {
	// Strip whitespace-only freeform pseudo-blocks before LCS — see
	// `isWhitespaceRawBlock` for why.
	currentRaw = currentRaw.filter( ( b ) => ! isWhitespaceRawBlock( b ) );
	previousRaw = previousRaw.filter( ( b ) => ! isWhitespaceRawBlock( b ) );

	const createBlockSignature = ( rawBlock ) =>
		JSON.stringify( {
			name: rawBlock.blockName,
			attrs: rawBlock.attrs,
			// Use innerContent filtered to non-null and non-whitespace-only strings.
			// This excludes whitespace between inner blocks which changes based on count.
			html: ( rawBlock.innerContent || [] ).filter(
				( c ) => c !== null && c.trim() !== ''
			),
		} );
	const currentSigs = currentRaw.map( createBlockSignature );
	const previousSigs = previousRaw.map( createBlockSignature );

	const diff = diffArrays( previousSigs, currentSigs );

	const result = [];
	let currIdx = 0;
	let prevIdx = 0;

	for ( const part of diff ) {
		if ( part.added ) {
			for ( let i = 0; i < part.count; i++ ) {
				result.push( {
					...currentRaw[ currIdx++ ],
					__revisionDiffStatus: { status: 'added' },
				} );
			}
		} else if ( part.removed ) {
			for ( let i = 0; i < part.count; i++ ) {
				result.push( {
					...previousRaw[ prevIdx++ ],
					__revisionDiffStatus: { status: 'removed' },
				} );
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

	// Post-process to pair similar removed/added blocks as modifications.
	return pairSimilarBlocks( result );
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
 * Analyze what formatting changed between two character positions.
 * Returns both the change type (for styling) and a description (for tooltip).
 *
 * @param {Array}  currentFormats  Current formats array.
 * @param {Array}  previousFormats Previous formats array.
 * @param {number} currIdx         Character index in current.
 * @param {number} prevIdx         Character index in previous.
 * @return {{ type: 'added'|'removed'|'changed', description: string }} Change info.
 */
function describeFormatChange(
	currentFormats,
	previousFormats,
	currIdx,
	prevIdx
) {
	const currFmts = currentFormats[ currIdx ] || [];
	const prevFmts = previousFormats[ prevIdx ] || [];

	let addedCount = 0;
	let removedCount = 0;
	let changedCount = 0;

	// Find added formats and attribute changes
	for ( const fmt of currFmts ) {
		const match = prevFmts.find( ( pf ) => pf.type === fmt.type );
		if ( ! match ) {
			addedCount++;
		} else if (
			JSON.stringify( fmt.attributes ) !==
			JSON.stringify( match.attributes )
		) {
			changedCount++;
		}
	}

	// Find removed formats
	for ( const fmt of prevFmts ) {
		const match = currFmts.find( ( cf ) => cf.type === fmt.type );
		if ( ! match ) {
			removedCount++;
		}
	}

	// Determine primary change type for styling
	if ( addedCount > 0 && removedCount === 0 && changedCount === 0 ) {
		return {
			type: 'added',
			description: sprintf(
				/* translators: %d: number of formats added */
				_n( '%d format added', '%d formats added', addedCount ),
				addedCount
			),
		};
	}
	if ( removedCount > 0 && addedCount === 0 && changedCount === 0 ) {
		return {
			type: 'removed',
			description: sprintf(
				/* translators: %d: number of formats removed */
				_n( '%d format removed', '%d formats removed', removedCount ),
				removedCount
			),
		};
	}

	// Mixed or attribute-only changes
	const parts = [];
	if ( addedCount > 0 ) {
		parts.push(
			sprintf(
				/* translators: %d: number of formats added */
				_n( '%d format added', '%d formats added', addedCount ),
				addedCount
			)
		);
	}
	if ( removedCount > 0 ) {
		parts.push(
			sprintf(
				/* translators: %d: number of formats removed */
				_n( '%d format removed', '%d formats removed', removedCount ),
				removedCount
			)
		);
	}
	if ( changedCount > 0 ) {
		parts.push(
			sprintf(
				/* translators: %d: number of formats changed */
				_n( '%d format changed', '%d formats changed', changedCount ),
				changedCount
			)
		);
	}
	return {
		type: 'changed',
		description: parts.join( ', ' ) || __( 'Formatting changed' ),
	};
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

	// Diff the plain text (words for cleaner output).
	const textDiff = diffWordsWithSpace( previousText, currentText );

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
				{
					type: 'revision/diff-removed',
					attributes: { title: __( 'Removed' ) },
				},
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
				{
					type: 'revision/diff-added',
					attributes: { title: __( 'Added' ) },
				},
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
						// Get type and description of what changed
						const { type, description } = describeFormatChange(
							currentFormats,
							previousFormats,
							currentIdx + rangeStart,
							previousIdx + rangeStart
						);

						// Map change type to format type for styling
						const formatType = {
							added: 'revision/diff-format-added',
							removed: 'revision/diff-format-removed',
							changed: 'revision/diff-format-changed',
						}[ type ];

						const marked = applyFormat(
							rangeSlice,
							{
								type: formatType,
								attributes: { title: description },
							},
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
 * Apply diffs to a modified block's attributes.
 * - Rich-text attributes: applies inline diff formatting (ins/del marks).
 * - Other attributes: computes word-level diffs for the sidebar panel.
 *
 * @param {Object} currentBlock  Current parsed block.
 * @param {Object} previousBlock Previous parsed block.
 * @param {Object} diffStatus    The __revisionDiffStatus object to attach changedAttributes to.
 */
function applyDiffToBlock( currentBlock, previousBlock, diffStatus ) {
	const blockType = getBlockType( currentBlock.name );
	if ( ! blockType ) {
		return;
	}

	const changedAttributes = {};

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
		} else {
			const currStr = stringifyValue(
				currentBlock.attributes[ attrName ]
			);
			const prevStr = stringifyValue(
				previousBlock.attributes[ attrName ]
			);
			if ( currStr !== prevStr ) {
				changedAttributes[ attrName ] = diffWordsWithSpace(
					prevStr,
					currStr
				);
			}
		}
	}

	if ( Object.keys( changedAttributes ).length > 0 ) {
		diffStatus.changedAttributes = changedAttributes;
	}
}

/**
 * Recursively apply diff status and rich text diff to blocks in the tree.
 * Copies __revisionDiffStatus from raw blocks to parsed blocks and applies
 * rich text diffs to modified blocks.
 *
 * @param {Object} parsedBlock Parsed block (with inner blocks).
 * @param {Object} rawBlock    Raw block (with __revisionDiffStatus and __previousRawBlock).
 */
function applyDiffRecursively( parsedBlock, rawBlock ) {
	// Copy diff status from raw block to parsed block.
	if ( rawBlock.__revisionDiffStatus ) {
		// Apply diffs if this block is modified and has a previous raw block.
		if (
			rawBlock.__revisionDiffStatus.status === 'modified' &&
			rawBlock.__previousRawBlock
		) {
			const previousParsed = parseRawBlock( rawBlock.__previousRawBlock );
			if ( previousParsed ) {
				applyDiffToBlock(
					parsedBlock,
					previousParsed,
					rawBlock.__revisionDiffStatus
				);
			}
		}

		parsedBlock.__revisionDiffStatus = rawBlock.__revisionDiffStatus;
		// Also store in attributes so it survives block-editor store normalization.
		parsedBlock.attributes.__revisionDiffStatus =
			rawBlock.__revisionDiffStatus;
	}

	// Recursively process inner blocks.
	if ( parsedBlock.innerBlocks && rawBlock.innerBlocks ) {
		for ( let i = 0; i < parsedBlock.innerBlocks.length; i++ ) {
			const parsedInner = parsedBlock.innerBlocks[ i ];
			const rawInner = rawBlock.innerBlocks[ i ];
			if ( parsedInner && rawInner ) {
				applyDiffRecursively( parsedInner, rawInner );
			}
		}
	}
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

	// Parse each raw block and apply diff status.
	return mergedRaw
		.map( ( rawBlock ) => {
			const parsed = parseRawBlock( rawBlock );
			if ( parsed ) {
				applyDiffRecursively( parsed, rawBlock );
			}
			return parsed;
		} )
		.filter( Boolean );
}
