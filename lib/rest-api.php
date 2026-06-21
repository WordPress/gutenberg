<?php
/**
 * PHP and WordPress configuration compatibility functions for the Gutenberg
 * editor plugin changes related to REST API.
 *
 * @package gutenberg
 */

if ( ! defined( 'ABSPATH' ) ) {
	die( 'Silence is golden.' );
}

/**
 * Overrides the REST controller for the `wp_global_styles` post type.
 *
 * @param array $args Array of arguments for registering a post type.
 *                          See the register_post_type() function for accepted arguments.
 *
 * @return array Array of arguments for registering a post type.
 */
function gutenberg_override_global_styles_endpoint( array $args ): array {
	$args['rest_controller_class']   = 'WP_REST_Global_Styles_Controller_Gutenberg';
	$args['late_route_registration'] = true;
	$args['show_in_rest']            = true;
	$args['rest_base']               = 'global-styles';

	return $args;
}
add_filter( 'register_wp_global_styles_post_type_args', 'gutenberg_override_global_styles_endpoint' );

/**
 * Registers the Edit Site Export REST API routes.
 */
function gutenberg_register_edit_site_export_controller_endpoints() {
	$edit_site_export_controller = new WP_REST_Edit_Site_Export_Controller_Gutenberg();
	$edit_site_export_controller->register_routes();
}
add_action( 'rest_api_init', 'gutenberg_register_edit_site_export_controller_endpoints' );

/**
 * Registers the Icons Registry REST API routes.
 */
function gutenberg_register_icon_controller_endpoints() {
	$icons_controller = new WP_REST_Icons_Controller_Gutenberg();
	$icons_controller->register_routes();
}
add_action( 'rest_api_init', 'gutenberg_register_icon_controller_endpoints' );

/**
 * Normalizes a CSS class name in the same shape used by the editor package.
 *
 * @param string $class_name Candidate class name.
 * @return string Class name without whitespace or a leading dot.
 */
function gutenberg_normalize_managed_css_class_name( string $class_name ): string {
	return preg_replace( '/^\./', '', trim( $class_name ) );
}

/**
 * Returns whether a class name can be emitted as an unescaped CSS selector.
 *
 * @param string $class_name Candidate class name.
 * @return bool Whether the class name is valid.
 */
function gutenberg_is_valid_managed_css_class_name( string $class_name ): bool {
	return 1 === preg_match( '/^-?[_a-zA-Z]+[_a-zA-Z0-9-]*$/', gutenberg_normalize_managed_css_class_name( $class_name ) );
}

/**
 * Returns a block title for a parsed block.
 *
 * @param string $block_name Block name.
 * @return string Block title.
 */
function gutenberg_get_css_class_usage_block_title( string $block_name ): string {
	$block_type = WP_Block_Type_Registry::get_instance()->get_registered( $block_name );

	if ( $block_type && ! empty( $block_type->title ) ) {
		return $block_type->title;
	}

	return $block_name;
}

/**
 * Returns entity metadata for a CSS class usage source.
 *
 * @param WP_Post $post Post object.
 * @return array Entity metadata.
 */
function gutenberg_get_css_class_usage_post_entity( WP_Post $post ): array {
	$post_type_object = get_post_type_object( $post->post_type );

	return array(
		'id'        => (string) $post->ID,
		'type'      => $post->post_type,
		'typeLabel' => $post_type_object ? $post_type_object->labels->singular_name : $post->post_type,
		'title'     => get_the_title( $post ) ? get_the_title( $post ) : sprintf(
			/* translators: %s: Post ID. */
			__( 'Untitled #%s', 'gutenberg' ),
			$post->ID
		),
		'status'    => $post->post_status,
		'source'    => 'post',
	);
}

/**
 * Adds CSS class usages from a parsed block tree.
 *
 * @param array $blocks  Parsed blocks.
 * @param array $entity  Entity metadata.
 * @param array $usages  Usage rows.
 * @param array $path    Current block path.
 */
function gutenberg_collect_css_class_usages_from_blocks( array $blocks, array $entity, array &$usages, array $path = array() ): void {
	foreach ( $blocks as $index => $block ) {
		$block_path  = array_merge( $path, array( $index ) );
		$block_name  = isset( $block['blockName'] ) && is_string( $block['blockName'] ) ? $block['blockName'] : '';
		$class_name  = isset( $block['attrs']['className'] ) && is_string( $block['attrs']['className'] ) ? $block['attrs']['className'] : '';
		$class_names = preg_split( '/\s+/', $class_name, -1, PREG_SPLIT_NO_EMPTY );

		foreach ( $class_names as $name ) {
			$normalized_name = gutenberg_normalize_managed_css_class_name( $name );
			if ( '' === $normalized_name ) {
				continue;
			}

			$usages[] = array(
				'className'   => $normalized_name,
				'blockName'   => $block_name,
				'blockTitle'  => $block_name ? gutenberg_get_css_class_usage_block_title( $block_name ) : __( 'HTML', 'gutenberg' ),
				'blockPath'   => $block_path,
				'entityId'    => $entity['id'],
				'entityType'  => $entity['type'],
				'entityLabel' => $entity['typeLabel'],
				'entityTitle' => $entity['title'],
				'status'      => $entity['status'],
				'source'      => $entity['source'],
			);
		}

		if ( ! empty( $block['innerBlocks'] ) && is_array( $block['innerBlocks'] ) ) {
			gutenberg_collect_css_class_usages_from_blocks( $block['innerBlocks'], $entity, $usages, $block_path );
		}
	}
}

/**
 * Returns post types that can contain block markup relevant to class usage.
 *
 * @return string[] Post type names.
 */
function gutenberg_get_css_class_usage_post_types(): array {
	$post_types = get_post_types( array( 'show_in_rest' => true ), 'objects' );
	$included   = array();

	foreach ( $post_types as $post_type => $post_type_object ) {
		if ( in_array( $post_type, array( 'attachment', 'wp_global_styles' ), true ) ) {
			continue;
		}

		if (
			post_type_supports( $post_type, 'editor' ) ||
			in_array( $post_type, array( 'wp_template', 'wp_template_part', 'wp_navigation', 'wp_block' ), true )
		) {
			$included[] = $post_type;
		}
	}

	return array_values( array_unique( $included ) );
}

/**
 * Returns CSS class usages found in block widgets.
 *
 * @return array Usage rows.
 */
function gutenberg_get_block_widget_css_class_usages(): array {
	$widgets = get_option( 'widget_block', array() );
	$usages  = array();

	if ( ! is_array( $widgets ) ) {
		return $usages;
	}

	foreach ( $widgets as $widget_id => $widget ) {
		if ( empty( $widget['content'] ) || ! is_string( $widget['content'] ) ) {
			continue;
		}

		gutenberg_collect_css_class_usages_from_blocks(
			parse_blocks( $widget['content'] ),
			array(
				'id'        => (string) $widget_id,
				'type'      => 'widget_block',
				'typeLabel' => __( 'Widget', 'gutenberg' ),
				'title'     => sprintf(
					/* translators: %s: Widget ID. */
					__( 'Block widget #%s', 'gutenberg' ),
					$widget_id
				),
				'status'    => '',
				'source'    => 'widget',
			),
			$usages
		);
	}

	return $usages;
}

/**
 * Returns CSS class usages across block-bearing site content.
 *
 * @return array Usage data.
 */
function gutenberg_get_site_css_class_usage_data(): array {
	$usages = array();
	$posts  = get_posts(
		array(
			'post_type'              => gutenberg_get_css_class_usage_post_types(),
			'post_status'            => array( 'publish', 'future', 'draft', 'pending', 'private' ),
			'posts_per_page'         => -1,
			'orderby'                => 'ID',
			'order'                  => 'ASC',
			'no_found_rows'          => true,
			'update_post_meta_cache' => false,
			'update_post_term_cache' => false,
		)
	);

	foreach ( $posts as $post ) {
		if ( ! current_user_can( 'edit_post', $post->ID ) ) {
			continue;
		}

		gutenberg_collect_css_class_usages_from_blocks(
			parse_blocks( $post->post_content ),
			gutenberg_get_css_class_usage_post_entity( $post ),
			$usages
		);
	}

	$usages = array_merge( $usages, gutenberg_get_block_widget_css_class_usages() );
	$counts = array();

	foreach ( $usages as $usage ) {
		if ( ! isset( $counts[ $usage['className'] ] ) ) {
			$counts[ $usage['className'] ] = 0;
		}
		++$counts[ $usage['className'] ];
	}

	ksort( $counts );

	return array(
		'usages'     => $usages,
		'counts'     => $counts,
		'classNames' => array_keys( $counts ),
	);
}

/**
 * REST callback for CSS class usages.
 *
 * @return WP_REST_Response Usage response.
 */
function gutenberg_rest_get_css_class_usages(): WP_REST_Response {
	return rest_ensure_response( gutenberg_get_site_css_class_usage_data() );
}

/**
 * Checks whether the current user can read CSS class usage data.
 *
 * @return bool Whether the user can read usage data.
 */
function gutenberg_rest_can_read_css_class_usages(): bool {
	return current_user_can( 'edit_theme_options' );
}

/**
 * Registers CSS class usage REST routes.
 */
function gutenberg_register_css_class_usage_routes(): void {
	register_rest_route(
		'wp/v2',
		'/css-class-usages',
		array(
			'methods'             => WP_REST_Server::READABLE,
			'callback'            => 'gutenberg_rest_get_css_class_usages',
			'permission_callback' => 'gutenberg_rest_can_read_css_class_usages',
			'schema'              => array(
				'$schema'    => 'http://json-schema.org/draft-04/schema#',
				'title'      => 'css-class-usages',
				'type'       => 'object',
				'properties' => array(
					'usages'     => array(
						'type'  => 'array',
						'items' => array( 'type' => 'object' ),
					),
					'counts'     => array(
						'type'                 => 'object',
						'additionalProperties' => array( 'type' => 'integer' ),
					),
					'classNames' => array(
						'type'  => 'array',
						'items' => array( 'type' => 'string' ),
					),
				),
			),
		)
	);
}
add_action( 'rest_api_init', 'gutenberg_register_css_class_usage_routes' );
