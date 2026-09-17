type TemplateRecordForPostList = {
	slug?: string;
	is_custom?: boolean;
	post_types?: string[];
	postTypes?: string[];
	site_editor_template_context?: {
		post_type?: string;
	} | null;
};

const PAGE_TEMPLATE_SLUGS = [ 'front-page', 'page' ];
const NON_PAGE_TEMPLATE_SLUGS = [
	'404',
	'archive',
	'attachment',
	'author',
	'category',
	'date',
	'home',
	'index',
	'search',
	'single',
	'tag',
	'taxonomy',
];
const NON_PAGE_TEMPLATE_PREFIXES = [
	'archive-',
	'author-',
	'category-',
	'date-',
	'single-',
	'tag-',
	'taxonomy-',
];

function getSupportedPostTypes( record: TemplateRecordForPostList ) {
	return record.post_types || record.postTypes;
}

function isNonPageTemplateSlug( slug: string | undefined ) {
	return (
		!! slug &&
		( NON_PAGE_TEMPLATE_SLUGS.includes( slug ) ||
			NON_PAGE_TEMPLATE_PREFIXES.some( ( prefix ) =>
				slug.startsWith( prefix )
			) )
	);
}

export function isPageApplicableTemplate( record: TemplateRecordForPostList ) {
	const supportedPostTypes = getSupportedPostTypes( record );
	if ( Array.isArray( supportedPostTypes ) ) {
		return supportedPostTypes.includes( 'page' );
	}

	if ( record.site_editor_template_context?.post_type === 'page' ) {
		return true;
	}

	if (
		!! record.slug &&
		( PAGE_TEMPLATE_SLUGS.includes( record.slug ) ||
			record.slug.startsWith( 'page-' ) )
	) {
		return true;
	}

	return !! record.is_custom && ! isNonPageTemplateSlug( record.slug );
}
