/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { useSelect } from '@wordpress/data';
import { store as coreStore } from '@wordpress/core-data';
import { useMemo } from '@wordpress/element';

/**
 * Internal dependencies
 */
import type { NormalizedPattern } from '../use-patterns';

const OPERATOR_IS = 'is';

function CategoryField( { item }: { item: NormalizedPattern } ) {
	const blockPatternCategories = useSelect(
		( select ) => select( coreStore ).getBlockPatternCategories(),
		[]
	);

	const categoryLabels = useMemo( () => {
		if ( ! item.categories || ! Array.isArray( item.categories ) ) {
			return [];
		}

		return item.categories
			.map( ( catSlug: string ) => {
				const category = blockPatternCategories?.find(
					( cat: any ) => cat.name === catSlug
				);
				return category ? category.label || category.name : null;
			} )
			.filter( Boolean );
	}, [ item.categories, blockPatternCategories ] );

	if ( categoryLabels.length === 0 ) {
		return <span className="pattern-category-field__empty">—</span>;
	}

	return (
		<span className="pattern-category-field">
			{ categoryLabels.join( ', ' ) }
		</span>
	);
}

/**
 * Hook to get all available pattern categories from both user and theme sources.
 */
export function usePatternCategories() {
	const userPatternCategories = useSelect(
		( select ) => select( coreStore ).getUserPatternCategories(),
		[]
	);

	const blockPatternCategories = useSelect(
		( select ) => select( coreStore ).getBlockPatternCategories(),
		[]
	);

	return useMemo( () => {
		const categoryMap = new Map();

		// Add user pattern categories
		userPatternCategories?.forEach( ( cat: any ) => {
			if ( ! categoryMap.has( cat.name ) ) {
				categoryMap.set( cat.name, {
					value: cat.name,
					label: cat.label || cat.name,
				} );
			}
		} );

		// Add block pattern categories
		blockPatternCategories?.forEach( ( cat: any ) => {
			if ( ! categoryMap.has( cat.name ) ) {
				categoryMap.set( cat.name, {
					value: cat.name,
					label: cat.label || cat.name,
				} );
			}
		} );

		// Convert map to array and sort by label
		return Array.from( categoryMap.values() ).sort( ( a, b ) =>
			a.label.localeCompare( b.label )
		);
	}, [ userPatternCategories, blockPatternCategories ] );
}

/**
 * Pattern category field configuration for DataViews.
 * This field shows pattern categories and provides filtering capabilities.
 */
export function usePatternCategoryField() {
	const categories = usePatternCategories();

	return {
		label: __( 'Category' ),
		id: 'category',
		render: CategoryField,
		elements: categories,
		getValue: ( { item }: { item: NormalizedPattern } ) => {
			return item.categories;
		},
		filterBy: {
			operators: [ OPERATOR_IS ],
			isPrimary: true,
		},
		enableSorting: false,
	};
}
