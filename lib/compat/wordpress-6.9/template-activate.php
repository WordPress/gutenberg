<?php

// How does this work?
// 1. For wp_template, we remove the custom templates controller, so it becomes
//    a normal posts endpoint, modified slightly to allow auto-drafts.
add_filter( 'register_post_type_args', 'gutenberg_modify_wp_template_post_type_args', 10, 2 );
function gutenberg_modify_wp_template_post_type_args( $args, $post_type ) {
	if ( 'wp_template' === $post_type ) {
		$args['rest_base']                       = 'wp_template';
		$args['rest_controller_class']           = 'Gutenberg_REST_Templates_Controller';
		$args['autosave_rest_controller_class']  = null;
		$args['revisions_rest_controller_class'] = null;
	}
	return $args;
}

// 2. We maintain the routes for /templates and /templates/lookup. I think we'll
//    need to deprecate /templates eventually, but we'll still want to be able
//    to lookup the active template for a specific slug, and probably get a list
//    of all _active_ templates. For that we can keep /lookup.
add_action( 'rest_api_init', 'gutenberg_maintain_templates_routes' );
function gutenberg_maintain_templates_routes() {
	// This should later be changed in core so we don't need initialise
	// WP_REST_Templates_Controller with a post type.
	global $wp_post_types;
	$wp_post_types['wp_template']->rest_base = 'templates';
	$controller                              = new WP_REST_Templates_Controller( 'wp_template' );
	$wp_post_types['wp_template']->rest_base = 'wp_template';
	$controller->register_routes();
}

// 3. We need a route to get that raw static templates from themes and plugins.
//    I registered this as a post type route because right now the
//    EditorProvider assumes templates are posts.
add_action( 'init', 'gutenberg_setup_static_template' );
function gutenberg_setup_static_template() {
	global $wp_post_types;
	$wp_post_types['wp_registered_template']                        = clone $wp_post_types['wp_template'];
	$wp_post_types['wp_registered_template']->name                  = 'wp_registered_template';
	$wp_post_types['wp_registered_template']->rest_base             = 'wp_registered_template';
	$wp_post_types['wp_registered_template']->rest_controller_class = 'Gutenberg_REST_Static_Templates_Controller';

	register_setting(
		'reading',
		'active_templates',
		array(
			'type'         => 'object',
			'show_in_rest' => array(
				'schema' => array(
					'type'                 => 'object',
					// properties can be integers or false (deactivated).
					'additionalProperties' => true,
				),
			),
			'default'      => array(),
			'label'        => 'Active Templates',
		)
	);
}

add_filter( 'pre_wp_unique_post_slug', 'gutenberg_allow_template_slugs_to_be_duplicated', 10, 5 );
function gutenberg_allow_template_slugs_to_be_duplicated( $override, $slug, $post_id, $post_status, $post_type ) {
	return 'wp_template' === $post_type ? $slug : $override;
}

add_filter( 'pre_get_block_templates', 'gutenberg_pre_get_block_templates', 10, 3 );
function gutenberg_pre_get_block_templates( $output, $query, $template_type ) {
	if ( 'wp_template' === $template_type && ! empty( $query['slug__in'] ) ) {
		$active_templates = (array) get_option( 'active_templates', array() );
		$slugs            = $query['slug__in'];
		$output           = array();
		foreach ( $slugs as $slug ) {
			if ( isset( $active_templates[ $slug ] ) ) {
				if ( false !== $active_templates[ $slug ] ) {
					$post = get_post( $active_templates[ $slug ] );
					if ( $post && 'publish' === $post->post_status ) {
						$output[] = _build_block_template_result_from_post( $post );
					}
				} else {
					// Deactivated template, fall back to next slug.
					$output[] = array();
				}
			}
		}
		if ( empty( $output ) ) {
			$output = null;
		}
	}
	return $output;
}

// Whenever templates are queried by slug, never return any user templates.
// We are handling that in gutenberg_pre_get_block_templates.
function gutenberg_remove_tax_query_for_templates( $query ) {
	if ( isset( $query->query['post_type'] ) && 'wp_template' === $query->query['post_type'] ) {
		// We don't have templates with this status, that's the point. We want
		// this query to not return any user templates.
		$query->set( 'post_status', array( 'pending' ) );
	}
}

add_filter( 'pre_get_block_templates', 'gutenberg_tax_pre_get_block_templates', 10, 3 );
function gutenberg_tax_pre_get_block_templates( $output, $query, $template_type ) {
	// Do not remove the tax query when querying for a specific slug.
	if ( 'wp_template' === $template_type && ! empty( $query['slug__in'] ) ) {
		add_action( 'pre_get_posts', 'gutenberg_remove_tax_query_for_templates' );
	}
	return $output;
}

add_filter( 'get_block_templates', 'gutenberg_tax_get_block_templates', 10, 3 );
function gutenberg_tax_get_block_templates( $output, $query, $template_type ) {
	if ( 'wp_template' === $template_type && ! empty( $query['slug__in'] ) ) {
		remove_action( 'pre_get_posts', 'gutenberg_remove_tax_query_for_templates' );
	}
	return $output;
}

// We need to set the theme for the template when it's created. See:
// https://github.com/WordPress/wordpress-develop/blob/b2c8d8d2c8754cab5286b06efb4c11e2b6aa92d5/src/wp-includes/rest-api/endpoints/class-wp-rest-templates-controller.php#L571-L578
// Priority 9 so it runs before default hooks like
// `inject_ignored_hooked_blocks_metadata_attributes`.
add_action( 'rest_pre_insert_wp_template', 'gutenberg_set_active_template_theme', 9, 2 );
function gutenberg_set_active_template_theme( $changes, $request ) {
	$template = $request['id'] ? get_block_template( $request['id'], 'wp_template' ) : null;
	if ( $template ) {
		return $changes;
	}
	$changes->tax_input = array(
		'wp_theme' => isset( $request['theme'] ) ? $request['theme'] : get_stylesheet(),
	);
	return $changes;
}

// Migrate existing "edited" templates. By existing, it means that the template
// is active.
add_action( 'init', 'gutenberg_migrate_existing_templates' );
function gutenberg_migrate_existing_templates() {
	$active_templates = get_option( 'active_templates' );

	if ( $active_templates ) {
		return;
	}

	// Query all templates in the database. See `get_block_templates`.
	$wp_query_args = array(
		'post_status'         => 'publish',
		'post_type'           => 'wp_template',
		'posts_per_page'      => -1,
		'no_found_rows'       => true,
		'lazy_load_term_meta' => false,
		'tax_query'           => array(
			array(
				'taxonomy' => 'wp_theme',
				'field'    => 'name',
				'terms'    => get_stylesheet(),
			),
		),
	);

	$template_query   = new WP_Query( $wp_query_args );
	$active_templates = array();

	foreach ( $template_query->posts as $post ) {
		$active_templates[ $post->post_name ] = $post->ID;
	}

	update_option( 'active_templates', $active_templates );
}
