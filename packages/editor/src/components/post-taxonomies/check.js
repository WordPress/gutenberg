/**
 * WordPress dependencies
 */
import { useSelect } from '@wordpress/data';
import { store as coreStore } from '@wordpress/core-data';

/**
 * Internal dependencies
 */
import { store as editorStore } from '../../store';

export default function PostTaxonomiesCheck( { children } ) {
	const hasTaxonomies = useSelect( ( select ) => {
		const postType = select( editorStore ).getCurrentPostType();
		const taxonomies = select( coreStore ).getTaxonomies( {
			per_page: -1,
		} );
		return taxonomies?.some( ( taxonomy ) =>
			taxonomy.types.includes( postType )
		);
	}, [] );
	if ( ! hasTaxonomies ) {
		return null;
	}

	return children;
}
