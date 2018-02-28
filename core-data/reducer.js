const reducer = ( state, action ) => {
	switch ( action.type ) {
		case 'FETCH_CATEGORIES_SUCCESS':
			return action.categories.reduce( ( memo, category ) => ( {
				...memo,
				[ category.id ]: category,
			} ), {} );
	}

	return state;
};

export default reducer;
