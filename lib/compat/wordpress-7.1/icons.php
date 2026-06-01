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
	 *     @type int    $size  Width and height in pixels. Default 24.
	 *     @type string $class Additional CSS class names.
	 *     @type string $label Accessible label. If provided, the SVG gets
	 *                         role="img" and aria-label. If omitted, the SVG
	 *                         gets aria-hidden="true".
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

		$processor->set_attribute( 'width', (string) $args['size'] );
		$processor->set_attribute( 'height', (string) $args['size'] );
		$processor->add_class( 'wp-icon' );

		if ( ! empty( $args['class'] ) ) {
			$processor->add_class( $args['class'] );
		}

		if ( ! empty( $args['label'] ) ) {
			$processor->set_attribute( 'role', 'img' );
			$processor->set_attribute( 'aria-label', $args['label'] );
		} else {
			$processor->set_attribute( 'aria-hidden', 'true' );
		}

		return $processor->get_updated_html();
	}
}
