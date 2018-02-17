function TermList( { terms, showTagCounts, ...rest } ) {
	return (
		<div { ...rest }>
			{ terms.map( ( term, i ) => (
				<a key={ i } href={ term.link } target="_blank">
					{ term.name }
					{ showTagCounts ? <span>{ `(${ term.count })` }</span> : '' }
				</a>
			) ) }
		</div>
	);
}

export default TermList;
