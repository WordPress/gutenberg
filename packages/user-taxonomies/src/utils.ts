/**
 * WordPress dependencies
 */
import { store as coreStore } from '@wordpress/core-data';
import { useSelect } from '@wordpress/data';
import { useMemo } from '@wordpress/element';

/**
 * Internal dependencies
 */
import type { StoredLabels, TaxonomyFormData, TaxonomyRecord } from './types';

export const BLANK_RECORD: TaxonomyFormData = {
	slug: '',
	status: 'publish',
	title: { raw: '' },
	config: {
		labels: { singular_name: '' },
		object_type: [],
		description: '',
		public: true,
		hierarchical: false,
	},
};

export const STRING_LABEL_KEYS: ( keyof StoredLabels )[] = [
	'singular_name',
	'menu_name',
	'all_items',
	'edit_item',
	'view_item',
	'update_item',
	'add_new_item',
	'new_item_name',
	'search_items',
	'not_found',
	'back_to_items',
	'parent_item',
	'popular_items',
	'separate_items_with_commas',
	'parent_item_colon',
	'add_or_remove_items',
	'choose_from_most_used',
];

export function toFormData( row: TaxonomyRecord ): TaxonomyFormData {
	const config = row.config ?? {};
	const labels: StoredLabels = {};
	for ( const key of STRING_LABEL_KEYS ) {
		const value = config.labels?.[ key ];
		if ( typeof value === 'string' ) {
			labels[ key ] = value;
		}
	}
	return {
		id: row.id,
		slug: row.slug,
		status: row.status,
		title: { raw: row.title.raw },
		config: {
			labels: { singular_name: '', ...labels },
			object_type: Array.isArray( row.object_type )
				? row.object_type
				: [],
			description: config.description ?? '',
			public: config.public ?? true,
			hierarchical: config.hierarchical ?? false,
		},
	};
}

export function serializeForSave( data: TaxonomyFormData ) {
	const { config } = data;

	const labels: StoredLabels = {};
	for ( const key of STRING_LABEL_KEYS ) {
		const value = config.labels[ key ];
		if ( typeof value === 'string' && value.trim() !== '' ) {
			labels[ key ] = value.trim();
		}
	}
	// singular_name is required; keep the raw (possibly-empty) value so save
	// errors point at the right field rather than silently dropping it.
	labels.singular_name = config.labels.singular_name;

	const description = config.description.trim();
	return {
		...( data.id !== undefined ? { id: data.id } : {} ),
		slug: data.slug,
		status: data.status,
		title: data.title.raw,
		object_type: config.object_type,
		config: {
			labels,
			public: config.public,
			hierarchical: config.hierarchical,
			...( description !== '' ? { description } : {} ),
		},
	};
}

export function usePublicPostTypes() {
	const postTypes = useSelect(
		( select ) => select( coreStore ).getPostTypes( { per_page: -1 } ),
		[]
	);
	return useMemo( () => {
		return postTypes
			?.filter( ( { viewable }: any ) => viewable )
			.sort( ( a: any, b: any ) => {
				// Keep the built-in 'post' type at the top; sort the rest alphabetically.
				if ( a.slug === 'post' ) {
					return -1;
				}
				if ( b.slug === 'post' ) {
					return 1;
				}
				return a.name.localeCompare( b.name );
			} );
	}, [ postTypes ] );
}
