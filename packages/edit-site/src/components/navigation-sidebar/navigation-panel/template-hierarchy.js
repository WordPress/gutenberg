const TEMPLATE_OVERRIDES = {
	singular: [ 'single', 'page' ],
	index: [ 'archive', '404', 'search', 'singular' ],
};

export function isTemplateSuperseded( slug, existingSlugs ) {
	if ( ! TEMPLATE_OVERRIDES[ slug ] ) {
		return false;
	}

	return TEMPLATE_OVERRIDES[ slug ].every(
		( overrideSlug ) =>
			existingSlugs.includes( overrideSlug ) ||
			isTemplateSuperseded( overrideSlug, existingSlugs )
	);
}
