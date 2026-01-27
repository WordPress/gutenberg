export const defaultLayouts = {
	table: {
		showMedia: false,
	},
	grid: {
		showMedia: true,
	},
	list: {
		showMedia: false,
	},
};

const DEFAULT_VIEW = {
	type: 'grid',
	perPage: 20,
	sort: {
		field: 'title',
		direction: 'asc',
	},
	titleField: 'title',
	descriptionField: 'description',
	mediaField: 'preview',
	fields: [ 'author', 'active', 'slug', 'theme' ],
	filters: [],
	...defaultLayouts.grid,
};

export function getDefaultView() {
	return {
		...DEFAULT_VIEW,
	};
}

export function getActiveFiltersForTab( activeView ) {
	if ( activeView === 'active' || activeView === 'user' ) {
		return [];
	}
	// Author-based view
	return [
		{
			field: 'author',
			operator: 'isAny',
			value: [ activeView ],
		},
	];
}
