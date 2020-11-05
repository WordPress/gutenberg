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
	$blocks_dirs = array(
		dirname( __FILE__ ) . '/../build/block-library/blocks/' => array(
			'block_folders' => array(
				'audio',
				'button',
				'buttons',
				'classic',
				'code',
				'column',
				'columns',
				'file',
				'gallery',
				'group',
				'heading',
				'html',
				'image',
				'list',
				'media-text',
				'missing',
				'more',
				'navigation-link',
				'nextpage',
				'paragraph',
				'preformatted',
				'pullquote',
				'quote',
				'separator',
				'social-links',
				'spacer',
				'subhead',
				'table',
				'text-columns',
				'verse',
				'video',
				'embed',
			),
			'block_names'   => array_merge(
				array(
					'archives.php'                => 'core/archives',
					'block.php'                   => 'core/block',
					'calendar.php'                => 'core/calendar',
					'categories.php'              => 'core/categories',
					'cover.php'                   => 'core/cover',
					'latest-comments.php'         => 'core/latest-comments',
					'latest-posts.php'            => 'core/latest-posts',
					'navigation.php'              => 'core/navigation',
					'navigation-link.php'         => 'core/navigation-link',
					'rss.php'                     => 'core/rss',
					'search.php'                  => 'core/search',
					'shortcode.php'               => 'core/shortcode',
					'social-link.php'             => 'core/social-link',
					'tag-cloud.php'               => 'core/tag-cloud',
					'post-author.php'             => 'core/post-author',
					'post-comment.php'            => 'core/post-comment',
					'post-comment-author.php'     => 'core/post-comment-author',
					'post-comment-content.php'    => 'core/post-comment-content',
					'post-comment-date.php'       => 'core/post-comment-date',
					'post-comments.php'           => 'core/post-comments',
					'post-comments-count.php'     => 'core/post-comments-count',
					'post-comments-form.php'      => 'core/post-comments-form',
					'post-content.php'            => 'core/post-content',
					'post-date.php'               => 'core/post-date',
					'post-excerpt.php'            => 'core/post-excerpt',
					'post-featured-image.php'     => 'core/post-featured-image',
					'post-hierarchical-terms.php' => 'core/post-hierarchical-terms',
					'post-tags.php'               => 'core/post-tags',
					'post-title.php'              => 'core/post-title',
					'query.php'                   => 'core/query',
					'query-loop.php'              => 'core/query-loop',
					'query-pagination.php'        => 'core/query-pagination',
					'site-logo.php'               => 'core/site-logo',
					'site-tagline.php'            => 'core/site-tagline',
					'site-title.php'              => 'core/site-title',
					'template-part.php'           => 'core/template-part',
				)
			),
		),
		dirname( __FILE__ ) . '/../build/edit-widgets/blocks/'  => array(
			'block_folders' => array(
				'legacy-widget',
				'widget-area',
			),
			'block_names'   => array(
				'legacy-widget.php' => 'core/legacy-widget',
				'widget-area.php'   => 'core/widget-area',
			),
		),
	);
	foreach ( $blocks_dirs as $blocks_dir => $details ) {
		if ( ! file_exists( $blocks_dir ) ) {
			return;
		}
		$block_folders = $details['block_folders'];
		$block_names   = $details['block_names'];

		$registry = WP_Block_Type_Registry::get_instance();

		foreach ( $block_folders as $folder_name ) {
			$block_json_file = $blocks_dir . $folder_name . '/block.json';
			if ( ! file_exists( $block_json_file ) ) {
				return;
			}

			// Ideally, all paths to block metadata files should be listed in
			// WordPress core. In this place we should rather use filter
			// to replace paths with overrides defined by the plugin.
			$metadata = json_decode( file_get_contents( $block_json_file ), true );
			if ( ! is_array( $metadata ) || ! $metadata['name'] ) {
				return false;
			}

			if ( $registry->is_registered( $metadata['name'] ) ) {
				$registry->unregister( $metadata['name'] );
			}

			register_block_type_from_metadata( $block_json_file );
		}

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
