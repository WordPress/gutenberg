import { decodeEntities } from '@wordpress/html-entities';
import { sprintf, _x } from '@wordpress/i18n';

/**
 * Builds display labels without changing the category objects saved by the block.
 *
 * @param {Array} categoriesList     Available categories.
 * @param {Array} selectedCategories Saved categories, including any not in the list.
 * @return {Object} Suggestions, display values, and categories indexed by ID.
 */
export default function getCategorySuggestions(
	categoriesList,
	selectedCategories
) {
	const categoriesById = new Map(
		[ ...selectedCategories, ...categoriesList ].map( ( category ) => [
			String( category.id ),
			category,
		] )
	);
	const namesById = new Map(
		Array.from( categoriesById, ( [ id, category ] ) => [
			id,
			decodeEntities( category.name || category.value || id ),
		] )
	);
	const nameCounts = new Map();
	for ( const name of namesById.values() ) {
		nameCounts.set( name, ( nameCounts.get( name ) ?? 0 ) + 1 );
	}

	const labelsById = new Map( namesById );
	for ( const [ id, category ] of categoriesById ) {
		const name = namesById.get( id );
		if ( nameCounts.get( name ) === 1 ) {
			continue;
		}
		const ancestors = [];
		const visited = new Set( [ id ] );
		let parent = categoriesById.get( String( category.parent ) );
		while ( parent && ! visited.has( String( parent.id ) ) ) {
			const parentId = String( parent.id );
			visited.add( parentId );
			ancestors.unshift( namesById.get( parentId ) );
			parent = categoriesById.get( String( parent.parent ) );
		}
		if ( ancestors.length ) {
			const path = ancestors.reduce( ( result, ancestor ) =>
				sprintf(
					/* translators: 1: a term. 2: the term it holds. */
					_x( '%1$s › %2$s', 'term ancestors' ),
					result,
					ancestor
				)
			);
			labelsById.set(
				id,
				sprintf(
					/* translators: 1: term name. 2: its parent terms. */
					_x( '%1$s (%2$s)', 'term' ),
					name,
					path
				)
			);
		}
	}

	// Reserve unique names so disambiguating another category never changes them.
	const usedLabels = new Set(
		Array.from( namesById.values() ).filter(
			( name ) => nameCounts.get( name ) === 1
		)
	);
	const preferredLabels = new Set( labelsById.values() );
	const labelCounts = new Map();
	for ( const label of labelsById.values() ) {
		labelCounts.set( label, ( labelCounts.get( label ) ?? 0 ) + 1 );
	}
	for ( const [ id, name ] of namesById ) {
		if ( nameCounts.get( name ) === 1 ) {
			continue;
		}
		let label = labelsById.get( id );
		if ( labelCounts.get( label ) > 1 || usedLabels.has( label ) ) {
			do {
				label = sprintf(
					/* translators: 1: term name. 2: term ID used to distinguish identical names. */
					_x( '%1$s (%2$s)', 'term' ),
					label,
					id
				);
			} while ( usedLabels.has( label ) || preferredLabels.has( label ) );
		}
		usedLabels.add( label );
		labelsById.set( id, label );
	}

	return {
		categoriesById,
		categorySuggestions: Object.fromEntries(
			categoriesList.map( ( category ) => [
				labelsById.get( String( category.id ) ),
				category,
			] )
		),
		selectedCategories: selectedCategories.map( ( category ) => ( {
			...category,
			name: labelsById.get( String( category.id ) ),
		} ) ),
	};
}
