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

	$block_folders = array(
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
		'widget-area',
	);

	$block_names = array(
		'archives.php'        => 'core/archives',
		'block.php'           => 'core/block',
		'calendar.php'        => 'core/calendar',
		'categories.php'      => 'core/categories',
		'cover.php'           => 'core/cover',
		'latest-comments.php' => 'core/latest-comments',
		'latest-posts.php'    => 'core/latest-posts',
		'legacy-widget.php'   => 'core/legacy-widget',
		'navigation.php'      => 'core/navigation',
		'navigation-link.php' => 'core/navigation-link',
		'rss.php'             => 'core/rss',
		'search.php'          => 'core/search',
		'shortcode.php'       => 'core/shortcode',
		'social-link.php'     => 'core/social-link',
		'tag-cloud.php'       => 'core/tag-cloud',
	);

	if ( gutenberg_is_experiment_enabled( 'gutenberg-full-site-editing' ) ) {
		$block_names = array_merge(
			$block_names,
			array(
				'post-author.php'         => 'core/post-author',
				'post-comments.php'       => 'core/post-comments',
				'post-comments-count.php' => 'core/post-comments-count',
				'post-comments-form.php'  => 'core/post-comments-form',
				'post-content.php'        => 'core/post-content',
				'post-date.php'           => 'core/post-date',
				'post-excerpt.php'        => 'core/post-excerpt',
				'post-featured-image.php' => 'core/post-featured-image',
				'post-tags.php'           => 'core/post-tags',
				'post-title.php'          => 'core/post-title',
				'query.php'               => 'core/query',
				'query-loop.php'          => 'core/query-loop',
				'query-pagination.php'    => 'core/query-pagination',
				'site-logo.php'           => 'core/site-logo',
				'site-title.php'          => 'core/site-title',
				'template-part.php'       => 'core/template-part',
			)
		);
	}

	$registry = WP_Block_Type_Registry::get_instance();

	foreach ( $block_folders as $folder_name ) {
		$block_json_file = $blocks_dir . '/' . $folder_name . '/block.json';
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

/**
 * Renders the classNames and styles for blocks
 *
 * @param string $block_content Output of the current block.
 * @param array  $block Block Object.
 * @return string New block output.
 */
function gutenberg_experimental_apply_classnames_and_styles( $block_content, $block ) {
	if ( ! isset( $block['attrs'] ) ) {
		return $block_content;
	}

	$block_type = WP_Block_Type_Registry::get_instance()->get_registered( $block['blockName'] );
	// If no render_callback, assume styles have been previously handled.
	if ( ! $block_type || ! $block_type->render_callback ) {
		return $block_content;
	}
	// Check what style features the block supports.
	$supports = gutenberg_experimental_global_styles_get_supported_styles( $block_type->supports );

	$attributes = array();
	$attributes = gutenberg_experimental_build_css_colors( $attributes, $block['attrs'], $supports );
	$attributes = gutenberg_experimental_build_css_typography( $attributes, $block['attrs'], $supports );

	if ( ! count( $attributes ) ) {
		return $block_content;
	}

	$dom = new DOMDocument( '1.0', 'utf-8' );

	// Suppress warnings from this method from polluting the front-end.
	// @codingStandardsIgnoreStart
	if ( ! @$dom->loadHTML( $block_content, LIBXML_HTML_NOIMPLIED | LIBXML_HTML_NODEFDTD | LIBXML_COMPACT ) ) {
	// @codingStandardsIgnoreEnd
		return $block_content;
	}

	$xpath      = new DOMXPath( $dom );
	$block_root = $xpath->query( '/*' )[0];

	if ( empty( $block_root ) ) {
		return $block_content;
	}

	// Some inline styles may be added without ending ';', add this if necessary.
	$current_styles = trim( $block_root->getAttribute( 'style' ), ' ' );
	if ( strlen( $current_styles ) > 0 && substr( $current_styles, -1 ) !== ';' ) {
		$current_styles = $current_styles . ';';
	};

	// Merge and dedupe new and existing classes and styles.
	$classes_to_add = esc_attr( implode( ' ', array_key_exists( 'css_classes', $attributes ) ? $attributes['css_classes'] : array() ) );
	$styles_to_add  = esc_attr( implode( ' ', array_key_exists( 'inline_styles', $attributes ) ? $attributes['inline_styles'] : array() ) );
	$new_classes    = implode( ' ', array_unique( explode( ' ', ltrim( $block_root->getAttribute( 'class' ) . ' ' ) . $classes_to_add ) ) );
	$new_styles     = implode( ' ', array_unique( explode( ' ', $current_styles . ' ' . $styles_to_add ) ) );

	// Apply new styles and classes.
	if ( ! empty( $new_classes ) ) {
		$block_root->setAttribute( 'class', $new_classes );
	}

	if ( ! empty( $new_styles ) ) {
		$block_root->setAttribute( 'style', $new_styles );
	}

	return $dom->saveHtml();
}
add_filter( 'render_block', 'gutenberg_experimental_apply_classnames_and_styles', 10, 2 );

/**
 * Build an array with CSS classes and inline styles defining the colors
 * which will be applied to the block markup in the front-end.
 *
 * @param  array $attributes comprehensive list of attributes to be applied.
 * @param  array $block_attributes block attributes.
 * @param  array $supports style features the block attributes.
 * @return array Colors CSS classes and inline styles.
 */
function gutenberg_experimental_build_css_colors( $attributes, $block_attributes, $supports ) {
	// Text Colors.
	// Check support for text colors.
	if ( in_array( 'color', $supports, true ) ) {
		$has_named_text_color  = array_key_exists( 'textColor', $block_attributes );
		$has_custom_text_color = isset( $block_attributes['style']['color']['text'] );

		// Apply required generic class.
		if ( $has_custom_text_color || $has_named_text_color ) {
			$attributes['css_classes'][] = 'has-text-color';
		}
		// Apply color class or inline style.
		if ( $has_named_text_color ) {
			$attributes['css_classes'][] = sprintf( 'has-%s-color', $block_attributes['textColor'] );
		} elseif ( $has_custom_text_color ) {
			$attributes['inline_styles'][] = sprintf( 'color: %s;', $block_attributes['style']['color']['text'] );
		}
	}

	// Link Colors.
	if ( in_array( 'link-color', $supports, true ) ) {
		$has_link_color = isset( $block_attributes['style']['color']['link'] );
		// Apply required class and style.
		if ( $has_link_color ) {
			$attributes['css_classes'][] = 'has-link-color';
			// If link is a named color.
			if ( strpos( $block_attributes['style']['color']['link'], 'var:preset|color|' ) !== false ) {
				// Get the name from the string and add proper styles.
				$index_to_splice               = strrpos( $block_attributes['style']['color']['link'], '|' ) + 1;
				$link_color_name               = substr( $block_attributes['style']['color']['link'], $index_to_splice );
				$attributes['inline_styles'][] = sprintf( '--wp--style--color--link:var(--wp--preset--color--%s);', $link_color_name );
			} else {
				$attributes['inline_styles'][] = sprintf( '--wp--style--color--link: %s;', $block_attributes['style']['color']['link'] );
			}
		}
	}

	// Background Colors.
	if ( in_array( 'background-color', $supports, true ) ) {
		$has_named_background_color  = array_key_exists( 'backgroundColor', $block_attributes );
		$has_custom_background_color = isset( $block_attributes['style']['color']['background'] );

		// Apply required background class.
		if ( $has_custom_background_color || $has_named_background_color ) {
			$attributes['css_classes'][] = 'has-background';
		}
		// Apply background color classes or styles.
		if ( $has_named_background_color ) {
			$attributes['css_classes'][] = sprintf( 'has-%s-background-color', $block_attributes['backgroundColor'] );
		} elseif ( $has_custom_background_color ) {
			$attributes['inline_styles'][] = sprintf( 'background-color: %s;', $block_attributes['style']['color']['background'] );
		}
	}

	// Gradients.
	if ( in_array( 'background', $supports, true ) ) {
		$has_named_gradient  = array_key_exists( 'gradient', $block_attributes );
		$has_custom_gradient = isset( $block_attributes['style']['color']['gradient'] );

		if ( $has_named_gradient || $has_custom_gradient ) {
			$attributes['css_classes'][] = 'has-background';
		}
		// Apply required background class.
		if ( $has_named_gradient ) {
			$attributes['css_classes'][] = sprintf( 'has-%s-gradient-background', $block_attributes['gradient'] );
		} elseif ( $has_custom_gradient ) {
			$attributes['inline_styles'][] = sprintf( 'background: %s;', $block_attributes['style']['color']['gradient'] );
		}
	}

	return $attributes;
}

/**
 * Build an array with CSS classes and inline styles defining the font sizes
 * which will be applied to the block markup in the front-end.
 *
 * @param  array $attributes comprehensive list of attributes to be applied.
 * @param  array $block_attributes block attributes.
 * @param  array $supports style features the block attributes.
 * @return array Font size CSS classes and inline styles.
 */
function gutenberg_experimental_build_css_typography( $attributes, $block_attributes, $supports ) {
	// Font Size.
	if ( in_array( 'font-size', $supports, true ) ) {
		$has_named_font_size  = array_key_exists( 'fontSize', $block_attributes );
		$has_custom_font_size = isset( $block_attributes['style']['typography']['fontSize'] );

		// Apply required class or style.
		if ( $has_named_font_size ) {
			$attributes['css_classes'][] = sprintf( 'has-%s-font-size', $block_attributes['fontSize'] );
		} elseif ( $has_custom_font_size ) {
			$attributes['inline_styles'][] = sprintf( 'font-size: %spx;', $block_attributes['style']['typography']['fontSize'] );
		}
	}

	// Line Height.
	if ( in_array( 'line-height', $supports, true ) ) {
		$has_line_height = isset( $block_attributes['style']['typography']['lineHeight'] );
		// Add the style (no classes for line-height).
		if ( $has_line_height ) {
			$attributes['inline_styles'][] = sprintf( 'line-height: %s;', $block_attributes['style']['typography']['lineHeight'] );
		}
	}

	return $attributes;
}
