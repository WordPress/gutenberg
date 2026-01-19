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
 * Does NOT mark inner blocks - parent styling is sufficient for added/removed.
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
	};
}

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
		const status = block.attrs?.__revisionDiffStatus;
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
			if ( score > bestScore && score > SIMILARITY_THRESHOLD ) {
				bestScore = score;
				bestMatch = add;
			}
		}

		if ( bestMatch ) {
			pairedRemoved.add( rem.index );

			// Create modified block with previous content stored.
			modifications.set( bestMatch.index, {
				...bestMatch.block,
				attrs: {
					...bestMatch.block.attrs,
					__revisionDiffStatus: 'modified',
				},
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

	// Post-process to pair similar removed/added blocks as modifications.
	return pairSimilarBlocks( result );
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
 * Get a human-readable label for a format type.
 *
 * @param {string} formatType The format type (e.g., 'core/bold').
 * @return {string} Human-readable label.
 */
function getFormatLabel( formatType ) {
	const labels = {
		'core/bold': 'Bold',
		'core/italic': 'Italic',
		'core/link': 'Link',
		'core/code': 'Code',
		'core/strikethrough': 'Strikethrough',
		'core/underline': 'Underline',
		'core/subscript': 'Subscript',
		'core/superscript': 'Superscript',
	};
	return labels[ formatType ] || formatType?.split( '/' )[ 1 ] || 'Format';
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

	const added = [];
	const removed = [];
	const changed = [];

	// Find added formats and attribute changes
	for ( const fmt of currFmts ) {
		const match = prevFmts.find( ( pf ) => pf.type === fmt.type );
		if ( ! match ) {
			added.push( getFormatLabel( fmt.type ) );
		} else if (
			JSON.stringify( fmt.attributes ) !==
			JSON.stringify( match.attributes )
		) {
			changed.push( getFormatLabel( fmt.type ) );
		}
	}

	// Find removed formats
	for ( const fmt of prevFmts ) {
		const match = currFmts.find( ( cf ) => cf.type === fmt.type );
		if ( ! match ) {
			removed.push( getFormatLabel( fmt.type ) );
		}
	}

	// Determine primary change type for styling
	if ( added.length > 0 && removed.length === 0 && changed.length === 0 ) {
		return {
			type: 'added',
			description: added.join( ', ' ) + ' added',
		};
	}
	if ( removed.length > 0 && added.length === 0 && changed.length === 0 ) {
		return {
			type: 'removed',
			description: removed.join( ', ' ) + ' removed',
		};
	}

	// Mixed or attribute-only changes
	const parts = [
		...added.map( ( f ) => f + ' added' ),
		...removed.map( ( f ) => f + ' removed' ),
		...changed.map( ( f ) => f + ' changed' ),
	];
	return {
		type: 'changed',
		description: parts.join( ', ' ) || 'Formatting changed',
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
					attributes: { title: 'Removed' },
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
					attributes: { title: 'Added' },
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

/**
 * Calculate diff statistics from parsed blocks with diff status.
 *
 * @param {Array} blocks Parsed blocks with __revisionDiffStatus attributes.
 * @return {Object} Statistics object with blocksAdded, blocksRemoved, blocksModified, wordsAdded, wordsRemoved.
 */
export function calculateDiffStatistics( blocks ) {
	let blocksAdded = 0;
	let blocksRemoved = 0;
	let blocksModified = 0;
	let wordsAdded = 0;
	let wordsRemoved = 0;

	function countWords( text ) {
		return ( text || '' ).trim().split( /\s+/ ).filter( Boolean ).length;
	}

	function processBlock( block ) {
		const status = block.attributes?.__revisionDiffStatus;
		const content = block.attributes?.content?.toString?.() || '';

		if ( status === 'added' ) {
			blocksAdded++;
			wordsAdded += countWords( content );
		} else if ( status === 'removed' ) {
			blocksRemoved++;
			wordsRemoved += countWords( content );
		} else if ( status === 'modified' ) {
			blocksModified++;
			// Modified blocks have inline diff - parse del/ins for word counts
			const htmlContent = content;
			const delMatches =
				htmlContent.match( /<del[^>]*>([^<]*)<\/del>/g ) || [];
			const insMatches =
				htmlContent.match( /<ins[^>]*>([^<]*)<\/ins>/g ) || [];
			delMatches.forEach( ( m ) => {
				wordsRemoved += countWords( m.replace( /<[^>]+>/g, '' ) );
			} );
			insMatches.forEach( ( m ) => {
				wordsAdded += countWords( m.replace( /<[^>]+>/g, '' ) );
			} );
		}

		// Recurse into inner blocks
		block.innerBlocks?.forEach( processBlock );
	}

	blocks.forEach( processBlock );

	return {
		blocksAdded,
		blocksRemoved,
		blocksModified,
		wordsAdded,
		wordsRemoved,
	};
}

/**
 * Preserves clientIds from previously rendered blocks to prevent flashing.
 * Uses LCS algorithm to match blocks by blockName between renders.
 *
 * This is separate from the visual diff (which compares revision content).
 * This compares the newly parsed blocks against the last rendered blocks
 * to maintain React key stability.
 *
 * @param {Array} newBlocks  Newly parsed blocks with fresh clientIds.
 * @param {Array} prevBlocks Previously rendered blocks with stable clientIds.
 * @return {Array} Blocks with preserved clientIds where possible.
 */
export function preserveClientIds( newBlocks, prevBlocks ) {
	if ( ! prevBlocks?.length || ! newBlocks?.length ) {
		return newBlocks;
	}

	// Create signatures for LCS matching (just blockName for simplicity).
	const newSigs = newBlocks.map( ( b ) => b.name );
	const prevSigs = prevBlocks.map( ( b ) => b.name );

	const diffResult = diffArrays( prevSigs, newSigs );

	let newIndex = 0;
	let prevIndex = 0;
	const result = [];

	for ( const chunk of diffResult ) {
		if ( chunk.removed ) {
			// Blocks only in prev render - skip them.
			prevIndex += chunk.count;
		} else if ( chunk.added ) {
			// Blocks only in new render - keep new clientIds.
			for ( let i = 0; i < chunk.count; i++ ) {
				result.push( newBlocks[ newIndex++ ] );
			}
		} else {
			// Matched blocks - preserve clientIds from prev render.
			for ( let i = 0; i < chunk.count; i++ ) {
				const newBlock = newBlocks[ newIndex++ ];
				const prevBlock = prevBlocks[ prevIndex++ ];
				result.push( {
					...newBlock,
					clientId: prevBlock.clientId,
					innerBlocks: preserveClientIds(
						newBlock.innerBlocks,
						prevBlock.innerBlocks
					),
				} );
			}
		}
	}

	return result;
}
