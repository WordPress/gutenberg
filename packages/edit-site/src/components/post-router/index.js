/**
 * WordPress dependencies
 */
import { useEffect } from '@wordpress/element';
import { useDispatch, useSelect } from '@wordpress/data';
import { getQueryArg } from '@wordpress/url';

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
		const url = window.location.href;
		const contextType = getQueryArg( url, 'contextType' );
		const id = getQueryArg( url, 'id' );
		const content = getQueryArg( url, 'content' );

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

	// Update URL when context changes.
	useEffect( () => {
		if ( page ) {
			updateQueryParams( 'content', JSON.stringify( page ) );
		} else if ( templateType && ( templateId || templatePartId ) ) {
			updateQueryParams( templateType, templateId || templatePartId );
		}
	}, [ templateId, templatePartId, templateType, page ] );

	return null;
}
