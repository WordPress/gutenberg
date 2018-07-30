/**
 * External Dependencies
 */
import { filter, identity, includes } from 'lodash';

/**
 * WordPress dependencies
 */
import { Fragment } from '@wordpress/element';
import { withSelect } from '@wordpress/data';
import { compose } from '@wordpress/compose';

/**
 * Internal dependencies
 */
import HierarchicalTermSelector from './hierarchical-term-selector';
import FlatTermSelector from './flat-term-selector';

export function PostTaxonomies( { postType, taxonomies, taxonomyWrapper = identity } ) {
	const availableTaxonomies = filter( taxonomies, ( taxonomy ) => includes( taxonomy.types, postType ) );
	const visibleTaxonomies = filter( availableTaxonomies, ( taxonomy ) => taxonomy.visibility.show_ui );
	return visibleTaxonomies.map( ( taxonomy ) => {
		const TaxonomyComponent = taxonomy.hierarchical ? HierarchicalTermSelector : FlatTermSelector;
		return (
			<Fragment key={ `taxonomy-${ taxonomy.slug }` }>
				{
					taxonomyWrapper(
						<TaxonomyComponent slug={ taxonomy.slug } />,
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
			postType: select( 'core/editor' ).getCurrentPostType(),
			taxonomies: select( 'core' ).getTaxonomies(),
		};
	} ),
] )( PostTaxonomies );

