/**
 * WordPress dependencies
 */
import { decodeEntities } from '@wordpress/html-entities';
import { __, sprintf } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import type { Post, TemplatePart, Template } from '../types';

export function isTemplate( post: Post ): post is Template {
	return post.type === 'wp_template';
}

export function isTemplatePart( post: Post ): post is TemplatePart {
	return post.type === 'wp_template_part';
}

export function isTemplateOrTemplatePart(
	p: Post
): p is Template | TemplatePart {
	return p.type === 'wp_template' || p.type === 'wp_template_part';
}

export function getItemTitle(
	item: {
		title: string | { rendered: string } | { raw: string };
		excerpt?: string | { rendered: string } | { raw: string };
		content?: string | { rendered: string } | { raw: string };
	},
	fallback: string = __( '(no title)' )
) {
	let title = '';
	if ( typeof item.title === 'string' ) {
		title = decodeEntities( item.title );
	} else if ( item.title && 'rendered' in item.title ) {
		title = decodeEntities( item.title.rendered );
	} else if ( item.title && 'raw' in item.title ) {
		title = decodeEntities( item.title.raw );
	}
	if ( title ) {
		return title;
	}

	let snippet = '';
	if ( item.excerpt ) {
		if ( typeof item.excerpt === 'string' ) {
			snippet = item.excerpt;
		} else if ( 'rendered' in item.excerpt ) {
			snippet = item.excerpt.rendered;
		} else if ( 'raw' in item.excerpt ) {
			snippet = item.excerpt.raw;
		}
	}
	if ( ! snippet && item.content ) {
		if ( typeof item.content === 'string' ) {
			snippet = item.content;
		} else if ( 'rendered' in item.content ) {
			snippet = item.content.rendered;
		} else if ( 'raw' in item.content ) {
			snippet = item.content.raw;
		}
	}

	if ( snippet ) {
		const plainText = decodeEntities(
			snippet.replace( /<[^>]+>/g, '' )
		).trim();
		const truncated = plainText.substring( 0, 40 );
		if ( truncated ) {
			const ellipsis = plainText.length > 40 ? '…' : '';
			return sprintf(
				/* translators: 1: Default no title text, 2: Post excerpt/content snippet */
				__( '%1$s - %2$s' ),
				fallback,
				truncated + ellipsis
			);
		}
	}

	return fallback;
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
		[ template.source, template.source ].includes( 'custom' ) &&
		! Boolean( template.type === 'wp_template' && template?.plugin ) &&
		! template.has_theme_file
	);
}
