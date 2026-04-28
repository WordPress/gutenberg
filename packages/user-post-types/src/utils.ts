/**
 * WordPress dependencies
 */
import { store as coreStore } from '@wordpress/core-data';
import { useSelect } from '@wordpress/data';
import { useMemo } from '@wordpress/element';

/**
 * Internal dependencies
 */
import type {
	PostTypeFormData,
	PostTypeRecord,
	StoredConfig,
	StoredLabels,
	SupportFeature,
} from './types';

export const DEFAULT_SUPPORTS: SupportFeature[] = [ 'title', 'editor' ];

export const BLANK_RECORD: PostTypeFormData = {
	slug: '',
	status: 'publish',
	title: { raw: '' },
	config: {
		labels: { singular_name: '' },
		taxonomies: [],
		supports: [ ...DEFAULT_SUPPORTS ],
		description: '',
		public: true,
		hierarchical: false,
		has_archive: false,
		show_in_rest: true,
	},
};

export function parseConfig( raw?: string ): StoredConfig {
	if ( ! raw ) {
		return {};
	}
	try {
		const parsed = JSON.parse( raw );
		return typeof parsed === 'object' && parsed !== null ? parsed : {};
	} catch {
		return {};
	}
}

export const STRING_LABEL_KEYS: ( keyof StoredLabels )[] = [
	'singular_name',
	'menu_name',
	'all_items',
	'add_new',
	'add_new_item',
	'edit_item',
	'new_item',
	'view_item',
	'view_items',
	'search_items',
	'not_found',
	'not_found_in_trash',
	'parent_item_colon',
	'archives',
	'attributes',
	'insert_into_item',
	'uploaded_to_this_item',
	'featured_image',
	'set_featured_image',
	'remove_featured_image',
	'use_featured_image',
	'filter_items_list',
	'items_list_navigation',
	'items_list',
];

export const SUPPORT_FEATURES: SupportFeature[] = [
	'title',
	'editor',
	'thumbnail',
	'excerpt',
	'comments',
	'revisions',
	'author',
	'page-attributes',
	'custom-fields',
	'trackbacks',
	'post-formats',
];

export function toFormData( row: PostTypeRecord ): PostTypeFormData {
	const parsed = parseConfig( row.content.raw );
	const labels: StoredLabels = {};
	for ( const key of STRING_LABEL_KEYS ) {
		const value = parsed.labels?.[ key ];
		if ( typeof value === 'string' ) {
			labels[ key ] = value;
		}
	}
	const supports: SupportFeature[] = Array.isArray( parsed.supports )
		? parsed.supports.filter( ( s ): s is SupportFeature =>
				SUPPORT_FEATURES.includes( s as SupportFeature )
		  )
		: [ ...DEFAULT_SUPPORTS ];
	return {
		id: row.id,
		slug: row.slug,
		status: row.status,
		title: { raw: row.title.raw },
		config: {
			labels: { singular_name: '', ...labels },
			taxonomies: Array.isArray( parsed.taxonomies )
				? parsed.taxonomies
				: [],
			supports,
			description: parsed.description ?? '',
			public: parsed.public ?? true,
			hierarchical: parsed.hierarchical ?? false,
			has_archive: parsed.has_archive ?? false,
			show_in_rest: parsed.show_in_rest ?? true,
		},
	};
}

function serializeConfig( data: PostTypeFormData ): StoredConfig {
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
		labels,
		taxonomies: config.taxonomies,
		supports: config.supports,
		public: config.public,
		hierarchical: config.hierarchical,
		has_archive: config.has_archive,
		show_in_rest: config.show_in_rest,
		...( description !== '' ? { description } : {} ),
	};
}

export function serializeForSave( data: PostTypeFormData ) {
	return {
		...( data.id !== undefined ? { id: data.id } : {} ),
		slug: data.slug,
		status: data.status,
		title: data.title.raw,
		content: JSON.stringify( serializeConfig( data ) ),
	};
}

const CORE_TAXONOMY_SLUGS = [ 'category', 'post_tag' ];

export function usePublicTaxonomies() {
	const taxonomies = useSelect(
		( select ) => select( coreStore ).getTaxonomies( { per_page: -1 } ),
		[]
	);
	return useMemo( () => {
		return taxonomies
			?.filter( ( t: any ) => t.visibility?.public ?? false )
			.sort( ( a: any, b: any ) => {
				// Core taxonomies first (alphabetically), then the rest
				// (alphabetically). The REST API doesn't expose `_builtin`,
				// so we partition against a hardcoded slug list.
				const aIsCore = CORE_TAXONOMY_SLUGS.includes( a.slug );
				const bIsCore = CORE_TAXONOMY_SLUGS.includes( b.slug );
				if ( aIsCore !== bIsCore ) {
					return aIsCore ? -1 : 1;
				}
				return a.name.localeCompare( b.name );
			} );
	}, [ taxonomies ] );
}
