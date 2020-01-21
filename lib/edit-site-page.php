<?php
/**
 * Bootstraping the Gutenberg Edit Site Page.
 *
 * @package gutenberg
 */

/**
 * The main entry point for the Gutenberg Edit Site Page.
 *
 * @since 7.2.0
 */
function gutenberg_edit_site_page() {
	?>
	<div
		id="edit-site-editor"
		class="edit-site"
	>
	</div>
	<?php
}

/**
 * Initialize the Gutenberg Edit Site Page.
 *
 * @since 7.2.0
 *
 * @param string $hook Page.
 */
function gutenberg_edit_site_init( $hook ) {
	global
		$_wp_current_template_id,
		$_wp_current_template_name,
		$_wp_current_template_content,
		$_wp_current_template_hierarchy,
		$_wp_current_template_part_ids;
	if ( 'gutenberg_page_gutenberg-edit-site' !== $hook ) {
		return;
	}

	// Get editor settings.
	$max_upload_size = wp_max_upload_size();
	if ( ! $max_upload_size ) {
		$max_upload_size = 0;
	}

	// This filter is documented in wp-admin/includes/media.php.
	$image_size_names      = apply_filters(
		'image_size_names_choose',
		array(
			'thumbnail' => __( 'Thumbnail', 'gutenberg' ),
			'medium'    => __( 'Medium', 'gutenberg' ),
			'large'     => __( 'Large', 'gutenberg' ),
			'full'      => __( 'Full Size', 'gutenberg' ),
		)
	);
	$available_image_sizes = array();
	foreach ( $image_size_names as $image_size_slug => $image_size_name ) {
		$available_image_sizes[] = array(
			'slug' => $image_size_slug,
			'name' => $image_size_name,
		);
	}

	$settings = array(
		'disableCustomColors'    => get_theme_support( 'disable-custom-colors' ),
		'disableCustomFontSizes' => get_theme_support( 'disable-custom-font-sizes' ),
		'imageSizes'             => $available_image_sizes,
		'isRTL'                  => is_rtl(),
		'maxUploadFileSize'      => $max_upload_size,
	);

	list( $color_palette, ) = (array) get_theme_support( 'editor-color-palette' );
	list( $font_sizes, )    = (array) get_theme_support( 'editor-font-sizes' );
	if ( false !== $color_palette ) {
		$settings['colors'] = $color_palette;
	}
	if ( false !== $font_sizes ) {
		$settings['fontSizes'] = $font_sizes;
	}

	// Get all templates by triggering `./template-loader.php`'s logic.
	$template_getters  = array(
		'get_embed_template',
		'get_404_template',
		'get_search_template',
		'get_home_template',
		'get_privacy_policy_template',
		'get_post_type_archive_template',
		'get_taxonomy_template',
		'get_attachment_template',
		'get_single_template',
		'get_page_template',
		'get_singular_template',
		'get_category_template',
		'get_tag_template',
		'get_author_template',
		'get_date_template',
		'get_archive_template',
	);
	$template_ids      = array();
	$template_part_ids = array();
	foreach ( $template_getters as $template_getter ) {
		call_user_func( $template_getter );
		apply_filters( 'template_include', null );
		if ( isset( $_wp_current_template_id ) ) {
			$template_ids[ $_wp_current_template_name ] = $_wp_current_template_id;
		}
		if ( isset( $_wp_current_template_part_ids ) ) {
			$template_part_ids = $template_part_ids + $_wp_current_template_part_ids;
		}
		$_wp_current_template_id        = null;
		$_wp_current_template_name      = null;
		$_wp_current_template_content   = null;
		$_wp_current_template_hierarchy = null;
		$_wp_current_template_part_ids  = null;
	}
	get_front_page_template();
	get_index_template();
	apply_filters( 'template_include', null );
	$template_ids[ $_wp_current_template_name ] = $_wp_current_template_id;
	if ( isset( $_wp_current_template_part_ids ) ) {
		$template_part_ids = $template_part_ids + $_wp_current_template_part_ids;
	}
	$settings['templateId']      = $_wp_current_template_id;
	$settings['templateType']    = 'wp_template';
	$settings['templateIds']     = array_values( $template_ids );
	$settings['templatePartIds'] = array_values( $template_part_ids );

	// This is so other parts of the code can hook their own settings.
	// Example: Global Styles.
	global $post;
	$settings = apply_filters( 'block_editor_settings', $settings, $post );

	// Initialize editor.
	wp_add_inline_script(
		'wp-edit-site',
		sprintf(
			'wp.domReady( function() {
				wp.editSite.initialize( "edit-site-editor", %s );
			} );',
			wp_json_encode( gutenberg_experiments_editor_settings( $settings ) )
		)
	);

	// Preload server-registered block schemas.
	wp_add_inline_script(
		'wp-blocks',
		'wp.blocks.unstable__bootstrapServerSideBlockDefinitions(' . wp_json_encode( get_block_editor_server_block_settings() ) . ');'
	);

	wp_enqueue_script( 'wp-edit-site' );
	wp_enqueue_script( 'wp-format-library' );
	wp_enqueue_style( 'wp-edit-site' );
	wp_enqueue_style( 'wp-format-library' );
}
add_action( 'admin_enqueue_scripts', 'gutenberg_edit_site_init' );
