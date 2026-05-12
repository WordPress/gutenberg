<?php
/**
 * Server-side rendering of the `core/post-featured-media` block.
 *
 * @package WordPress
 */

/**
 * Renders the `core/post-featured-media` block on the server.
 *
 * Returns an empty string when no featured media is set so query-loop
 * layouts can omit the figure cleanly.
 *
 * @since 7.1.0
 *
 * @param array    $attributes Block attributes.
 * @param string   $content    Block default content.
 * @param WP_Block $block      Block instance.
 * @return string HTML output, or an empty string when no featured media is set.
 */
function render_block_core_post_featured_media( $attributes, $content, $block ) {
	if ( ! isset( $block->context['postId'] ) ) {
		return '';
	}

	$post_id   = $block->context['postId'];
	$is_link   = ! empty( $attributes['isLink'] );
	$target    = $is_link
		? ( in_array( $attributes['linkTarget'] ?? '_self', array( '_self', '_blank' ), true )
			? $attributes['linkTarget']
			: '_self' )
		: '';
	$rel       = $is_link ? ( $attributes['rel'] ?? '' ) : '';
	$size_slug = $attributes['sizeSlug'] ?? 'post-thumbnail';
	$controls  = $attributes['controls'] ?? true;

	// Restrict object-fit to the CSS spec values. Unknown values fall through
	// to "don't emit object-fit at all" rather than being injected raw.
	$scale = isset( $attributes['scale'] ) && in_array(
		$attributes['scale'],
		array( 'cover', 'contain', 'fill', 'none', 'scale-down' ),
		true
	) ? $attributes['scale'] : '';

	$extra_styles = '';
	if ( ! empty( $attributes['aspectRatio'] ) ) {
		$extra_styles .= 'width:100%;height:100%;';
	} elseif ( ! empty( $attributes['height'] ) ) {
		$extra_styles .= esc_attr( safecss_filter_attr( 'height:' . $attributes['height'] ) ) . ';';
	}
	if ( $scale && ( ! empty( $attributes['height'] ) || ! empty( $attributes['aspectRatio'] ) ) ) {
		$extra_styles .= 'object-fit:' . $scale . ';';
	}
	if ( ! empty( $attributes['style']['shadow'] ) ) {
		$shadow_styles = wp_style_engine_get_styles( array( 'shadow' => $attributes['style']['shadow'] ) );
		if ( ! empty( $shadow_styles['css'] ) ) {
			$extra_styles .= $shadow_styles['css'];
		}
	}

	$overlay = render_block_core_post_featured_media_overlay( $attributes );

	$featured = function_exists( 'get_post_featured_media' )
		? get_post_featured_media( $post_id )
		: ( get_post_thumbnail_id( $post_id )
			? array(
				'id'   => (int) get_post_thumbnail_id( $post_id ),
				'type' => 'image',
			)
			: null );

	// Inherited legacy fallback: pull the first image from post content.
	if ( ! $featured && ! empty( $attributes['useFirstImageFromPost'] ) ) {
		$content_post = get_post( $post_id );
		$post_content = $content_post ? $content_post->post_content : '';
		$processor    = new WP_HTML_Tag_Processor( $post_content );
		if ( $processor->next_tag( 'img' ) ) {
			$tag_html = new WP_HTML_Tag_Processor( '<img>' );
			$tag_html->next_tag();
			foreach ( $processor->get_attribute_names_with_prefix( '' ) as $name ) {
				$tag_html->set_attribute( $name, $processor->get_attribute( $name ) );
			}
			$featured_image = $tag_html->get_updated_html();
			if ( $extra_styles ) {
				$processor = new WP_HTML_Tag_Processor( $featured_image );
				if ( $processor->next_tag( 'img' ) ) {
					$existing = $processor->get_attribute( 'style' ) ?? '';
					$processor->set_attribute( 'style', $existing . $extra_styles );
					$featured_image = $processor->get_updated_html();
				}
			}
			return render_block_core_post_featured_media_wrap(
				$featured_image,
				$attributes,
				$is_link,
				$target,
				$rel,
				$post_id,
				$overlay
			);
		}
	}

	if ( ! $featured ) {
		return '';
	}

	if ( 'image' === $featured['type'] ) {
		$attr   = array();
		$border = render_block_core_post_featured_media_border_attributes( $attributes );
		if ( ! empty( $border['class'] ) ) {
			$attr['class'] = $border['class'];
		}
		if ( ! empty( $border['style'] ) || $extra_styles ) {
			$attr['style'] = ( $border['style'] ?? '' ) . $extra_styles;
		}
		// When the image is the entire content of a post permalink, provide
		// the post title as alt text so the link has an accessible name.
		if ( $is_link ) {
			$title        = trim( wp_strip_all_tags( get_the_title( $post_id ) ) );
			$attr['alt']  = $title
				? $title
				/* translators: %d: post ID. */
				: sprintf( __( 'Untitled post %d' ), $post_id );
		}

		$featured_image = get_the_post_thumbnail( $post_id, $size_slug, $attr );
		if ( ! $featured_image ) {
			return '';
		}

		return render_block_core_post_featured_media_wrap(
			$featured_image,
			$attributes,
			$is_link,
			$target,
			$rel,
			$post_id,
			$overlay
		);
	}

	$src = wp_get_attachment_url( $featured['id'] );
	if ( ! $src ) {
		return '';
	}

	if ( 'video' === $featured['type'] ) {
		$style = 'width:100%;' . $extra_styles;
		$inner = sprintf(
			'<video src="%s" style="%s"%s></video>',
			esc_url( $src ),
			esc_attr( $style ),
			$controls ? ' controls' : ''
		);
	} elseif ( 'audio' === $featured['type'] ) {
		$style = 'width:100%;' . $extra_styles;
		$inner = sprintf(
			'<audio src="%s" style="%s"%s></audio>',
			esc_url( $src ),
			esc_attr( $style ),
			$controls ? ' controls' : ''
		);
	} else {
		return '';
	}

	return render_block_core_post_featured_media_wrap(
		$inner,
		$attributes,
		$is_link,
		$target,
		$rel,
		$post_id,
		$overlay
	);
}

/**
 * Wraps rendered featured-media HTML in an optional link and a `<figure>` element.
 *
 * The overlay element, when present, is rendered as a sibling of the media
 * inside the figure — outside the post-permalink link so its dimmed area
 * doesn't capture clicks intended for player controls or surrounding UI.
 *
 * @since 7.1.0
 *
 * @param string $inner      The media HTML (img, video, or audio element).
 * @param array  $attributes Block attributes.
 * @param bool   $is_link    Whether to wrap the media in a post permalink link.
 * @param string $target     Link target attribute value.
 * @param string $rel        Link rel attribute value.
 * @param int    $post_id    The post ID.
 * @param string $overlay    Optional. Overlay `<span>` markup to append inside the figure.
 * @return string The complete block HTML.
 */
function render_block_core_post_featured_media_wrap( $inner, $attributes, $is_link, $target, $rel, $post_id, $overlay = '' ) {
	if ( $is_link ) {
		$rel_attr = $rel ? sprintf( ' rel="%s"', esc_attr( $rel ) ) : '';
		$inner    = sprintf(
			'<a href="%s" target="%s"%s>%s</a>',
			esc_url( get_the_permalink( $post_id ) ),
			esc_attr( $target ),
			$rel_attr,
			$inner
		);
	}

	$aspect_ratio = ! empty( $attributes['aspectRatio'] )
		? esc_attr( safecss_filter_attr( 'aspect-ratio:' . $attributes['aspectRatio'] ) ) . ';'
		: '';
	$width        = ! empty( $attributes['width'] )
		? esc_attr( safecss_filter_attr( 'width:' . $attributes['width'] ) ) . ';'
		: '';
	$height       = ! empty( $attributes['height'] )
		? esc_attr( safecss_filter_attr( 'height:' . $attributes['height'] ) ) . ';'
		: '';
	$wrapper_style = $aspect_ratio . $width . $height;

	$wrapper_attributes = $wrapper_style
		? get_block_wrapper_attributes( array( 'style' => $wrapper_style ) )
		: get_block_wrapper_attributes();

	return "<figure {$wrapper_attributes}>{$inner}{$overlay}</figure>";
}

/**
 * Builds the overlay `<span>` markup for the block when an overlay is configured.
 *
 * The overlay is only emitted when `dimRatio` is non-zero — without a dim, the
 * overlay would be transparent. Color, gradient, and border are inherited from
 * the block's standard supports and serialized into class + style here.
 *
 * @since 7.1.0
 *
 * @param array $attributes Block attributes.
 * @return string Overlay markup, or an empty string when no overlay is needed.
 */
function render_block_core_post_featured_media_overlay( $attributes ) {
	if ( empty( $attributes['dimRatio'] ) ) {
		return '';
	}

	$class_names = array( 'wp-block-post-featured-media__overlay', 'has-background-dim' );
	$styles      = array();

	$class_names[] = 'has-background-dim-' . (int) $attributes['dimRatio'];

	if ( ! empty( $attributes['overlayColor'] ) ) {
		$class_names[] = 'has-' . $attributes['overlayColor'] . '-background-color';
	}
	if ( ! empty( $attributes['gradient'] ) || ! empty( $attributes['customGradient'] ) ) {
		$class_names[] = 'has-background-gradient';
	}
	if ( ! empty( $attributes['gradient'] ) ) {
		$class_names[] = 'has-' . $attributes['gradient'] . '-gradient-background';
	}

	if ( ! empty( $attributes['customGradient'] ) ) {
		$styles[] = sprintf( 'background-image:%s', $attributes['customGradient'] );
	}
	if ( ! empty( $attributes['customOverlayColor'] ) ) {
		$styles[] = sprintf( 'background-color:%s', $attributes['customOverlayColor'] );
	}

	$border = render_block_core_post_featured_media_border_attributes( $attributes );
	if ( ! empty( $border['class'] ) ) {
		$class_names[] = $border['class'];
	}
	if ( ! empty( $border['style'] ) ) {
		$styles[] = $border['style'];
	}

	return sprintf(
		'<span class="%s" style="%s" aria-hidden="true"></span>',
		esc_attr( implode( ' ', $class_names ) ),
		esc_attr( safecss_filter_attr( implode( ';', $styles ) ) )
	);
}

/**
 * Resolves the block's border support to a class/style pair via the style engine.
 *
 * @since 7.1.0
 *
 * @param array $attributes Block attributes.
 * @return array {
 *     Border-related attributes for the overlay element.
 *
 *     @type string $class Optional. Class names contributed by the style engine.
 *     @type string $style Optional. Inline CSS contributed by the style engine.
 * }
 */
function render_block_core_post_featured_media_border_attributes( $attributes ) {
	$border_styles = array();
	$sides         = array( 'top', 'right', 'bottom', 'left' );

	if ( isset( $attributes['style']['border']['radius'] ) ) {
		$border_styles['radius'] = $attributes['style']['border']['radius'];
	}
	if ( isset( $attributes['style']['border']['style'] ) ) {
		$border_styles['style'] = $attributes['style']['border']['style'];
	}
	if ( isset( $attributes['style']['border']['width'] ) ) {
		$border_styles['width'] = $attributes['style']['border']['width'];
	}

	$preset_color           = array_key_exists( 'borderColor', $attributes )
		? "var:preset|color|{$attributes['borderColor']}"
		: null;
	$custom_color           = $attributes['style']['border']['color'] ?? null;
	$border_styles['color'] = $preset_color ? $preset_color : $custom_color;

	foreach ( $sides as $side ) {
		$border                 = $attributes['style']['border'][ $side ] ?? null;
		$border_styles[ $side ] = array(
			'color' => $border['color'] ?? null,
			'style' => $border['style'] ?? null,
			'width' => $border['width'] ?? null,
		);
	}

	$styles = wp_style_engine_get_styles( array( 'border' => $border_styles ) );
	$out    = array();
	if ( ! empty( $styles['classnames'] ) ) {
		$out['class'] = $styles['classnames'];
	}
	if ( ! empty( $styles['css'] ) ) {
		$out['style'] = $styles['css'];
	}
	return $out;
}

/**
 * Registers the `core/post-featured-media` block on the server.
 *
 * @since 7.1.0
 */
function register_block_core_post_featured_media() {
	register_block_type_from_metadata(
		__DIR__ . '/post-featured-media',
		array(
			'render_callback' => 'render_block_core_post_featured_media',
		)
	);
}
add_action( 'init', 'register_block_core_post_featured_media' );

/**
 * Re-registers the legacy `core/post-featured-image` block server-side.
 *
 * The JS block parser rewrites saved `core/post-featured-image` markup to
 * `core/post-featured-media` on load, so this registration only matters for
 * raw block markup rendered server-side without a parser pass — typically
 * theme template files and patterns. Mirrors `register_legacy_post_comments_block()`.
 *
 * @since 7.1.0
 *
 * @see register_legacy_post_comments_block()
 */
function register_legacy_post_featured_image_block() {
	$registry = WP_Block_Type_Registry::get_instance();

	if ( $registry->is_registered( 'core/post-featured-image' ) ) {
		unregister_block_type( 'core/post-featured-image' );
	}

	$metadata = array(
		'name'            => 'core/post-featured-image',
		'category'        => 'theme',
		'attributes'      => array(
			'isLink'                => array(
				'type'    => 'boolean',
				'default' => false,
				'role'    => 'content',
			),
			'aspectRatio'           => array( 'type' => 'string' ),
			'width'                 => array( 'type' => 'string' ),
			'height'                => array( 'type' => 'string' ),
			'scale'                 => array(
				'type'    => 'string',
				'default' => 'cover',
			),
			'sizeSlug'              => array( 'type' => 'string' ),
			'rel'                   => array(
				'type'      => 'string',
				'attribute' => 'rel',
				'default'   => '',
				'role'      => 'content',
			),
			'linkTarget'            => array(
				'type'    => 'string',
				'default' => '_self',
				'role'    => 'content',
			),
			'overlayColor'          => array( 'type' => 'string' ),
			'customOverlayColor'    => array( 'type' => 'string' ),
			'dimRatio'              => array(
				'type'    => 'number',
				'default' => 0,
			),
			'gradient'              => array( 'type' => 'string' ),
			'customGradient'        => array( 'type' => 'string' ),
			'useFirstImageFromPost' => array(
				'type'    => 'boolean',
				'default' => false,
			),
		),
		'uses_context'    => array( 'postId', 'postType', 'queryId' ),
		'supports'        => array(
			'inserter'      => false,
			'anchor'        => true,
			'align'         => array( 'left', 'right', 'center', 'wide', 'full' ),
			'html'          => false,
			'spacing'       => array(
				'margin'  => true,
				'padding' => true,
			),
			'interactivity' => array(
				'clientNavigation' => true,
			),
		),
		'render_callback' => 'render_block_core_post_featured_media',
	);

	/** This filter is documented in wp-includes/blocks.php */
	$metadata = apply_filters( 'block_type_metadata', $metadata );

	register_block_type( 'core/post-featured-image', $metadata );
}
add_action( 'init', 'register_legacy_post_featured_image_block', 21 );
