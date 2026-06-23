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
 * Get the page the Site Editor prototype should use as the static homepage.
 *
 * This is prototype bootstrap behavior for the Extensible Site Editor. WordPress
 * core still defaults new installs to latest posts, but the prototype assumes a
 * static front page so that the Homepage route, preview toolbar, and homepage
 * configuration flow all start from the same predictable state.
 *
 * The helper is intentionally idempotent: it reuses an existing page named Home
 * where possible, publishes it if needed, and only creates a page when none can
 * be found. It does not touch page_for_posts because the prototype only needs a
 * stable static front page baseline.
 *
 * @return int Home page ID, or 0 if the page could not be found or created.
 */
function gutenberg_site_editor_get_or_create_home_page() {
	$home_page = get_page_by_path( 'home', OBJECT, 'page' );

	if ( ! $home_page ) {
		$home_pages = get_posts(
			array(
				'fields'         => 'ids',
				'order'          => 'ASC',
				'orderby'        => 'ID',
				'post_status'    => 'any',
				'post_type'      => 'page',
				'posts_per_page' => 1,
				'title'          => 'Home',
			)
		);

		if ( ! empty( $home_pages ) ) {
			$home_page = get_post( (int) $home_pages[0] );
		}
	}

	if ( $home_page ) {
		if ( 'publish' !== $home_page->post_status ) {
			wp_update_post(
				array(
					'ID'          => $home_page->ID,
					'post_status' => 'publish',
				)
			);
		}

		return (int) $home_page->ID;
	}

	$home_page_id = wp_insert_post(
		array(
			'post_name'    => 'home',
			'post_status'  => 'publish',
			'post_title'   => 'Home',
			'post_type'    => 'page',
			'post_content' => '',
		),
		true
	);

	if ( is_wp_error( $home_page_id ) ) {
		return 0;
	}

	return (int) $home_page_id;
}

/**
 * Ensure the Site Editor prototype starts with a static Home page.
 *
 * This runs on the Site Editor v2 boot hook rather than during general
 * WordPress initialization. That keeps the prototype-specific default scoped to
 * the prototype while still running early enough for preloaded settings and
 * route rendering to see the configured static front page.
 */
function gutenberg_site_editor_ensure_static_home_page() {
	$home_page_id = gutenberg_site_editor_get_or_create_home_page();

	if ( ! $home_page_id ) {
		return;
	}

	if ( 'page' !== get_option( 'show_on_front' ) ) {
		update_option( 'show_on_front', 'page' );
	}

	if ( $home_page_id !== (int) get_option( 'page_on_front' ) ) {
		update_option( 'page_on_front', $home_page_id );
	}
}
add_action( 'site-editor-v2_init', 'gutenberg_site_editor_ensure_static_home_page', 1 );

/**
 * Check whether the prototype already has an editable Navigation menu.
 *
 * @return bool Whether a published or draft wp_navigation post exists.
 */
function gutenberg_site_editor_has_navigation_menu() {
	$navigation_menus = get_posts(
		array(
			'fields'         => 'ids',
			'no_found_rows'  => true,
			'post_status'    => array( 'publish', 'draft' ),
			'post_type'      => 'wp_navigation',
			'posts_per_page' => 1,
		)
	);

	return ! empty( $navigation_menus );
}

/**
 * Ensure the Site Editor prototype starts with a standard Navigation menu.
 *
 * The Navigation block already has a server-side fallback system which can
 * create or select a sensible wp_navigation post. This prototype wants that
 * fallback to exist as an editable menu before users reach Navigation Menus, so
 * the route is never an unexplained blank list after a clean wp-env reset.
 *
 * If Core's fallback class is unavailable or does not create a persistent menu,
 * fall back to a small Page List based menu. The Page List block is intentional:
 * it mirrors the default Navigation fallback and stays useful as pages are
 * created during prototype testing.
 */
function gutenberg_site_editor_ensure_default_navigation_menu() {
	if ( gutenberg_site_editor_has_navigation_menu() ) {
		return;
	}

	if ( class_exists( 'WP_Navigation_Fallback' ) && method_exists( 'WP_Navigation_Fallback', 'get_fallback' ) ) {
		$fallback_navigation = WP_Navigation_Fallback::get_fallback();

		if (
			$fallback_navigation instanceof WP_Post &&
			'wp_navigation' === $fallback_navigation->post_type
		) {
			return;
		}
	}

	if ( gutenberg_site_editor_has_navigation_menu() ) {
		return;
	}

	wp_insert_post(
		array(
			'post_content' => '<!-- wp:page-list /-->',
			'post_name'    => 'main-menu',
			'post_status'  => 'publish',
			'post_title'   => __( 'Main menu', 'gutenberg' ),
			'post_type'    => 'wp_navigation',
		)
	);
}
add_action( 'site-editor-v2_init', 'gutenberg_site_editor_ensure_default_navigation_menu', 2 );

/**
 * Check whether the current wp-admin request is embedded as a Site Editor
 * compatibility bridge.
 *
 * @return bool Whether the current request is an embedded admin bridge request.
 */
function gutenberg_site_editor_is_admin_bridge_request() {
	return is_admin() &&
		isset( $_GET['gutenberg_site_editor_admin_bridge'] ) &&
		'1' === sanitize_text_field( wp_unslash( $_GET['gutenberg_site_editor_admin_bridge'] ) );
}

if ( gutenberg_site_editor_is_admin_bridge_request() && ! defined( 'IFRAME_REQUEST' ) ) {
	define( 'IFRAME_REQUEST', true );
}

/**
 * Force the classic wp-admin editor inside the Site Editor admin bridge.
 *
 * @param bool   $use_block_editor Whether the post type should use the block editor.
 * @param string $post_type        Post type name.
 * @return bool Whether the post type should use the block editor.
 */
function gutenberg_site_editor_admin_bridge_use_block_editor_for_post_type( $use_block_editor, $post_type ) {
	if ( ! gutenberg_site_editor_is_admin_bridge_request() ) {
		return $use_block_editor;
	}

	if ( in_array( $post_type, array( 'post', 'page' ), true ) ) {
		return $use_block_editor;
	}

	return false;
}
add_filter( 'use_block_editor_for_post_type', 'gutenberg_site_editor_admin_bridge_use_block_editor_for_post_type', 100, 2 );

/**
 * Force the classic wp-admin editor for existing CPT posts inside the Site
 * Editor admin bridge. This keeps wp-admin redirects after save in the same
 * compatibility mode.
 *
 * @param bool    $use_block_editor Whether the post should use the block editor.
 * @param WP_Post $post             Post object.
 * @return bool Whether the post should use the block editor.
 */
function gutenberg_site_editor_admin_bridge_use_block_editor_for_post( $use_block_editor, $post ) {
	if ( ! gutenberg_site_editor_is_admin_bridge_request() ) {
		return $use_block_editor;
	}

	if ( ! $post || in_array( $post->post_type, array( 'post', 'page' ), true ) ) {
		return $use_block_editor;
	}

	return false;
}
add_filter( 'use_block_editor_for_post', 'gutenberg_site_editor_admin_bridge_use_block_editor_for_post', 100, 2 );

/**
 * Hide the "Screen Options" tab inside the embedded wp-admin bridge.
 *
 * The bridge already provides its own Site Editor toolbar and back navigation.
 * Classic wp-admin's Screen Options control belongs to the full wp-admin shell,
 * so showing it inside an iframe makes the embedded edit screen feel like a
 * nested admin page rather than a compatibility surface. This filter is scoped
 * to requests carrying the bridge query arg, so normal wp-admin screens keep
 * their Screen Options UI.
 *
 * @param bool $show_screen Whether to show Screen Options.
 * @return bool Whether to show Screen Options.
 */
function gutenberg_site_editor_admin_bridge_show_screen_options( $show_screen ) {
	if ( ! gutenberg_site_editor_is_admin_bridge_request() ) {
		return $show_screen;
	}

	return false;
}
add_filter( 'screen_options_show_screen', 'gutenberg_site_editor_admin_bridge_show_screen_options' );

/**
 * Add a body class to wp-admin screens embedded by the Site Editor bridge.
 *
 * @param string $classes Space-separated body classes.
 * @return string Body classes.
 */
function gutenberg_site_editor_admin_bridge_body_class( $classes ) {
	if ( ! gutenberg_site_editor_is_admin_bridge_request() ) {
		return $classes;
	}

	return $classes . ' gutenberg-site-editor-admin-bridge';
}
add_filter( 'admin_body_class', 'gutenberg_site_editor_admin_bridge_body_class' );

/**
 * Hide wp-admin chrome that duplicates the Site Editor shell in the bridge.
 *
 * This CSS is intentionally bridge-only. The iframe is a compatibility escape
 * hatch for post types whose creation/editing UI depends on long-standing
 * wp-admin hooks and meta boxes. In that context, the Site Editor is already
 * providing the outer navigation, header, and back button, so duplicated
 * wp-admin chrome creates a confusing "admin inside admin" experience.
 *
 * We keep plugin/admin notices visible because they can contain important
 * contextual information about the embedded editor screen. The selectors below
 * only hide structural chrome: the wp-admin menu, screen-meta controls, and the
 * classic edit screen heading/action row.
 */
function gutenberg_site_editor_admin_bridge_enqueue_styles() {
	if ( ! gutenberg_site_editor_is_admin_bridge_request() ) {
		return;
	}

	$css = '
		/*
		 * The full wp-admin menu is redundant inside the Site Editor iframe.
		 * The Site Editor sidebar remains the source of navigation.
		 */
		body.gutenberg-site-editor-admin-bridge #adminmenumain,
		body.gutenberg-site-editor-admin-bridge #adminmenuback,
		body.gutenberg-site-editor-admin-bridge #adminmenuwrap {
			display: none !important;
		}

		/*
		 * Screen meta links include "Screen Options" and "Help". Screen Options
		 * is also disabled via PHP, but the CSS keeps third-party screen-meta
		 * output from leaving an empty control strip in the iframe.
		 */
		body.gutenberg-site-editor-admin-bridge #screen-meta,
		body.gutenberg-site-editor-admin-bridge #screen-meta-links {
			display: none !important;
		}

		/*
		 * Classic edit screens render their own page heading row, such as
		 * "Edit Event" plus an "Add New" action. The outer bridge toolbar already
		 * labels the current collection and provides the back control, so this row
		 * duplicates context and pushes the actual editing form down the iframe.
		 */
		body.gutenberg-site-editor-admin-bridge.post-php #wpbody-content > .wrap > h1:first-child,
		body.gutenberg-site-editor-admin-bridge.post-new-php #wpbody-content > .wrap > h1:first-child {
			display: none;
		}

		/*
		 * Removing the heading leaves wp-admin default top spacing feeling too
		 * large. Reduce only the embedded edit screen spacing; notices and the
		 * edit form remain visible.
		 */
		body.gutenberg-site-editor-admin-bridge.post-php #wpbody-content > .wrap,
		body.gutenberg-site-editor-admin-bridge.post-new-php #wpbody-content > .wrap {
			margin-top: 20px;
		}

		/*
		 * With the wp-admin menu hidden, reset the content/footer offset that
		 * normally reserves space for that menu.
		 */
		body.gutenberg-site-editor-admin-bridge #wpcontent,
		body.gutenberg-site-editor-admin-bridge.auto-fold #wpcontent,
		body.gutenberg-site-editor-admin-bridge.auto-fold #wpfooter {
			margin-left: 0 !important;
		}

		/*
		 * Restore a modest left inset so the embedded edit form does not sit
		 * flush against the iframe edge after the menu margin is removed.
		 */
		body.gutenberg-site-editor-admin-bridge #wpcontent,
		body.gutenberg-site-editor-admin-bridge.auto-fold #wpcontent {
			padding-left: 20px;
		}

		body.gutenberg-site-editor-admin-bridge #wpfooter,
		body.gutenberg-site-editor-admin-bridge.auto-fold #wpfooter {
			margin-left: 0 !important;
		}

		@media screen and (max-width: 782px) {
			body.gutenberg-site-editor-admin-bridge.auto-fold #wpcontent,
			body.gutenberg-site-editor-admin-bridge.auto-fold #wpfooter {
				margin-left: 0 !important;
			}

			body.gutenberg-site-editor-admin-bridge #wpcontent,
			body.gutenberg-site-editor-admin-bridge.auto-fold #wpcontent {
				padding-left: 10px;
			}
		}
	';

	wp_register_style( 'gutenberg-site-editor-admin-bridge', false );
	wp_enqueue_style( 'gutenberg-site-editor-admin-bridge' );
	wp_add_inline_style( 'gutenberg-site-editor-admin-bridge', $css );
}
add_action( 'admin_enqueue_scripts', 'gutenberg_site_editor_admin_bridge_enqueue_styles' );

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
 * Get a post status label for preview context.
 *
 * @param WP_Post $post Post object.
 * @return string Post status label.
 */
function gutenberg_site_editor_get_preview_post_status_label( $post ) {
	$status = get_post_status_object( $post->post_status );
	if ( $status && ! empty( $status->label ) ) {
		return $status->label;
	}

	return __( 'Preview', 'gutenberg' );
}

/**
 * Get a stable status label for synthetic preview states.
 *
 * Some preview contexts, such as the generated homepage or taxonomy archives,
 * do not have a real post status object. The canvas status dot still needs a
 * status-like hover label rather than contextual labels like "Homepage" or
 * "Category".
 *
 * @param string $status Preview status slug.
 * @return string Preview status label.
 */
function gutenberg_site_editor_get_preview_status_label( $status ) {
	switch ( $status ) {
		case 'homepage':
		case 'publish':
			return __( 'Published', 'gutenberg' );
		case 'future':
			return __( 'Scheduled', 'gutenberg' );
		case 'draft':
		case 'auto-draft':
			return __( 'Draft', 'gutenberg' );
		case 'pending':
			return __( 'Pending review', 'gutenberg' );
		case 'private':
			return __( 'Private', 'gutenberg' );
		case 'trash':
			return __( 'Trash', 'gutenberg' );
		case 'archive':
			return __( 'Archive', 'gutenberg' );
		default:
			return __( 'Preview', 'gutenberg' );
	}
}

/**
 * Get preview context for a post.
 *
 * @param int    $post_id Post ID.
 * @param string $preview_type Optional preview type.
 * @param string $status_label Optional status label override.
 * @param string $status Optional status slug override.
 * @return array Preview context.
 */
function gutenberg_site_editor_get_post_preview_context(
	$post_id,
	$preview_type = '',
	$status_label = '',
	$status = ''
) {
	$post = get_post( $post_id );
	if ( ! $post ) {
		return array();
	}

	$post_type = get_post_type_object( $post->post_type );
	$title     = get_the_title( $post );
	if ( '' === $title ) {
		$title = $post_type ? $post_type->labels->singular_name : __( 'Untitled', 'gutenberg' );
	}

	$edit_link = gutenberg_site_editor_add_preview_edit_args(
		gutenberg_site_editor_get_post_edit_link( $post_id )
	);

	return array(
		'editLink'           => $edit_link,
		'previewLabel'       => $title,
		'previewStatus'      => $status ? $status : $post->post_status,
		'previewStatusLabel' => $status_label ? $status_label : gutenberg_site_editor_get_preview_post_status_label( $post ),
		'previewType'        => $preview_type ? $preview_type : $post->post_type,
		'previewEditLabel'   => 'page' === $post->post_type ? __( 'Edit page', 'gutenberg' ) : __( 'Edit', 'gutenberg' ),
		'previewCanEdit'     => '' !== $edit_link,
	);
}

/**
 * Determine whether a title is effectively just "Home".
 *
 * @param string $title Page title.
 * @return bool Whether the title is a home-equivalent title.
 */
function gutenberg_site_editor_is_home_equivalent_title( $title ) {
	$normalized_title = strtolower(
		html_entity_decode(
			wp_strip_all_tags( (string) $title ),
			ENT_QUOTES,
			get_bloginfo( 'charset' )
		)
	);
	$normalized_title = preg_replace( '/[^a-z0-9]+/', '', $normalized_title );

	return in_array(
		$normalized_title,
		array( 'home', 'homepage', 'frontpage' ),
		true
	);
}

/**
 * Get preview context for a static page used as the site's front page.
 *
 * @param int $post_id Front page post ID.
 * @return array Preview context.
 */
function gutenberg_site_editor_get_static_front_page_preview_context( $post_id ) {
	$context = gutenberg_site_editor_get_post_preview_context(
		$post_id,
		'home',
		gutenberg_site_editor_get_preview_status_label( 'homepage' ),
		'homepage'
	);
	if ( empty( $context ) ) {
		return array();
	}

	$page_title = get_the_title( $post_id );
	if ( '' === $page_title ) {
		$page_title = __( 'Untitled', 'gutenberg' );
	}

	$context['previewLabel'] = gutenberg_site_editor_is_home_equivalent_title( $page_title )
		? __( 'Home', 'gutenberg' )
		: sprintf(
			/* translators: %s: The title of the static page used as the homepage. */
			__( 'Home (%s)', 'gutenberg' ),
			$page_title
		);

	return $context;
}

/**
 * Get preview context for the site's front page.
 *
 * @return array Preview context.
 */
function gutenberg_site_editor_get_front_page_preview_context() {
	if ( 'page' === get_option( 'show_on_front' ) ) {
		$page_on_front = (int) get_option( 'page_on_front' );
		if ( $page_on_front ) {
			return gutenberg_site_editor_get_static_front_page_preview_context( $page_on_front );
		}
	}

	$edit_link = gutenberg_site_editor_get_front_page_edit_link();
	$edit_link = gutenberg_site_editor_add_preview_edit_args( $edit_link );

	return array(
		'editLink'           => $edit_link,
		'previewLabel'       => __( 'Home', 'gutenberg' ),
		'previewStatus'      => 'homepage',
		'previewStatusLabel' => gutenberg_site_editor_get_preview_status_label( 'homepage' ),
		'previewType'        => 'template',
		'previewEditLabel'   => __( 'Edit template', 'gutenberg' ),
		'previewCanEdit'     => '' !== $edit_link,
		'previewTone'        => 'global',
	);
}

/**
 * Get preview context for a taxonomy term archive URL.
 *
 * @param string $url Preview URL.
 * @return array Preview context.
 */
function gutenberg_site_editor_get_term_preview_context( $url ) {
	$taxonomies = get_taxonomies( array( 'public' => true ) );
	if ( empty( $taxonomies ) ) {
		return array();
	}

	$terms = get_terms(
		array(
			'taxonomy'   => array_values( $taxonomies ),
			'hide_empty' => false,
		)
	);
	if ( is_wp_error( $terms ) || empty( $terms ) ) {
		return array();
	}

	$normalized_url = gutenberg_site_editor_normalize_url_path( $url );
	$matched_term   = null;
	foreach ( $terms as $term ) {
		$term_link = get_term_link( $term );
		if ( is_wp_error( $term_link ) ) {
			continue;
		}

		if (
			gutenberg_site_editor_normalize_url_path( $term_link ) ===
			$normalized_url
		) {
			$matched_term = $term;
			break;
		}
	}

	if ( ! $matched_term ) {
		return array();
	}

	$preview_type = 'archive';
	if ( 'category' === $matched_term->taxonomy ) {
		$preview_type = 'category';
	} elseif ( 'post_tag' === $matched_term->taxonomy ) {
		$preview_type = 'tag';
	}

	return array(
		'editLink'           => '',
		'previewLabel'       => $matched_term->name,
		'previewStatus'      => 'archive',
		'previewStatusLabel' => gutenberg_site_editor_get_preview_status_label( 'archive' ),
		'previewType'        => $preview_type,
		'previewEditLabel'   => __( 'Edit', 'gutenberg' ),
		'previewCanEdit'     => false,
	);
}

/**
 * Get preview context for the current local preview URL.
 *
 * @param string $url Preview URL.
 * @return array Preview context.
 */
function gutenberg_site_editor_get_preview_context( $url ) {
	$url = remove_query_arg( 'site-editor-preview', $url );
	$url = gutenberg_site_editor_get_local_preview_url( $url );
	if ( '' === $url ) {
		return array();
	}

	if (
		gutenberg_site_editor_normalize_url_path( $url ) ===
		gutenberg_site_editor_normalize_url_path( home_url( '/' ) )
	) {
		return gutenberg_site_editor_get_front_page_preview_context();
	}

	$post_id = url_to_postid( $url );
	if ( $post_id ) {
		$page_on_front = (int) get_option( 'page_on_front' );
		if (
			'page' === get_option( 'show_on_front' ) &&
			$page_on_front &&
			$post_id === $page_on_front
		) {
			return gutenberg_site_editor_get_static_front_page_preview_context( $post_id );
		}

		return gutenberg_site_editor_get_post_preview_context( $post_id );
	}

	$term_context = gutenberg_site_editor_get_term_preview_context( $url );
	if ( ! empty( $term_context ) ) {
		return $term_context;
	}

	$edit_link = gutenberg_site_editor_get_preview_edit_link( $url );

	return array(
		'editLink'           => $edit_link,
		'previewLabel'       => __( 'Site preview', 'gutenberg' ),
		'previewStatus'      => 'preview',
		'previewStatusLabel' => __( 'Preview', 'gutenberg' ),
		'previewType'        => 'preview',
		'previewEditLabel'   => __( 'Edit', 'gutenberg' ),
		'previewCanEdit'     => '' !== $edit_link,
	);
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
					gutenberg_site_editor_get_preview_context( $request['url'] )
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
 * Hide the WordPress admin bar inside Extensible Site Editor preview iframes.
 *
 * @param bool $show_admin_bar Whether to show the admin bar.
 * @return bool Whether to show the admin bar.
 */
function gutenberg_site_editor_hide_admin_bar_in_preview( $show_admin_bar ) {
	if ( is_admin() ) {
		return $show_admin_bar;
	}

	$is_preview = '1' === filter_input(
		INPUT_GET,
		'site-editor-preview',
		FILTER_SANITIZE_FULL_SPECIAL_CHARS
	);
	if ( ! $is_preview ) {
		return $show_admin_bar;
	}

	return false;
}
add_filter( 'show_admin_bar', 'gutenberg_site_editor_hide_admin_bar_in_preview', PHP_INT_MAX );

/**
 * Fill blank core post type descriptions for the Extensible Site Editor.
 *
 * Core registers the built-in `post` and `page` post types with an empty
 * `description` argument. The content routes use the REST/Core Data post type
 * record as the single source of truth for their page subtitle, so this filter
 * gives those built-in types the same REST shape that custom post types get
 * when they provide a `description` during `register_post_type()`.
 *
 * The filter only fills blank values and only when the `description` field is
 * present in the response, so custom/plugin-provided descriptions and `_fields`
 * filtering remain respected.
 *
 * @param WP_REST_Response $response  The REST response.
 * @param WP_Post_Type     $post_type The original post type object.
 * @return WP_REST_Response The filtered REST response.
 */
function gutenberg_site_editor_add_builtin_post_type_descriptions( $response, $post_type ) {
	if ( ! $response instanceof WP_REST_Response || ! $post_type instanceof WP_Post_Type ) {
		return $response;
	}

	$descriptions = array(
		'post' => __( 'Write posts and control how posts appear on the site.', 'gutenberg' ),
		'page' => __( 'Create pages and control how pages appear on the site.', 'gutenberg' ),
	);

	if ( ! isset( $descriptions[ $post_type->name ] ) ) {
		return $response;
	}

	$data = $response->get_data();
	if ( ! is_array( $data ) || ! array_key_exists( 'description', $data ) || '' !== $data['description'] ) {
		return $response;
	}

	$data['description'] = $descriptions[ $post_type->name ];
	$response->set_data( $data );

	return $response;
}
add_filter( 'rest_prepare_post_type', 'gutenberg_site_editor_add_builtin_post_type_descriptions', 10, 2 );

/**
 * Add the resolved archive URL to REST post type records for Navigation editing.
 *
 * Navigation links for post type archives need the final URL generated by
 * WordPress, because CPTs can use custom rewrite slugs and `has_archive` can be
 * configured as either a boolean or a custom string. Computing the URL in React
 * would duplicate permalink logic and fail for plugin-provided post types, so
 * the Extensible Site Editor exposes the server-resolved archive URL instead.
 *
 * @param WP_REST_Response $response  The REST response.
 * @param WP_Post_Type     $post_type The original post type object.
 * @return WP_REST_Response The filtered REST response.
 */
function gutenberg_site_editor_add_post_type_archive_url( $response, $post_type ) {
	if ( ! $response instanceof WP_REST_Response || ! $post_type instanceof WP_Post_Type ) {
		return $response;
	}

	$data = $response->get_data();
	if ( ! is_array( $data ) ) {
		return $response;
	}

	$archive_url = null;
	if ( $post_type->show_in_nav_menus && is_post_type_viewable( $post_type ) ) {
		$resolved_archive_url = get_post_type_archive_link( $post_type->name );
		if ( $resolved_archive_url ) {
			$archive_url = $resolved_archive_url;
		}
	}

	$data['site_editor_archive_url'] = $archive_url;
	$response->set_data( $data );

	return $response;
}
add_filter( 'rest_prepare_post_type', 'gutenberg_site_editor_add_post_type_archive_url', 10, 2 );

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

	gutenberg_register_site_editor_v2_menu_item( 'home', __( 'Homepage', 'gutenberg' ), '/', '' );
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
