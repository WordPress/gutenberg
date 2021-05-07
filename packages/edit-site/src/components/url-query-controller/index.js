/**
 * WordPress dependencies
 */
import { useEffect } from '@wordpress/element';
import { useDispatch, useSelect } from '@wordpress/data';
import { getQueryArg, addQueryArgs, removeQueryArgs } from '@wordpress/url';

/**
 * Internal dependencies
 */
import { store as editSiteStore } from '../../store';

export default function URLQueryController() {
	const { setTemplate, setTemplatePart, showHomepage, setPage } = useDispatch(
		editSiteStore
	);

	// Set correct entity on load.
	useEffect( () => {
		const url = window.location.href;
		const postId = getQueryArg( url, 'postId' );

		if ( ! postId ) {
			showHomepage();
			return;
		}

		const postType = getQueryArg( url, 'postType' );
		if ( 'page' === postType || 'post' === postType ) {
			setPage( { context: { postType, postId } } ); // Resolves correct template based on ID.
		} else if ( 'wp_template' === postType ) {
			setTemplate( postId );
		} else if ( 'wp_template_part' === postType ) {
			setTemplatePart( postId );
		} else {
			showHomepage();
		}
	}, [] );

	// Update page URL when context changes.
	const pageContext = useCurrentPageContext();
	useEffect( () => {
		const newUrl = pageContext
			? addQueryArgs( window.location.href, pageContext )
			: removeQueryArgs( window.location.href, 'postType', 'postId' );

		window.history.replaceState( {}, '', newUrl );
	}, [ pageContext ] );

	return null;
}

function useCurrentPageContext() {
	return useSelect( ( select ) => {
		const { getEditedPostType, getEditedPostId, getPage } = select(
			editSiteStore
		);

		const page = getPage();
		let _postId = getEditedPostId(),
			_postType = getEditedPostType();
		// This doesn't seem right to me,
		// we shouldn't be using the "page" and the "template" in the same way.
		// This need to be investigated.
		if ( page?.context?.postId && page?.context?.postType ) {
			_postId = page.context.postId;
			_postType = page.context.postType;
		}

		if ( _postId && _postType ) {
			return { postId: _postId, postType: _postType };
		}

		return null;
	} );
}
