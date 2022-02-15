/**
 * Internal dependencies
 */
import { WithEdits } from './common';

export interface Taxonomy {
	/**
	 * All capabilities used by the taxonomy.
	 */
	capabilities?: {
		[ k: string ]: string;
	};
	/**
	 * A human-readable description of the taxonomy.
	 */
	description?: string;
	/**
	 * Whether or not the taxonomy should have children.
	 */
	hierarchical?: boolean;
	/**
	 * Human-readable labels for the taxonomy for various contexts.
	 */
	labels?: {
		[ k: string ]: string;
	};
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
	show_cloud?: boolean;
	/**
	 * Types associated with the taxonomy.
	 */
	types?: string[];
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
	visibility?: TaxonomyVisibility;
}

export interface TaxonomyVisibility {
	/**
	 * Whether a taxonomy is intended for use publicly either via the admin interface or by front-end users.
	 */
	public?: boolean;
	/**
	 * Whether the taxonomy is publicly queryable.
	 */
	publicly_queryable?: boolean;
	/**
	 * Whether to generate a default UI for managing this taxonomy.
	 */
	show_ui?: boolean;
	/**
	 * Whether to allow automatic creation of taxonomy columns on associated post-types table.
	 */
	show_admin_column?: boolean;
	/**
	 * Whether to make the taxonomy available for selection in navigation menus.
	 */
	show_in_nav_menus?: boolean;
	/**
	 * Whether to show the taxonomy in the quick/bulk edit panel.
	 */
	show_in_quick_edit?: boolean;
}

export interface TaxonomyWithEdits
	extends WithEdits< Taxonomy, 'description' > {}
