// TODO jsdoc and tests
export const getTermsInfo = ( terms ) => ( {
	terms,
	...terms?.reduce(
		( accumulator, term ) => {
			const { mapById, mapByName, names } = accumulator;
			mapById[ term.id ] = term;
			mapByName[ term.name ] = term;
			names.push( term.name );
			return accumulator;
		},
		{ mapById: {}, mapByName: {}, names: [] }
	),
} );
