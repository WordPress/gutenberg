/**
 * Structural backbone shared by `TaxonomyFormData` and `PostTypeFormData`.
 * Both per-package form-data interfaces `extends ContentType` and add their
 * own keys; shared field utilities in `utils/fields.tsx` and `SlugEdit` are
 * typed against this shape so they don't need a per-package generic.
 */
export interface ContentType {
	id?: number;
	slug: string;
	status: 'publish' | 'draft';
	title: { raw: string };
	config: {
		labels: { singular_name: string };
		description: string;
		public: boolean;
		hierarchical: boolean;
		show_in_rest: boolean;
	};
}

export type CoreDataError = { message?: string; code?: string };
