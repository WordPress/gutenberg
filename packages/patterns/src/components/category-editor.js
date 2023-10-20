/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { useMemo, useState } from '@wordpress/element';
import { FormTokenField } from '@wordpress/components';
import { useDebounce } from '@wordpress/compose';
import { decodeEntities } from '@wordpress/html-entities';

/**
 * Internal dependencies
 */
import CategorySelector from './category-selector';

const unescapeString = ( arg ) => decodeEntities( arg );

export const CATEGORY_SLUG = 'wp_pattern_category';

export default function CategoryEditor( {
	categoryTerms,
	onChange,
	categoryMap,
	canAddCategories,
} ) {
	const categoryOptions = Array.from( categoryMap.values() );
	const [ search, setSearch ] = useState( '' );
	const debouncedSearch = useDebounce( setSearch, 500 );

	const suggestions = useMemo( () => {
		return Array.from( categoryMap.values() )
			.map( ( category ) => unescapeString( category.label ) )
			.filter( ( category ) => {
				if ( search !== '' ) {
					return category
						.toLowerCase()
						.includes( search.toLowerCase() );
				}
				return true;
			} )
			.sort( ( a, b ) => a.localeCompare( b ) );
	}, [ search, categoryMap ] );

	function handleChange( termNames ) {
		const uniqueTerms = termNames.reduce( ( terms, newTerm ) => {
			if (
				! terms.some(
					( term ) => term.toLowerCase() === newTerm.toLowerCase()
				)
			) {
				terms.push( newTerm );
			}
			return terms;
		}, [] );

		onChange( uniqueTerms );
	}
	const isCategorySelected = ( selectedCategory ) =>
		categoryTerms.includes( selectedCategory.label );

	const onCategorySelectChange = ( selectedCategory ) => {
		if ( categoryTerms.includes( selectedCategory.label ) ) {
			onChange(
				categoryTerms.filter(
					( categoryTerm ) => categoryTerm !== selectedCategory.label
				)
			);
		} else {
			onChange( [ ...categoryTerms, selectedCategory.label ] );
		}
	};

	return (
		<>
			{ canAddCategories && (
				<FormTokenField
					className="patterns-menu-items__convert-modal-categories"
					value={ categoryTerms }
					suggestions={ suggestions }
					onChange={ handleChange }
					onInputChange={ debouncedSearch }
					label={ __( 'Categories' ) }
					tokenizeOnBlur
					__experimentalExpandOnFocus
					__next40pxDefaultSize
				/>
			) }
			{ ! canAddCategories && categoryOptions.length > 0 && (
				<CategorySelector
					onChange={ onCategorySelectChange }
					categoryMap={ categoryTerms }
					categoryOptions={ categoryOptions }
					isCategorySelected={ isCategorySelected }
				/>
			) }
		</>
	);
}
