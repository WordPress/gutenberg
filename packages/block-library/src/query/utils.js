// TODO jsdoc and tests
export const getTaxonomyInfo = ( terms ) => ( {
	terms,
	...terms?.reduce(
		( acc, term ) => ( {
			mapById: {
				...acc.mapById,
				[ term.id ]: term,
			},
			mapByName: {
				...acc.mapByName,
				[ term.name ]: term,
			},
		} ),
		{ mapById: {}, mapByName: {} }
	),
} );
