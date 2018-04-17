/**
 * External Dependencies
 */
import { some, includes } from 'lodash';

/**
 * WordPress dependencies
 */
import { withAPIData } from '@wordpress/components';
import { compose } from '@wordpress/element';
import { withSelect } from '@wordpress/data';

export function PostTaxonomiesCheck( { postType, taxonomies, children } ) {
	const hasTaxonomies = some( taxonomies.data, ( taxonomy ) => includes( taxonomy.types, postType ) );
	if ( ! hasTaxonomies ) {
		return null;
	}

	return children;
}

export default compose( [
	withSelect( ( select ) => {
		return {
			postType: select( 'core/editor' ).getCurrentPostType(),
		};
	} ),
	withAPIData( () => ( {
		taxonomies: '/wp/v2/taxonomies?context=edit',
	} ) ),
] )( PostTaxonomiesCheck );

