<?php
/**
 * Bootstrapping the Gutenberg experiments page.
 *
 * @package gutenberg
 */

if ( isset( $_GET['page'] ) && 'gutenberg-experiments' === $_GET['page'] ) {
	// Default to is-fullscreen-mode to avoid jumps in the UI.
	add_filter(
		'admin_body_class',
		static function ( $classes ) {
			return "$classes is-fullscreen-mode";
		}
	);
}

if ( ! function_exists( 'the_gutenberg_experiments' ) ) {
	/**
	 * The main entry point for the Gutenberg experiments page.
	 *
	 * @since 6.3.0
	 */
	function the_gutenberg_experiments() {
		$block_editor_context = new WP_Block_Editor_Context( array( 'name' => 'core/edit-site' ) );
		$custom_settings      = array(
			'siteUrl' => site_url(),
		);

		$editor_settings         = get_block_editor_settings( $custom_settings, $block_editor_context );

		wp_register_style(
			'wp-gutenberg-experiments',
			gutenberg_url( 'build/edit-site/experiments.css' ),
			array( 'wp-components', 'wp-commands', 'wp-edit-site' )
		);
		wp_enqueue_style( 'wp-gutenberg-experiments' );
		wp_add_inline_script(
			'wp-edit-site',
			sprintf(
				'wp.domReady( function() {
					wp.editSite.initializeExperiments( "gutenberg-experiments", %s );
				} );',
				wp_json_encode( $editor_settings )
			)
		);
		wp_enqueue_script( 'wp-edit-site' );
		wp_enqueue_media();
		echo '<div id="gutenberg-experiments"></div>';
	}
}

/**
 * Set up the experiments settings.
 *
 * @since 6.8.0
 */
function gutenberg_initialize_experiments_settings() {
	register_setting(
		'gutenberg-experiments',
		'gutenberg-experiments',
		array(
			'label'        => __( 'Gutenberg Experiments', 'gutenberg' ),
			'description'  => __( "The block editor includes experimental features that are usable while they're in development. Select the ones you'd like to enable. These features are likely to change, so avoid using them in production.", 'gutenberg' ),
			'show_in_rest' => array(
				'schema' => array(
					'type'       => 'object',
					'properties' => array(
						'gutenberg-block-experiments'    => array( 'type' => 'boolean' ),
						'gutenberg-form-blocks'          => array( 'type' => 'boolean' ),
						'gutenberg-grid-interactivity'   => array( 'type' => 'boolean' ),
						'gutenberg-no-tinymce'           => array( 'type' => 'boolean' ),
						'gutenberg-media-processing'     => array( 'type' => 'boolean' ),
						'gutenberg-block-comments'       => array( 'type' => 'boolean' ),
						'gutenberg-sync-collaboration'   => array( 'type' => 'boolean' ),
						'gutenberg-custom-dataviews'     => array( 'type' => 'boolean' ),
						'gutenberg-new-posts-dashboard'  => array( 'type' => 'boolean' ),
						'gutenberg-quick-edit-dataviews' => array( 'type' => 'boolean' ),
						'gutenberg-editor-write-mode'    => array( 'type' => 'boolean' ),
						'gutenberg-full-page-client-side-navigation' => array( 'type' => 'boolean' ),
						'gutenberg-color-randomizer'     => array( 'type' => 'boolean' ),
					),
				),
			),
			'default'      => array(),
		)
	);
}

add_action( 'admin_init', 'gutenberg_initialize_experiments_settings' );
add_action( 'rest_api_init', 'gutenberg_initialize_experiments_settings' );
