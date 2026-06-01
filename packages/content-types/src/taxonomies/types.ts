export interface TaxonomyRecord {
	id: number;
	type: 'wp_user_taxonomy';
	slug: string;
	status: 'publish' | 'draft';
	title: { raw: string; rendered: string };
	config: StoredConfig;
	// WP core's `register_taxonomy()` accepts `array|string`, but the
	// `wp_user_taxonomy` REST controller normalizes to `string[]`.
	object_type: string[];
	count: number;
}

export interface StoredLabels {
	singular_name?: string;
	menu_name?: string;
	all_items?: string;
	edit_item?: string;
	view_item?: string;
	update_item?: string;
	add_new_item?: string;
	new_item_name?: string;
	search_items?: string;
	not_found?: string;
	back_to_items?: string;
	parent_item?: string;
	popular_items?: string;
	separate_items_with_commas?: string;
	parent_item_colon?: string;
	add_or_remove_items?: string;
	choose_from_most_used?: string;
}

export interface StoredConfig {
	labels?: StoredLabels;
	description?: string;
	public: boolean;
	hierarchical: boolean;
	publicly_queryable: boolean;
	show_ui: boolean;
	show_in_menu: boolean;
	show_in_nav_menus: boolean;
	show_tagcloud: boolean;
	show_in_quick_edit: boolean;
	show_admin_column: boolean;
	show_in_rest: boolean;
	sort?: boolean;
	default_term?: { name: string };
}

import type { ContentType } from '../types';

/**
 * Normalized in-memory shape used by the Add/Edit forms and the DataViews
 * table. REST rows are converted to this shape via `toFormData`, and back to
 * the save payload via `serializeForSave`. `object_type` lives inside
 * `config` here even though the wire format keeps it at the top level —
 * keeps the form components free of split state.
 */
export interface TaxonomyFormData extends ContentType {
	config: ContentType[ 'config' ] & {
		labels: Required< Pick< StoredLabels, 'singular_name' > > &
			StoredLabels;
		object_type: string[];
		publicly_queryable: boolean;
		show_ui: boolean;
		show_in_menu: boolean;
		show_in_nav_menus: boolean;
		show_tagcloud: boolean;
		show_in_quick_edit: boolean;
		show_admin_column: boolean;
		sort: boolean;
		// Form-only — controls whether `default_term` is sent on save.
		// Not part of `StoredConfig`; stripped by `serializeForSave`.
		default_term_enabled: boolean;
		default_term: { name: string };
	};
	count?: number;
}
