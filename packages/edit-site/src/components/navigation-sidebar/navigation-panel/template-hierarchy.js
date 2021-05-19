/**
 * External dependencies
 */
import { map } from 'lodash';

/**
 * Internal dependencies
 */
import {
	MENU_TEMPLATES,
	MENU_TEMPLATES_GENERAL,
	MENU_TEMPLATES_PAGES,
	MENU_TEMPLATES_POSTS,
	TEMPLATE_OVERRIDES,
	TEMPLATES_GENERAL,
	TEMPLATES_PAGES_PREFIXES,
	TEMPLATES_POSTS_PREFIXES,
	TEMPLATES_TOP_LEVEL,
} from './constants';

export function isTemplateSuperseded( slug, existingSlugs, showOnFront ) {
	if ( ! TEMPLATE_OVERRIDES[ slug ] ) {
		return false;
	}

	// `home` template is unused if it is superseded by `front-page`
	// or "show on front" is set to show a page rather than blog posts.
	if ( slug === 'home' && showOnFront !== 'posts' ) {
		return true;
	}

	return TEMPLATE_OVERRIDES[ slug ].every(
		( overrideSlug ) =>
			existingSlugs.includes( overrideSlug ) ||
			isTemplateSuperseded( overrideSlug, existingSlugs, showOnFront )
	);
}

export function getTemplateLocation( slug ) {
	const isTopLevelTemplate = TEMPLATES_TOP_LEVEL.includes( slug );
	if ( isTopLevelTemplate ) {
		return MENU_TEMPLATES;
	}

	const isGeneralTemplate = TEMPLATES_GENERAL.includes( slug );
	if ( isGeneralTemplate ) {
		return MENU_TEMPLATES_GENERAL;
	}

	const isPostsTemplate = TEMPLATES_POSTS_PREFIXES.some( ( prefix ) =>
		slug.startsWith( prefix )
	);
	if ( isPostsTemplate ) {
		return MENU_TEMPLATES_POSTS;
	}

	const isPagesTemplate = TEMPLATES_PAGES_PREFIXES.some( ( prefix ) =>
		slug.startsWith( prefix )
	);
	if ( isPagesTemplate ) {
		return MENU_TEMPLATES_PAGES;
	}

	return MENU_TEMPLATES_GENERAL;
}

export function getUnusedTemplates( templates, showOnFront ) {
	const templateSlugs = map( templates, 'slug' );
	const supersededTemplates = templates.filter( ( { slug } ) =>
		isTemplateSuperseded( slug, templateSlugs, showOnFront )
	);

	return supersededTemplates;
}

export function getTemplatesLocationMap( templates ) {
	return templates.reduce( ( obj, template ) => {
		obj[ template.slug ] = getTemplateLocation( template.slug );
		return obj;
	}, {} );
}
