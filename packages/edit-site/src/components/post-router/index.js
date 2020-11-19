/**
 * WordPress dependencies
 */
import { useEffect } from '@wordpress/element';
import { useDispatch, useSelect } from '@wordpress/data';
/**
 * Internal dependencies
 */
import updateQueryParams from './update-query-params';

export default function PostRouter() {
	const { templateId, templatePartId, templateType, page } = useSelect(
		( select ) => {
			const {
				getTemplateId,
				getTemplatePartId,
				getTemplateType,
				getPage,
			} = select( 'core/edit-site' );

			return {
				templateId: getTemplateId(),
				templatePartId: getTemplatePartId(),
				templateType: getTemplateType(),
				page: getPage(),
			};
		}
	);
	const { setTemplate, setTemplatePart, showHomepage, setPage } = useDispatch(
		'core/edit-site'
	);

	// Set correct entity on load.
	useEffect( () => {
		const query = new URLSearchParams( window.location.search );
		const contextType = query.get( 'contextType' );
		const id = query.get( 'id' );
		const content = query.get( 'content' );

		if ( 'content' === contextType && content ) {
			setPage( JSON.parse( content ) );
		} else if ( 'wp_template' === contextType && id ) {
			setTemplate( id );
		} else if ( 'wp_template_part' === contextType && id ) {
			setTemplatePart( id );
		} else {
			showHomepage();
		}
	}, [] );

	// Upadte URL when context changes.
	useEffect( () => {
		if ( page ) {
			updateQueryParams( 'content', JSON.stringify( page ) );
		} else if ( templateType && ( templateId || templatePartId ) ) {
			updateQueryParams( templateType, templateId || templatePartId );
		}
	}, [ templateId, templatePartId, templateType, page ] );

	return null;
}
