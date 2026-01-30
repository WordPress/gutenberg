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

export const DEFAULT_VIEW = {
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
