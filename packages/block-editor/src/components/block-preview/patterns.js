/**
 * Gets all of the patterns needed for block preview.
 *
 * @param {Object[]} allPatterns       All registered patterns.
 * @param {Set}      patternsToPreview Patterns found in blocks.
 * @return {Object[]} Array of pattern data for block preview.
 */
export function getBlockPreviewPatterns( allPatterns, patternsToPreview ) {
	// Return early if no patterns are in the preview.
	if ( patternsToPreview.size === 0 ) {
		return [];
	}

	if ( allPatterns.length === 0 ) {
		return [];
	}

	let patterns = allPatterns.filter( ( pattern ) =>
		patternsToPreview.has( pattern.name )
	);

	let currentPatterns = patternsToPreview;

	currentPatterns = patterns.reduce( ( set, pattern ) => {
		const innerPatterns = getPatternsWithinPattern(
			pattern,
			allPatterns,
			currentPatterns
		);

		innerPatterns.forEach( ( patternName ) => set.add( patternName ) );

		return set;
	}, currentPatterns );

	patterns = allPatterns.filter( ( pattern ) =>
		currentPatterns.has( pattern.name )
	);

	return patterns;
}

/**
 * Search for patterns recursively within pattern.
 *
 * @param {Object}   pattern         The pattern to look at.
 * @param {Object[]} allPatterns     All registered patterns.
 * @param {Set}      currentPatterns Set of patterns we already know exist for blocks.
 * @return {Set} Set of patterns that exist for blocks.
 */
function getPatternsWithinPattern(
	pattern,
	allPatterns,
	currentPatterns = new Set()
) {
	if ( ! pattern.content || ! pattern.content.length ) {
		return new Set();
	}

	const regex = /wp:pattern\s*{.*"slug":\s*"(.*)"/g;

	const match = Array.from( pattern.content.matchAll( regex ) );

	if ( ! match || ! match.length || ! Array.isArray( match ) ) {
		return new Set();
	}

	const patternsWithin = match.reduce( ( set, regexMatch ) => {
		// Add capture group for slug.
		set.add( regexMatch[ 1 ] );

		return set;
	}, new Set() );

	const allPatternsWithin = allPatterns
		.filter( ( innerPattern ) => patternsWithin.has( innerPattern.name ) )
		// Avoid circular refrences by filtering out any patterns to be included already.
		.filter(
			( innerPattern ) => ! currentPatterns.has( innerPattern.name )
		);

	// Add new patterns to currentPatterns list of patterns we have already included.
	allPatternsWithin.forEach( ( innerPattern ) =>
		currentPatterns.add( innerPattern.name )
	);

	if ( allPatternsWithin && allPatternsWithin.length ) {
		allPatternsWithin.forEach( ( innerPattern ) => {
			const innerPatterns = getPatternsWithinPattern(
				innerPattern,
				allPatterns,
				currentPatterns
			);

			innerPatterns.forEach( ( patt ) => currentPatterns.add( patt ) );
		} );
	}

	return currentPatterns;
}

/**
 * Gets a set of patterns found in blocks.
 *
 * @param {Object[]} blocks Blocks to check.
 * @return {Set} Set of patterns found.
 */
export function getPatternsFromBlocks( blocks ) {
	if ( ! blocks || ! blocks.length || ! Array.isArray( blocks ) ) {
		return new Set();
	}

	// Merge sets of patterns.
	return blocks.reduce( ( set, block ) => {
		const patterns = getPatternsFromBlock( block );

		patterns.forEach( ( patternName ) => set.add( patternName ) );

		return set;
	}, new Set() );
}

/**
 * Finds the patterns in a block recursively checking inner blocks.
 *
 * @param {Object} block    The block to inspect
 * @param {Set}    patterns Set of patterns already found.
 * @return {Set} Set of found patterns in blocks.
 */
function getPatternsFromBlock( block, patterns = new Set() ) {
	if ( block.name === 'core/pattern' ) {
		patterns.add( block.attributes.slug );
	}

	if ( block.innerBlocks && block.innerBlocks.length ) {
		block.innerBlocks.forEach( ( innerBlock ) => {
			patterns = getPatternsFromBlock( innerBlock, patterns );
		} );
	}

	return patterns;
}
