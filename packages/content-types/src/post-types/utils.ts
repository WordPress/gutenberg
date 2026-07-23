/**
 * WordPress dependencies
 */
import { store as coreStore } from '@wordpress/core-data';
import { useSelect } from '@wordpress/data';
import { useMemo } from '@wordpress/element';
import { __, sprintf } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import { pickStoredLabels, serializeLabels } from '../utils/form-data';
import type {
	PostTypeFormData,
	PostTypeRecord,
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

export function deriveLabels(
	plural: string,
	singular: string
): Omit< StoredLabels, 'singular_name' > {
	const lcPlural = plural.toLowerCase();
	const lcSingular = singular.toLowerCase();
	return {
		menu_name: plural,
		all_items: sprintf(
			/* translators: %s: Plural post type label. */
			__( 'All %s' ),
			plural
		),
		add_new: __( 'Add New' ),
		add_new_item: sprintf(
			/* translators: %s: Singular post type label. */
			__( 'Add New %s' ),
			singular
		),
		edit_item: sprintf(
			/* translators: %s: Singular post type label. */
			__( 'Edit %s' ),
			singular
		),
		new_item: sprintf(
			/* translators: %s: Singular post type label. */
			__( 'New %s' ),
			singular
		),
		view_item: sprintf(
			/* translators: %s: Singular post type label. */
			__( 'View %s' ),
			singular
		),
		view_items: sprintf(
			/* translators: %s: Plural post type label. */
			__( 'View %s' ),
			plural
		),
		search_items: sprintf(
			/* translators: %s: Plural post type label. */
			__( 'Search %s' ),
			plural
		),
		not_found: sprintf(
			/* translators: %s: Plural post type label, lowercase. */
			__( 'No %s found.' ),
			lcPlural
		),
		not_found_in_trash: sprintf(
			/* translators: %s: Plural post type label, lowercase. */
			__( 'No %s found in Trash.' ),
			lcPlural
		),
		parent_item_colon: sprintf(
			/* translators: %s: Singular post type label. */
			__( 'Parent %s:' ),
			singular
		),
		archives: sprintf(
			/* translators: %s: Singular post type label. */
			__( '%s Archives' ),
			singular
		),
		attributes: sprintf(
			/* translators: %s: Singular post type label. */
			__( '%s Attributes' ),
			singular
		),
		insert_into_item: sprintf(
			/* translators: %s: Singular post type label, lowercase. */
			__( 'Insert into %s' ),
			lcSingular
		),
		uploaded_to_this_item: sprintf(
			/* translators: %s: Singular post type label, lowercase. */
			__( 'Uploaded to this %s' ),
			lcSingular
		),
		featured_image: __( 'Featured image' ),
		set_featured_image: __( 'Set featured image' ),
		remove_featured_image: __( 'Remove featured image' ),
		use_featured_image: __( 'Use as featured image' ),
		filter_items_list: sprintf(
			/* translators: %s: Plural post type label, lowercase. */
			__( 'Filter %s list' ),
			lcPlural
		),
		items_list_navigation: sprintf(
			/* translators: %s: Plural post type label. */
			__( '%s list navigation' ),
			plural
		),
		items_list: sprintf(
			/* translators: %s: Plural post type label. */
			__( '%s list' ),
			plural
		),
	};
}

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
	const config = row.config ?? {};
	const labels = pickStoredLabels< StoredLabels >(
		config.labels,
		STRING_LABEL_KEYS
	);
	const supports: SupportFeature[] = Array.isArray( config.supports )
		? config.supports.filter( ( s ): s is SupportFeature =>
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
			taxonomies: Array.isArray( config.taxonomies )
				? config.taxonomies
				: [],
			supports,
			description: config.description ?? '',
			public: config.public ?? true,
			hierarchical: config.hierarchical ?? false,
			has_archive: config.has_archive ?? false,
			show_in_rest: config.show_in_rest ?? true,
		},
		count: row.count,
	};
}

export function serializeForSave( data: PostTypeFormData ) {
	const { config } = data;

	const labels = serializeLabels< PostTypeFormData[ 'config' ][ 'labels' ] >(
		config.labels,
		STRING_LABEL_KEYS as ReadonlyArray<
			keyof PostTypeFormData[ 'config' ][ 'labels' ]
		>
	);

	const description = config.description.trim();
	return {
		...( data.id !== undefined ? { id: data.id } : {} ),
		slug: data.slug,
		status: data.status,
		title: data.title.raw,
		config: {
			labels,
			taxonomies: config.taxonomies,
			supports: config.supports,
			public: config.public,
			hierarchical: config.hierarchical,
			has_archive: config.has_archive,
			show_in_rest: config.show_in_rest,
			...( description !== '' ? { description } : {} ),
		},
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
			?.filter( ( t: any ) => !! t.visibility?.public )
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
