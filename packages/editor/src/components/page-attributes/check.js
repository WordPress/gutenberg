/**
 * External dependencies
 */
import { get, isEmpty } from 'lodash';

/**
 * WordPress dependencies
 */
import { useSelect } from '@wordpress/data';
import { store as coreStore } from '@wordpress/core-data';

/**
 * Internal dependencies
 */
import { store as editorStore } from '../../store';

export function PageAttributesCheck( { children } ) {
	const { postType, availableTemplates } = useSelect( ( select ) => {
		const { getEditedPostAttribute, getEditorSettings } = select(
			editorStore
		);
		const { getPostType } = select( coreStore );

		return {
			postType: getPostType( getEditedPostAttribute( 'type' ) ),
			availableTemplates: getEditorSettings().availableTemplates,
		};
	}, [] );
	const supportsPageAttributes = get(
		postType,
		[ 'supports', 'page-attributes' ],
		false
	);

	// Only render fields if post type supports page attributes or available templates exist.
	if (
		! supportsPageAttributes &&
		( isEmpty( availableTemplates ) || ! postType?.viewable )
	) {
		return null;
	}

	return children;
}

export default PageAttributesCheck;
