/**
 * WordPress dependencies
 */
import { useSelect, useDispatch } from '@wordpress/data';
import { store as coreStore } from '@wordpress/core-data';
import { addFilter } from '@wordpress/hooks';
import { privateApis as patternsPrivateApis } from '@wordpress/patterns';

/**
 * Internal dependencies
 */
import { unlock } from '../../lock-unlock';
import { store as editorStore } from '../../store';

const { CategorySelector } = unlock( patternsPrivateApis );

const EMPTY_ARRAY = [];

const DEFAULT_QUERY = {
	per_page: -1,
	orderby: 'name',
	order: 'asc',
	_fields: 'id,name,parent',
	context: 'view',
};

/*
 * Pattern categories are a flat taxonomy but do not allow Author users and below to create
 * new categories, so this selector overrides the default flat taxonomy selector for
 * wp_block post types and users without 'create' capability for wp_pattern_category.
 */
export function PatternCategoriesSelector( { slug } ) {
	const { hasAssignAction, terms, availableTerms, taxonomy, loading } =
		useSelect(
			( select ) => {
				const { getCurrentPost, getEditedPostAttribute } =
					select( editorStore );
				const { getTaxonomy, getEntityRecords, isResolving } =
					select( coreStore );
				const _taxonomy = getTaxonomy( slug );
				const post = getCurrentPost();

				return {
					hasAssignAction: _taxonomy
						? post._links?.[
								'wp:action-assign-' + _taxonomy.rest_base
						  ] ?? false
						: false,
					terms: _taxonomy
						? getEditedPostAttribute( _taxonomy.rest_base )
						: EMPTY_ARRAY,
					loading: isResolving( 'getEntityRecords', [
						'taxonomy',
						slug,
						DEFAULT_QUERY,
					] ),
					availableTerms:
						getEntityRecords( 'taxonomy', slug, DEFAULT_QUERY ) ||
						EMPTY_ARRAY,
					taxonomy: _taxonomy,
				};
			},
			[ slug ]
		);

	const { editPost } = useDispatch( editorStore );

	if ( ! hasAssignAction || loading || availableTerms.length === 0 ) {
		return null;
	}

	const onUpdateTerms = ( termIds ) => {
		editPost( { [ taxonomy.rest_base ]: termIds } );
	};

	const onChange = ( term ) => {
		const hasTerm = terms.includes( term.id );
		const newTerms = hasTerm
			? terms.filter( ( id ) => id !== term.id )
			: [ ...terms, term.id ];
		onUpdateTerms( newTerms );
	};

	const isCategorySelected = ( term ) => terms.includes( term.id );

	const categoryOptions = availableTerms.map( ( term ) => ( {
		...term,
		label: term.name,
	} ) );

	return (
		<CategorySelector
			onChange={ onChange }
			categoryOptions={ categoryOptions }
			isCategorySelected={ isCategorySelected }
			showLabel={ false }
		/>
	);
}

export default function patternCategorySelector( OriginalComponent ) {
	return function ( props ) {
		const canAddCategories = useSelect( ( select ) => {
			const { canUser } = select( coreStore );
			return canUser( 'create', 'wp_pattern_category' );
		} );
		if ( props.slug === 'wp_pattern_category' && ! canAddCategories ) {
			return <PatternCategoriesSelector { ...props } />;
		}

		return <OriginalComponent { ...props } />;
	};
}

addFilter(
	'editor.PostTaxonomyType',
	'core/pattern-category-selector',
	patternCategorySelector
);
