<?php
/**
 * Widget Type Composer: server-defined widget definitions.
 *
 * Loaded only when the `gutenberg-widget-type-composer` experiment is on
 * (gated from `lib/load.php`).
 *
 * A widget definition is a composition of blocks. Two storage layers live here:
 *
 * 1. Code-registered. Declared in PHP via `gutenberg_register_widget_def()` and
 *    held in a per-request in-memory registry. Same model as
 *    `register_block_pattern()`: declarative, versioned with the code, never
 *    persisted to the database.
 * 2. CPT-stored. Created by a user through the visual composer; persisted as
 *    `widget_def` posts, editable and queryable through the standard posts
 *    controller at `/wp/v2/widget-defs`.
 *
 * The resolver in `dashboard-widgets/widget-types.php` walks both on `init` and
 * registers each as a Widget Type with `origin = 'code-registered'` or
 * `origin = 'cpt'`. The built-in origin is merged by the same resolver.
 *
 * Capabilities: a single `manage_widget_definitions` primitive gates every CPT
 * operation, synthesized for users that already hold `manage_options` via the
 * `user_has_cap` filter, so role assignment stays portable.
 *
 * @package gutenberg
 */

/*
 * Slug of the post type that backs CPT-stored widget definitions.
 * Constrained to the 20-character limit imposed by `register_post_type`.
 */
const GUTENBERG_WIDGET_DEF_POST_TYPE = 'widget_def';

/*
 * Primitive capability that gates every widget_def CPT operation.
 */
const GUTENBERG_WIDGET_DEF_CAP = 'manage_widget_definitions';

/**
 * Registers the `widget_def` post type used for user-created definitions.
 */
function gutenberg_register_widget_def_post_type() {
	register_post_type(
		GUTENBERG_WIDGET_DEF_POST_TYPE,
		array(
			'labels'                => array(
				'name'          => __( 'Widget Definitions', 'gutenberg' ),
				'singular_name' => __( 'Widget Definition', 'gutenberg' ),
			),
			'public'                => false,
			'show_ui'               => false,
			'show_in_menu'          => false,
			'show_in_rest'          => true,
			'rest_base'             => 'widget-defs',
			'rest_controller_class' => 'WP_REST_Posts_Controller',
			'supports'              => array( 'editor', 'revisions', 'author', 'custom-fields' ),
			/*
			 * Only primitive caps are aliased to `manage_widget_definitions`.
			 * Meta caps (`edit_post`, `read_post`, `delete_post`) are NOT aliased:
			 * doing so populates the `$post_type_meta_caps` reverse lookup, which
			 * makes `map_meta_cap('manage_widget_definitions')` loop back to
			 * `edit_post` and resolve to `do_not_allow` when no post ID is in
			 * scope. With `map_meta_cap = true` below, WP maps the meta caps to
			 * the appropriate primitive based on ownership / status, and the
			 * primitives all collapse to the single cap.
			 */
			'capabilities'          => array(
				'edit_posts'             => GUTENBERG_WIDGET_DEF_CAP,
				'edit_others_posts'      => GUTENBERG_WIDGET_DEF_CAP,
				'edit_published_posts'   => GUTENBERG_WIDGET_DEF_CAP,
				'edit_private_posts'     => GUTENBERG_WIDGET_DEF_CAP,
				'publish_posts'          => GUTENBERG_WIDGET_DEF_CAP,
				'read_private_posts'     => GUTENBERG_WIDGET_DEF_CAP,
				'create_posts'           => GUTENBERG_WIDGET_DEF_CAP,
				'delete_posts'           => GUTENBERG_WIDGET_DEF_CAP,
				'delete_others_posts'    => GUTENBERG_WIDGET_DEF_CAP,
				'delete_published_posts' => GUTENBERG_WIDGET_DEF_CAP,
				'delete_private_posts'   => GUTENBERG_WIDGET_DEF_CAP,
			),
			'map_meta_cap'          => true,
			'has_archive'           => false,
			'rewrite'               => false,
			'query_var'             => false,
			'delete_with_user'      => false,
		)
	);

	gutenberg_register_widget_def_post_meta();
}
add_action( 'init', 'gutenberg_register_widget_def_post_type' );

/**
 * Registers the four meta fields exposed by every `widget_def` post.
 *
 * Kept on its own so the registrations sit next to the CPT itself but the `init`
 * callback above stays terse.
 */
function gutenberg_register_widget_def_post_meta() {
	register_post_meta(
		GUTENBERG_WIDGET_DEF_POST_TYPE,
		'attributes_schema',
		array(
			'type'         => 'array',
			'single'       => true,
			'default'      => array(),
			'show_in_rest' => array(
				'schema' => gutenberg_widget_def_attributes_schema_rest_schema(),
			),
		)
	);

	register_post_meta(
		GUTENBERG_WIDGET_DEF_POST_TYPE,
		'sources',
		array(
			'type'         => 'array',
			'single'       => true,
			'default'      => array(),
			'show_in_rest' => array(
				'schema' => gutenberg_widget_def_sources_rest_schema(),
			),
		)
	);

	register_post_meta(
		GUTENBERG_WIDGET_DEF_POST_TYPE,
		'category',
		array(
			'type'         => 'string',
			'single'       => true,
			'default'      => '',
			'show_in_rest' => true,
		)
	);

	register_post_meta(
		GUTENBERG_WIDGET_DEF_POST_TYPE,
		'icon',
		array(
			'type'         => 'string',
			'single'       => true,
			'default'      => '',
			'show_in_rest' => true,
		)
	);
}

/**
 * Returns the REST schema for the `attributes_schema` meta: an array of
 * `Field< Item >` records (the JSON-serializable subset of a
 * `@wordpress/dataviews` Field).
 *
 * Pins the known properties (`id` required, plus the documented optionals) so
 * REST writes reject obvious structural mistakes early. Leaves
 * `additionalProperties` open at every level so future Field additions do not
 * reject stored data.
 *
 * @access private
 *
 * @return array JSON Schema describing the meta value.
 */
function gutenberg_widget_def_attributes_schema_rest_schema() {
	return array(
		'type'  => 'array',
		'items' => array(
			'type'                 => 'object',
			'required'             => array( 'id' ),
			'properties'           => array(
				'id'                 => array( 'type' => 'string' ),
				'type'               => array( 'type' => 'string' ),
				'label'              => array( 'type' => 'string' ),
				'header'             => array( 'type' => 'string' ),
				'placeholder'        => array( 'type' => 'string' ),
				'description'        => array( 'type' => 'string' ),
				'readOnly'           => array( 'type' => 'boolean' ),
				'enableSorting'      => array( 'type' => 'boolean' ),
				'enableHiding'       => array( 'type' => 'boolean' ),
				'enableGlobalSearch' => array( 'type' => 'boolean' ),
				'elements'           => array(
					'type'  => 'array',
					'items' => array(
						'type'                 => 'object',
						'required'             => array( 'value', 'label' ),
						'properties'           => array(
							'value'       => array(
								'type' => array( 'string', 'integer', 'number', 'boolean', 'null' ),
							),
							'label'       => array( 'type' => 'string' ),
							'description' => array( 'type' => 'string' ),
						),
						'additionalProperties' => true,
					),
				),
				'filterBy'           => array(
					'type'                 => 'object',
					'properties'           => array(
						'operators' => array(
							'type'  => 'array',
							'items' => array( 'type' => 'string' ),
						),
					),
					'additionalProperties' => true,
				),
			),
			'additionalProperties' => true,
		),
	);
}

/**
 * Returns the REST schema for the `sources` meta: an array of binding source
 * declarations.
 *
 * Each entry is an object with a required `name` (the source identifier, e.g.
 * `core/instance-attribute`) plus optional `label` and `args`. The `name` is not
 * enumerated against a registry so plugins can declare their own sources;
 * cross-checking against the runtime registry happens at binding-resolve time,
 * not at storage time.
 *
 * @access private
 *
 * @return array JSON Schema describing the meta value.
 */
function gutenberg_widget_def_sources_rest_schema() {
	return array(
		'type'  => 'array',
		'items' => array(
			'type'                 => 'object',
			'required'             => array( 'name' ),
			'properties'           => array(
				'name'  => array( 'type' => 'string' ),
				'label' => array( 'type' => 'string' ),
				'args'  => array(
					'type'                 => 'object',
					'additionalProperties' => true,
				),
			),
			'additionalProperties' => true,
		),
	);
}

/**
 * Grants `manage_widget_definitions` to users that already hold `manage_options`.
 *
 * Wired on `user_has_cap` so the synthesis happens at check time. Sites that
 * want a different role mapping can unhook this filter and grant the cap
 * explicitly to roles.
 *
 * @param array   $allcaps All capabilities of the user.
 * @param array   $caps    Required primitive capabilities for the requested capability.
 * @param array   $args    Arguments that accompany the requested capability check.
 * @param WP_User $user    The user object.
 * @return array Possibly augmented capabilities.
 */
function gutenberg_widget_def_synthesize_cap( $allcaps, $caps, $args, $user ) {
	unset( $caps, $args, $user );

	if ( ! empty( $allcaps['manage_options'] ) ) {
		$allcaps[ GUTENBERG_WIDGET_DEF_CAP ] = true;
	}

	return $allcaps;
}
add_filter( 'user_has_cap', 'gutenberg_widget_def_synthesize_cap', 10, 4 );

/**
 * Registers a code-defined widget definition.
 *
 * Mirrors the spirit of `register_block_pattern()`: the definition is stored in
 * an in-memory registry for the lifetime of the request, no database row is
 * created, and the registration is the canonical source of truth.
 *
 * Calling the function twice for the same `$name` overwrites the previous entry.
 * When the second call carries arguments identical to the first the overwrite is
 * silent; when they differ, the function emits `_doing_it_wrong` so conflicts
 * surface during development.
 *
 * Example:
 *
 *     add_action( 'init', function () {
 *         gutenberg_register_widget_def( 'my-plugin/quick-stats', array(
 *             'title'       => __( 'Quick stats', 'my-plugin' ),
 *             'description' => __( 'Headline numbers for today.', 'my-plugin' ),
 *             'icon'        => 'chart-bar',
 *             'content'     => '<!-- wp:my-plugin/stats /-->',
 *         ) );
 *     }, 15 );
 *
 * @param string $name Definition identifier (namespaced, e.g. `core/latest-posts`).
 * @param array  $args {
 *     Definition arguments.
 *
 *     @type string $title       Optional. Display title surfaced by the host.
 *     @type string $description Optional. Short description.
 *     @type string $icon        Optional. Icon identifier (Dashicon slug or
 *                               registered icon name).
 *     @type string $category    Optional. Grouping category.
 *     @type string $content     Required. Block markup defining the composition.
 * }
 * @return bool True on success, false when validation fails.
 */
function gutenberg_register_widget_def( $name, $args = array() ) {
	if ( ! is_string( $name ) || '' === $name ) {
		_doing_it_wrong(
			__FUNCTION__,
			esc_html__( 'Widget Definition name must be a non-empty string.', 'gutenberg' ),
			'Gutenberg 23.2'
		);
		return false;
	}

	if ( empty( $args['content'] ) || ! is_string( $args['content'] ) ) {
		_doing_it_wrong(
			__FUNCTION__,
			sprintf(
				/* translators: %s: Widget Definition name. */
				esc_html__( 'Widget Definition "%s" is missing the required `content` argument.', 'gutenberg' ),
				esc_html( $name )
			),
			'Gutenberg 23.2'
		);
		return false;
	}

	$registry = &gutenberg_get_widget_def_registry_ref();

	$next = array_merge(
		array(
			'title'       => '',
			'description' => '',
			'icon'        => '',
			'category'    => '',
			'content'     => '',
		),
		$args,
		array( 'name' => $name )
	);

	if ( isset( $registry[ $name ] ) && $registry[ $name ] != $next ) { // phpcs:ignore Universal.Operators.StrictComparisons.LooseNotEqual
		_doing_it_wrong(
			__FUNCTION__,
			sprintf(
				/* translators: %s: Widget Definition name. */
				esc_html__( 'Widget Definition "%s" is already registered with different arguments. The previous registration is being overwritten.', 'gutenberg' ),
				esc_html( $name )
			),
			'Gutenberg 23.2'
		);
	}

	$registry[ $name ] = $next;

	return true;
}

/**
 * Returns all code-registered widget definitions.
 *
 * @return array<string, array<string, mixed>> Map of `$name => $args`.
 */
function gutenberg_get_registered_widget_defs() {
	return gutenberg_get_widget_def_registry_ref();
}

/**
 * Internal accessor that returns the in-memory registry by reference.
 *
 * Wrapped in a function so the static survives across calls without leaking a
 * top-level mutable global.
 *
 * @access private
 *
 * @return array<string, array<string, mixed>> Registry by reference.
 */
function &gutenberg_get_widget_def_registry_ref() {
	static $registry = array();
	return $registry;
}
