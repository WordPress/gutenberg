/**
 * External Dependencies
 */
import { filter, get, identity, includes } from 'lodash';

/**
 * WordPress dependencies
 */
import { compose, Fragment } from '@wordpress/element';
import { withSelect } from '@wordpress/data';

/**
 * Internal dependencies
 */
import './style.scss';
import HierarchicalTermSelector from './hierarchical-term-selector';
import FlatTermSelector from './flat-term-selector';

export function PostTaxonomies( { post, postType, taxonomies, taxonomyWrapper = identity } ) {
	const availableTaxonomies = filter( taxonomies, ( taxonomy ) => includes( taxonomy.types, postType ) );
	const visibleTaxonomies = filter( availableTaxonomies, ( taxonomy ) => taxonomy.visibility.show_ui );
	return visibleTaxonomies.map( ( taxonomy ) => {
		const TaxonomyComponent = taxonomy.hierarchical ? HierarchicalTermSelector : FlatTermSelector;
		const restBase = taxonomy.rest_base;
		const hasCreateAction = get( post, [ '_links', 'wp:action-create-' + restBase ], false );
		const hasAssignAction = get( post, [ '_links', 'wp:action-assign-' + restBase ], false );
		return (
			<Fragment key={ `taxonomy-${ taxonomy.slug }` }>
				{
					taxonomyWrapper(
						<TaxonomyComponent
							restBase={ restBase }
							slug={ taxonomy.slug }
							hasCreateAction={ hasCreateAction }
							hasAssignAction={ hasAssignAction }
						/>,
						taxonomy
					)
				}
			</Fragment>
		);
	} );
}

export default compose( [
	withSelect( ( select ) => {
		return {
			post: select( 'core/editor' ).getCurrentPost(),
			postType: select( 'core/editor' ).getCurrentPostType(),
			taxonomies: select( 'core' ).getTaxonomies(),
		};
	} ),
] )( PostTaxonomies );

