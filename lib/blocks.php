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
				'cover',
				'gallery',
				'group',
				'heading',
				'html',
				'home-link',
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
				'table',
				// 'table-of-contents',
				'text-columns',
				'verse',
				'video',
				'embed',
			),
			'block_names'   => array(
				'archives.php'                  => 'core/archives',
				'block.php'                     => 'core/block',
				'calendar.php'                  => 'core/calendar',
				'categories.php'                => 'core/categories',
				'file.php'                      => 'core/file',
				'latest-comments.php'           => 'core/latest-comments',
				'latest-posts.php'              => 'core/latest-posts',
				'loginout.php'                  => 'core/loginout',
				'navigation.php'                => 'core/navigation',
				'navigation-link.php'           => 'core/navigation-link',
				'home-link.php'                 => 'core/home-link',
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
				'post-comments-link.php'        => 'core/post-comments-link',
				'post-content.php'              => 'core/post-content',
				'post-date.php'                 => 'core/post-date',
				'post-excerpt.php'              => 'core/post-excerpt',
				'post-featured-image.php'       => 'core/post-featured-image',
				'post-terms.php'                => 'core/post-terms',
				'post-navigation-link.php'      => 'core/post-navigation-link',
				'post-title.php'                => 'core/post-title',
				'query.php'                     => 'core/query',
				'post-template.php'             => 'core/post-template',
				'query-title.php'               => 'core/query-title',
				'query-pagination.php'          => 'core/query-pagination',
				'query-pagination-next.php'     => 'core/query-pagination-next',
				'query-pagination-numbers.php'  => 'core/query-pagination-numbers',
				'query-pagination-previous.php' => 'core/query-pagination-previous',
				'site-logo.php'                 => 'core/site-logo',
				'site-tagline.php'              => 'core/site-tagline',
				'site-title.php'                => 'core/site-title',
				// 'table-of-contents.php'         => 'core/table-of-contents',
				'template-part.php'             => 'core/template-part',
				'term-description.php'          => 'core/term-description',
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
			),
			'block_names'   => array(
				'legacy-widget.php' => 'core/legacy-widget',
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

			gutenberg_register_core_block_assets( $folder_name );
			register_block_type_from_metadata( $block_json_file );
		}

		foreach ( $block_names as $file => $sub_block_names ) {
			if ( ! file_exists( $blocks_dir . $file ) ) {
				return;
			}

			$sub_block_names_normalized = is_string( $sub_block_names ) ? array( $sub_block_names ) : $sub_block_names;
			foreach ( $sub_block_names_normalized as $block_name ) {
				if ( $registry->is_registered( $block_name ) ) {
					$registry->unregister( $block_name );
				}
				gutenberg_register_core_block_assets( $block_name );
			}

			require_once $blocks_dir . $file;
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
function gutenberg_register_core_block_assets( $block_name ) {
	if ( ! wp_should_load_separate_core_block_assets() ) {
		return;
	}

	$block_name = str_replace( 'core/', '', $block_name );

	// When in production, use the plugin's version as the default asset version;
	// else (for development or test) default to use the current time.
	$default_version = defined( 'GUTENBERG_VERSION' ) && ! ( defined( 'SCRIPT_DEBUG' ) && SCRIPT_DEBUG ) ? GUTENBERG_VERSION : time();

	$style_path        = "build/block-library/blocks/$block_name/style.css";
	$editor_style_path = "build/block-library/blocks/$block_name/style-editor.css";

	if ( file_exists( gutenberg_dir_path() . $style_path ) ) {
		wp_deregister_style( "wp-block-{$block_name}" );
		wp_register_style(
			"wp-block-{$block_name}",
			gutenberg_url( $style_path ),
			array(),
			$default_version
		);
		wp_style_add_data( "wp-block-{$block_name}", 'rtl', 'replace' );

		// Add a reference to the stylesheet's path to allow calculations for inlining styles in `wp_head`.
		wp_style_add_data( "wp-block-{$block_name}", 'path', gutenberg_dir_path() . $style_path );
	} else {
		wp_register_style( "wp-block-{$block_name}", false );
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
				function() {
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

			if ( file_exists( gutenberg_dir_path() . $style_path ) ) {
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
