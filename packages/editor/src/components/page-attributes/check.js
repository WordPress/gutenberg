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
	const supportsPageAttributes = useSelect( ( select ) => {
		const { getEditedPostAttribute } = select( editorStore );
		const { getPostType } = select( coreStore );
		const postType = getPostType( getEditedPostAttribute( 'type' ) );

		return !! postType?.supports?.[ 'page-attributes' ];
	}, [] );

	// Only render fields if post type supports page attributes or available templates exist.
	if ( ! supportsPageAttributes ) {
		return null;
	}

	return children;
}

export default PageAttributesCheck;
