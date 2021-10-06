<?php
/**
 * Block template functions.
 *
 * @package gutenberg
 */

/**
 * Registers block editor 'wp_template' post type.
 */
function gutenberg_register_template_post_type() {
	if ( ! gutenberg_supports_block_templates() ) {
		return;
	}

	$labels = array(
		'name'                  => __( 'Templates', 'gutenberg' ),
		'singular_name'         => __( 'Template', 'gutenberg' ),
		'menu_name'             => _x( 'Templates', 'Admin Menu text', 'gutenberg' ),
		'add_new'               => _x( 'Add New', 'Template', 'gutenberg' ),
		'add_new_item'          => __( 'Add New Template', 'gutenberg' ),
		'new_item'              => __( 'New Template', 'gutenberg' ),
		'edit_item'             => __( 'Edit Template', 'gutenberg' ),
		'view_item'             => __( 'View Template', 'gutenberg' ),
		'all_items'             => __( 'All Templates', 'gutenberg' ),
		'search_items'          => __( 'Search Templates', 'gutenberg' ),
		'parent_item_colon'     => __( 'Parent Template:', 'gutenberg' ),
		'not_found'             => __( 'No templates found.', 'gutenberg' ),
		'not_found_in_trash'    => __( 'No templates found in Trash.', 'gutenberg' ),
		'archives'              => __( 'Template archives', 'gutenberg' ),
		'insert_into_item'      => __( 'Insert into template', 'gutenberg' ),
		'uploaded_to_this_item' => __( 'Uploaded to this template', 'gutenberg' ),
		'filter_items_list'     => __( 'Filter templates list', 'gutenberg' ),
		'items_list_navigation' => __( 'Templates list navigation', 'gutenberg' ),
		'items_list'            => __( 'Templates list', 'gutenberg' ),
	);

	$args = array(
		'labels'                => $labels,
		'description'           => __( 'Templates to include in your theme.', 'gutenberg' ),
		'public'                => false,
		'has_archive'           => false,
		'show_ui'               => true,
		'show_in_menu'          => 'themes.php',
		'show_in_admin_bar'     => false,
		'show_in_rest'          => true,
		'rest_base'             => 'templates',
		'rest_controller_class' => 'Gutenberg_REST_Templates_Controller',
		'capability_type'       => array( 'template', 'templates' ),
		'map_meta_cap'          => true,
		'supports'              => array(
			'title',
			'slug',
			'excerpt',
			'editor',
			'revisions',
		),
	);

	register_post_type( 'wp_template', $args );
}
add_action( 'init', 'gutenberg_register_template_post_type' );

/**
 * Registers block editor 'wp_theme' taxonomy.
 */
function gutenberg_register_wp_theme_taxonomy() {
	if ( ! gutenberg_supports_block_templates() && ! WP_Theme_JSON_Resolver_Gutenberg::theme_has_support() ) {
		return;
	}

	register_taxonomy(
		'wp_theme',
		array( 'wp_global_styles' ),
		array(
			'public'            => false,
			'hierarchical'      => false,
			'labels'            => array(
				'name'          => __( 'Themes', 'gutenberg' ),
				'singular_name' => __( 'Theme', 'gutenberg' ),
			),
			'query_var'         => false,
			'rewrite'           => false,
			'show_ui'           => false,
			'_builtin'          => true,
			'show_in_nav_menus' => false,
			'show_in_rest'      => false,
		)
	);
}
add_action( 'init', 'gutenberg_register_wp_theme_taxonomy' );

/**
 * Filters the capabilities of a user to conditionally grant them capabilities for managing 'wp_template' posts.
 *
 * Any user who can 'edit_theme_options' will have access.
 *
 * @param array $allcaps A user's capabilities.
 * @return array Filtered $allcaps.
 */
function gutenberg_grant_template_caps( array $allcaps ) {
	if ( isset( $allcaps['edit_theme_options'] ) ) {
		$allcaps['edit_templates']             = $allcaps['edit_theme_options'];
		$allcaps['edit_others_templates']      = $allcaps['edit_theme_options'];
		$allcaps['edit_published_templates']   = $allcaps['edit_theme_options'];
		$allcaps['edit_private_templates']     = $allcaps['edit_theme_options'];
		$allcaps['delete_templates']           = $allcaps['edit_theme_options'];
		$allcaps['delete_others_templates']    = $allcaps['edit_theme_options'];
		$allcaps['delete_published_templates'] = $allcaps['edit_theme_options'];
		$allcaps['delete_private_templates']   = $allcaps['edit_theme_options'];
		$allcaps['publish_templates']          = $allcaps['edit_theme_options'];
		$allcaps['read_private_templates']     = $allcaps['edit_theme_options'];
	}

	return $allcaps;
}
add_filter( 'user_has_cap', 'gutenberg_grant_template_caps' );

/**
 * Fixes the label of the 'wp_template' admin menu entry.
 */
function gutenberg_fix_template_admin_menu_entry() {
	if ( ! gutenberg_supports_block_templates() ) {
		return;
	}
	global $submenu;
	if ( ! isset( $submenu['themes.php'] ) ) {
		return;
	}
	$post_type = get_post_type_object( 'wp_template' );
	if ( ! $post_type ) {
		return;
	}
	foreach ( $submenu['themes.php'] as $key => $submenu_entry ) {
		if ( $post_type->labels->all_items === $submenu['themes.php'][ $key ][0] ) {
			$submenu['themes.php'][ $key ][0] = $post_type->labels->menu_name; // phpcs:ignore WordPress.WP.GlobalVariablesOverride
			break;
		}
	}
}
add_action( 'admin_menu', 'gutenberg_fix_template_admin_menu_entry' );

// Customize the `wp_template` admin list.
add_filter( 'manage_wp_template_posts_columns', 'gutenberg_templates_lists_custom_columns' );
add_action( 'manage_wp_template_posts_custom_column', 'gutenberg_render_templates_lists_custom_column', 10, 2 );

/**
 * Finds whether a template or template part slug is customized for the currently active theme.
 *
 * @param string $slug          Template or template part slug.
 * @param string $template_type wp_template or wp_template_part.
 *
 * @return bool Whether the template is customized for the currently active theme.
 */
function template_is_customized( $slug, $template_type = 'wp_template' ) {
	$templates = get_theme_mod( $template_type, array() );

	if ( ! isset( $templates[ $slug ] ) ) {
		return false;
	}

	$customized = get_post( $templates[ $slug ] );
	if ( $customized && $customized->post_type === $template_type ) {
		return true;
	} else {
		return false;
	}
}

/**
 * Customizes a template or template part for the currently active theme.
 *
 * @param string      $slug           Template or template part identifier.
 * @param int|WP_Post $post           Post ID or object of customized template.
 * @param bool        $overwrite_slug Whether to overwrite existing slug. Default true.
 * @param bool        $overwrite_post Whether to overwrite existing post. Default true.
 *
 * @return string|null The identifier of the customized template, or null if the post is an invalid type.
 */
function customize_template( $slug, $post, $overwrite_slug = true, $overwrite_post = true ) {
	$post = get_post( $post );
	if ( ! in_array( $post->post_type, array( 'wp_template', 'wp_template_part' ), true ) ) {
		return null;
	}

	$templates = get_theme_mod( $post->post_type, array() );

	while ( in_array( $post->ID, $templates, true ) ) {
		$existing_slug = array_search( $post->ID, $templates, true );

		if ( ! $overwrite_post || $existing_slug === $slug ) {
			return $existing_slug;
		} else {
			unset( $templates[ $existing_slug ] );
			set_theme_mod( $post->post_type, $templates );
		}
	}

	if ( ! $overwrite_slug && template_is_customized( $slug, $post->post_type ) ) {
		$original_slug = $slug;
		$suffix = 2;
		do {
			$slug = _truncate_post_slug( $original_slug, 200 - ( strlen( $suffix ) + 1 ) ) . "-$suffix";
			$suffix++;
		} while ( template_is_customized( $slug, $post->post_type ) );
	}

	$templates[ $slug ] = $post->ID;
	set_theme_mod( $post->post_type, $templates );

	return $slug;
}

/**
 * Print the skip-link script & styles.
 *
 * @todo Remove this when WP 5.8 is the minimum required version.
 *
 * @return void
 */
function gutenberg_the_skip_link() {
	// Early exit if not a block theme.
	if ( ! gutenberg_supports_block_templates() ) {
		return;
	}

	// Early exit if not a block template.
	global $_wp_current_template_content;
	if ( ! $_wp_current_template_content ) {
		return;
	}
	?>

	<?php
	/**
	 * Print the skip-link styles.
	 */
	?>
	<style id="skip-link-styles">
		.skip-link.screen-reader-text {
			border: 0;
			clip: rect(1px,1px,1px,1px);
			clip-path: inset(50%);
			height: 1px;
			margin: -1px;
			overflow: hidden;
			padding: 0;
			position: absolute !important;
			width: 1px;
			word-wrap: normal !important;
		}

		.skip-link.screen-reader-text:focus {
			background-color: #eee;
			clip: auto !important;
			clip-path: none;
			color: #444;
			display: block;
			font-size: 1em;
			height: auto;
			left: 5px;
			line-height: normal;
			padding: 15px 23px 14px;
			text-decoration: none;
			top: 5px;
			width: auto;
			z-index: 100000;
		}
	</style>
	<?php
	/**
	 * Print the skip-link script.
	 */
	?>
	<script>
	( function() {
		var skipLinkTarget = document.querySelector( 'main' ),
			sibling,
			skipLinkTargetID,
			skipLink;

		// Early exit if a skip-link target can't be located.
		if ( ! skipLinkTarget ) {
			return;
		}

		// Get the site wrapper.
		// The skip-link will be injected in the beginning of it.
		sibling = document.querySelector( '.wp-site-blocks' );

		// Early exit if the root element was not found.
		if ( ! sibling ) {
			return;
		}

		// Get the skip-link target's ID, and generate one if it doesn't exist.
		skipLinkTargetID = skipLinkTarget.id;
		if ( ! skipLinkTargetID ) {
			skipLinkTargetID = 'wp--skip-link--target';
			skipLinkTarget.id = skipLinkTargetID;
		}

		// Create the skip link.
		skipLink = document.createElement( 'a' );
		skipLink.classList.add( 'skip-link', 'screen-reader-text' );
		skipLink.href = '#' + skipLinkTargetID;
		skipLink.innerHTML = '<?php esc_html_e( 'Skip to content', 'gutenberg' ); ?>';

		// Inject the skip link.
		sibling.parentElement.insertBefore( skipLink, sibling );
	}() );
	</script>
	<?php
}

remove_action( 'wp_footer', 'the_block_template_skip_link' );
add_action( 'wp_footer', 'gutenberg_the_skip_link' );
