/**
 * WordPress dependencies
 */
import { useRefEffect } from '@wordpress/compose';

import apiFetch from '@wordpress/api-fetch';

async function getPageOrPostFromSlug( slug ) {
	const pages = await apiFetch( { path: `/wp/v2/pages?slug=${ slug }` } );

	if ( pages.length ) {
		return pages[ 0 ];
	}

	const posts = await apiFetch( { path: `/wp/v2/posts?slug=${ slug }` } );

	if ( posts.length ) {
		return posts[ 0 ];
	}
}

function buildEditorURI( id ) {
	return `https://gutenberg.test/wp-admin/post.php?post=${ id }&action=edit`;
}

export function useSelectObject() {
	return useRefEffect( ( element ) => {
		async function onClick( event ) {
			const { target, metaKey } = event;

			if ( true === metaKey ) {
				const { href } = target;
				//split slug by / and get item before last
				const slug = href.split( '/' ).slice( -2, -1 )[ 0 ];
				const postOrPage = await getPageOrPostFromSlug( slug );
				const goTo = buildEditorURI( postOrPage.id );
				window.location = goTo;
				return;
			}

			// If the child element has no text content, it must be an object.
			if ( target === element || target.textContent ) {
				return;
			}

			const { ownerDocument } = target;
			const { defaultView } = ownerDocument;
			const range = ownerDocument.createRange();
			const selection = defaultView.getSelection();

			range.selectNode( target );
			selection.removeAllRanges();
			selection.addRange( range );
		}

		element.addEventListener( 'click', onClick );
		return () => {
			element.removeEventListener( 'click', onClick );
		};
	}, [] );
}
