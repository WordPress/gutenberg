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

export function getActiveViewOverridesForTab( activeView ) {
	// User view: sort by date, newest first
	if ( activeView === 'user' ) {
		return {
			sort: { field: 'date', direction: 'desc' },
		};
	}
	// Active view: no overrides
	if ( activeView === 'active' ) {
		return {};
	}
	// Author-based view: filter by author
	return {
		filters: [
			{
				field: 'author',
				operator: 'isAny',
				value: [ activeView ],
			},
		],
	};
}
