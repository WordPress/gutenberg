/**
 * WordPress dependencies
 */
import { useEffect } from '@wordpress/element';
import { useDispatch, useSelect } from '@wordpress/data';
import { getQueryArg, addQueryArgs, removeQueryArgs } from '@wordpress/url';

export default function URLQueryController() {
	const { setTemplate, setTemplatePart, showHomepage, setPage } = useDispatch(
		'core/edit-site'
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
		const {
			getTemplateId,
			getTemplatePartId,
			getTemplateType,
			getPage,
		} = select( 'core/edit-site' );

		const page = getPage();
		const templateType = getTemplateType();
		const templateId = getTemplateId();
		const templatePartId = getTemplatePartId();

		let _postId, _postType;
		if ( page?.context?.postId && page?.context?.postType ) {
			_postId = page.context.postId;
			_postType = page.context.postType;
		} else if ( templateType === 'wp_template' && templateId ) {
			_postId = templateId;
			_postType = templateType;
		} else if ( templateType === 'wp_template_part' && templatePartId ) {
			_postId = templatePartId;
			_postType = templateType;
		}

		if ( _postId && _postType ) {
			return { postId: _postId, postType: _postType };
		}

		return null;
	} );
}
