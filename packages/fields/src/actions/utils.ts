/**
 * WordPress dependencies
 */
import { decodeEntities } from '@wordpress/html-entities';
import { __, sprintf } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import type { Post, TemplatePart, Template } from '../types';

const TITLE_FALLBACK_SNIPPET_LENGTH = 80;

type RenderedContent = string | { raw?: string; rendered?: string };

type ItemWithTitleAndContent = {
	title?: RenderedContent;
	excerpt?: RenderedContent;
	content?: RenderedContent;
};

function getRenderedContent( content?: RenderedContent ) {
	if ( ! content ) {
		return '';
	}

	if ( typeof content === 'string' ) {
		return content;
	}

	return content.rendered || content.raw || '';
}

function stripHTML( html: string ) {
	if ( typeof document !== 'undefined' ) {
		const element = document.createElement( 'div' );
		element.innerHTML = html;
		return element.textContent || '';
	}

	return html.replace( /<!--[\s\S]*?-->/g, '' ).replace( /<[^>]*>/g, '' );
}

function getPlainText( content?: RenderedContent ) {
	return decodeEntities( stripHTML( getRenderedContent( content ) ) )
		.replace( /\s+/g, ' ' )
		.trim();
}

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
		title?: string | { rendered: string } | { raw: string };
	},
	fallback: string = __( '(no title)' )
) {
	const title = getPlainText( item.title );
	return title || fallback;
}

export function getItemExcerptOrContentSnippet(
	item: ItemWithTitleAndContent,
	length: number = TITLE_FALLBACK_SNIPPET_LENGTH
) {
	const text = getPlainText( item.excerpt ) || getPlainText( item.content );

	if ( text.length <= length ) {
		return text;
	}

	return `${ text.slice( 0, length ).trimEnd() }...`;
}

export function getItemTitleWithFallbackSnippet(
	item: ItemWithTitleAndContent,
	fallback: string = __( '(no title)' )
) {
	const title = getItemTitle( item, '' );
	if ( title ) {
		return title;
	}

	const snippet = getItemExcerptOrContentSnippet( item );
	if ( ! snippet ) {
		return fallback;
	}

	return sprintf(
		/* translators: 1: title fallback for an untitled post, 2: excerpt or content snippet. */
		__( '%1$s %2$s' ),
		fallback,
		snippet
	);
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
