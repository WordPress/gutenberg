/**
 * WordPress dependencies
 */
import { compose } from '@wordpress/compose';
import { withSelect } from '@wordpress/data';
import { store as coreStore } from '@wordpress/core-data';

/**
 * Internal dependencies
 */
import { store as editorStore } from '../../store';

export function PostTaxonomiesCheck( { postType, taxonomies, children } ) {
	const hasTaxonomies = taxonomies?.some( ( taxonomy ) =>
		taxonomy.types.includes( postType )
	);
	if ( ! hasTaxonomies ) {
		return null;
	}

	return children;
}

export default compose( [
	withSelect( ( select ) => {
		return {
			postType: select( editorStore ).getCurrentPostType(),
			taxonomies: select( coreStore ).getTaxonomies( { per_page: -1 } ),
		};
	} ),
] )( PostTaxonomiesCheck );
