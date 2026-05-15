<?php
/**
 * Icon rendering helper functions.
 *
 * @package gutenberg
 */

if ( ! function_exists( 'wp_icon' ) ) {
	/**
	 * Returns the SVG markup for a registered icon.
	 *
	 * @param string $name The icon slug (e.g. 'plus', 'arrow-down').
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
	function wp_icon( $name, $args = array() ) {
		static $icons_data = null;

		if ( null === $icons_data ) {
			$data_path = gutenberg_dir_path() . 'packages/icons/build-php/icons-data.php';
			if ( is_readable( $data_path ) ) {
				$icons_data = include $data_path;
			}
			if ( ! is_array( $icons_data ) ) {
				$icons_data = array();
			}
		}

		if ( ! isset( $icons_data[ $name ] ) ) {
			return '';
		}

		$icon = $icons_data[ $name ];

		$defaults = array(
			'size'  => 24,
			'class' => '',
			'label' => '',
		);

		$args = wp_parse_args( $args, $defaults );

		$size    = absint( $args['size'] );
		$viewbox = isset( $icon['viewBox'] ) ? $icon['viewBox'] : '0 0 24 24';

		$classes = 'wp-icon';
		if ( ! empty( $args['class'] ) ) {
			$classes .= ' ' . $args['class'];
		}

		$attrs = sprintf(
			'xmlns="http://www.w3.org/2000/svg" viewBox="%s" width="%d" height="%d" class="%s" fill="currentColor"',
			esc_attr( $viewbox ),
			$size,
			$size,
			esc_attr( $classes )
		);

		if ( ! empty( $args['label'] ) ) {
			$attrs .= sprintf( ' role="img" aria-label="%s"', esc_attr( $args['label'] ) );
		} else {
			$attrs .= ' aria-hidden="true"';
		}

		return sprintf( '<svg %s>%s</svg>', $attrs, $icon['content'] );
	}
}

if ( ! function_exists( 'the_wp_icon' ) ) {
	/**
	 * Echoes the SVG markup for a registered icon.
	 *
	 * @param string $name The icon slug (e.g. 'plus', 'arrow-down').
	 * @param array  $args Optional. Arguments for the icon. See wp_icon() for details.
	 */
	function the_wp_icon( $name, $args = array() ) {
		echo wp_icon( $name, $args );
	}
}
