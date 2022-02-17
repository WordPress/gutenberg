/**
 * Internal dependencies
 */
import {
	Context,
	ContextualField,
	UpdatableRecord,
	WithoutNevers,
} from './common';

interface FullTaxonomy< C extends Context > {
	/**
	 * All capabilities used by the taxonomy.
	 */
	capabilities: ContextualField< Record< string, string >, 'edit', C >;
	/**
	 * A human-readable description of the taxonomy.
	 */
	description: ContextualField< string, 'view' | 'edit', C >;
	/**
	 * Whether or not the taxonomy should have children.
	 */
	hierarchical: ContextualField< boolean, 'view' | 'edit', C >;
	/**
	 * Human-readable labels for the taxonomy for various contexts.
	 */
	labels: ContextualField< Record< string, string >, 'edit', C >;
	/**
	 * The title for the taxonomy.
	 */
	name: string;
	/**
	 * An alphanumeric identifier for the taxonomy.
	 */
	slug: string;
	/**
	 * Whether or not the term cloud should be displayed.
	 */
	show_cloud: ContextualField< boolean, 'edit', C >;
	/**
	 * Types associated with the taxonomy.
	 */
	types: ContextualField< string[], 'view' | 'edit', C >;
	/**
	 * REST base route for the taxonomy.
	 */
	rest_base: string;
	/**
	 * REST namespace route for the taxonomy.
	 */
	rest_namespace: string;
	/**
	 * The visibility settings for the taxonomy.
	 */
	visibility: TaxonomyVisibility;
}

export interface TaxonomyVisibility {
	/**
	 * Whether a taxonomy is intended for use publicly either via the admin interface or by front-end users.
	 */
	public: boolean;
	/**
	 * Whether the taxonomy is publicly queryable.
	 */
	publicly_queryable: boolean;
	/**
	 * Whether to generate a default UI for managing this taxonomy.
	 */
	show_ui: boolean;
	/**
	 * Whether to allow automatic creation of taxonomy columns on associated post-types table.
	 */
	show_admin_column: boolean;
	/**
	 * Whether to make the taxonomy available for selection in navigation menus.
	 */
	show_in_nav_menus: boolean;
	/**
	 * Whether to show the taxonomy in the quick/bulk edit panel.
	 */
	show_in_quick_edit: boolean;
}

export type Taxonomy< C extends Context > = WithoutNevers< FullTaxonomy< C > >;
export interface UpdatableTaxonomy
	extends UpdatableRecord< Taxonomy< 'edit' >, 'description' > {}
