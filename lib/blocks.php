<?php
/**
 * Block and style registration functions.
 *
 * @package gutenberg
 */

/**
 * Substitutes the implementation of a core-registered block type, if exists,
 * with the built result from the plugin.
 */
function gutenberg_reregister_core_block_types() {
	// Blocks directory may not exist if working from a fresh clone.
	$blocks_dir = dirname( __FILE__ ) . '/../build/block-library/blocks/';
	if ( ! file_exists( $blocks_dir ) ) {
		return;
	}

	$block_names = array(
		'archives.php'        => 'core/archives',
		'block.php'           => 'core/block',
		'calendar.php'        => 'core/calendar',
		'categories.php'      => 'core/categories',
		'latest-comments.php' => 'core/latest-comments',
		'latest-posts.php'    => 'core/latest-posts',
		'legacy-widget.php'   => 'core/legacy-widget',
		'navigation.php'      => 'core/navigation',
		'rss.php'             => 'core/rss',
		'shortcode.php'       => 'core/shortcode',
		'search.php'          => 'core/search',
		'social-link.php'     => 'core/social-link',
		'tag-cloud.php'       => 'core/tag-cloud',
		'site-title.php'      => 'core/site-title',
		'template-part.php'   => 'core/template-part',
		'post-title.php'      => 'core/post-title',
		'post-content.php'    => 'core/post-content',
		'post-author.php'     => 'core/post-author',
		'post-date.php'       => 'core/post-date',
		'post-excerpt.php'    => 'core/post-excerpt',
	);

	$registry = WP_Block_Type_Registry::get_instance();

	foreach ( $block_names as $file => $block_names ) {
		if ( ! file_exists( $blocks_dir . $file ) ) {
			return;
		}

		if ( is_string( $block_names ) ) {
			if ( $registry->is_registered( $block_names ) ) {
				$registry->unregister( $block_names );
			}
		} elseif ( is_array( $block_names ) ) {
			foreach ( $block_names as $block_name ) {
				if ( $registry->is_registered( $block_name ) ) {
					$registry->unregister( $block_name );
				}
			}
		}

		require $blocks_dir . $file;
	}
}
add_action( 'init', 'gutenberg_reregister_core_block_types' );

/**
 * Complements the implementation of block type `core/social-icon`, whether it
 * be provided by core or the plugin, with derived block types for each
 * "service" (WordPress, Twitter, etc.) supported by Social Links.
 *
 * This ensures backwards compatibility for any users running the Gutenberg
 * plugin who have used Social Links prior to their conversion to block
 * variations.
 *
 * This shim is INTENTIONALLY left out of core, as Social Links haven't yet
 * landed there.
 *
 * @see https://github.com/WordPress/gutenberg/pull/19887
 */
function gutenberg_register_legacy_social_link_blocks() {
	$services = array(
		'amazon',
		'bandcamp',
		'behance',
		'chain',
		'codepen',
		'deviantart',
		'dribbble',
		'dropbox',
		'etsy',
		'facebook',
		'feed',
		'fivehundredpx',
		'flickr',
		'foursquare',
		'goodreads',
		'google',
		'github',
		'instagram',
		'lastfm',
		'linkedin',
		'mail',
		'mastodon',
		'meetup',
		'medium',
		'pinterest',
		'pocket',
		'reddit',
		'skype',
		'snapchat',
		'soundcloud',
		'spotify',
		'tumblr',
		'twitch',
		'twitter',
		'vimeo',
		'vk',
		'wordpress',
		'yelp',
		'youtube',
	);

	foreach ( $services as $service ) {
		register_block_type(
			'core/social-link-' . $service,
			array(
				'category'        => 'widgets',
				'attributes'      => array(
					'url'     => array(
						'type' => 'string',
					),
					'service' => array(
						'type'    => 'string',
						'default' => $service,
					),
					'label'   => array(
						'type' => 'string',
					),
				),
				'render_callback' => 'gutenberg_render_block_core_social_link',
			)
		);
	}
}
add_action( 'init', 'gutenberg_register_legacy_social_link_blocks' );

if ( ! function_exists( 'register_block_style' ) ) {
	/**
	 * Registers a new block style.
	 *
	 * @param string $block_name       Block type name including namespace.
	 * @param array  $style_properties Array containing the properties of the style name, label, style (name of the stylesheet to be enqueued), inline_style (string containing the CSS to be added).
	 *
	 * @return boolean True if the block style was registered with success and false otherwise.
	 */
	function register_block_style( $block_name, $style_properties ) {
		return WP_Block_Styles_Registry::get_instance()->register( $block_name, $style_properties );
	}
}

if ( ! function_exists( 'unregister_block_style' ) ) {
	/**
	 * Unregisters a block style.
	 *
	 * @param string $block_name       Block type name including namespace.
	 * @param array  $block_style_name Block style name.
	 *
	 * @return boolean True if the block style was unregistered with success and false otherwise.
	 */
	function unregister_block_style( $block_name, $block_style_name ) {
		return WP_Block_Styles_Registry::get_instance()->unregister( $block_name, $block_style_name );
	}
}

if ( ! has_action( 'enqueue_block_assets', 'enqueue_block_styles_assets' ) ) {
	/**
	 * Function responsible for enqueuing the styles required for block styles functionality on the editor and on the frontend.
	 */
	function gutenberg_enqueue_block_styles_assets() {
		$block_styles = WP_Block_Styles_Registry::get_instance()->get_all_registered();

		foreach ( $block_styles as $styles ) {
			foreach ( $styles as $style_properties ) {
				if ( isset( $style_properties['style_handle'] ) ) {
					wp_enqueue_style( $style_properties['style_handle'] );
				}
				if ( isset( $style_properties['inline_style'] ) ) {
					wp_add_inline_style( 'wp-block-library', $style_properties['inline_style'] );
				}
			}
		}
	}
	add_action( 'enqueue_block_assets', 'gutenberg_enqueue_block_styles_assets', 30 );
}
if ( ! has_action( 'enqueue_block_editor_assets', 'enqueue_editor_block_styles_assets' ) ) {
	/**
	 * Function responsible for enqueuing the assets required for block styles functionality on the editor.
	 */
	function gutenberg_enqueue_editor_block_styles_assets() {
		$block_styles = WP_Block_Styles_Registry::get_instance()->get_all_registered();

		$register_script_lines = array( '( function() {' );
		foreach ( $block_styles as $block_name => $styles ) {
			foreach ( $styles as $style_properties ) {
				$register_script_lines[] = sprintf(
					'	wp.blocks.registerBlockStyle( \'%s\', %s );',
					$block_name,
					wp_json_encode(
						array(
							'name'  => $style_properties['name'],
							'label' => $style_properties['label'],
						)
					)
				);
			}
		}
		$register_script_lines[] = '} )();';
		$inline_script           = implode( "\n", $register_script_lines );

		wp_register_script( 'wp-block-styles', false, array( 'wp-blocks' ), true, true );
		wp_add_inline_script( 'wp-block-styles', $inline_script );
		wp_enqueue_script( 'wp-block-styles' );
	}
	add_action( 'enqueue_block_editor_assets', 'gutenberg_enqueue_editor_block_styles_assets' );
}
