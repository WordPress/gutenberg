<?php
/**
 * Server-side rendering of the `core/archives` block.
 *
 * @package WordPress
 */

/**
 * Renders the `core/archives` block on server.
 *
 * @since 5.0.0
 *
 * @see WP_Widget_Archives
 *
 * @param array $attributes The block attributes.
 *
 * @return string Returns the post content with archives added.
 */
function render_block_core_archives( $attributes ) {
	$show_post_count = ! empty( $attributes['showPostCounts'] );
	$type            = isset( $attributes['type'] ) ? $attributes['type'] : 'monthly';

	$class = 'wp-block-archives-list';

	if ( ! empty( $attributes['displayAsDropdown'] ) ) {

		$class = 'wp-block-archives-dropdown';

		$dropdown_id = wp_unique_id( 'wp-block-archives-' );
		$title       = __( 'Archives' );

		/** This filter is documented in wp-includes/widgets/class-wp-widget-archives.php */
		$dropdown_args = apply_filters(
			'widget_archives_dropdown_args',
			array(
				'type'            => $type,
				'format'          => 'option',
				'show_post_count' => $show_post_count,
			)
		);

		$dropdown_args['echo'] = 0;

		$archives = wp_get_archives( $dropdown_args );

		$wrapper_attributes = get_block_wrapper_attributes( array( 'class' => $class ) );

		$style_attribute            = '';
		$has_classes                = [];
		$wrapper_attributes_classes = [];


		// Extract the style attribute
		if ( preg_match( '/style="([^"]+)"/', $wrapper_attributes, $matches ) ) {
			$style_attribute = $matches[1];
		}

		// Extract the class attribute
		if ( preg_match( '/class="([^"]+)"/', $wrapper_attributes, $matches ) ) {
			$classes = explode( ' ', $matches[1] );

			foreach ( $classes as $class ) {
				if ( strpos( $class, 'has-' ) === 0 ) {
					$has_classes[] = $class;
				} else {
					$wrapper_attributes_classes[] = $class;
				}
			}
		}

		// Convert arrays to strings
		$style_classes              = implode( ' ', $has_classes );
		$wrapper_attributes_classes = implode( ' ', $wrapper_attributes_classes );

		switch ( $dropdown_args['type'] ) {
			case 'yearly':
				$label = __( 'Select Year' );
				break;
			case 'monthly':
				$label = __( 'Select Month' );
				break;
			case 'daily':
				$label = __( 'Select Day' );
				break;
			case 'weekly':
				$label = __( 'Select Week' );
				break;
			default:
				$label = __( 'Select Post' );
				break;
		}

		$show_label = empty( $attributes['showLabel'] ) ? ' screen-reader-text' : '';

		$block_content = "<label for=\"{$dropdown_id}\"";

		if ( ! empty( $style_attribute ) ) {
			$block_content .= ' style="' . esc_attr( $style_attribute ) . '"';
		}


		$block_content .= ' class="wp-block-archives__label' . $show_label . ( ! empty( $style_classes ) ? ' ' . esc_attr( $style_classes ) : '' ) . '">' . esc_html( $title ) . '</label>
			<select id="' . esc_attr( $dropdown_id ) . '" name="archive-dropdown" onchange="document.location.href=this.options[this.selectedIndex].value;">
				<option value="">' . esc_html( $label ) . '</option>' . $archives . '
			</select>';


		return sprintf(
			'<div class="%1$s">%2$s</div>',
			$wrapper_attributes_classes,
			$block_content
		);
	}

	/** This filter is documented in wp-includes/widgets/class-wp-widget-archives.php */
	$archives_args = apply_filters(
		'widget_archives_args',
		array(
			'type'            => $type,
			'show_post_count' => $show_post_count,
		)
	);

	$archives_args['echo'] = 0;

	$archives = wp_get_archives( $archives_args );

	$wrapper_attributes = get_block_wrapper_attributes( array( 'class' => $class ) );

	if ( empty( $archives ) ) {
		return sprintf(
			'<div %1$s>%2$s</div>',
			$wrapper_attributes,
			__( 'No archives to show.' )
		);
	}

	return sprintf(
		'<ul %1$s>%2$s</ul>',
		$wrapper_attributes,
		$archives
	);
}

/**
 * Register archives block.
 *
 * @since 5.0.0
 */
function register_block_core_archives() {
	register_block_type_from_metadata(
		__DIR__ . '/archives',
		array(
			'render_callback' => 'render_block_core_archives',
		)
	);
}
add_action( 'init', 'register_block_core_archives' );
