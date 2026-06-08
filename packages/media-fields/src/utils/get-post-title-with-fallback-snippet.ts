/**
 * WordPress dependencies
 */
import { __, sprintf } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import { getRenderedContent } from './get-rendered-content';

const MAX_SNIPPET_LENGTH = 40;

export interface MediaAttachedPost {
	title?: string | { raw: string; rendered: string };
	excerpt?: string | { raw: string; rendered: string };
	content?: string | { raw: string; rendered: string };
}

function extractPlainText( htmlText: string ): string {
	if ( ! htmlText ) {
		return '';
	}

	let plainText = '';

	if ( typeof window !== 'undefined' && window.DOMParser ) {
		const parser = new DOMParser();
		const doc = parser.parseFromString( htmlText, 'text/html' );
		plainText = doc.body.textContent || '';
	} else {
		plainText = htmlText.replace( /<[^>]+>/g, '' );
	}

	return plainText.replace( /\s+/g, ' ' ).trim();
}

function generateSmartSnippet( text: string ): string {
	if ( text.length <= MAX_SNIPPET_LENGTH ) {
		return text;
	}

	// Look slightly past the max length to find the nearest word break.
	const boundarySlice = text.substring( 0, MAX_SNIPPET_LENGTH + 1 );
	const lastSpaceOffset = boundarySlice.lastIndexOf( ' ' );

	// If a space exists, slice up to it. Otherwise, force a hard slice.
	const cleanCut =
		lastSpaceOffset > 0
			? boundarySlice.substring( 0, lastSpaceOffset )
			: text.substring( 0, MAX_SNIPPET_LENGTH );

	return `${ cleanCut }…`;
}

export function getPostTitleWithFallbackSnippet(
	post: MediaAttachedPost
): string {
	const titleRaw = getRenderedContent( post?.title );
	const parsedTitle = extractPlainText( titleRaw );

	if ( parsedTitle ) {
		return parsedTitle;
	}

	const excerptRaw = getRenderedContent( post?.excerpt );
	const contentRaw = getRenderedContent( post?.content );

	const fallbackSource = excerptRaw || contentRaw;
	const cleanSnippet = extractPlainText( fallbackSource );

	if ( ! cleanSnippet ) {
		return __( '(no title)' );
	}

	return sprintf(
		/* translators: 1: Fallback string for untitled post, 2: Truncated excerpt/content snippet. */
		__( '%1$s - %2$s' ),
		__( '(no title)' ),
		generateSmartSnippet( cleanSnippet )
	);
}
