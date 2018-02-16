/**
 * External Dependencies
 */
import { connect } from 'react-redux';
import { filter, includes } from 'lodash';

/**
 * WordPress dependencies
 */
import { compose } from '@wordpress/element';

/**
 * Internal dependencies
 */
import './style.scss';
import HierarchicalTermSelector from './hierarchical-term-selector';
import FlatTermSelector from './flat-term-selector';
import { getCurrentPostType } from '../../store/selectors';

export function PostTaxonomies( { postType, taxonomies } ) {
	const availableTaxonomies = filter( taxonomies.data, ( taxonomy ) => includes( taxonomy.types, postType ) );

	return (
		<div>
			{ availableTaxonomies.map( ( taxonomy ) => {
				const TaxonomyComponent = taxonomy.hierarchical ? HierarchicalTermSelector : FlatTermSelector;
				return (
					<TaxonomyComponent
						taxonomy={ taxonomy }
						key={ taxonomy.slug }
						label={ taxonomy.name }
						restBase={ taxonomy.rest_base }
						slug={ taxonomy.slug }
					/>
				);
			} ) }
		</div>
	);
}

const applyConnect = connect(
	( state ) => {
		return {
			taxonomies: state.taxonomies,
			postType: getCurrentPostType( state ),
		};
	},
);

export default compose( [
	applyConnect,
] )( PostTaxonomies );

