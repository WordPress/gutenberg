/**
 * External Dependencies
 */
import { connect } from 'react-redux';
import { some, includes } from 'lodash';

/**
 * WordPress dependencies
 */
import { withAPIData } from '@wordpress/components';
import { compose } from '@wordpress/element';

/**
 * Internal dependencies
 */
import { getCurrentPostType } from '../../store/selectors';

export function PostTaxonomiesCheck( { postType, taxonomies, children } ) {
	const hasTaxonomies = some( taxonomies.data, ( taxonomy ) => includes( taxonomy.types, postType ) );
	if ( ! hasTaxonomies ) {
		return null;
	}

	return children;
}

const applyConnect = connect(
	( state ) => {
		return {
			postType: getCurrentPostType( state ),
		};
	},
);

const applyWithAPIData = withAPIData( () => ( {
	taxonomies: '/wp/v2/taxonomies?context=edit',
} ) );

export default compose( [
	applyConnect,
	applyWithAPIData,
] )( PostTaxonomiesCheck );

