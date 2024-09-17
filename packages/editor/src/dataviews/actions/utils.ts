/**
 * WordPress dependencies
 */
import { decodeEntities } from '@wordpress/html-entities';

/**
 * Internal dependencies
 */
import {
	TEMPLATE_ORIGINS,
	TEMPLATE_PART_POST_TYPE,
	TEMPLATE_POST_TYPE,
} from '../../store/constants';

import type { Post, TemplatePart, Template } from '../types';

export function isTemplate( post: Post ): post is Template {
	return post.type === TEMPLATE_POST_TYPE;
}

export function isTemplatePart( post: Post ): post is TemplatePart {
	return post.type === TEMPLATE_PART_POST_TYPE;
}

export function isTemplateOrTemplatePart(
	p: Post
): p is Template | TemplatePart {
	return p.type === TEMPLATE_POST_TYPE || p.type === TEMPLATE_PART_POST_TYPE;
}

export function getItemTitle( item: Post ) {
	if ( typeof item.title === 'string' ) {
		return decodeEntities( item.title );
	}
	if ( 'rendered' in item.title ) {
		return decodeEntities( item.title.rendered );
	}
	if ( 'raw' in item.title ) {
		return decodeEntities( item.title.raw );
	}
	return '';
}

/**
 * Check if a template is removable.
 *
 * @param template The template entity to check.
 * @return Whether the template is removable.
 */
export function isTemplateRemovable( template: Template | TemplatePart ) {
	if ( ! template ) {
		return false;
	}
	// In patterns list page we map the templates parts to a different object
	// than the one returned from the endpoint. This is why we need to check for
	// two props whether is custom or has a theme file.
	return (
		[ template.source, template.source ].includes(
			TEMPLATE_ORIGINS.custom
		) &&
		! Boolean( template.type === 'wp_template' && template?.plugin ) &&
		! template.has_theme_file
	);
}
