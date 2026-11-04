import { __ } from '@wordpress/i18n';
import { useMemo, useState } from '@wordpress/element';
import { FormTokenField } from '@wordpress/components';
import { useDebounce } from '@wordpress/compose';
import { decodeEntities } from '@wordpress/html-entities';
import type { CategorySelectorProps } from './types';

const unescapeString = ( arg: string ) => {
	return decodeEntities( arg );
};

export const CATEGORY_SLUG = 'wp_pattern_category';

export default function CategorySelector( {
	categoryTerms,
	onChange,
	categoryMap,
}: CategorySelectorProps ) {
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

	function handleChange( termNames: Array< unknown > ) {
		// The values and suggestions are strings, so the tokens are too.
		const uniqueTerms = ( termNames as Array< string > ).reduce<
			Array< string >
		>( ( terms, newTerm ) => {
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
			label={ __( 'Categories' ) }
			tokenizeOnBlur
			__experimentalExpandOnFocus
		/>
	);
}
