/**
 * WordPress dependencies
 */
import { useEffect } from '@wordpress/element';
import { useDispatch } from '@wordpress/data';

/**
 * Internal dependencies
 */
import { useLocation } from '../routes';
import { store as editSiteStore } from '../../store';

export default function useURLQueryController() {
	const { setTemplate, setTemplatePart, setPage } = useDispatch(
		editSiteStore
	);
	const {
		params: { postId, postType },
	} = useLocation();

	// Set correct entity on page navigation.
	useEffect( () => {
		if ( 'page' === postType || 'post' === postType ) {
			setPage( { context: { postType, postId } } ); // Resolves correct template based on ID.
		} else if ( 'wp_template' === postType ) {
			setTemplate( postId );
		} else if ( 'wp_template_part' === postType ) {
			setTemplatePart( postId );
		}
	}, [ postId, postType ] );

	return null;
}
