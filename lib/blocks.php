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
		__DIR__ . '/../build/block-library/blocks/' => array(
			'block_folders' => array(
				'audio',
				'button',
				'buttons',
				'freeform',
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
					'archives.php'                  => 'core/archives',
					'block.php'                     => 'core/block',
					'calendar.php'                  => 'core/calendar',
					'categories.php'                => 'core/categories',
					'cover.php'                     => 'core/cover',
					'latest-comments.php'           => 'core/latest-comments',
					'latest-posts.php'              => 'core/latest-posts',
					'navigation.php'                => 'core/navigation',
					'navigation-link.php'           => 'core/navigation-link',
					'rss.php'                       => 'core/rss',
					'search.php'                    => 'core/search',
					'shortcode.php'                 => 'core/shortcode',
					'social-link.php'               => 'core/social-link',
					'tag-cloud.php'                 => 'core/tag-cloud',
					'page-list.php'                 => 'core/page-list',
					'post-author.php'               => 'core/post-author',
					'post-comment.php'              => 'core/post-comment',
					'post-comment-author.php'       => 'core/post-comment-author',
					'post-comment-content.php'      => 'core/post-comment-content',
					'post-comment-date.php'         => 'core/post-comment-date',
					'post-comments.php'             => 'core/post-comments',
					'post-comments-count.php'       => 'core/post-comments-count',
					'post-comments-form.php'        => 'core/post-comments-form',
					'post-content.php'              => 'core/post-content',
					'post-date.php'                 => 'core/post-date',
					'post-excerpt.php'              => 'core/post-excerpt',
					'post-featured-image.php'       => 'core/post-featured-image',
					'post-hierarchical-terms.php'   => 'core/post-hierarchical-terms',
					'post-navigation-link.php'      => 'core/post-navigation-link',
					'post-tags.php'                 => 'core/post-tags',
					'post-title.php'                => 'core/post-title',
					'query.php'                     => 'core/query',
					'query-loop.php'                => 'core/query-loop',
					'query-pagination.php'          => 'core/query-pagination',
					'query-pagination-next.php'     => 'core/query-pagination-next',
					'query-pagination-numbers.php'  => 'core/query-pagination-numbers',
					'query-pagination-previous.php' => 'core/query-pagination-previous',
					'site-logo.php'                 => 'core/site-logo',
					'site-tagline.php'              => 'core/site-tagline',
					'site-title.php'                => 'core/site-title',
					'template-part.php'             => 'core/template-part',
				)
			),
		),
		__DIR__ . '/../build/edit-widgets/blocks/'  => array(
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
		$block_folders = $details['block_folders'];
		$block_names   = $details['block_names'];

		$registry = WP_Block_Type_Registry::get_instance();

		foreach ( $block_folders as $folder_name ) {
			$block_json_file = $blocks_dir . $folder_name . '/block.json';

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

			gutenberg_register_core_block_styles( $folder_name );
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
				gutenberg_register_core_block_styles( $block_names );
			} elseif ( is_array( $block_names ) ) {
				foreach ( $block_names as $block_name ) {
					if ( $registry->is_registered( $block_name ) ) {
						$registry->unregister( $block_name );
					}
					gutenberg_register_core_block_styles( $block_name );
				}
			}

			require $blocks_dir . $file;
		}
	}
}

add_action( 'init', 'gutenberg_reregister_core_block_types' );

/**
 * Registers block styles for a core block.
 *
 * @param string $block_name The block-name.
 *
 * @return void
 */
function gutenberg_register_core_block_styles( $block_name ) {
	if ( ! gutenberg_should_load_separate_block_styles() ) {
		return;
	}

	$block_name = str_replace( 'core/', '', $block_name );

	$style_path        = "build/block-library/blocks/$block_name/style.css";
	$editor_style_path = "build/block-library/blocks/$block_name/style-editor.css";

	if ( file_exists( gutenberg_dir_path() . $style_path ) ) {
		wp_register_style(
			"wp-block-{$block_name}",
			gutenberg_url( $style_path ),
			array(),
			filemtime( gutenberg_dir_path() . $style_path )
		);
		wp_style_add_data( "wp-block-{$block_name}", 'rtl', 'replace' );

		// Add a reference to the stylesheet's path to allow calculations for inlining styles in `wp_head`.
		wp_style_add_data( "wp-block-{$block_name}", 'path', gutenberg_dir_path() . $style_path );
	}

	if ( file_exists( gutenberg_dir_path() . $editor_style_path ) ) {
		wp_register_style(
			"wp-block-{$block_name}-editor",
			gutenberg_url( $editor_style_path ),
			array(),
			filemtime( gutenberg_dir_path() . $editor_style_path )
		);
		wp_style_add_data( "wp-block-{$block_name}-editor", 'rtl', 'replace' );
	}
}

/**
 * Change the way styles get loaded depending on their size.
 *
 * Optimizes performance and sustainability of styles by inlining smaller stylesheets.
 *
 * @return void
 */
function gutenberg_maybe_inline_styles() {

	$total_inline_limit = 20000;
	/**
	 * The maximum size of inlined styles in bytes.
	 *
	 * @param int $total_inline_limit The file-size threshold, in bytes. Defaults to 20000.
	 * @return int                    The file-size threshold, in bytes.
	 */
	$total_inline_limit = apply_filters( 'styles_inline_size_limit', $total_inline_limit );

	global $wp_styles;
	$styles = array();

	// Build an array of styles that have a path defined.
	foreach ( $wp_styles->queue as $handle ) {
		if ( wp_styles()->get_data( $handle, 'path' ) && file_exists( $wp_styles->registered[ $handle ]->extra['path'] ) ) {
			$block_styles = false;
			$styles_size  = filesize( $wp_styles->registered[ $handle ]->extra['path'] );

			// Minify styles and get their minified size if SCRIPT_DEBUG is not enabled.
			if ( ! defined( 'SCRIPT_DEBUG' ) || ! SCRIPT_DEBUG ) {
				// Get the styles and minify them by removing comments & whitespace.
				$block_styles = gutenberg_get_minified_styles( file_get_contents( $wp_styles->registered[ $handle ]->extra['path'] ) );
				// Get the styles size.
				$styles_size = strlen( $block_styles );
			}

			$styles[] = array(
				'handle' => $handle,
				'path'   => $wp_styles->registered[ $handle ]->extra['path'],
				'size'   => $styles_size,
				'css'    => $block_styles,
			);
		}
	}

	if ( ! empty( $styles ) ) {
		// Reorder styles array based on size.
		usort(
			$styles,
			function( $a, $b ) {
				return ( $a['size'] <= $b['size'] ) ? -1 : 1;
			}
		);

		/**
		 * The total inlined size.
		 *
		 * On each iteration of the loop, if a style gets added inline the value of this var increases
		 * to reflect the total size of inlined styles.
		 */
		$total_inline_size = 0;

		// Loop styles.
		foreach ( $styles as $style ) {

			// Size check. Since styles are ordered by size, we can break the loop.
			if ( $total_inline_size + $style['size'] > $total_inline_limit ) {
				break;
			}

			// Get the styles if we don't already have them.
			$style['css'] = $style['css'] ? $style['css'] : file_get_contents( $style['path'] );

			// Set `src` to `false` and add styles inline.
			$wp_styles->registered[ $style['handle'] ]->src              = false;
			$wp_styles->registered[ $style['handle'] ]->extra['after'][] = $style['css'];

			// Add the styles size to the $total_inline_size var.
			$total_inline_size += (int) $style['size'];
		}
	}
}
add_action( 'wp_head', 'gutenberg_maybe_inline_styles', 1 );

/**
 * Minify styles.
 *
 * Removes inline comments and whitespace.
 *
 * @param string $styles The styles to be minified.
 * @return string
 */
function gutenberg_get_minified_styles( $styles ) {
	$re1 = '(?sx)("(?:[^"\\\\]++|\\\\.)*+"|\'(?:[^\'\\\\]++|\\\\.)*+\')|/\\* (?> .*? \\*/ )';
	$re2 = '(?six)("(?:[^"\\\\]++|\\\\.)*+"|\'(?:[^\'\\\\]++|\\\\.)*+\')|\\s*+ ; \\s*+ ( } ) \\s*+|\\s*+ ( [*$~^|]?+= | [{};,>~+-] | !important\\b ) \\s*+|( [[(:] ) \\s++|\\s++ ( [])] )|\\s++ ( : ) \\s*+(?!(?>[^{}"\']++|"(?:[^"\\\\]++|\\\\.)*+"|\'(?:[^\'\\\\]++|\\\\.)*+\')*+{)|^ \\s++ | \\s++ \\z|(\\s)\\s+';

	$styles = preg_replace( "%$re1%", '$1', $styles );
	return preg_replace( "%$re2%", '$1$2$3$4$5$6$7', $styles );
}

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
