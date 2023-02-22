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
	const postType = useSelect( ( select ) => {
		const { getEditedPostAttribute } = select( editorStore );
		const { getPostType } = select( coreStore );

		return getPostType( getEditedPostAttribute( 'type' ) );
	}, [] );

	// Only render fields if post type supports page attributes or available templates exist.
	if ( ! postType?.supports?.[ 'page-attributes' ] ) {
		return null;
	}

	return children;
}

export default PageAttributesCheck;
