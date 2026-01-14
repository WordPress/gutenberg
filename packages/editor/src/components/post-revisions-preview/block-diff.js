/**
 * External dependencies
 */
import { diffArrays } from 'diff/lib/diff/array';
import { diffChars } from 'diff/lib/diff/character';

/**
 * WordPress dependencies
 */
import { parse as grammarParse } from '@wordpress/block-serialization-default-parser';
import { privateApis as blocksPrivateApis } from '@wordpress/blocks';

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
 * Generate inline diff HTML with <del> and <ins> tags.
 *
 * @param {string} oldHTML Previous HTML content.
 * @param {string} newHTML Current HTML content.
 * @return {string} HTML with inline diff markup.
 */
function generateInlineDiff( oldHTML, newHTML ) {
	const diff = diffChars( oldHTML || '', newHTML || '' );

	return diff
		.map( ( part ) => {
			if ( part.removed ) {
				return `<del class="revision-diff-removed">${ part.value }</del>`;
			}
			if ( part.added ) {
				return `<ins class="revision-diff-added">${ part.value }</ins>`;
			}
			return part.value;
		} )
		.join( '' );
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

				result.push( {
					...currBlock,
					innerHTML: generateInlineDiff(
						prevBlock.innerHTML,
						currBlock.innerHTML
					),
					attrs: {
						...currBlock.attrs,
						__revisionDiffStatus: 'modified',
					},
					innerBlocks: diffedInnerBlocks,
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
