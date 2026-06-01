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
		publicly_queryable: true,
		show_ui: true,
		show_in_menu: true,
		show_in_nav_menus: true,
		show_tagcloud: true,
		show_in_quick_edit: true,
		show_admin_column: false,
		show_in_rest: true,
		sort: false,
		default_term_enabled: false,
		default_term: { name: '' },
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

export function deriveLabels(
	plural: string,
	singular: string
): Omit< StoredLabels, 'singular_name' > {
	const lcPlural = plural.toLowerCase();
	return {
		menu_name: plural,
		all_items: sprintf(
			/* translators: %s: Plural taxonomy label. */
			__( 'All %s' ),
			plural
		),
		edit_item: sprintf(
			/* translators: %s: Singular taxonomy label. */
			__( 'Edit %s' ),
			singular
		),
		view_item: sprintf(
			/* translators: %s: Singular taxonomy label. */
			__( 'View %s' ),
			singular
		),
		update_item: sprintf(
			/* translators: %s: Singular taxonomy label. */
			__( 'Update %s' ),
			singular
		),
		add_new_item: sprintf(
			/* translators: %s: Singular taxonomy label. */
			__( 'Add New %s' ),
			singular
		),
		new_item_name: sprintf(
			/* translators: %s: Singular taxonomy label. */
			__( 'New %s Name' ),
			singular
		),
		search_items: sprintf(
			/* translators: %s: Plural taxonomy label. */
			__( 'Search %s' ),
			plural
		),
		not_found: sprintf(
			/* translators: %s: Plural taxonomy label, lowercase. */
			__( 'No %s found.' ),
			lcPlural
		),
		back_to_items: sprintf(
			/* translators: %s: Plural taxonomy label. */
			__( '← Back to %s' ),
			plural
		),
		parent_item: sprintf(
			/* translators: %s: Singular taxonomy label. */
			__( 'Parent %s' ),
			singular
		),
		popular_items: sprintf(
			/* translators: %s: Plural taxonomy label. */
			__( 'Popular %s' ),
			plural
		),
		separate_items_with_commas: sprintf(
			/* translators: %s: Plural taxonomy label, lowercase. */
			__( 'Separate %s with commas' ),
			lcPlural
		),
		parent_item_colon: sprintf(
			/* translators: %s: Singular taxonomy label. */
			__( 'Parent %s:' ),
			singular
		),
		add_or_remove_items: sprintf(
			/* translators: %s: Plural taxonomy label, lowercase. */
			__( 'Add or remove %s' ),
			lcPlural
		),
		choose_from_most_used: sprintf(
			/* translators: %s: Plural taxonomy label, lowercase. */
			__( 'Choose from the most used %s' ),
			lcPlural
		),
	};
}

export function toFormData( row: TaxonomyRecord ): TaxonomyFormData {
	const config = row.config ?? {};
	const labels = pickStoredLabels< StoredLabels >(
		config.labels,
		STRING_LABEL_KEYS
	);
	const defaultTermName = config.default_term?.name ?? '';
	const formConfig: TaxonomyFormData[ 'config' ] = {
		labels: { singular_name: '', ...labels },
		object_type: Array.isArray( row.object_type ) ? row.object_type : [],
		description: config.description ?? '',
		public: config.public,
		hierarchical: config.hierarchical,
		publicly_queryable: config.publicly_queryable,
		show_ui: config.show_ui,
		show_in_menu: config.show_in_menu,
		show_in_nav_menus: config.show_in_nav_menus,
		show_tagcloud: config.show_tagcloud,
		show_in_quick_edit: config.show_in_quick_edit,
		show_admin_column: config.show_admin_column,
		show_in_rest: config.show_in_rest,
		sort: !! config.sort,
		default_term_enabled: defaultTermName !== '',
		default_term: { name: defaultTermName },
	};
	return {
		id: row.id,
		slug: row.slug,
		status: row.status,
		title: { raw: row.title.raw },
		config: formConfig,
		count: row.count,
	};
}

export function serializeForSave( data: TaxonomyFormData ) {
	const { config } = data;

	const labels = serializeLabels< TaxonomyFormData[ 'config' ][ 'labels' ] >(
		config.labels,
		STRING_LABEL_KEYS as ReadonlyArray<
			keyof TaxonomyFormData[ 'config' ][ 'labels' ]
		>
	);

	const description = config.description.trim();
	const defaultTermName = config.default_term.name.trim();
	const includeDefaultTerm =
		config.default_term_enabled && defaultTermName !== '';
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
			publicly_queryable: config.publicly_queryable,
			show_ui: config.show_ui,
			show_in_menu: config.show_in_menu,
			show_in_nav_menus: config.show_in_nav_menus,
			show_tagcloud: config.show_tagcloud,
			show_in_quick_edit: config.show_in_quick_edit,
			show_admin_column: config.show_admin_column,
			show_in_rest: config.show_in_rest,
			sort: config.sort,
			...( description !== '' ? { description } : {} ),
			...( includeDefaultTerm
				? { default_term: { name: defaultTermName } }
				: {} ),
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
