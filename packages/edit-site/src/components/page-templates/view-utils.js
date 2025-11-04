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

export function getDefaultView( activeView ) {
	return {
		...DEFAULT_VIEW,
		sort:
			activeView === 'user'
				? {
						field: 'date',
						direction: 'desc',
				  }
				: DEFAULT_VIEW.sort,
		filters: ! [ 'active', 'user' ].includes( activeView )
			? [
					{
						field: 'author',
						operator: 'isAny',
						value: [ activeView ],
					},
			  ]
			: [],
	};
}
