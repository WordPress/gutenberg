<?php
/**
 * Server-side rendering of the `core/navigation-link` block.
 *
 * @package gutenberg
 */

/**
 * Returns the top-level submenu SVG chevron icon.
 *
 * @return string
 */
function block_core_navigation_link_render_submenu_icon() {
	return '<svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" transform="rotate(90)"><path d="M8 5v14l11-7z"/><path d="M0 0h24v24H0z" fill="none"/></svg>';
}

/**
 * Renders the `core/navigation-link` block.
 *
 * @param array $content The saved content.
 * @param array $block   The parsed block.
 *
 * @return string Returns the post content with the legacy widget added.
 */
function render_block_core_navigation_link( $content, $block ) {
	if ( 'core/navigation-link' !== $block['blockName'] ) {
		return $content;
	}

	// Apply default attributes. This is currently needed because the nav link block overrides
	// block rendering using the render_block filter. It does this to gain access to
	// innerBlocks, but at the same time this bypasses prepare_attributes_for_render.
	$block_type = WP_Block_Type_Registry::get_instance()->get_registered( $block['blockName'] );
	$attributes = $block_type->prepare_attributes_for_render( $block['attrs'] );

	// Don't render the block's subtree if it has no label.
	if ( empty( $attributes['label'] ) ) {
		return '';
	}

	// TODO $classes and $style_attribute below are temporary. Ideally the Navigation Block would
	// have some way of passing its attributes to the Navigation Link so that these continue to work.
	$classes         = array( 'wp-block-navigation-link' );
	$style_attribute = '';

	$css_classes = trim( implode( ' ', $classes ) );
	$has_submenu = count( (array) $block['innerBlocks'] ) > 0;
	$is_active   = ! empty( $attributes['id'] ) && ( get_the_ID() === $attributes['id'] );

	$class_name = ! empty( $attributes['className'] ) ? implode( ' ', (array) $attributes['className'] ) : false;

	if ( false !== $class_name ) {
		$css_classes .= ' ' . $class_name;
	};

	$html = '<li class="' . esc_attr( $css_classes . ( $has_submenu ? ' has-child' : '' ) ) .
		( $is_active ? ' current-menu-item' : '' ) . '"' . $style_attribute . '>' .
		'<a class="wp-block-navigation-link__content"';

	// Start appending HTML attributes to anchor tag.
	if ( isset( $attributes['url'] ) ) {
		$html .= ' href="' . esc_url( $attributes['url'] ) . '"';
	}

	if ( isset( $attributes['opensInNewTab'] ) && true === $attributes['opensInNewTab'] ) {
		$html .= ' target="_blank"  ';
	}
	// End appending HTML attributes to anchor tag.

	// Start anchor tag content.
	$html .= '>' .
		// Wrap title with span to isolate it from submenu icon.
		'<span class="wp-block-navigation-link__label">';

	if ( isset( $attributes['label'] ) ) {
		$html .= wp_kses(
			$attributes['label'],
			array(
				'code'   => array(),
				'em'     => array(),
				'img'    => array(
					'scale' => array(),
					'class' => array(),
					'style' => array(),
					'src'   => array(),
					'alt'   => array(),
				),
				's'      => array(),
				'span'   => array(
					'style' => array(),
				),
				'strong' => array(),
			)
		);
	}

	$html .= '</span>';

	if ( $has_submenu ) {
		// The submenu icon can be hidden by a CSS rule on the Navigation Block.
		$html .= '<span class="wp-block-navigation-link__submenu-icon">' . block_core_navigation_link_render_submenu_icon() . '</span>';
	}

	$html .= '</a>';
	// End anchor tag content.

	if ( $has_submenu ) {
		$inner_blocks_html = implode( array_map( 'render_block', $block['innerBlocks'] ) );

		// TODO - classname is wrong!
		$html .= sprintf(
			'<ul class="wp-block-navigation__container">%s</ul>',
			$inner_blocks_html
		);
	}

	$html .= '</li>';

	return $html;
}

/**
 * Register the navigation link block.
 *
 */
function register_block_core_navigation_link() {
	register_block_type(
		'core/navigation-link',
		array(
			'attributes' => array(
				'label'         => array(
					'type' => 'string',
				),
				'nofollow'      => array(
					'type'    => 'boolean',
					'default' => false,
				),
				'type'          => array(
					'type' => 'string',
				),
				'description'   => array(
					'type' => 'string',
				),
				'id'            => array(
					'type' => 'number',
				),
				'opensInNewTab' => array(
					'type'    => 'boolean',
					'default' => false,
				),
				'url'           => array(
					'type' => 'string',
				),
			),
		)
	);
}
add_action( 'init', 'register_block_core_navigation_link' );
add_filter( 'render_block', 'render_block_core_navigation_link', 10, 2 );
