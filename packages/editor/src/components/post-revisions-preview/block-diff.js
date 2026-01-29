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
import { __, _n, sprintf } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import { unlock } from '../../lock-unlock';

const { parseRawBlock } = unlock( blocksPrivateApis );

/**
 * Calculate text similarity using word diff (semantically meaningful).
 * Returns ratio of unchanged words to total words.
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

	const changes = diffWords( text1, text2 );
	const unchanged = changes
		.filter( ( c ) => ! c.added && ! c.removed )
		.reduce( ( sum, c ) => sum + c.value.length, 0 );
	const total = Math.max( text1.length, text2.length );
	return total > 0 ? unchanged / total : 0;
}

/**
 * Post-process diff result to pair similar removed/added blocks as modifications.
 * This catches modifications that LCS missed due to content changes.
 *
 * @param {Array} blocks Raw blocks with diff status.
 * @return {Array} Blocks with similar pairs converted to modifications.
 */
function pairSimilarBlocks( blocks ) {
	const removed = [];
	const added = [];

	// Separate blocks by status, tracking original indices.
	blocks.forEach( ( block, index ) => {
		const status = block.__revisionDiffStatus;
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

	const pairedRemoved = new Set(); // Indices of removed blocks that were paired.
	const modifications = new Map(); // Map from added block index to modified block.
	const SIMILARITY_THRESHOLD = 0.3;

	// For each removed block, find best matching added block.
	for ( const rem of removed ) {
		let bestMatch = null;
		let bestScore = 0;

		for ( const add of added ) {
			if ( modifications.has( add.index ) ) {
				continue;
			}
			if ( add.block.blockName !== rem.block.blockName ) {
				continue;
			}

			const score = textSimilarity(
				rem.block.innerHTML || '',
				add.block.innerHTML || ''
			);
			// If content is identical (score=1), only pair if attrs differ.
			// Otherwise identical blocks are just position swaps, not modifications.
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

		if ( bestMatch ) {
			pairedRemoved.add( rem.index );

			// Create modified block with previous content stored.
			modifications.set( bestMatch.index, {
				...bestMatch.block,
				__revisionDiffStatus: 'modified',
				__previousRawBlock: rem.block,
			} );
		}
	}

	// Rebuild result: filter out paired removed, replace paired added with modified.
	return blocks
		.map( ( block, index ) => {
			// Skip paired removed blocks.
			if ( pairedRemoved.has( index ) ) {
				return null;
			}
			// Replace paired added blocks with modified version.
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
 * @param {Array} currentRaw  Current revision's raw blocks.
 * @param {Array} previousRaw Previous revision's raw blocks.
 * @return {Array} Merged raw blocks with diff status injected.
 */
function diffRawBlocks( currentRaw, previousRaw ) {
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
					__revisionDiffStatus: 'added',
				} );
			}
		} else if ( part.removed ) {
			for ( let i = 0; i < part.count; i++ ) {
				result.push( {
					...previousRaw[ prevIdx++ ],
					__revisionDiffStatus: 'removed',
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
		parsedBlock.__revisionDiffStatus = rawBlock.__revisionDiffStatus;
	}

	// Apply rich text diff if this block is modified and has a previous raw block.
	if (
		rawBlock.__revisionDiffStatus === 'modified' &&
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
