/**
 * WordPress dependencies
 */
import { useEffect } from '@wordpress/element';
import { useDispatch, useSelect } from '@wordpress/data';
import { getQueryArgs, addQueryArgs, removeQueryArgs } from '@wordpress/url';

export default function URLQueryController() {
	const { setTemplate, setTemplatePart, showHomepage, setPage } = useDispatch(
		'core/edit-site'
	);

	// Set correct entity on load.
	useEffect( () => {
		const url = window.location.href;
		const { postId, postType, termId, taxonomy } = getQueryArgs( url );
		if ( ! ( postId || termId ) ) {
			showHomepage();
			return;
		}

		if ( [ 'page', 'post' ].includes( postType ) ) {
			setPage( { context: { postType, postId } } ); // Resolves correct template based on ID.
		} else if ( taxonomy && termId ) {
			const context = { taxonomy, termId };
			if ( taxonomy === 'category' ) {
				context.queryContext = { categoryIds: [ termId ] };
			}
			setPage( { context } );
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
		const cleanUrl = removeQueryArgs(
			window.location.href,
			'postType',
			'postId',
			'taxonomy',
			'termId'
		);
		const newUrl = pageContext
			? addQueryArgs( cleanUrl, pageContext )
			: cleanUrl;

		window.history.replaceState( {}, '', newUrl );
	}, [ pageContext ] );

	return null;
}

function useCurrentPageContext() {
	return useSelect( ( select ) => {
		const { getEditedPostType, getEditedPostId, getPage } = select(
			'core/edit-site'
		);

		const { context: { postId, postType, taxonomy, termId } = {} } =
			getPage() || {};
		if ( taxonomy && termId ) {
			return { taxonomy, termId };
		}
		let _postId = getEditedPostId(),
			_postType = getEditedPostType();
		// This doesn't seem right to me,
		// we shouldn't be using the "page" and the "template" in the same way.
		// This need to be investigated.
		if ( postId && postType ) {
			_postId = postId;
			_postType = postType;
		}
		if ( ! ( _postId && _postType ) ) return null;
		return {
			postId: _postId,
			postType: _postType,
		};
	} );
}
