/**
 * WordPress dependencies
 */
import { Fragment } from '@wordpress/element';
import { useSelect } from '@wordpress/data';
import { store as coreStore } from '@wordpress/core-data';

/**
 * Internal dependencies
 */
import HierarchicalTermSelector from './hierarchical-term-selector';
import FlatTermSelector from './flat-term-selector';
import { store as editorStore } from '../../store';

const identity = ( x ) => x;

export function PostTaxonomies( { taxonomyWrapper = identity } ) {
	const { postType, taxonomies } = useSelect( ( select ) => {
		return {
			postType: select( editorStore ).getCurrentPostType(),
			taxonomies: select( coreStore ).getTaxonomies( { per_page: -1 } ),
		};
	}, [] );
	const visibleTaxonomies = ( taxonomies ?? [] ).filter(
		( taxonomy ) =>
			// In some circumstances .visibility can end up as undefined so optional chaining operator required.
			// https://github.com/WordPress/gutenberg/issues/40326
			taxonomy.types.includes( postType ) && taxonomy.visibility?.show_ui
	);

	return visibleTaxonomies.map( ( taxonomy ) => {
		const TaxonomyComponent = taxonomy.hierarchical
			? HierarchicalTermSelector
			: FlatTermSelector;
		return (
			<Fragment key={ `taxonomy-${ taxonomy.slug }` }>
				{ taxonomyWrapper(
					<TaxonomyComponent slug={ taxonomy.slug } />,
					taxonomy
				) }
			</Fragment>
		);
	} );
}

export default PostTaxonomies;
