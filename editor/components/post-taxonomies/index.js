/**
 * External Dependencies
 */
import { connect } from 'react-redux';
import { flowRight, filter } from 'lodash';

/**
 * WordPress dependencies
 */
import { withAPIData } from '@wordpress/components';

/**
 * Internal dependencies
 */
import './style.scss';
import HierarchicalTermSelector from './hierarchical-term-selector';
import FlatTermSelector from './flat-term-selector';
import { getCurrentPostType } from '../../state/selectors';

function PostTaxonomies( { postType, taxonomies } ) {
	const availableTaxonomies = filter( taxonomies.data, ( taxonomy ) => taxonomy.types.indexOf( postType ) !== -1 );

	return (
		<div>
			{ availableTaxonomies.map( ( taxonomy ) => {
				const TaxonomyComponent = taxonomy.hierarchical ? HierarchicalTermSelector : FlatTermSelector;
				return (
					<TaxonomyComponent
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
			postType: getCurrentPostType( state ),
		};
	},
);

const applyWithAPIData = withAPIData( () => ( {
	taxonomies: '/wp/v2/taxonomies?context=edit',
} ) );

export default flowRight( [
	applyConnect,
	applyWithAPIData,
] )( PostTaxonomies );

