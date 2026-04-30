export interface TaxonomyRecord {
	id: number;
	type: 'wp_user_taxonomy';
	slug: string;
	status: 'publish' | 'draft';
	title: { raw: string; rendered: string };
	content: { raw: string; rendered: string };
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
	object_type?: string[];
	description?: string;
	public?: boolean;
	hierarchical?: boolean;
}

/**
 * Normalized in-memory shape used by the Add/Edit forms and the DataViews
 * table. REST rows are converted to this shape via `toFormData`, and back to
 * the save payload via `serializeForSave`, so fields never have to JSON
 * round-trip `content.raw` on every keystroke.
 */
export interface TaxonomyFormData {
	id?: number;
	slug: string;
	status: 'publish' | 'draft';
	title: { raw: string };
	config: {
		labels: Required< Pick< StoredLabels, 'singular_name' > > &
			StoredLabels;
		object_type: string[];
		description: string;
		public: boolean;
		hierarchical: boolean;
	};
}

export type CoreDataError = { message?: string; code?: string };
