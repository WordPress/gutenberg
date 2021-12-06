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
	const homeTemplateId = useSelect(
		( select ) => select( editSiteStore ).getHomeTemplateId(),
		[]
	);

	// Set correct entity on page navigation.
	useEffect( () => {
		if ( 'page' === postType || 'post' === postType ) {
			setPage( { context: { postType, postId } } ); // Resolves correct template based on ID.
		} else if ( 'wp_template' === postType ) {
			setTemplate( postId );
		} else if ( 'wp_template_part' === postType ) {
			setTemplatePart( postId );
		} else if ( homeTemplateId ) {
			history.replace( {
				postType: 'wp_template',
				postId: homeTemplateId,
			} );
		} else {
			showHomepage();
		}
	}, [ postId, postType, homeTemplateId, history ] );

	return null;
}
