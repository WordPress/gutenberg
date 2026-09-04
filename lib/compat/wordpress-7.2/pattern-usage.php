<?php
/**
 * REST API endpoint reporting where a synced pattern is used.
 *
 * @package gutenberg
 */

/**
 * Returns the post types that may contain a reference to a synced pattern.
 *
 * Any post type editable with the block editor can hold a `core/block` block,
 * including the design post types (`wp_template`, `wp_template_part`,
 * `wp_block`, `wp_navigation`).
 *
 * @param int $pattern_id The pattern being looked up.
 * @return string[] List of post type names.
 */
function gutenberg_get_pattern_usage_post_types( $pattern_id ) {
	$post_types = array();

	foreach ( get_post_types( array( 'show_in_rest' => true ) ) as $post_type ) {
		if ( post_type_supports( $post_type, 'editor' ) ) {
			$post_types[] = $post_type;
		}
	}

	/**
	 * Filters the post types searched when reporting where a pattern is used.
	 *
	 * @param string[] $post_types List of post type names.
	 * @param int      $pattern_id The pattern being looked up.
	 */
	return apply_filters( 'gutenberg_pattern_usage_post_types', $post_types, $pattern_id );
}

/**
 * Determines whether a list of parsed blocks references a synced pattern.
 *
 * @param array $blocks     Parsed blocks, as returned by `parse_blocks()`.
 * @param int   $pattern_id The pattern to look for.
 * @return bool Whether one of the blocks, at any depth, references the pattern.
 */
function gutenberg_blocks_reference_pattern( $blocks, $pattern_id ) {
	foreach ( $blocks as $block ) {
		if (
			'core/block' === $block['blockName'] &&
			isset( $block['attrs']['ref'] ) &&
			(int) $block['attrs']['ref'] === $pattern_id
		) {
			return true;
		}

		if (
			! empty( $block['innerBlocks'] ) &&
			gutenberg_blocks_reference_pattern( $block['innerBlocks'], $pattern_id )
		) {
			return true;
		}
	}

	return false;
}

/**
 * Checks whether the current user may see where a pattern is used.
 *
 * @param WP_REST_Request $request The request.
 * @return true|WP_Error True if the request has read access, WP_Error otherwise.
 */
function gutenberg_get_pattern_usage_permissions_check( $request ) {
	$pattern = get_post( (int) $request['id'] );

	if ( ! $pattern || 'wp_block' !== $pattern->post_type ) {
		return new WP_Error(
			'rest_post_invalid_id',
			__( 'Invalid pattern ID.', 'gutenberg' ),
			array( 'status' => 404 )
		);
	}

	if ( ! current_user_can( 'edit_post', $pattern->ID ) ) {
		return new WP_Error(
			'rest_cannot_read_pattern_usage',
			__( 'Sorry, you are not allowed to see where this pattern is used.', 'gutenberg' ),
			array( 'status' => rest_authorization_required_code() )
		);
	}

	return true;
}

/**
 * Lists the entries that use a synced pattern, grouped by post type.
 *
 * @param WP_REST_Request $request The request.
 * @return WP_REST_Response The list of entries using the pattern.
 */
function gutenberg_get_pattern_usage( $request ) {
	$pattern_id = (int) $request['id'];

	$query = new WP_Query(
		array(
			'post_type'              => gutenberg_get_pattern_usage_post_types( $pattern_id ),
			'post_status'            => 'any',
			'post__not_in'           => array( $pattern_id ),
			// The search is only a cheap way to narrow the table down: it is
			// capped because every candidate is then parsed to confirm it.
			'posts_per_page'         => 100,
			'orderby'                => 'title',
			'order'                  => 'ASC',
			's'                      => '"ref":' . $pattern_id,
			// `sentence` keeps the needle whole instead of splitting it on the
			// colon and quotes.
			'sentence'               => true,
			'search_columns'         => array( 'post_content' ),
			'no_found_rows'          => true,
			'ignore_sticky_posts'    => true,
			'update_post_meta_cache' => false,
			'update_post_term_cache' => false,
		)
	);

	$groups = array();

	foreach ( $query->posts as $post ) {
		/*
		 * The search above also matches `"ref":12` inside `"ref":123`, and
		 * other blocks such as `core/navigation` carry a `ref` attribute of
		 * their own, so confirm the reference against the parsed content.
		 */
		if ( ! gutenberg_blocks_reference_pattern( parse_blocks( $post->post_content ), $pattern_id ) ) {
			continue;
		}

		if ( ! current_user_can( 'read_post', $post->ID ) ) {
			continue;
		}

		if ( ! isset( $groups[ $post->post_type ] ) ) {
			$labels = get_post_type_object( $post->post_type )->labels;

			$groups[ $post->post_type ] = array(
				'type'   => $post->post_type,
				'labels' => array(
					'name'          => $labels->name,
					'singular_name' => $labels->singular_name,
				),
				'items'  => array(),
			);
		}

		$groups[ $post->post_type ]['items'][] = array(
			'id'    => $post->ID,
			'title' => $post->post_title,
		);
	}

	foreach ( $groups as $post_type => $group ) {
		$groups[ $post_type ]['count'] = count( $group['items'] );
	}

	return rest_ensure_response(
		array(
			'total'  => array_sum( wp_list_pluck( $groups, 'count' ) ),
			'groups' => array_values( $groups ),
		)
	);
}

/**
 * Returns the schema of the pattern usage endpoint.
 *
 * @return array Item schema data.
 */
function gutenberg_get_pattern_usage_schema() {
	return array(
		'$schema'    => 'http://json-schema.org/draft-04/schema#',
		'title'      => 'pattern-usage',
		'type'       => 'object',
		'properties' => array(
			'total'  => array(
				'description' => __( 'Number of entries using the pattern.', 'gutenberg' ),
				'type'        => 'integer',
				'context'     => array( 'view', 'edit' ),
				'readonly'    => true,
			),
			'groups' => array(
				'description' => __( 'Entries using the pattern, grouped by post type.', 'gutenberg' ),
				'type'        => 'array',
				'context'     => array( 'view', 'edit' ),
				'readonly'    => true,
				'items'       => array(
					'type'       => 'object',
					'properties' => array(
						'type'   => array(
							'description' => __( 'Post type of the entries.', 'gutenberg' ),
							'type'        => 'string',
						),
						'labels' => array(
							'description' => __( 'Singular and plural labels of the post type.', 'gutenberg' ),
							'type'        => 'object',
							'properties'  => array(
								'name'          => array( 'type' => 'string' ),
								'singular_name' => array( 'type' => 'string' ),
							),
						),
						'count'  => array(
							'description' => __( 'Number of entries of this post type.', 'gutenberg' ),
							'type'        => 'integer',
						),
						'items'  => array(
							'description' => __( 'Entries of this post type using the pattern.', 'gutenberg' ),
							'type'        => 'array',
							'items'       => array(
								'type'       => 'object',
								'properties' => array(
									'id'    => array( 'type' => 'integer' ),
									'title' => array( 'type' => 'string' ),
								),
							),
						),
					),
				),
			),
		),
	);
}

/**
 * Registers the route listing where a synced pattern is used.
 */
function gutenberg_register_pattern_usage_route() {
	register_rest_route(
		'wp/v2',
		'/blocks/(?P<id>[\d]+)/usage',
		array(
			array(
				'methods'             => WP_REST_Server::READABLE,
				'callback'            => 'gutenberg_get_pattern_usage',
				'permission_callback' => 'gutenberg_get_pattern_usage_permissions_check',
				'args'                => array(
					'id' => array(
						'description' => __( 'Unique identifier for the pattern.', 'gutenberg' ),
						'type'        => 'integer',
					),
				),
			),
			'schema' => 'gutenberg_get_pattern_usage_schema',
		)
	);
}
add_action( 'rest_api_init', 'gutenberg_register_pattern_usage_route' );
