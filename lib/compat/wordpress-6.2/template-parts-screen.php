<?php

/**
 * Initialize the editor for the screen. Most of this is copied from `site-editor.php`.
 *
 * Note: Parts that need to be ported back should have inline comments.
 *
 * @param string $hook Current page hook.
 * @return void
 */
function gutenberg_add_custom_settings() {
	$extra_template_types = apply_filters( 'extra_template_types', array() );

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
		'extraTemplateTypes'        => $extra_template_types,
		'defaultTemplateTypes'      => $indexed_template_types,
		'defaultTemplatePartAreas'  => get_allowed_block_template_part_areas(),
		'supportsLayout'            => wp_theme_has_theme_json(),
		'supportsTemplatePartsMode' => ! wp_is_block_theme() && current_theme_supports( 'block-template-parts' ),
	);

	$editor_settings = get_block_editor_settings( $custom_settings, $block_editor_context );

	wp_add_inline_script(
		'wp-edit-site',
		sprintf(
			'wp.domReady( function() {
				wp.editSite.initializeEditor( "site-editor", %s );
			} );',
			wp_json_encode( $editor_settings )
		)
	);
}
add_action( 'admin_enqueue_scripts', 'gutenberg_add_custom_settings' );
