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
 * Replaces a CSS class token in a space-separated class attribute value.
 *
 * @param string $class_names CSS class attribute value.
 * @param string $old_name    Class name to replace.
 * @param string $new_name    Replacement class name.
 * @return string Updated CSS class attribute value.
 */
function gutenberg_replace_css_class_token( string $class_names, string $old_name, string $new_name ): string {
	$old_name = gutenberg_normalize_managed_css_class_name( $old_name );
	$new_name = gutenberg_normalize_managed_css_class_name( $new_name );
	$tokens   = preg_split( '/\s+/', trim( $class_names ), -1, PREG_SPLIT_NO_EMPTY );

	if ( ! $tokens ) {
		return $class_names;
	}

	$next_tokens = array();
	foreach ( $tokens as $token ) {
		$next_token = gutenberg_normalize_managed_css_class_name( $token ) === $old_name ? $new_name : $token;

		if ( '' !== $next_token && ! in_array( $next_token, $next_tokens, true ) ) {
			$next_tokens[] = $next_token;
		}
	}

	return implode( ' ', $next_tokens );
}

/**
 * Replaces a CSS class token in serialized block HTML.
 *
 * @param string $html     Serialized block HTML.
 * @param string $old_name Class name to replace.
 * @param string $new_name Replacement class name.
 * @return string Updated HTML.
 */
function gutenberg_replace_css_class_token_in_html( string $html, string $old_name, string $new_name ): string {
	if ( false === strpos( $html, $old_name ) ) {
		return $html;
	}

	if ( class_exists( 'WP_HTML_Tag_Processor' ) ) {
		$processor = new WP_HTML_Tag_Processor( $html );

		while ( $processor->next_tag() ) {
			$class_names = $processor->get_attribute( 'class' );
			if ( is_string( $class_names ) ) {
				$updated_class_names = gutenberg_replace_css_class_token( $class_names, $old_name, $new_name );

				if ( $updated_class_names !== $class_names ) {
					$processor->set_attribute( 'class', $updated_class_names );
				}
			}
		}

		return $processor->get_updated_html();
	}

	return preg_replace_callback(
		'/\sclass=(["\'])(.*?)\1/s',
		static function ( array $matches ) use ( $old_name, $new_name ): string {
			return ' class=' . $matches[1] . gutenberg_replace_css_class_token( $matches[2], $old_name, $new_name ) . $matches[1];
		},
		$html
	);
}

/**
 * Replaces a CSS class token in a parsed block tree.
 *
 * @param array  $blocks        Parsed blocks.
 * @param string $old_name      Class name to replace.
 * @param string $new_name      Replacement class name.
 * @param int    $updated_count Number of updated block attributes.
 * @return array Updated parsed blocks.
 */
function gutenberg_replace_css_class_token_in_blocks( array $blocks, string $old_name, string $new_name, int &$updated_count = 0 ): array {
	foreach ( $blocks as &$block ) {
		if ( isset( $block['attrs']['className'] ) && is_string( $block['attrs']['className'] ) ) {
			$updated_class_names = gutenberg_replace_css_class_token( $block['attrs']['className'], $old_name, $new_name );
			if ( $updated_class_names !== $block['attrs']['className'] ) {
				$block['attrs']['className'] = $updated_class_names;
				++$updated_count;
			}
		}

		if ( isset( $block['innerHTML'] ) && is_string( $block['innerHTML'] ) ) {
			$block['innerHTML'] = gutenberg_replace_css_class_token_in_html( $block['innerHTML'], $old_name, $new_name );
		}

		if ( isset( $block['innerContent'] ) && is_array( $block['innerContent'] ) ) {
			$block['innerContent'] = array_map(
				static function ( $chunk ) use ( $old_name, $new_name ) {
					return is_string( $chunk ) ? gutenberg_replace_css_class_token_in_html( $chunk, $old_name, $new_name ) : $chunk;
				},
				$block['innerContent']
			);
		}

		if ( ! empty( $block['innerBlocks'] ) && is_array( $block['innerBlocks'] ) ) {
			$block['innerBlocks'] = gutenberg_replace_css_class_token_in_blocks( $block['innerBlocks'], $old_name, $new_name, $updated_count );
		}
	}

	return $blocks;
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
 * Renames a CSS class token in block widgets.
 *
 * @param string $old_name Class name to replace.
 * @param string $new_name Replacement class name.
 * @return int Number of updated block attributes.
 */
function gutenberg_rename_css_class_in_block_widgets( string $old_name, string $new_name ): int {
	$widgets       = get_option( 'widget_block', array() );
	$updated_count = 0;
	$has_updates   = false;

	if ( ! is_array( $widgets ) ) {
		return 0;
	}

	foreach ( $widgets as &$widget ) {
		if ( empty( $widget['content'] ) || ! is_string( $widget['content'] ) ) {
			continue;
		}

		$widget_updated_count = 0;
		$blocks               = gutenberg_replace_css_class_token_in_blocks(
			parse_blocks( $widget['content'] ),
			$old_name,
			$new_name,
			$widget_updated_count
		);

		if ( $widget_updated_count > 0 ) {
			$widget['content'] = serialize_blocks( $blocks );
			$updated_count    += $widget_updated_count;
			$has_updates       = true;
		}
	}

	if ( $has_updates ) {
		update_option( 'widget_block', $widgets );
	}

	return $updated_count;
}

/**
 * Renames a CSS class token across block-bearing site content.
 *
 * @param string $old_name Class name to replace.
 * @param string $new_name Replacement class name.
 * @return array Usage data after the rename.
 */
function gutenberg_rename_site_css_class_usages( string $old_name, string $new_name ): array {
	$posts = get_posts(
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

		$post_updated_count = 0;
		$blocks             = gutenberg_replace_css_class_token_in_blocks(
			parse_blocks( $post->post_content ),
			$old_name,
			$new_name,
			$post_updated_count
		);

		if ( $post_updated_count > 0 ) {
			wp_update_post(
				wp_slash(
					array(
						'ID'           => $post->ID,
						'post_content' => serialize_blocks( $blocks ),
					)
				)
			);
		}
	}

	gutenberg_rename_css_class_in_block_widgets( $old_name, $new_name );

	return gutenberg_get_site_css_class_usage_data();
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
		'usages'              => $usages,
		'counts'              => $counts,
		'classNames'          => array_keys( $counts ),
		'canManageCssClasses' => current_user_can( 'manage_options' ),
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
 * REST callback for renaming CSS class usages.
 *
 * @param WP_REST_Request $request REST request.
 * @return WP_REST_Response|WP_Error Usage response after the rename.
 */
function gutenberg_rest_rename_css_class_usages( WP_REST_Request $request ) {
	$old_name = gutenberg_normalize_managed_css_class_name( (string) $request['class_name'] );
	$new_name = gutenberg_normalize_managed_css_class_name( (string) $request['newName'] );

	if ( ! gutenberg_is_valid_managed_css_class_name( $old_name ) || ! gutenberg_is_valid_managed_css_class_name( $new_name ) ) {
		return new WP_Error(
			'rest_invalid_css_class_name',
			__( 'CSS class names must start with a letter, hyphen, or underscore and contain only letters, numbers, hyphens, or underscores.', 'gutenberg' ),
			array( 'status' => 400 )
		);
	}

	if ( $old_name === $new_name ) {
		return rest_ensure_response( gutenberg_get_site_css_class_usage_data() );
	}

	return rest_ensure_response( gutenberg_rename_site_css_class_usages( $old_name, $new_name ) );
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
 * Checks whether the current user can mutate CSS class usage data.
 *
 * @return bool Whether the user can mutate usage data.
 */
function gutenberg_rest_can_manage_css_class_usages(): bool {
	return current_user_can( 'manage_options' );
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
					'usages'              => array(
						'type'  => 'array',
						'items' => array( 'type' => 'object' ),
					),
					'counts'              => array(
						'type'                 => 'object',
						'additionalProperties' => array( 'type' => 'integer' ),
					),
					'classNames'          => array(
						'type'  => 'array',
						'items' => array( 'type' => 'string' ),
					),
					'canManageCssClasses' => array(
						'type' => 'boolean',
					),
				),
			),
		)
	);
	register_rest_route(
		'wp/v2',
		'/css-class-usages/(?P<class_name>[\w-]+)/rename',
		array(
			'methods'             => WP_REST_Server::CREATABLE,
			'callback'            => 'gutenberg_rest_rename_css_class_usages',
			'permission_callback' => 'gutenberg_rest_can_manage_css_class_usages',
			'args'                => array(
				'class_name' => array(
					'type'              => 'string',
					'required'          => true,
					'sanitize_callback' => 'gutenberg_normalize_managed_css_class_name',
				),
				'newName'    => array(
					'type'              => 'string',
					'required'          => true,
					'sanitize_callback' => 'gutenberg_normalize_managed_css_class_name',
				),
			),
		)
	);
}
add_action( 'rest_api_init', 'gutenberg_register_css_class_usage_routes' );
