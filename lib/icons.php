<?php
/**
 * Icon rendering helper functions.
 *
 * @package gutenberg
 */

if ( ! function_exists( 'wp_icon' ) ) {
	/**
	 * Returns the SVG markup for an icon.
	 *
	 * Checks the Icons Registry first (covers public and third-party icons),
	 * then falls back to reading the SVG file from the icons package.
	 *
	 * @param string $name The icon slug (e.g. 'plus', 'arrow-down') or a
	 *                     namespaced icon name (e.g. 'my-plugin/custom-icon').
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
		$svg = '';

		// Determine the registry name: bare slugs get the core/ prefix.
		$registry_name = str_contains( $name, '/' ) ? $name : 'core/' . $name;

		// Try the Icons Registry first (public + third-party icons).
		$icon = WP_Icons_Registry::get_instance()->get_registered_icon( $registry_name );
		if ( ! is_null( $icon ) ) {
			$svg = $icon['content'];
		} else {
			// Fall back to reading the SVG file for non-public core icons.
			$svg_path = gutenberg_dir_path() . 'packages/icons/src/library/' . $name . '.svg';
			if ( is_readable( $svg_path ) ) {
				$svg = file_get_contents( $svg_path );
			}
		}

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
		$processor->set_attribute( 'fill', 'currentColor' );
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

if ( ! function_exists( 'the_wp_icon' ) ) {
	/**
	 * Echoes the SVG markup for an icon.
	 *
	 * @param string $name The icon slug (e.g. 'plus', 'arrow-down') or a
	 *                     namespaced icon name (e.g. 'my-plugin/custom-icon').
	 * @param array  $args Optional. Arguments for the icon. See wp_icon() for details.
	 */
	function the_wp_icon( $name, $args = array() ) {
		echo wp_icon( $name, $args );
	}
}
