<?php
/**
 * Bootstrapping the Gutenberg Template Parts screen & integration.
 *
 * This isn't a new file for wp-admin; just override necessary for `site-editor.php`.
 *
 * @package gutenberg
 */

/**
 * Register Template Parts submenu.
 *
 * This should be handled directly in wp-admin/menu.php.
 *
 * @return void
 */
function gutenberg_template_parts_screen_menu() {
	// Only add page for Classic theme that support the feature.
	if ( wp_is_block_theme() ) {
		return;
	}

	if ( ! current_theme_supports( 'block-template-parts' ) ) {
		return;
	}

	add_theme_page(
		__( 'Template Parts', 'gutenberg' ),
		__( 'Template Parts', 'gutenberg' ),
		'edit_theme_options',
		'gutenberg-template-parts',
		'gutenberg_template_parts_screen_render'
	);
}
add_action( 'admin_menu', 'gutenberg_template_parts_screen_menu' );

/**
 * The page permissions and redirections.
 *
 * @return void
 */
function gutenberg_template_parts_screen_permissions() {
	if ( ! current_theme_supports( 'block-template-parts' ) ) {
		wp_die( __( 'The theme you are currently using doesn\'t block-based template parts.', 'gutenberg' ) );
	}

	/**
	 * Should be handled directly in /wp-admin/menu.php.
	 * Path: `site-editor.php?postType=wp_template_part`.
	 */
	if ( ! isset( $_GET['postType'] ) ) {
		$redirect_url = add_query_arg(
			array( 'postType' => 'wp_template_part' ),
			admin_url( 'themes.php?page=gutenberg-template-parts' )
		);
		wp_safe_redirect( $redirect_url );
		exit;
	}
}
add_action( 'load-appearance_page_gutenberg-template-parts', 'gutenberg_template_parts_screen_permissions' );

/**
 * Initialize the editor for the screen. Most of this is copied from `site-editor.php`.
 *
 * Note: Parts that need to be ported back should have inline comments.
 *
 * @param string $hook Current page hook.
 * @return void
 */
function gutenberg_template_parts_screen_init( $hook ) {
	global $current_screen, $editor_styles;

	if ( 'appearance_page_gutenberg-template-parts' !== $hook ) {
		return;
	}

	// Flag that we're loading the block editor.
	$current_screen->is_block_editor( true );

	// Default to is-fullscreen-mode to avoid jumps in the UI.
	add_filter(
		'admin_body_class',
		static function( $classes ) {
			return "$classes is-fullscreen-mode";
		}
	);

	$indexed_template_types = array();
	foreach ( get_default_block_template_types() as $slug => $template_type ) {
		$template_type['slug']    = (string) $slug;
		$indexed_template_types[] = $template_type;
	}

	$block_editor_context = new WP_Block_Editor_Context( array( 'name' => 'core/edit-site' ) );
	$custom_settings      = array(
		'siteUrl'                   => site_url(),
		'postsPerPage'              => get_option( 'posts_per_page' ),
		'styles'                    => get_block_editor_theme_styles(),
		'defaultTemplateTypes'      => $indexed_template_types,
		'defaultTemplatePartAreas'  => get_allowed_block_template_part_areas(),
		'supportsLayout'            => WP_Theme_JSON_Resolver::theme_has_support(),
		'supportsTemplatePartsMode' => ! wp_is_block_theme() && current_theme_supports( 'block-template-parts' ),
		'__unstableHomeTemplate'    => gutenberg_resolve_home_template(),
	);

	/**
	 * We don't need home template resolution when block template parts are supported.
	 * Set the value to true to satisfy the editor initialization guard clause.
	 */
	if ( $custom_settings['supportsTemplatePartsMode'] ) {
		$custom_settings['__unstableHomeTemplate'] = true;
	}

	// Add additional back-compat patterns registered by `current_screen` et al.
	$custom_settings['__experimentalAdditionalBlockPatterns']          = WP_Block_Patterns_Registry::get_instance()->get_all_registered( true );
	$custom_settings['__experimentalAdditionalBlockPatternCategories'] = WP_Block_Pattern_Categories_Registry::get_instance()->get_all_registered( true );

	$editor_settings = get_block_editor_settings( $custom_settings, $block_editor_context );

	if ( isset( $_GET['postType'] ) && ! isset( $_GET['postId'] ) ) {
		$post_type = get_post_type_object( $_GET['postType'] );
		if ( ! $post_type ) {
			wp_die( __( 'Invalid post type.', 'gutenberg' ) );
		}
	}

	$active_global_styles_id = WP_Theme_JSON_Resolver::get_user_global_styles_post_id();
	$active_theme            = wp_get_theme()->get_stylesheet();
	$preload_paths           = array(
		array( '/wp/v2/media', 'OPTIONS' ),
		'/wp/v2/types?context=view',
		'/wp/v2/types/wp_template?context=edit',
		'/wp/v2/types/wp_template-part?context=edit',
		'/wp/v2/templates?context=edit&per_page=-1',
		'/wp/v2/template-parts?context=edit&per_page=-1',
		'/wp/v2/themes?context=edit&status=active',
		'/wp/v2/global-styles/' . $active_global_styles_id . '?context=edit',
		'/wp/v2/global-styles/' . $active_global_styles_id,
		'/wp/v2/global-styles/themes/' . $active_theme,
	);

	block_editor_rest_api_preload( $preload_paths, $block_editor_context );

	wp_add_inline_script(
		'wp-edit-site',
		sprintf(
			'wp.domReady( function() {
				wp.editSite.initializeEditor( "site-editor", %s );
			} );',
			wp_json_encode( $editor_settings )
		)
	);

	// Preload server-registered block schemas.
	wp_add_inline_script(
		'wp-blocks',
		'wp.blocks.unstable__bootstrapServerSideBlockDefinitions(' . wp_json_encode( get_block_editor_server_block_settings() ) . ');'
	);

	wp_add_inline_script(
		'wp-blocks',
		sprintf( 'wp.blocks.setCategories( %s );', wp_json_encode( get_block_categories( $block_editor_context ) ) )
	);

	wp_enqueue_script( 'wp-edit-site' );
	wp_enqueue_script( 'wp-format-library' );
	wp_enqueue_style( 'wp-edit-site' );
	wp_enqueue_style( 'wp-format-library' );
	wp_enqueue_media();

	if (
		current_theme_supports( 'wp-block-styles' ) ||
		( ! is_array( $editor_styles ) || count( $editor_styles ) === 0 )
	) {
		wp_enqueue_style( 'wp-block-library-theme' );
	}

	/** This action is documented in wp-admin/edit-form-blocks.php */
	do_action( 'enqueue_block_editor_assets' );
}
add_action( 'admin_enqueue_scripts', 'gutenberg_template_parts_screen_init' );

/**
 * The main entry point for the screen.
 *
 * @return void
 */
function gutenberg_template_parts_screen_render() {
	echo '<div id="site-editor" class="edit-site"></div>';
}

/**
 * Register the new theme feature.
 *
 * Migrates into `create_initial_theme_features` method.
 *
 * @return void
 */
function gutenberg_register_template_parts_theme_feature() {
	register_theme_feature(
		'block-template-parts',
		array(
			'description'  => __( 'Whether a theme uses block-based template parts.', 'gutenberg' ),
			'show_in_rest' => true,
		)
	);
}
add_action( 'setup_theme', 'gutenberg_register_template_parts_theme_feature', 5 );
