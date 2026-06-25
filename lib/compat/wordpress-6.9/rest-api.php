<?php
/**
 * PHP and WordPress configuration compatibility functions for the Gutenberg
 * editor plugin changes related to REST API.
 *
 * @package gutenberg
 */

/**
 * Adds export theme link relation to the block theme responses.
 *
 * @param WP_REST_Response $response The response object.
 * @param WP_Theme         $theme    Theme object used to create response.
 * @return WP_REST_Response Modified response object.
 */
function gutenberg_rest_theme_export_link_rel( $response, $theme ) {
	if ( ! empty( $response->get_links() ) && $theme->is_block_theme() ) {
		$response->add_link(
			'https://api.w.org/export-theme',
			rest_url( 'wp-block-editor/v1/export' ),
			array(
				'targetHints' => array(
					'allow' => current_user_can( 'export' ) ? array( 'GET' ) : array(),
				),
			)
		);
	}

	return $response;
}
add_filter( 'rest_prepare_theme', 'gutenberg_rest_theme_export_link_rel', 10, 2 );

/**
 * Overrides the REST controller for the attachment post type to add support
 * for filtering by multiple media types.
 *
 * Only applies if the experimental media processing feature is not enabled,
 * as that feature includes this functionality and more.
 *
 * @param array  $args      Array of arguments for registering a post type.
 * @param string $post_type Post type key.
 * @return array Modified array of arguments.
 */
function gutenberg_override_attachments_rest_controller( $args, $post_type ) {
	if ( 'attachment' === $post_type && ! gutenberg_is_client_side_media_processing_enabled() ) {
		$args['rest_controller_class'] = 'Gutenberg_REST_Attachments_Controller_6_9';
	}
	return $args;
}
add_filter( 'register_post_type_args', 'gutenberg_override_attachments_rest_controller', 10, 2 );

/**
 * Registers the meta-query collection params on a single post-type endpoint.
 *
 * @param array $params The current collection params for the endpoint.
 * @return array Modified params array.
 */
function gutenberg_add_meta_query_collection_params( $params ) {
	/*
	* Using `meta_key` can result in slow queries on sites with large amounts of post meta.
	* However, it is a necessary evil for ordering by custom field values.
	*/
	$params['meta_key'] = array( // phpcs:ignore WordPress.DB.SlowDBQuery.slow_db_query_meta_key
		'description'       => __( 'Custom meta field key to sort or filter by.', 'gutenberg' ),
		'type'              => 'string',
		'sanitize_callback' => 'sanitize_key',
		'validate_callback' => 'rest_validate_request_arg',
	);

	$params['meta_type'] = array(
		'description'       => __( 'Data type of the meta field value, used for correct comparison.', 'gutenberg' ),
		'type'              => 'string',
		'enum'              => array( 'CHAR', 'NUMERIC', 'DATE', 'DATETIME', 'DECIMAL', 'SIGNED', 'TIME', 'UNSIGNED' ),
		'default'           => 'CHAR',
		'sanitize_callback' => 'sanitize_text_field',
		'validate_callback' => 'rest_validate_request_arg',
	);

	$params['date_range'] = array(
		'description'       => __( 'Preset date-range filter applied against the meta field.', 'gutenberg' ),
		'type'              => 'string',
		'enum'              => array( '', 'future', 'past', 'today', 'custom' ),
		'default'           => '',
		'sanitize_callback' => 'sanitize_text_field',
		'validate_callback' => 'rest_validate_request_arg',
	);

	$params['meta_date_start'] = array(
		'description'       => __( 'Start date for custom date range filter.', 'gutenberg' ),
		'type'              => 'string',
		'sanitize_callback' => 'sanitize_text_field',
		'validate_callback' => 'rest_validate_request_arg',
	);

	$params['meta_date_end'] = array(
		'description'       => __( 'End date for custom date range filter.', 'gutenberg' ),
		'type'              => 'string',
		'sanitize_callback' => 'sanitize_text_field',
		'validate_callback' => 'rest_validate_request_arg',
	);

	$params['meta_value_filter'] = array(
		'description'       => __( 'Value to compare the meta field against.', 'gutenberg' ),
		'type'              => 'string',
		'sanitize_callback' => 'sanitize_text_field',
		'validate_callback' => 'rest_validate_request_arg',
	);

	$params['meta_compare'] = array(
		'description'       => __( 'Operator to use for the meta field comparison.', 'gutenberg' ),
		'type'              => 'string',
		'enum'              => array( '=', '!=', '>', '<', 'LIKE' ),
		'default'           => '=',
		'sanitize_callback' => 'sanitize_text_field',
		'validate_callback' => 'rest_validate_request_arg',
	);

	if ( isset( $params['orderby'] ) && isset( $params['orderby']['enum'] ) ) {
		if ( ! in_array( 'meta_value', $params['orderby']['enum'], true ) ) {
			$params['orderby']['enum'][] = 'meta_value';
		}
		if ( ! in_array( 'meta_value_num', $params['orderby']['enum'], true ) ) {
			$params['orderby']['enum'][] = 'meta_value_num';
		}
	}

	return $params;
}

/**
 * Applies meta key ordering and filtering to the WP_Query arguments for REST API requests.
 *
 * Parses the meta-related collection parameters provided by the Query Loop block
 * and translates them into native `WP_Query` and `WP_Meta_Query` arguments.
 * Supports meta value sorting, preset and custom date-range filtering, and generic
 * text/numeric filtering. Includes the `query_loop_meta_clause` filter to allow
 * third-party plugins to intercept and modify the generated meta clause.
 * Mirrors the frontend rendering logic to ensure the Editor preview matches the frontend.
 *
 * @since 23.4.0
 *
 * @param array           $args    WP_Query arguments array being built.
 * @param WP_REST_Request $request Full details about the REST request.
 * @param string          $post_type The post type slug current being queried.
 * @return array Returns the modified WP_Query arguments.
 */
function gutenberg_apply_meta_query_rest_args( $args, $request, $post_type = 'post' ) {
	$meta_key          = $request->get_param( 'meta_key' );
	$meta_type         = $request->get_param( 'meta_type' );
	$date_range        = $request->get_param( 'date_range' );
	$start_date        = $request->get_param( 'meta_date_start' );
	$end_date          = $request->get_param( 'meta_date_end' );
	$meta_value_filter = $request->get_param( 'meta_value_filter' );
	$order_by          = $args['orderby'] ?? '';

	if ( ! $meta_type ) {
		$meta_type = 'CHAR';
	}

	$meta_compare_raw = $request->get_param( 'meta_compare' ) ? $request->get_param( 'meta_compare' ) : '=';
	$meta_compare     = html_entity_decode( $meta_compare_raw );
	if ( ! in_array( $meta_compare, array( '=', '!=', '>', '<', 'LIKE' ), true ) ) {
		$meta_compare = '=';
	}

	if ( empty( $meta_key ) || is_protected_meta( $meta_key, $post_type ) ) {
		return $args;
	}

	$meta_order_types = array( 'meta_value', 'meta_value_num' );
	if ( in_array( $order_by, $meta_order_types, true ) ) {
		/*
		 * Using `meta_key` can result in slow queries on sites with large amounts of post meta.
		 * However, it is a necessary evil for ordering by custom field values.
		 */
		$args['meta_key']  = $meta_key; // phpcs:ignore WordPress.DB.SlowDBQuery.slow_db_query_meta_key
		$args['meta_type'] = $meta_type;

		if ( 'DATE' === $meta_type ) {
			$args['orderby'] = 'meta_value';
		}
	}

	$meta_clause = null;

	if ( ! empty( $date_range ) ) {
		$today = current_time( 'Y-m-d' );

		if ( 'custom' === $date_range ) {
			if ( $start_date && $end_date ) {
				$meta_clause = array(
					'key'     => $meta_key,
					'value'   => array( $start_date, $end_date ),
					'compare' => 'BETWEEN',
					'type'    => $meta_type,
				);
			} elseif ( $start_date ) {
				$meta_clause = array(
					'key'     => $meta_key,
					'value'   => $start_date,
					'compare' => '>=',
					'type'    => $meta_type,
				);
			} elseif ( $end_date ) {
				$meta_clause = array(
					'key'     => $meta_key,
					'value'   => $end_date,
					'compare' => '<=',
					'type'    => $meta_type,
				);
			}
		} else {
			$compare_map = array(
				'future' => '>=',
				'past'   => '<',
				'today'  => '=',
			);

			if ( isset( $compare_map[ $date_range ] ) ) {
				$meta_clause = array(
					'key'     => $meta_key,
					'value'   => $today,
					'compare' => $compare_map[ $date_range ],
					'type'    => $meta_type,
				);
			}
		}
	} elseif ( null !== $meta_value_filter && '' !== $meta_value_filter ) {
		$meta_clause = array(
			'key'     => $meta_key,
			'value'   => $meta_value_filter,
			'compare' => $meta_compare,
			'type'    => $meta_type,
		);
	}
	if ( $meta_clause ) {
		$meta_clause = apply_filters( 'query_loop_meta_clause', $meta_clause, $meta_key, $date_range, $meta_type, $start_date, $end_date );

		if ( $meta_clause && is_array( $meta_clause ) ) {
			/*
			 * Using `meta_query` can result in slow queries on sites with large amounts of post meta.
			 * However, it is a necessary evil for filtering by custom field values.
			 */
			if ( ! empty( $args['meta_query'] ) ) {
				$args['meta_query'] = array( // phpcs:ignore WordPress.DB.SlowDBQuery.slow_db_query_meta_query
					'relation' => 'AND',
					$args['meta_query'],
					$meta_clause,
				);
			} else {
				$args['meta_query'] = array( $meta_clause ); // phpcs:ignore WordPress.DB.SlowDBQuery.slow_db_query_meta_query
			}
		}
	}

	return $args;
}

/**
 * Registers the meta-query params and query filter on every public REST-
 * enabled post type during `rest_api_init`.
 */
function gutenberg_register_meta_query_rest_params() {
	$post_types = get_post_types( array( 'show_in_rest' => true ) );

	foreach ( $post_types as $post_type ) {
		add_filter(
			"rest_{$post_type}_collection_params",
			'gutenberg_add_meta_query_collection_params'
		);

		add_filter(
			"rest_{$post_type}_query",
			function ( $args, $request ) use ( $post_type ) {
				return gutenberg_apply_meta_query_rest_args( $args, $request, $post_type );
			},
			10,
			2
		);
	}
}
add_action( 'rest_api_init', 'gutenberg_register_meta_query_rest_params' );
