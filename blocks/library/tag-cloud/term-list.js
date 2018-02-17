function termCountScale( count ) {
	return Math.round( Math.log10( count + 1 ) * 100 );
}

function calculateFontSizes( terms ) {
	const MIN = 8;
	const MAX = 22;
	const UNIT = 'pt';
	const scaledCounts = [];

	terms.forEach( ( term, i ) => {
		const countScale = termCountScale( term.count );

		terms[ i ].fontScale = countScale;
		scaledCounts.push( countScale );
	} );

	const minCount = Math.min( ...scaledCounts );
	let spread = Math.max( ...scaledCounts ) - minCount;

	if ( spread <= 0 ) {
		spread = 1;
	}

	let fontSpread = MAX - MIN;

	if ( fontSpread < 0 ) {
		fontSpread = 1;
	}

	const fontStep = fontSpread / spread;

	terms.forEach( ( term, i ) => {
		const fontSize = MIN + ( ( terms[ i ].fontScale - minCount ) * fontStep );
		terms[ i ].fontScale = `${ fontSize }${ UNIT }`;
	} );

	return terms;
}

function TermList( { terms, showTagCounts, ...rest } ) {
	const termFontSizes = calculateFontSizes( terms );

	return (
		<div { ...rest }>
			{ terms.map( ( term, i ) => (
				<a
					key={ i }
					href={ term.link }
					style={ { fontSize: termFontSizes[ i ].fontScale } }
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
