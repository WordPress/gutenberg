/**
 * WordPress dependencies
 */
import { decodeEntities } from '@wordpress/html-entities';
import { __, sprintf } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import type { Post, TemplatePart, Template } from '../types';

const TITLE_FALLBACK_SNIPPET_LENGTH = 40;

type RenderedContent = string | { raw?: string; rendered?: string };

export type ItemWithTitleAndContent = {
	title?: RenderedContent;
	excerpt?: RenderedContent;
	content?: RenderedContent;
};

function extractTextContent( content?: RenderedContent ): string {
	if ( ! content ) {
		return '';
	}
	if ( typeof content === 'string' ) {
		return content;
	}
	return content.rendered || content.raw || '';
}

export function sanitizeAndStripHtml( html: string ): string {
	if ( ! html ) {
		return '';
	}

	let plainText = '';
	if ( typeof window !== 'undefined' && window.DOMParser ) {
		const parser = new DOMParser();
		const doc = parser.parseFromString( html, 'text/html' );
		plainText = doc.body.textContent || '';
	} else {
		plainText = html.replace( /<[^>]*>/g, '' );
	}

	return decodeEntities( plainText ).replace( /\s+/g, ' ' ).trim();
}

export function smartTruncate(
	text: string,
	maxLength: number = TITLE_FALLBACK_SNIPPET_LENGTH
): string {
	if ( text.length <= maxLength ) {
		return text;
	}

	// Slice to max length, then find the last space to avoid cutting words in half.
	const trimmed = text.slice( 0, maxLength + 1 );
	const lastSpaceIndex = trimmed.lastIndexOf( ' ' );

	if ( lastSpaceIndex > 0 ) {
		return `${ trimmed.slice( 0, lastSpaceIndex ) }…`;
	}

	// Fallback for extremely long contiguous strings without spaces.
	return `${ text.slice( 0, maxLength ) }…`;
}

export function getFallbackSnippet( item: ItemWithTitleAndContent ): string {
	const rawText =
		extractTextContent( item.excerpt ) ||
		extractTextContent( item.content );
	const cleanText = sanitizeAndStripHtml( rawText );

	return smartTruncate( cleanText );
}

export function getItemTitleWithFallbackSnippet(
	item: ItemWithTitleAndContent,
	fallback: string = __( '(no title)' )
): string {
	const title = getItemTitle( item, '' );
	if ( title ) {
		return title;
	}

	const snippet = getFallbackSnippet( item );
	if ( ! snippet ) {
		return fallback;
	}

	return sprintf(
		/* translators: 1: title fallback for an untitled post, 2: excerpt or content snippet. */
		__( '%1$s - %2$s' ),
		fallback,
		snippet
	);
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
	item: { title?: RenderedContent },
	fallback: string = __( '(no title)' )
): string {
	const title = sanitizeAndStripHtml( extractTextContent( item.title ) );
	return title || fallback;
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
