/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { useMemo, useState } from '@wordpress/element';
import { FormTokenField } from '@wordpress/components';
import { useSelect } from '@wordpress/data';
import { store as coreStore } from '@wordpress/core-data';
import { store as blockEditorStore } from '@wordpress/block-editor';
import { useDebounce } from '@wordpress/compose';
import { decodeEntities } from '@wordpress/html-entities';

const unescapeString = ( arg ) => {
	return decodeEntities( arg );
};

export const CATEGORY_SLUG = 'wp_pattern_category';

export default function CategorySelector( { categoryTerms, onChange } ) {
	const [ search, setSearch ] = useState( '' );
	const debouncedSearch = useDebounce( setSearch, 500 );

	const { corePatternCategories, userPatternCategories } = useSelect(
		( select ) => {
			const { getSettings } = select( blockEditorStore );
			const { getUserPatternCategories } = select( coreStore );

			return {
				corePatternCategories:
					getSettings().__experimentalBlockPatternCategories,
				userPatternCategories: getUserPatternCategories(),
			};
		}
	);

	const categoryOptions = userPatternCategories.map( ( category ) => ( {
		label: category.label,
		value: category.label,
	} ) );

	corePatternCategories.forEach( ( category ) => {
		if (
			! categoryOptions.find( ( cat ) => cat.label === category.label ) &&
			category.name !== 'query'
		) {
			categoryOptions.push( {
				label: category.label,
				value: category.label,
			} );
		}
	} );

	categoryOptions.sort( ( a, b ) => a.label.localeCompare( b.label ) );

	const suggestions = useMemo( () => {
		return ( categoryOptions ?? [] )
			.map( ( category ) => unescapeString( category.label ) )
			.filter( ( category ) => {
				if ( search !== '' ) {
					return category
						.toLowerCase()
						.includes( search.toLowerCase() );
				}
				return true;
			} );
	}, [ search, categoryOptions ] );

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

	return (
		<FormTokenField
			className="patterns-menu-items__convert-modal-categories"
			value={ categoryTerms }
			suggestions={ suggestions }
			onChange={ handleChange }
			onInputChange={ debouncedSearch }
			label={ __( 'Category' ) }
			tokenizeOnBlur={ true }
			__experimentalExpandOnFocus={ true }
		/>
	);
}
