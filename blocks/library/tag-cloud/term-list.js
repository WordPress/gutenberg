/**
 * Calculate font size for terms based on their post count.
 *
 * @param {Array} terms The list of terms.
 *
 * @return {Array} Array of scaled font sizes.
 */
function calculateFontSizes( terms ) {
	const MIN = 8;
	const MAX = 22;
	const UNIT = 'pt';

	// Sort terms by post count ascending
	const sortedTerms = terms.slice().sort( ( a, b ) => a.count - b.count );

	// Get first and last items in array to know
	// the lowest and highest post count in list
	const lowestCount = sortedTerms[ 0 ].count;
	const highestCount = sortedTerms.pop().count;

	const range = Math.max( highestCount - lowestCount, 1 );
	const fontStep = ( MAX - MIN ) / range;

	// Calculate font size for each term
	return terms.map( term => {
		const countWeight = term.count - lowestCount;
		const fontSize = MIN + ( countWeight * fontStep ) + UNIT;
		return fontSize;
	} );
}

function TermList( { terms, showTagCounts, ...rest } ) {
	const termFontSizes = calculateFontSizes( terms );

	return (
		<div { ...rest }>
			{ terms.map( ( term, i ) => (
				<a
					key={ i }
					href={ term.link }
					style={ { fontSize: termFontSizes[ i ] } }
					target="_blank"
				>
					{ term.name }
					{ showTagCounts ? <span>{ `(${ term.count })` }</span> : '' }
				</a>
			) ) }
		</div>
	);
}

export default TermList;
