<?php
/**
 * Icon rendering helper functions.
 *
 * @package gutenberg
 */

if ( ! function_exists( 'wp_get_icon' ) ) {
	/**
	 * Returns the SVG markup for a registered icon.
	 *
	 * @since 7.1.0
	 *
	 * @param string $name The namespaced icon name (e.g. 'core/plus',
	 *                     'core/arrow-down', 'my-plugin/custom-icon').
	 * @param array  $args {
	 *     Optional. Arguments for the icon.
	 *
	 *     @type int    $size  Width and height in pixels. Pass 0 to leave the
	 *                         SVG's intrinsic dimensions untouched. Default 24.
	 *     @type string $class Additional CSS class names. Multiple classes may be
	 *                         provided as a space-separated string.
	 *     @type string $label Accessible label. If provided, the SVG gets
	 *                         role="img" and aria-label. If omitted, the SVG
	 *                         gets aria-hidden="true" and focusable="false".
	 * }
	 * @return string SVG markup for the icon, or empty string if not found.
	 */
	function wp_get_icon( $name, $args = array() ) {
		$icon = WP_Icons_Registry::get_instance()->get_registered_icon( $name );
		if ( is_null( $icon ) ) {
			return '';
		}

		$svg = $icon['content'];
		if ( empty( $svg ) ) {
			return '';
		}

		$args = wp_parse_args(
			$args,
			array(
				'size'  => 24,
				'class' => '',
				'label' => '',
			)
		);

		$processor = new WP_HTML_Tag_Processor( $svg );
		if ( ! $processor->next_tag( 'svg' ) ) {
			return '';
		}

		if ( ! empty( $args['size'] ) ) {
			$processor->set_attribute( 'width', (string) $args['size'] );
			$processor->set_attribute( 'height', (string) $args['size'] );
		}

		if ( ! empty( $args['class'] ) ) {
			foreach ( preg_split( '/\s+/', $args['class'], -1, PREG_SPLIT_NO_EMPTY ) as $class_name ) {
				$processor->add_class( $class_name );
			}
		}

		if ( ! empty( $args['label'] ) ) {
			$processor->set_attribute( 'role', 'img' );
			$processor->set_attribute( 'aria-label', $args['label'] );
		} else {
			$processor->set_attribute( 'aria-hidden', 'true' );
			$processor->set_attribute( 'focusable', 'false' );
		}

		$html = $processor->get_updated_html();

		/**
		 * Filters the SVG markup returned by wp_get_icon().
		 *
		 * @since 7.1.0
		 *
		 * @param string $html The SVG markup.
		 * @param string $name The namespaced icon name.
		 * @param array  $args The arguments passed to wp_get_icon().
		 */
		return apply_filters( 'wp_icon_html', $html, $name, $args );
	}
}
