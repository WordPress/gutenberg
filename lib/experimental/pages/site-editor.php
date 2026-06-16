<?php
/**
 * Site Editor Page - Integration file for admin menu registration.
 *
 * @package gutenberg
 */

/**
 * Register site editor admin page in WordPress admin menu.
 */
function gutenberg_register_site_editor_admin_page() {
	add_submenu_page(
		'nothing',
		__( 'Site Editor', 'gutenberg' ),
		__( 'Site Editor', 'gutenberg' ),
		'manage_options',
		'site-editor-v2',
		'gutenberg_site_editor_v2_render_page'
	);
}
add_action( 'admin_menu', 'gutenberg_register_site_editor_admin_page' );

/**
 * Get post types that should appear under the Content menu.
 *
 * @return WP_Post_Type[] Post type objects keyed by post type name.
 */
function gutenberg_site_editor_get_content_post_types() {
	$excluded_post_types = array(
		'attachment',
		'nav_menu_item',
		'page',
		'wp_block',
		'wp_font_face',
		'wp_font_family',
		'wp_global_styles',
		'wp_navigation',
		'wp_template',
		'wp_template_part',
	);

	$post_types = get_post_types(
		array(
			'public'       => true,
			'show_in_rest' => true,
			'show_ui'      => true,
		),
		'objects'
	);

	return array_filter(
		$post_types,
		function ( $post_type ) use ( $excluded_post_types ) {
			return ! in_array( $post_type->name, $excluded_post_types, true );
		}
	);
}

/**
 * Get an Extensible Site Editor edit route for a post.
 *
 * @param int $post_id Post ID.
 * @return string Edit route or empty string.
 */
function gutenberg_site_editor_get_post_edit_link( $post_id ) {
	$post = get_post( $post_id );
	if ( ! $post ) {
		return '';
	}

	$post_type_object = get_post_type_object( $post->post_type );
	if (
		! $post_type_object ||
		empty( $post_type_object->show_in_rest ) ||
		! current_user_can( 'edit_post', $post_id )
	) {
		return '';
	}

	return '/types/' . $post->post_type . '/edit/' . $post_id;
}

/**
 * Get an Extensible Site Editor edit route for a block template slug.
 *
 * @param string $slug Template slug.
 * @return string Edit route or empty string.
 */
function gutenberg_site_editor_get_template_edit_link( $slug ) {
	if ( ! current_user_can( 'edit_theme_options' ) ) {
		return '';
	}

	$template = get_block_template( get_stylesheet() . '//' . $slug, 'wp_template' );
	if ( ! $template || empty( $template->id ) ) {
		return '';
	}

	return '/types/wp_template/edit/' . rawurlencode( $template->id );
}

/**
 * Add preview-edit route arguments.
 *
 * @param string $edit_link Edit route.
 * @return string Edit route with preview-edit arguments.
 */
function gutenberg_site_editor_add_preview_edit_args( $edit_link ) {
	if ( '' === $edit_link ) {
		return '';
	}

	$separator = false === strpos( $edit_link, '?' ) ? '?' : '&';
	return $edit_link . $separator . 'skipStartPageOptions=true';
}

/**
 * Normalize a URL path for local route comparisons.
 *
 * @param string $url URL.
 * @return string Normalized path.
 */
function gutenberg_site_editor_normalize_url_path( $url ) {
	$parts = wp_parse_url( $url );
	$path  = isset( $parts['path'] ) ? $parts['path'] : '/';
	$path  = '/' . ltrim( $path, '/' );
	$path  = untrailingslashit( $path );

	return '' === $path ? '/' : $path;
}

/**
 * Get a normalized URL port for local URL comparisons.
 *
 * @param array $parts Parsed URL parts.
 * @return int|null URL port.
 */
function gutenberg_site_editor_get_url_port( $parts ) {
	if ( isset( $parts['port'] ) ) {
		return (int) $parts['port'];
	}

	if ( isset( $parts['scheme'] ) && 'https' === $parts['scheme'] ) {
		return 443;
	}

	if ( isset( $parts['scheme'] ) && 'http' === $parts['scheme'] ) {
		return 80;
	}

	return null;
}

/**
 * Determine whether a URL points at the current site.
 *
 * @param string $url URL.
 * @return bool Whether the URL is local.
 */
function gutenberg_site_editor_is_local_url( $url ) {
	$url_parts = wp_parse_url( $url );

	if ( empty( $url_parts['host'] ) ) {
		return true;
	}

	$home_parts = wp_parse_url( home_url( '/' ) );
	if ( empty( $home_parts['host'] ) ) {
		return false;
	}

	return strtolower( $url_parts['host'] ) === strtolower( $home_parts['host'] )
		&& gutenberg_site_editor_get_url_port( $url_parts ) === gutenberg_site_editor_get_url_port( $home_parts );
}

/**
 * Convert a local preview URL to an absolute URL.
 *
 * @param string $url URL.
 * @return string Absolute local URL or empty string.
 */
function gutenberg_site_editor_get_local_preview_url( $url ) {
	if ( '' === $url || ! gutenberg_site_editor_is_local_url( $url ) ) {
		return '';
	}

	if ( 0 === strpos( $url, '/' ) && 0 !== strpos( $url, '//' ) ) {
		return home_url( $url );
	}

	return $url;
}

/**
 * Get the best edit route for the site's front page.
 *
 * @return string Edit route or empty string.
 */
function gutenberg_site_editor_get_front_page_edit_link() {
	if ( 'page' === get_option( 'show_on_front' ) ) {
		$page_on_front = (int) get_option( 'page_on_front' );
		if ( $page_on_front ) {
			$edit_link = gutenberg_site_editor_get_post_edit_link( $page_on_front );
			if ( $edit_link ) {
				return $edit_link;
			}
		}
	}

	$edit_link = gutenberg_site_editor_get_template_edit_link( 'front-page' );
	if ( $edit_link ) {
		return $edit_link;
	}

	return gutenberg_site_editor_get_template_edit_link( 'home' );
}

/**
 * Get the best edit route for the current local preview URL.
 *
 * @param string $url Preview URL.
 * @return string Edit route or empty string.
 */
function gutenberg_site_editor_get_preview_edit_link( $url ) {
	$url = gutenberg_site_editor_get_local_preview_url( $url );
	if ( '' === $url ) {
		return '';
	}

	$post_id = url_to_postid( $url );
	if ( $post_id ) {
		return gutenberg_site_editor_add_preview_edit_args(
			gutenberg_site_editor_get_post_edit_link( $post_id )
		);
	}

	if (
		gutenberg_site_editor_normalize_url_path( $url ) ===
		gutenberg_site_editor_normalize_url_path( home_url( '/' ) )
	) {
		return gutenberg_site_editor_add_preview_edit_args(
			gutenberg_site_editor_get_front_page_edit_link()
		);
	}

	return '';
}

/**
 * Register the preview URL to edit route resolver.
 */
function gutenberg_site_editor_register_preview_link_endpoint() {
	register_rest_route(
		'gutenberg/v1',
		'/site-editor-preview-link',
		array(
			'methods'             => WP_REST_Server::READABLE,
			'callback'            => function ( $request ) {
				return rest_ensure_response(
					array(
						'editLink' => gutenberg_site_editor_get_preview_edit_link( $request['url'] ),
					)
				);
			},
			'permission_callback' => function () {
				return current_user_can( 'edit_posts' );
			},
			'args'                => array(
				'url' => array(
					'type'              => 'string',
					'required'          => true,
					'sanitize_callback' => 'esc_url_raw',
				),
			),
		)
	);
}
add_action( 'rest_api_init', 'gutenberg_site_editor_register_preview_link_endpoint' );

/**
 * Normalize template and post type text for conservative template-slot matching.
 *
 * @param string $value Text to normalize.
 * @return string Normalized text.
 */
function gutenberg_site_editor_normalize_template_match_text( $value ) {
	$value = strtolower( wp_strip_all_tags( (string) $value ) );
	$value = preg_replace( '/[_-]+/', ' ', $value );
	$value = preg_replace( '/[^a-z0-9]+/', ' ', $value );
	return trim( $value );
}

/**
 * Get normalized terms that can identify a post type in a template title/slug.
 *
 * @param WP_Post_Type $post_type Post type object.
 * @return string[] Terms.
 */
function gutenberg_site_editor_get_post_type_template_match_terms( $post_type ) {
	$candidates = array(
		$post_type->name,
		str_replace( array( '_', '-' ), ' ', $post_type->name ),
		$post_type->label,
		$post_type->labels->name ?? '',
		$post_type->labels->singular_name ?? '',
		$post_type->labels->menu_name ?? '',
	);
	$terms      = array();

	foreach ( $candidates as $candidate ) {
		$normalized_candidate = gutenberg_site_editor_normalize_template_match_text( $candidate );
		foreach ( preg_split( '/\s+/', $normalized_candidate ) as $term ) {
			if ( strlen( $term ) <= 2 ) {
				continue;
			}

			$terms[ $term ] = true;
			if ( strlen( $term ) > 3 && str_ends_with( $term, 's' ) ) {
				$terms[ substr( $term, 0, -1 ) ] = true;
			}
		}
	}

	return array_keys( $terms );
}

/**
 * Get the normalized text used to classify a template.
 *
 * @param array $template REST template response object.
 * @return string Normalized text.
 */
function gutenberg_site_editor_get_template_match_text( $template ) {
	$title = '';
	if ( isset( $template['title']['rendered'] ) ) {
		$title = $template['title']['rendered'];
	} elseif ( isset( $template['title'] ) && is_string( $template['title'] ) ) {
		$title = $template['title'];
	}

	return gutenberg_site_editor_normalize_template_match_text(
		implode(
			' ',
			array(
				$template['slug'] ?? '',
				$title,
				$template['description'] ?? '',
			)
		)
	);
}

/**
 * Determine whether normalized template text contains any of the supplied terms.
 *
 * @param string   $text Normalized template text.
 * @param string[] $terms Terms.
 * @return bool Whether the text contains any term.
 */
function gutenberg_site_editor_template_text_contains_any_term( $text, $terms ) {
	$text_terms = preg_split( '/\s+/', $text );

	foreach ( $terms as $term ) {
		if ( in_array( $term, $text_terms, true ) ) {
			return true;
		}
	}

	return false;
}

/**
 * Get template slots for a post type in the Content templates tab.
 *
 * @param WP_Post_Type $post_type Post type object.
 * @return array[] Slots.
 */
function gutenberg_site_editor_get_template_slots_for_post_type( $post_type ) {
	if ( 'page' === $post_type->name ) {
		return array();
	}

	$slots = array();

	if ( 'post' === $post_type->name ) {
		$slots[] = array(
			'kind'                  => 'archive',
			'canonical_slug'        => 'home',
			'active_fallback_slugs' => array(),
		);
		$slots[] = array(
			'kind'                  => 'single',
			'canonical_slug'        => 'single-post',
			'active_fallback_slugs' => array( 'single' ),
		);
		return $slots;
	}

	if ( $post_type->has_archive ) {
		$slots[] = array(
			'kind'                  => 'archive',
			'canonical_slug'        => 'archive-' . $post_type->name,
			'active_fallback_slugs' => array(),
		);
	}

	$slots[] = array(
		'kind'                  => 'single',
		'canonical_slug'        => 'single-' . $post_type->name,
		'active_fallback_slugs' => array(),
	);

	return $slots;
}

/**
 * Determine whether a template response represents a slot for the requested post type.
 *
 * @param array           $template  REST template response object.
 * @param array           $slot      Template slot.
 * @param WP_Post_Type    $post_type Requested post type object.
 * @param string|string[] $post_types Template post type support, if known.
 * @return bool Whether the template matches the slot.
 */
function gutenberg_site_editor_template_matches_slot( $template, $slot, $post_type, $post_types ) {
	$slug = $template['slug'] ?? '';
	if ( $slug === $slot['canonical_slug'] || in_array( $slug, $slot['active_fallback_slugs'], true ) ) {
		return true;
	}

	if ( is_string( $post_types ) ) {
		$post_types = array( $post_types );
	}

	$text              = gutenberg_site_editor_get_template_match_text( $template );
	$matches_slot      = 'archive' === $slot['kind']
		? gutenberg_site_editor_template_text_contains_any_term( $text, array( 'archive', 'listing', 'list' ) )
		: gutenberg_site_editor_template_text_contains_any_term( $text, array( 'single', 'detail', 'item' ) );
	$matches_post_type = gutenberg_site_editor_template_text_contains_any_term(
		$text,
		gutenberg_site_editor_get_post_type_template_match_terms( $post_type )
	);

	if ( is_array( $post_types ) && in_array( $post_type->name, $post_types, true ) ) {
		return $matches_slot;
	}

	// Plugin or alternate template namespaces sometimes save wp_template posts
	// without post type metadata. Only infer these when both the post type and
	// slot intent are present in the template label/slug/description.
	$is_external_template_namespace = ! empty( $template['theme'] ) && get_stylesheet() !== $template['theme'];

	return $is_external_template_namespace && $matches_post_type && $matches_slot;
}

/**
 * Register Content template context on wp_template responses.
 */
function gutenberg_site_editor_register_template_context_rest_field() {
	register_rest_field(
		'wp_template',
		'site_editor_template_context',
		array(
			'get_callback' => function ( $template, $field_name, $request ) {
				$post_type_name = $request['post_type'];
				if ( ! $post_type_name ) {
					return null;
				}

				$post_type = get_post_type_object( $post_type_name );
				if ( ! $post_type ) {
					return null;
				}

				$post_types = $template['post_types'] ?? ( $template['postTypes'] ?? null );
				foreach ( gutenberg_site_editor_get_template_slots_for_post_type( $post_type ) as $slot ) {
					if ( ! gutenberg_site_editor_template_matches_slot( $template, $slot, $post_type, $post_types ) ) {
						continue;
					}

					$slug = $template['slug'] ?? '';
					return array(
						'post_type'          => $post_type_name,
						'slot'               => $slot['kind'],
						'canonical_slug'     => $slot['canonical_slug'],
						'is_specific'        => $slug === $slot['canonical_slug'],
						'is_active_slot'     => true,
						'is_active_fallback' => in_array( $slug, $slot['active_fallback_slugs'], true ),
					);
				}

				return array(
					'post_type'          => $post_type_name,
					'slot'               => null,
					'canonical_slug'     => null,
					'is_specific'        => false,
					'is_active_slot'     => false,
					'is_active_fallback' => false,
				);
			},
			'schema'       => array(
				'description' => __( 'Content template context for the Extensible Site Editor.', 'gutenberg' ),
				'type'        => array( 'object', 'null' ),
				'context'     => array( 'view', 'edit' ),
				'readonly'    => true,
				'properties'  => array(
					'post_type'          => array(
						'type' => 'string',
					),
					'slot'               => array(
						'type' => array( 'string', 'null' ),
						'enum' => array( 'archive', 'single', null ),
					),
					'canonical_slug'     => array(
						'type' => array( 'string', 'null' ),
					),
					'is_specific'        => array(
						'type' => 'boolean',
					),
					'is_active_slot'     => array(
						'type' => 'boolean',
					),
					'is_active_fallback' => array(
						'type' => 'boolean',
					),
				),
			),
		)
	);
}
add_action( 'rest_api_init', 'gutenberg_site_editor_register_template_context_rest_field' );

/**
 * Register default menu items for the site editor page.
 */
function gutenberg_site_editor_register_default_menu_items() {
	$content_post_types      = gutenberg_site_editor_get_content_post_types();
	$content_post_type_names = array_keys( $content_post_types );
	$content_target          = ! empty( $content_post_type_names )
		? '/types/' . $content_post_type_names[0]
		: '/types/post';

	gutenberg_register_site_editor_v2_menu_item( 'home', __( 'Home', 'gutenberg' ), '/', '' );
	gutenberg_register_site_editor_v2_menu_item( 'pages', __( 'Pages', 'gutenberg' ), '/types/page', '' );
	gutenberg_register_site_editor_v2_menu_item( 'content', __( 'Content', 'gutenberg' ), $content_target, '', 'drilldown' );
	foreach ( $content_post_types as $post_type ) {
			gutenberg_register_site_editor_v2_menu_item(
				'content-' . $post_type->name,
				$post_type->labels->menu_name ? $post_type->labels->menu_name : $post_type->label,
				'/types/' . $post_type->name,
				'content'
			);
	}
	gutenberg_register_site_editor_v2_menu_item( 'navigation', __( 'Navigation Menus', 'gutenberg' ), '/navigation', '' );
	gutenberg_register_site_editor_v2_menu_item( 'design', __( 'Design', 'gutenberg' ), '/styles', '', 'drilldown' );
	gutenberg_register_site_editor_v2_menu_item( 'styles', __( 'Styles', 'gutenberg' ), '/styles', 'design' );
	gutenberg_register_site_editor_v2_menu_item( 'identity', __( 'Site Identity', 'gutenberg' ), '/identity', 'design' );
	gutenberg_register_site_editor_v2_menu_item( 'advanced', __( 'Advanced', 'gutenberg' ), '/patterns', '', 'drilldown' );
	gutenberg_register_site_editor_v2_menu_item( 'patterns', __( 'Patterns', 'gutenberg' ), '/patterns', 'advanced' );
	gutenberg_register_site_editor_v2_menu_item( 'templateParts', __( 'Template Parts', 'gutenberg' ), '/template-parts', 'advanced' );
	gutenberg_register_site_editor_v2_menu_item( 'templates', __( 'Templates', 'gutenberg' ), '/templates', 'advanced' );
}
add_action( 'site-editor-v2_init', 'gutenberg_site_editor_register_default_menu_items', 5 );

/**
 * Renders the admin bar on the site editor page.
 */
function gutenberg_site_editor_enable_admin_bar() {
	if ( ! is_admin_bar_showing() ) {
		return;
	}

	remove_action( 'admin_bar_menu', 'wp_admin_bar_sidebar_toggle', 0 );
	add_action( 'admin_footer-site-editor-v2', 'wp_admin_bar_render' );

	$admin_color = get_user_option( 'admin_color' );
	if ( empty( $admin_color ) ) {
		$admin_color = 'fresh';
	}
	$admin_color_class = 'admin-color-' . sanitize_html_class( $admin_color );

	add_action(
		'admin_footer-site-editor-v2',
		static function () use ( $admin_color_class ) {
			echo '<script>'
				. 'document.body.classList.add(' . wp_json_encode( $admin_color_class ) . ');'
				. '</script>';
		}
	);

	wp_enqueue_script( 'admin-bar' );
	wp_enqueue_style( 'admin-bar' );
	wp_enqueue_style( 'colors' );

	$css = <<<CSS
#wpadminbar {
	display: block;
}

#site-editor-v2-app {
	position: fixed;
	top: var(--wp-admin--admin-bar--height, 0);
	left: 0;
	right: 0;
	bottom: 0;
	height: calc(100vh - var(--wp-admin--admin-bar--height, 0)) !important;
}
CSS;

	wp_add_inline_style( 'admin-bar', $css );
}
add_action( 'site-editor-v2_init', 'gutenberg_site_editor_enable_admin_bar' );
