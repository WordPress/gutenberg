export interface PostTypeRecord {
	id: number;
	type: 'wp_user_post_type';
	slug: string;
	status: 'publish' | 'draft';
	title: { raw: string; rendered: string };
	config: StoredConfig;
}

export interface StoredLabels {
	singular_name?: string;
	menu_name?: string;
	all_items?: string;
	add_new?: string;
	add_new_item?: string;
	edit_item?: string;
	new_item?: string;
	view_item?: string;
	view_items?: string;
	search_items?: string;
	not_found?: string;
	not_found_in_trash?: string;
	parent_item_colon?: string;
	archives?: string;
	attributes?: string;
	insert_into_item?: string;
	uploaded_to_this_item?: string;
	featured_image?: string;
	set_featured_image?: string;
	remove_featured_image?: string;
	use_featured_image?: string;
	filter_items_list?: string;
	items_list_navigation?: string;
	items_list?: string;
}

/**
 * Post type feature flags accepted by `register_post_type()` via `supports`.
 * Kept narrow on purpose — we surface only the supports a typical CPT
 * definition needs to toggle from the UI.
 */
export type SupportFeature =
	| 'title'
	| 'editor'
	| 'thumbnail'
	| 'excerpt'
	| 'comments'
	| 'revisions'
	| 'author'
	| 'page-attributes'
	| 'custom-fields'
	| 'trackbacks'
	| 'post-formats';

export interface StoredConfig {
	labels?: StoredLabels;
	taxonomies?: string[];
	supports?: SupportFeature[];
	description?: string;
	public?: boolean;
	hierarchical?: boolean;
	has_archive?: boolean;
	show_in_rest?: boolean;
}

/**
 * Normalized in-memory shape used by the Add/Edit forms and the DataViews
 * table. REST rows are converted to this shape via `toFormData`, and back to
 * the save payload via `serializeForSave`.
 */
export interface PostTypeFormData {
	id?: number;
	slug: string;
	status: 'publish' | 'draft';
	title: { raw: string };
	config: {
		labels: Required< Pick< StoredLabels, 'singular_name' > > &
			StoredLabels;
		taxonomies: string[];
		supports: SupportFeature[];
		description: string;
		public: boolean;
		hierarchical: boolean;
		has_archive: boolean;
		show_in_rest: boolean;
	};
}

export type CoreDataError = { message?: string; code?: string };
