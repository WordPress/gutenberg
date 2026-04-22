export interface TaxonomyRecord {
	id: number;
	type: 'wp_user_taxonomy';
	slug: string;
	status: 'publish' | 'draft';
	title: { raw: string; rendered: string };
	content: { raw: string; rendered: string };
}

export interface StoredConfig {
	labels?: { singular_name?: string };
	object_type?: string[];
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
	config: Required<
		Pick< StoredConfig, 'object_type' | 'public' | 'hierarchical' >
	> & {
		labels: { singular_name: string };
	};
}
