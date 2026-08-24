/**
 * WordPress dependencies
 */
import { __, sprintf } from '@wordpress/i18n';

/**
 * @typedef {import('../types').AccessibilityIssue} AccessibilityIssue
 * @typedef {import('../types').BlockLike} BlockLike
 */

/**
 * Collects all heading blocks from a block tree in document order.
 *
 * @param {BlockLike[]} blocks - Array of blocks to analyze
 * @return {BlockLike[]} Array of heading blocks in document order
 */
function collectHeadings( blocks ) {
	const headings = [];

	/**
	 * Recursively collect headings from blocks.
	 *
	 * @param {BlockLike} block - Block to process
	 */
	function processBlock( block ) {
		if ( block.name === 'core/heading' ) {
			headings.push( block );
		}

		// Recursively process inner blocks
		if ( block.innerBlocks && block.innerBlocks.length > 0 ) {
			block.innerBlocks.forEach( processBlock );
		}
	}

	blocks.forEach( processBlock );
	return headings;
}

/**
 * Checks heading hierarchy for proper nesting order.
 * Headings should not skip levels (e.g., H1 to H3 without H2).
 *
 * @param {BlockLike[]} blocks - Array of blocks to analyze
 * @return {AccessibilityIssue[]} Array of issues found
 */
export function checkHeadingHierarchy( blocks ) {
	const issues = [];
	const headings = collectHeadings( blocks );

	if ( headings.length === 0 ) {
		return issues;
	}

	// Check if first heading is not H1 (optional warning)
	const firstHeading = headings[ 0 ];
	const firstLevel = firstHeading.attributes?.level || 2;

	if ( firstLevel !== 1 && firstLevel !== 2 ) {
		issues.push( {
			id: `heading-hierarchy-first-${ firstHeading.clientId }`,
			type: 'warning',
			category: 'heading-hierarchy',
			message: sprintf(
				/* translators: %d: heading level number */
				__(
					'Document starts with H%d. Consider starting with H1 or H2.'
				),
				firstLevel
			),
			clientId: firstHeading.clientId,
			blockType: firstHeading.name,
			suggestion: __(
				'The first heading in a document should typically be H1 or H2 for proper document structure.'
			),
		} );
	}

	// Check for skipped heading levels
	let previousLevel = 0;

	headings.forEach( ( heading ) => {
		const currentLevel = heading.attributes?.level || 2;

		// Check if we skipped a level (e.g., went from H1 to H3)
		if ( previousLevel > 0 && currentLevel > previousLevel + 1 ) {
			const skippedLevels = [];
			for ( let i = previousLevel + 1; i < currentLevel; i++ ) {
				skippedLevels.push( `H${ i }` );
			}

			let suggestion;
			if ( skippedLevels.length === 1 ) {
				suggestion = sprintf(
					/* translators: %1$s: the skipped heading level like "H2" */
					__(
						'Consider using %1$s instead, or add a %1$s heading before this one.'
					),
					skippedLevels[ 0 ]
				);
			} else {
				suggestion = sprintf(
					/* translators: %s: list of skipped heading levels like "H2, H3" */
					__(
						'Missing heading levels: %s. Consider restructuring your heading hierarchy.'
					),
					skippedLevels.join( ', ' )
				);
			}

			issues.push( {
				id: `heading-hierarchy-skip-${ heading.clientId }`,
				type: 'warning',
				category: 'heading-hierarchy',
				message: sprintf(
					/* translators: %1$d: previous heading level, %2$d: current heading level */
					__( 'Heading level skipped from H%1$d to H%2$d' ),
					previousLevel,
					currentLevel
				),
				clientId: heading.clientId,
				blockType: heading.name,
				suggestion,
			} );
		}

		previousLevel = currentLevel;
	} );

	return issues;
}
