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
	search: '',
	page: 1,
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
