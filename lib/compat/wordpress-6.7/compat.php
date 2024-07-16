<?php
/**
 * WordPress 6.7 compatibility functions.
 *
 * @package gutenberg
 */

/**
 * Hooks into `get_block_templates` so templates from the registry are also returned, as long as there
 * isn't a theme template with the same slug.
 *
 * @param WP_Block_Template[] $query_result Array of found block templates.
 * @param array               $query {
 *     Arguments to retrieve templates. All arguments are optional.
 *
 *     @type string[] $slug__in  List of slugs to include.
 *     @type int      $wp_id     Post ID of customized template.
 *     @type string   $area      A 'wp_template_part_area' taxonomy value to filter by (for 'wp_template_part' template type only).
 *     @type string   $post_type Post type to get the templates for.
 * }
 * @param string              $template_type wp_template or wp_template_part.
 * @return WP_Block_Template[] The same $query_result but might contain some additional templates from
 * the registry.
 */
function _gutenberg_add_block_templates_from_registry( $query_result, $query, $template_type ) {
	// Add `plugin` property to templates registered by a plugin.
	foreach ( $query_result as $key => $value ) {
		$registered_template = WP_Templates_Registry::get_instance()->get_by_slug( $query_result[ $key ]->slug );
		if ( $registered_template ) {
			$query_result[ $key ]->plugin = $registered_template->plugin;
		}
	}

	if ( ! isset( $query['wp_id'] ) ) {
		$template_files = _gutenberg_get_block_templates_files( $template_type, $query );

		/*
		 * Add templates registered in the template registry. Filtering out the ones which have a theme file.
		 */
		$registered_templates          = WP_Templates_Registry::get_instance()->get_by_query( $query );
		$matching_registered_templates = array_filter(
			$registered_templates,
			function ( $registered_template ) use ( $template_files ) {
				foreach ( $template_files as $template_file ) {
					if ( $template_file['slug'] === $registered_template->slug ) {
						return false;
					}
				}
				return true;
			}
		);
		$query_result                  = array_merge( $query_result, $matching_registered_templates );
	}

	return $query_result;
}
add_filter( 'get_block_templates', '_gutenberg_add_block_templates_from_registry', 10, 3 );

/**
 * Hooks into `get_block_template` to add the `plugin` property when necessary.
 *
 * @param [WP_Block_Template|null] $block_template The found block template, or null if there isn’t one.
 * @return [WP_Block_Template|null] The block template that was already found with the plugin property defined if it was reigstered by a plugin.
 */
function _gutenberg_add_block_template_plugin_attribute( $block_template ) {
	if ( $block_template ) {
		$registered_template = WP_Templates_Registry::get_instance()->get_by_slug( $block_template->slug );
		if ( $registered_template ) {
			$block_template->plugin = $registered_template->plugin;
		}
	}

	return $block_template;
}
add_filter( 'get_block_template', '_gutenberg_add_block_template_plugin_attribute', 10, 1 );

/**
 * Hooks into `get_block_file_template` so templates from the registry are also returned.
 *
 * @param WP_Block_Template|null $block_template The found block template, or null if there is none.
 * @param string                 $id             Template unique identifier (example: 'theme_slug//template_slug').
 * @return WP_Block_Template|null The block template that was already found or from the registry. In case the template was already found, add the necessary details from the registry.
 */
function _gutenberg_add_block_file_templates_from_registry( $block_template, $id ) {
	if ( $block_template ) {
		$registered_template = WP_Templates_Registry::get_instance()->get_by_slug( $block_template->slug );
		if ( $registered_template ) {
			$block_template->plugin = $registered_template->plugin;
		}
		return $block_template;
	}

	$parts = explode( '//', $id, 2 );

	if ( count( $parts ) < 2 ) {
		return $block_template;
	}

	list( , $slug ) = $parts;
	return WP_Templates_Registry::get_instance()->get_by_slug( $slug );
}
add_filter( 'get_block_file_template', '_gutenberg_add_block_file_templates_from_registry', 10, 2 );
