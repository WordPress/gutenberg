<?php
/**
 * Utilities shared by the Entity Actions and Entity Fields APIs.
 *
 * The functions are defined when core does not ship them.
 *
 * @package gutenberg
 */

if ( ! function_exists( '_wp_add_entity_preload_paths' ) ) {
	/**
	 * Adds the paths of an entity route for the post types the editors list.
	 *
	 * The post editor lists the post type of the edited post. The site editor
	 * lists that of the edited post, if any, and those of the screen it opens on.
	 * Post types that are not registered are skipped, and each post type is added
	 * once.
	 *
	 * @param mixed  $paths   REST API paths to preload.
	 * @param mixed  $context Block editor context.
	 * @param string $route   The entity route, such as `/wp/v2/entity-fields`.
	 * @return mixed The paths with one path per post type added. An empty value
	 *               that is not an array becomes an array. Any other value that
	 *               is not an array, or a context that is not a block editor
	 *               context, returns `$paths` unchanged.
	 */
	function _wp_add_entity_preload_paths( $paths, $context, $route ) {
		if ( empty( $paths ) && ! is_array( $paths ) ) {
			$paths = array();
		}

		if ( ! is_array( $paths ) || ! $context instanceof WP_Block_Editor_Context ) {
			return $paths;
		}

		$post_types = array();
		if ( 'core/edit-post' === $context->name && isset( $context->post ) ) {
			$post_types[] = $context->post->post_type;
		} elseif ( 'core/edit-site' === $context->name ) {
			if ( isset( $context->post ) ) {
				$post_types[] = $context->post->post_type;
			}

			/*
			 * Adds the post types the screen lists or edits, from the first
			 * segment of its `p` query arg. The screens are the routes in
			 * packages/edit-site/src/components/site-editor-routes.
			 * The patterns screen lists both patterns and template parts.
			 */
			$screen_post_types = array(
				'page'             => array( 'page' ),
				'template'         => array( 'wp_template' ),
				'wp_template'      => array( 'wp_template' ),
				'pattern'          => array( 'wp_block', 'wp_template_part' ),
				'wp_block'         => array( 'wp_block' ),
				'wp_template_part' => array( 'wp_template_part' ),
			);

			// phpcs:ignore WordPress.Security.NonceVerification.Recommended -- Only picks what to preload.
			$screen   = isset( $_GET['p'] ) && is_string( $_GET['p'] ) ? sanitize_text_field( wp_unslash( $_GET['p'] ) ) : '';
			$segments = explode( '/', trim( $screen, '/' ) );
			if ( isset( $screen_post_types[ $segments[0] ] ) ) {
				$post_types = array_merge( $post_types, $screen_post_types[ $segments[0] ] );
			}
		}

		foreach ( array_unique( $post_types ) as $post_type ) {
			if ( ! post_type_exists( $post_type ) ) {
				continue;
			}
			$paths[] = add_query_arg(
				array(
					'kind' => 'postType',
					'name' => $post_type,
				),
				$route
			);
		}

		return $paths;
	}
}
