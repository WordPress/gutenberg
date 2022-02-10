export interface Type {
  /**
   * All capabilities used by the post type.
   */
  capabilities?: {
  };
  /**
   * A human-readable description of the post type.
   */
  description?: string;
  /**
   * Whether or not the post type should have children.
   */
  hierarchical?: boolean;
  /**
   * Whether or not the post type can be viewed.
   */
  viewable?: boolean;
  /**
   * Human-readable labels for the post type for various contexts.
   */
  labels?: {
  };
  /**
   * The title for the post type.
   */
  name?: string;
  /**
   * An alphanumeric identifier for the post type.
   */
  slug?: string;
  /**
   * All features, supported by the post type.
   */
  supports?: {
  };
  /**
   * Taxonomies associated with post type.
   */
  taxonomies?: string[];
  /**
   * REST base route for the post type.
   */
  rest_base?: string;
  /**
   * REST route's namespace for the post type.
   */
  rest_namespace?: string;
  /**
   * The visibility settings for the post type.
   */
  visibility?: {
    /**
     * Whether to generate a default UI for managing this post type.
     */
    show_ui?: boolean;
    /**
     * Whether to make the post type is available for selection in navigation menus.
     */
    show_in_nav_menus?: boolean;
  };
}
