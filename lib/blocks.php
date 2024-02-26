<?php
/**
 * Block functions specific for the Gutenberg editor plugin.
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
				'details',
				'form-input',
				'form-submit-button',
				'group',
				'html',
				'list',
				'list-item',
				'media-text',
				'missing',
				'more',
				'nextpage',
				'paragraph',
				'preformatted',
				'pullquote',
				'quote',
				'separator',
				'social-links',
				'spacer',
				'table',
				'table-of-contents',
				'text-columns',
				'verse',
				'video',
				'embed',
			),
			'block_names'   => array(
				'archives.php'                     => 'core/archives',
				'avatar.php'                       => 'core/avatar',
				'block.php'                        => 'core/block',
				'calendar.php'                     => 'core/calendar',
				'categories.php'                   => 'core/categories',
				'cover.php'                        => 'core/cover',
				'comment-author-avatar.php'        => 'core/comment-author-avatar',
				'comment-author-name.php'          => 'core/comment-author-name',
				'comment-content.php'              => 'core/comment-content',
				'comment-date.php'                 => 'core/comment-date',
				'comment-edit-link.php'            => 'core/comment-edit-link',
				'comment-reply-link.php'           => 'core/comment-reply-link',
				'comment-template.php'             => 'core/comment-template',
				'comments-pagination.php'          => 'core/comments-pagination',
				'comments-pagination-next.php'     => 'core/comments-pagination-next',
				'comments-pagination-numbers.php'  => 'core/comments-pagination-numbers',
				'comments-pagination-previous.php' => 'core/comments-pagination-previous',
				'comments-title.php'               => 'core/comments-title',
				'comments.php'                     => 'core/comments',
				'footnotes.php'                    => 'core/footnotes',
				'file.php'                         => 'core/file',
				'form.php'                         => 'core/form',
				'form-input.php'                   => 'core/form-input',
				'form-submission-notification.php' => 'core/form-submission-notification',
				'home-link.php'                    => 'core/home-link',
				'image.php'                        => 'core/image',
				'gallery.php'                      => 'core/gallery',
				'heading.php'                      => 'core/heading',
				'latest-comments.php'              => 'core/latest-comments',
				'latest-posts.php'                 => 'core/latest-posts',
				'loginout.php'                     => 'core/loginout',
				'navigation.php'                   => 'core/navigation',
				'navigation-link.php'              => 'core/navigation-link',
				'navigation-submenu.php'           => 'core/navigation-submenu',
				'page-list.php'                    => 'core/page-list',
				'page-list-item.php'               => 'core/page-list-item',
				'pattern.php'                      => 'core/pattern',
				'post-author.php'                  => 'core/post-author',
				'post-author-name.php'             => 'core/post-author-name',
				'post-author-biography.php'        => 'core/post-author-biography',
				'post-comment.php'                 => 'core/post-comment',
				'post-comments-count.php'          => 'core/post-comments-count',
				'post-comments-form.php'           => 'core/post-comments-form',
				'post-comments-link.php'           => 'core/post-comments-link',
				'post-content.php'                 => 'core/post-content',
				'post-date.php'                    => 'core/post-date',
				'post-excerpt.php'                 => 'core/post-excerpt',
				'post-featured-image.php'          => 'core/post-featured-image',
				'post-navigation-link.php'         => 'core/post-navigation-link',
				'post-terms.php'                   => 'core/post-terms',
				'post-time-to-read.php'            => 'core/post-time-to-read',
				'post-title.php'                   => 'core/post-title',
				'query.php'                        => 'core/query',
				'post-template.php'                => 'core/post-template',
				'query-no-results.php'             => 'core/query-no-results',
				'query-pagination.php'             => 'core/query-pagination',
				'query-pagination-next.php'        => 'core/query-pagination-next',
				'query-pagination-numbers.php'     => 'core/query-pagination-numbers',
				'query-pagination-previous.php'    => 'core/query-pagination-previous',
				'query-title.php'                  => 'core/query-title',
				'read-more.php'                    => 'core/read-more',
				'rss.php'                          => 'core/rss',
				'search.php'                       => 'core/search',
				'shortcode.php'                    => 'core/shortcode',
				'social-link.php'                  => 'core/social-link',
				'site-logo.php'                    => 'core/site-logo',
				'site-tagline.php'                 => 'core/site-tagline',
				'site-title.php'                   => 'core/site-title',
				'tag-cloud.php'                    => 'core/tag-cloud',
				'template-part.php'                => 'core/template-part',
				'term-description.php'             => 'core/term-description',
			),
		),
		__DIR__ . '/../build/edit-widgets/blocks/'  => array(
			'block_folders' => array(
				'widget-area',
			),
			'block_names'   => array(),
		),
		__DIR__ . '/../build/widgets/blocks/'       => array(
			'block_folders' => array(
				'legacy-widget',
				'widget-group',
			),
			'block_names'   => array(
				'legacy-widget.php' => 'core/legacy-widget',
				'widget-group.php'  => 'core/widget-group',
			),
		),
	);
	foreach ( $blocks_dirs as $blocks_dir => $details ) {
		$block_folders = $details['block_folders'];
		$block_names   = $details['block_names'];

		foreach ( $block_folders as $folder_name ) {
			$block_json_file = $blocks_dir . $folder_name . '/block.json';

			// Ideally, all paths to block metadata files should be listed in
			// WordPress core. In this place we should rather use filter
			// to replace paths with overrides defined by the plugin.
			$metadata = json_decode( file_get_contents( $block_json_file ), true );
			if ( ! is_array( $metadata ) || ! $metadata['name'] ) {
				continue;
			}

			gutenberg_deregister_core_block_and_assets( $metadata['name'] );
			gutenberg_register_core_block_assets( $folder_name );
			register_block_type_from_metadata( $block_json_file );
		}

		foreach ( $block_names as $file => $sub_block_names ) {
			if ( ! file_exists( $blocks_dir . $file ) ) {
				continue;
			}

			$sub_block_names_normalized = is_string( $sub_block_names ) ? array( $sub_block_names ) : $sub_block_names;
			foreach ( $sub_block_names_normalized as $block_name ) {
				gutenberg_deregister_core_block_and_assets( $block_name );
				gutenberg_register_core_block_assets( $block_name );
			}

			require_once $blocks_dir . $file;
		}
	}
}

add_action( 'init', 'gutenberg_reregister_core_block_types' );

/**
 * Adds the defer loading strategy to all registered blocks.
 *
 * This function would not be part of core merge. Instead, the register_block_script_handle() function would be patched
 * as follows.
 *
 * ```
 * --- a/wp-includes/blocks.php
 * +++ b/wp-includes/blocks.php
 * @ @ -153,7 +153,8 @ @ function register_block_script_handle( $metadata, $field_name, $index = 0 ) {
 *                 $script_handle,
 *                 $script_uri,
 *                 $script_dependencies,
 * -           isset( $script_asset['version'] ) ? $script_asset['version'] : false
 * +         isset( $script_asset['version'] ) ? $script_asset['version'] : false,
 * +         array( 'strategy' => 'defer' )
 *         );
 *         if ( ! $result ) {
 *                 return false;
 * ```
 *
 * @see register_block_script_handle()
 */
function gutenberg_defer_block_view_scripts() {
	$block_types = WP_Block_Type_Registry::get_instance()->get_all_registered();
	foreach ( $block_types as $block_type ) {
		foreach ( $block_type->view_script_handles as $view_script_handle ) {
			wp_script_add_data( $view_script_handle, 'strategy', 'defer' );
		}
	}
}

add_action( 'init', 'gutenberg_defer_block_view_scripts', 100 );

/**
 * Deregisters the existing core block type and its assets.
 *
 * @param string $block_name The name of the block.
 *
 * @return void
 */
function gutenberg_deregister_core_block_and_assets( $block_name ) {
	$registry = WP_Block_Type_Registry::get_instance();
	if ( $registry->is_registered( $block_name ) ) {
		$block_type = $registry->get_registered( $block_name );
		if ( ! empty( $block_type->view_script_handles ) ) {
			foreach ( $block_type->view_script_handles as $view_script_handle ) {
				if ( str_starts_with( $view_script_handle, 'wp-block-' ) ) {
					wp_deregister_script( $view_script_handle );
				}
			}
		}
		$registry->unregister( $block_name );
	}
}

/**
 * Registers block styles for a core block.
 *
 * @param string $block_name The block-name.
 *
 * @return void
 */
function gutenberg_register_core_block_assets( $block_name ) {
	if ( ! wp_should_load_separate_core_block_assets() ) {
		return;
	}

	$block_name = str_replace( 'core/', '', $block_name );

	// When in production, use the plugin's version as the default asset version;
	// else (for development or test) default to use the current time.
	$default_version = defined( 'GUTENBERG_VERSION' ) && ! SCRIPT_DEBUG ? GUTENBERG_VERSION : time();

	$style_path      = "build/block-library/blocks/$block_name/";
	$stylesheet_url  = gutenberg_url( $style_path . 'style.css' );
	$stylesheet_path = gutenberg_dir_path() . $style_path . ( is_rtl() ? 'style-rtl.css' : 'style.css' );

	if ( file_exists( $stylesheet_path ) ) {
		wp_deregister_style( "wp-block-{$block_name}" );
		wp_register_style(
			"wp-block-{$block_name}",
			$stylesheet_url,
			array(),
			$default_version
		);
		wp_style_add_data( "wp-block-{$block_name}", 'rtl', 'replace' );

		// Add a reference to the stylesheet's path to allow calculations for inlining styles in `wp_head`.
		wp_style_add_data( "wp-block-{$block_name}", 'path', $stylesheet_path );
	} else {
		wp_register_style( "wp-block-{$block_name}", false, array() );
	}

	// If the current theme supports wp-block-styles, dequeue the full stylesheet
	// and instead attach each block's theme-styles to their block styles stylesheet.
	if ( current_theme_supports( 'wp-block-styles' ) ) {

		// Dequeue the full stylesheet.
		// Make sure this only runs once, it doesn't need to run for every block.
		static $stylesheet_removed;
		if ( ! $stylesheet_removed ) {
			add_action(
				'wp_enqueue_scripts',
				static function () {
					wp_dequeue_style( 'wp-block-library-theme' );
				}
			);
			$stylesheet_removed = true;
		}

		// Get the path to the block's stylesheet.
		$theme_style_path = is_rtl()
			? "build/block-library/blocks/$block_name/theme-rtl.css"
			: "build/block-library/blocks/$block_name/theme.css";

		// If the file exists, enqueue it.
		if ( file_exists( gutenberg_dir_path() . $theme_style_path ) ) {

			if ( file_exists( $stylesheet_path ) ) {
				// If there is a main stylesheet for this block, append the theme styles to main styles.
				wp_add_inline_style(
					"wp-block-{$block_name}",
					file_get_contents( gutenberg_dir_path() . $theme_style_path )
				);
			} else {
				// If there is no main stylesheet for this block, register theme style.
				wp_register_style(
					"wp-block-{$block_name}",
					gutenberg_url( $theme_style_path ),
					array(),
					$default_version
				);
				wp_style_add_data( "wp-block-{$block_name}", 'path', gutenberg_dir_path() . $theme_style_path );
			}
		}
	}

	$editor_style_path = "build/block-library/blocks/$block_name/style-editor.css";
	if ( file_exists( gutenberg_dir_path() . $editor_style_path ) ) {
		wp_deregister_style( "wp-block-{$block_name}-editor" );
		wp_register_style(
			"wp-block-{$block_name}-editor",
			gutenberg_url( $editor_style_path ),
			array(),
			$default_version
		);
		wp_style_add_data( "wp-block-{$block_name}-editor", 'rtl', 'replace' );
	} else {
		wp_register_style( "wp-block-{$block_name}-editor", false );
	}
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
 * This shim is INTENTIONALLY left out of core, as Social Links have never
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

/**
 * Migrate the legacy `sync_status` meta key (added 16.1) to the new `wp_pattern_sync_status` meta key (16.1.1).
 *
 * This filter is INTENTIONALLY left out of core as the meta key was fist introduced to core in 6.3 as `wp_pattern_sync_status`.
 * see https://github.com/WordPress/gutenberg/pull/52232
 *
 * @param mixed  $value     The value to return, either a single metadata value or an array of values depending on the value of $single.
 * @param int    $object_id ID of the object metadata is for.
 * @param string $meta_key  Metadata key.
 * @param bool   $single    Whether to return only the first value of the specified $meta_key.
 */
function gutenberg_legacy_wp_block_post_meta( $value, $object_id, $meta_key, $single ) {
	if ( 'wp_pattern_sync_status' !== $meta_key ) {
		return $value;
	}

	$sync_status = get_post_meta( $object_id, 'sync_status', $single );

	if ( $single && 'unsynced' === $sync_status ) {
		return $sync_status;
	} elseif ( isset( $sync_status[0] ) && 'unsynced' === $sync_status[0] ) {
		return $sync_status;
	}

	return $value;
}

add_filter( 'default_post_metadata', 'gutenberg_legacy_wp_block_post_meta', 10, 4 );



/**
 * Strips all HTML from the content of footnotes, and sanitizes the ID.
 *
 * This function expects slashed data on the footnotes content.
 *
 * @access private
 *
 * @param string $footnotes JSON encoded string of an array containing the content and ID of each footnote.
 * @return string Filtered content without any HTML on the footnote content and with the sanitized id.
 */
function _gutenberg_filter_post_meta_footnotes( $footnotes ) {
	$footnotes_decoded = json_decode( $footnotes, true );
	if ( ! is_array( $footnotes_decoded ) ) {
		return '';
	}
	$footnotes_sanitized = array();
	foreach ( $footnotes_decoded as $footnote ) {
		if ( ! empty( $footnote['content'] ) && ! empty( $footnote['id'] ) ) {
			$footnotes_sanitized[] = array(
				'id'      => sanitize_key( $footnote['id'] ),
				'content' => wp_unslash( wp_filter_post_kses( wp_slash( $footnote['content'] ) ) ),
			);
		}
	}
	return wp_json_encode( $footnotes_sanitized );
}

/**
 * Adds the filters to filter footnotes meta field.
 *
 * @access private
 */
function _gutenberg_footnotes_kses_init_filters() {
	add_filter( 'sanitize_post_meta_footnotes', '_gutenberg_filter_post_meta_footnotes' );
}

/**
 * Removes the filters that filter footnotes meta field.
 *
 * @access private
 */
function _gutenberg_footnotes_remove_filters() {
	remove_filter( 'sanitize_post_meta_footnotes', '_gutenberg_filter_post_meta_footnotes' );
}

/**
 * Registers the filter of footnotes meta field if the user does not have unfiltered_html capability.
 *
 * @access private
 */
function _gutenberg_footnotes_kses_init() {
	if ( function_exists( '_wp_filter_post_meta_footnotes' ) ) {
		return;
	}
	_gutenberg_footnotes_remove_filters();
	if ( ! current_user_can( 'unfiltered_html' ) ) {
		_gutenberg_footnotes_kses_init_filters();
	}
}

/**
 * Initializes footnotes meta field filters when imported data should be filtered.
 *
 * This filter is the last being executed on force_filtered_html_on_import.
 * If the input of the filter is true it means we are in an import situation and should
 * enable kses, independently of the user capabilities.
 * So in that case we call _gutenberg_footnotes_kses_init_filters;
 *
 * @access private
 *
 * @param string $arg Input argument of the filter.
 * @return string Input argument of the filter.
 */
function _gutenberg_footnotes_force_filtered_html_on_import_filter( $arg ) {
	if ( function_exists( '_wp_filter_post_meta_footnotes' ) ) {
		return;
	}
	// force_filtered_html_on_import is true we need to init the global styles kses filters.
	if ( $arg ) {
		_gutenberg_footnotes_kses_init_filters();
	}
	return $arg;
}

add_action( 'init', '_gutenberg_footnotes_kses_init' );
add_action( 'set_current_user', '_gutenberg_footnotes_kses_init' );
add_filter( 'force_filtered_html_on_import', '_gutenberg_footnotes_force_filtered_html_on_import_filter', 999 );
