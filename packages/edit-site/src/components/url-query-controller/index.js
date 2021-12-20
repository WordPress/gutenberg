/**
 * WordPress dependencies
 */
import { useEffect } from '@wordpress/element';
import { useDispatch, useSelect } from '@wordpress/data';

/**
 * Internal dependencies
 */
import { useLocation, useHistory } from '../routes';
import { store as editSiteStore } from '../../store';

export default function URLQueryController() {
	const { setTemplate, setTemplatePart, showHomepage, setPage } = useDispatch(
		editSiteStore
	);
	const history = useHistory();
	const {
		params: { postId, postType },
	} = useLocation();
	const { getPage, getEditedPostId, getEditedPostType } = useSelect(
		editSiteStore
	);

	// Set correct entity on page navigation.
	useEffect( () => {
		let isMounted = true;

		if ( 'page' === postType || 'post' === postType ) {
			setPage( { context: { postType, postId } } ); // Resolves correct template based on ID.
		} else if ( 'wp_template' === postType ) {
			setTemplate( postId );
		} else if ( 'wp_template_part' === postType ) {
			setTemplatePart( postId );
		} else {
			showHomepage().then( () => {
				if ( ! isMounted ) {
					return;
				}

				const page = getPage();
				const editedPostId = getEditedPostId();
				const editedPostType = getEditedPostType();

				if ( page?.context?.postId && page?.context?.postType ) {
					history.replace( {
						postId: page.context.postId,
						postType: page.context.postType,
					} );
				} else if ( editedPostId && editedPostType ) {
					history.replace( {
						postId: editedPostId,
						postType: editedPostType,
					} );
				}
			} );
		}

		return () => {
			isMounted = false;
		};
	}, [ postId, postType ] );

	return null;
}
