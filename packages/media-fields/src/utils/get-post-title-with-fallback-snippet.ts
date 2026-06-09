/**
 * WordPress dependencies
 */
import { decodeEntities } from '@wordpress/html-entities';
import { __, sprintf } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import { getRenderedContent } from './get-rendered-content';

const TITLE_FALLBACK_SNIPPET_LENGTH = 80;

type RenderedContent = string | { raw: string; rendered: string };

type PostLike = {
	title?: RenderedContent;
	excerpt?: RenderedContent;
	content?: RenderedContent;
};

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

function getSnippet( content?: RenderedContent ) {
	const text = getPlainText( content );
	if ( text.length <= TITLE_FALLBACK_SNIPPET_LENGTH ) {
		return text;
	}

	return `${ text.slice( 0, TITLE_FALLBACK_SNIPPET_LENGTH ).trimEnd() }...`;
}

export function getPostTitleWithFallbackSnippet( post: PostLike ) {
	const title = getPlainText( post.title );
	if ( title ) {
		return title;
	}

	const snippet = getSnippet( post.excerpt ) || getSnippet( post.content );
	if ( ! snippet ) {
		return __( '(no title)' );
	}

	return sprintf(
		/* translators: 1: title fallback for an untitled post, 2: excerpt or content snippet. */
		__( '%1$s %2$s' ),
		__( '(no title)' ),
		snippet
	);
}
