/**
 * Maps template slugs to their parents.
 */
const TEMPLATE_PARENTS = {
	index: null,
	archive: 'index',

	singular: 'index',
	single: 'singular',
	page: 'singular',

	home: 'index',
	404: 'index',
	search: 'index',

	'front-page': 'home',
};

/**
 * Maps template slugs to their children template slugs.
 */
const TEMPLATE_DEPS = Object.keys( TEMPLATE_PARENTS ).reduce(
	( obj, template ) => {
		const parent = TEMPLATE_PARENTS[ template ];
		if ( ! obj[ parent ] ) {
			obj[ parent ] = [];
		}
		obj[ parent ].push( template );

		return obj;
	},
	{}
);

export function isTemplateSuperseded( slug, existingSlugs ) {
	return TEMPLATE_DEPS[ slug ]
		? TEMPLATE_DEPS[ slug ].every(
				( dep ) =>
					isTemplateSuperseded( dep, existingSlugs ) ||
					!! existingSlugs.find(
						( existingSlug ) => existingSlug === dep
					)
		  )
		: ! existingSlugs.find( ( existingSlug ) => existingSlug === slug );
}
