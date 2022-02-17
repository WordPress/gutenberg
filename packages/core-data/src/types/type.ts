/**
 * Internal dependencies
 */
import { Context, WithoutNevers, ContextualField } from './common';

interface FullType< C extends Context > {
	/**
	 * All capabilities used by the post type.
	 */
	capabilities: ContextualField< Record< string, string >, 'edit', C >;
	/**
	 * A human-readable description of the post type.
	 */
	description: ContextualField< string, 'view' | 'edit', C >;
	/**
	 * Whether or not the post type should have children.
	 */
	hierarchical: ContextualField< boolean, 'view' | 'edit', C >;
	/**
	 * Whether or not the post type can be viewed.
	 */
	viewable: ContextualField< boolean, 'edit', C >;
	/**
	 * Human-readable labels for the post type for various contexts.
	 */
	labels: ContextualField< Record< string, string >, 'edit', C >;
	/**
	 * The title for the post type.
	 */
	name: string;
	/**
	 * An alphanumeric identifier for the post type.
	 */
	slug: string;
	/**
	 * All features, supported by the post type.
	 */
	supports: ContextualField< Record< string, string >, 'edit', C >;
	/**
	 * Taxonomies associated with post type.
	 */
	taxonomies: ContextualField< string[], 'view' | 'edit', C >;
	/**
	 * REST base route for the post type.
	 */
	rest_base: string;
	/**
	 * REST route's namespace for the post type.
	 */
	rest_namespace: string;
	/**
	 * The visibility settings for the post type.
	 */
	visibility: ContextualField< TypeVisibility, 'edit', C >;
}

interface TypeVisibility {
	/**
	 * Whether to generate a default UI for managing this post type.
	 */
	show_ui: boolean;
	/**
	 * Whether to make the post type is available for selection in navigation menus.
	 */
	show_in_nav_menus: boolean;
}

export type Type< C extends Context > = WithoutNevers< FullType< C > >;
export interface UpdatableType extends Type< 'edit' > {}
