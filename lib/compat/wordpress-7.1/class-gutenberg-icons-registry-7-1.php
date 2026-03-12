<?php

class Gutenberg_Icons_Registry_7_1 extends WP_Icons_Registry {
	/**
	 * Modified to point $manifest_path to Gutenberg packages
	 */
	protected function __construct() {
		$icons_directory = gutenberg_dir_path() . 'packages/icons/src';
		$icons_directory = trailingslashit( $icons_directory );
		$manifest_path   = $icons_directory . 'manifest.php';

		if ( ! is_readable( $manifest_path ) ) {
			wp_trigger_error(
				__METHOD__,
				__( 'Core icon collection manifest is missing or unreadable.', 'gutenberg' )
			);
			return;
		}

		$collection = include $manifest_path;

		if ( empty( $collection ) ) {
			wp_trigger_error(
				__METHOD__,
				__( 'Core icon collection manifest is empty or invalid.', 'gutenberg' )
			);
			return;
		}

		foreach ( $collection as $icon_name => $icon_data ) {
			if (
				empty( $icon_data['filePath'] )
				|| ! is_string( $icon_data['filePath'] )
			) {
				_doing_it_wrong(
					__METHOD__,
					__( 'Core icon collection manifest must provide valid a "filePath" for each icon.', 'gutenberg' ),
					'7.0.0'
				);
				return;
			}

			$this->register(
				'core/' . $icon_name,
				array(
					'label'    => $icon_data['label'],
					'filePath' => $icons_directory . $icon_data['filePath'],
				)
			);
		}
	}

	/**
	 * Sanitizes the icon SVG content.
	 *
	 * Uses WP_HTML_Processor to extract the SVG element in its entirety before
	 * applying wp_kses. This avoids issues where HTML tags like <p> inside the
	 * content would terminate the SVG element when parsed as HTML, and ensures
	 * proper handling of SVG structure including self-closing tags.
	 *
	 * @param string $icon_content The icon SVG content to sanitize.
	 * @return string The sanitized icon SVG content.
	 */
	protected function sanitize_icon_content( $icon_content ) {
		// Core attributes applicable to most elements.
		$core_attributes = array(
			'id'    => true,
			'class' => true,
			'style' => true,
		);

		// ARIA and accessibility attributes.
		$aria_attributes = array(
			'aria-hidden'      => true,
			'aria-label'       => true,
			'aria-labelledby'  => true,
			'aria-describedby' => true,
			'role'             => true,
			'focusable'        => true,
			'tabindex'         => true,
		);

		// Presentation attributes for graphics elements (shapes, text, use, image).
		$presentation_attributes = array(
			'fill'                => true,
			'fill-opacity'        => true,
			'fill-rule'           => true,
			'stroke'              => true,
			'stroke-width'        => true,
			'stroke-linecap'      => true,
			'stroke-linejoin'     => true,
			'stroke-miterlimit'   => true,
			'stroke-dasharray'    => true,
			'stroke-dashoffset'   => true,
			'stroke-opacity'      => true,
			'opacity'             => true,
			'transform'           => true,
			'clip-path'           => true,
			'clip-rule'           => true,
			'mask'                => true,
			'filter'              => true,
			'visibility'          => true,
			'display'             => true,
			'color'               => true,
			'color-interpolation' => true,
			'color-rendering'     => true,
			'vector-effect'       => true,
			'paint-order'         => true,
		);

		// Marker attributes (only for shape elements).
		$marker_attributes = array(
			'marker-start' => true,
			'marker-mid'   => true,
			'marker-end'   => true,
		);

		// Container attributes for grouping elements.
		$container_attributes = array(
			'transform'  => true,
			'clip-path'  => true,
			'mask'       => true,
			'filter'     => true,
			'visibility' => true,
			'display'    => true,
			'opacity'    => true,
		);

		/*
		 * Allowed tags for wp_kses(). Only SVG elements are permitted; foreignObject
		 * and HTML tags (e.g. p, div) are intentionally excluded as they are not
		 * valid in icon SVG content per the SVG specification.
		 *
		 * @see https://github.com/dmsnell/wordpress-develop/pull/20
		 */
		$allowed_tags = array(
			// Root SVG element.
			'svg'                 => array_merge(
				$core_attributes,
				$aria_attributes,
				$presentation_attributes,
				array(
					'xmlns'               => true,
					'xmlns:xlink'         => true,
					'width'               => true,
					'height'              => true,
					'viewbox'             => true,
					'preserveaspectratio' => true,
					'x'                   => true,
					'y'                   => true,
				)
			),
			// Basic shape elements (with markers).
			'path'                => array_merge(
				$core_attributes,
				$aria_attributes,
				$presentation_attributes,
				$marker_attributes,
				array(
					'd'          => true,
					'pathLength' => true,
				)
			),
			'circle'              => array_merge(
				$core_attributes,
				$aria_attributes,
				$presentation_attributes,
				$marker_attributes,
				array(
					'cx' => true,
					'cy' => true,
					'r'  => true,
				)
			),
			'ellipse'             => array_merge(
				$core_attributes,
				$aria_attributes,
				$presentation_attributes,
				$marker_attributes,
				array(
					'cx' => true,
					'cy' => true,
					'rx' => true,
					'ry' => true,
				)
			),
			'line'                => array_merge(
				$core_attributes,
				$aria_attributes,
				$presentation_attributes,
				$marker_attributes,
				array(
					'x1' => true,
					'x2' => true,
					'y1' => true,
					'y2' => true,
				)
			),
			'polygon'             => array_merge(
				$core_attributes,
				$aria_attributes,
				$presentation_attributes,
				$marker_attributes,
				array(
					'points' => true,
				)
			),
			'polyline'            => array_merge(
				$core_attributes,
				$aria_attributes,
				$presentation_attributes,
				$marker_attributes,
				array(
					'points' => true,
				)
			),
			'rect'                => array_merge(
				$core_attributes,
				$aria_attributes,
				$presentation_attributes,
				$marker_attributes,
				array(
					'x'      => true,
					'y'      => true,
					'width'  => true,
					'height' => true,
					'rx'     => true,
					'ry'     => true,
				)
			),
			// Grouping and structural elements.
			'g'                   => array_merge(
				$core_attributes,
				$aria_attributes,
				$container_attributes
			),
			'defs'                => $core_attributes,
			'symbol'              => array_merge(
				$core_attributes,
				$aria_attributes,
				$container_attributes,
				array(
					'viewBox'             => true,
					'preserveAspectRatio' => true,
					'x'                   => true,
					'y'                   => true,
					'width'               => true,
					'height'              => true,
				)
			),
			'use'                 => array_merge(
				$core_attributes,
				$aria_attributes,
				$presentation_attributes,
				array(
					'href'       => true,
					'xlink:href' => true,
					'x'          => true,
					'y'          => true,
					'width'      => true,
					'height'     => true,
				)
			),
			'clipPath'            => array_merge(
				$core_attributes,
				array(
					'clipPathUnits' => true,
					'transform'     => true,
				)
			),
			'mask'                => array_merge(
				$core_attributes,
				array(
					'x'                => true,
					'y'                => true,
					'width'            => true,
					'height'           => true,
					'maskUnits'        => true,
					'maskContentUnits' => true,
				)
			),
			// Gradient elements.
			'linearGradient'      => array_merge(
				$core_attributes,
				array(
					'x1'                => true,
					'x2'                => true,
					'y1'                => true,
					'y2'                => true,
					'gradientUnits'     => true,
					'gradientTransform' => true,
					'spreadMethod'      => true,
					'href'              => true,
					'xlink:href'        => true,
				)
			),
			'radialGradient'      => array_merge(
				$core_attributes,
				array(
					'cx'                => true,
					'cy'                => true,
					'r'                 => true,
					'fx'                => true,
					'fy'                => true,
					'fr'                => true,
					'gradientUnits'     => true,
					'gradientTransform' => true,
					'spreadMethod'      => true,
					'href'              => true,
					'xlink:href'        => true,
				)
			),
			'stop'                => array_merge(
				$core_attributes,
				array(
					'offset'       => true,
					'stop-color'   => true,
					'stop-opacity' => true,
				)
			),
			// Pattern element.
			'pattern'             => array_merge(
				$core_attributes,
				array(
					'x'                   => true,
					'y'                   => true,
					'width'               => true,
					'height'              => true,
					'patternUnits'        => true,
					'patternContentUnits' => true,
					'patternTransform'    => true,
					'viewBox'             => true,
					'preserveAspectRatio' => true,
					'href'                => true,
					'xlink:href'          => true,
				)
			),
			// Filter elements.
			'filter'              => array_merge(
				$core_attributes,
				array(
					'x'              => true,
					'y'              => true,
					'width'          => true,
					'height'         => true,
					'filterUnits'    => true,
					'primitiveUnits' => true,
				)
			),
			'feBlend'             => array(
				'in'     => true,
				'in2'    => true,
				'mode'   => true,
				'result' => true,
			),
			'feColorMatrix'       => array(
				'in'     => true,
				'type'   => true,
				'values' => true,
				'result' => true,
			),
			'feComponentTransfer' => array(
				'in'     => true,
				'result' => true,
			),
			'feComposite'         => array(
				'in'       => true,
				'in2'      => true,
				'operator' => true,
				'k1'       => true,
				'k2'       => true,
				'k3'       => true,
				'k4'       => true,
				'result'   => true,
			),
			'feConvolveMatrix'    => array(
				'in'            => true,
				'order'         => true,
				'kernelMatrix'  => true,
				'divisor'       => true,
				'bias'          => true,
				'targetX'       => true,
				'targetY'       => true,
				'edgeMode'      => true,
				'preserveAlpha' => true,
				'result'        => true,
			),
			'feDiffuseLighting'   => array(
				'in'              => true,
				'surfaceScale'    => true,
				'diffuseConstant' => true,
				'result'          => true,
			),
			'feDisplacementMap'   => array(
				'in'               => true,
				'in2'              => true,
				'scale'            => true,
				'xChannelSelector' => true,
				'yChannelSelector' => true,
				'result'           => true,
			),
			'feDistantLight'      => array(
				'azimuth'   => true,
				'elevation' => true,
			),
			'feFlood'             => array(
				'flood-color'   => true,
				'flood-opacity' => true,
				'result'        => true,
			),
			'feGaussianBlur'      => array(
				'in'           => true,
				'stdDeviation' => true,
				'edgeMode'     => true,
				'result'       => true,
			),
			'feImage'             => array(
				'href'                => true,
				'xlink:href'          => true,
				'preserveAspectRatio' => true,
				'result'              => true,
			),
			'feMerge'             => array(
				'result' => true,
			),
			'feMergeNode'         => array(
				'in' => true,
			),
			'feMorphology'        => array(
				'in'       => true,
				'operator' => true,
				'radius'   => true,
				'result'   => true,
			),
			'feOffset'            => array(
				'in'     => true,
				'dx'     => true,
				'dy'     => true,
				'result' => true,
			),
			'fePointLight'        => array(
				'x' => true,
				'y' => true,
				'z' => true,
			),
			'feSpecularLighting'  => array(
				'in'               => true,
				'surfaceScale'     => true,
				'specularConstant' => true,
				'specularExponent' => true,
				'result'           => true,
			),
			'feSpotLight'         => array(
				'x'                 => true,
				'y'                 => true,
				'z'                 => true,
				'pointsAtX'         => true,
				'pointsAtY'         => true,
				'pointsAtZ'         => true,
				'specularExponent'  => true,
				'limitingConeAngle' => true,
			),
			'feTile'              => array(
				'in'     => true,
				'result' => true,
			),
			'feTurbulence'        => array(
				'baseFrequency' => true,
				'numOctaves'    => true,
				'seed'          => true,
				'stitchTiles'   => true,
				'type'          => true,
				'result'        => true,
			),
			'feFuncA'             => array(
				'type'        => true,
				'tableValues' => true,
				'slope'       => true,
				'intercept'   => true,
				'amplitude'   => true,
				'exponent'    => true,
				'offset'      => true,
			),
			'feFuncB'             => array(
				'type'        => true,
				'tableValues' => true,
				'slope'       => true,
				'intercept'   => true,
				'amplitude'   => true,
				'exponent'    => true,
				'offset'      => true,
			),
			'feFuncG'             => array(
				'type'        => true,
				'tableValues' => true,
				'slope'       => true,
				'intercept'   => true,
				'amplitude'   => true,
				'exponent'    => true,
				'offset'      => true,
			),
			'feFuncR'             => array(
				'type'        => true,
				'tableValues' => true,
				'slope'       => true,
				'intercept'   => true,
				'amplitude'   => true,
				'exponent'    => true,
				'offset'      => true,
			),
			// Text elements.
			'text'                => array_merge(
				$core_attributes,
				$aria_attributes,
				$presentation_attributes,
				array(
					'x'                  => true,
					'y'                  => true,
					'dx'                 => true,
					'dy'                 => true,
					'rotate'             => true,
					'textLength'         => true,
					'lengthAdjust'       => true,
					'text-anchor'        => true,
					'font-family'        => true,
					'font-size'          => true,
					'font-weight'        => true,
					'font-style'         => true,
					'font-variant'       => true,
					'text-decoration'    => true,
					'writing-mode'       => true,
					'letter-spacing'     => true,
					'word-spacing'       => true,
					'dominant-baseline'  => true,
					'alignment-baseline' => true,
					'baseline-shift'     => true,
				)
			),
			'tspan'               => array_merge(
				$core_attributes,
				$aria_attributes,
				$presentation_attributes,
				array(
					'x'               => true,
					'y'               => true,
					'dx'              => true,
					'dy'              => true,
					'rotate'          => true,
					'textLength'      => true,
					'lengthAdjust'    => true,
					'text-anchor'     => true,
					'font-family'     => true,
					'font-size'       => true,
					'font-weight'     => true,
					'font-style'      => true,
					'text-decoration' => true,
				)
			),
			'textPath'            => array_merge(
				$core_attributes,
				$aria_attributes,
				$presentation_attributes,
				array(
					'href'        => true,
					'xlink:href'  => true,
					'startOffset' => true,
					'method'      => true,
					'spacing'     => true,
					'text-anchor' => true,
				)
			),
			// Descriptive elements.
			'title'               => array(),
			'desc'                => array(),
			'metadata'            => array(),
			// Image element.
			'image'               => array_merge(
				$core_attributes,
				$aria_attributes,
				$presentation_attributes,
				array(
					'x'                   => true,
					'y'                   => true,
					'width'               => true,
					'height'              => true,
					'href'                => true,
					'xlink:href'          => true,
					'preserveAspectRatio' => true,
				)
			),
			// Marker element.
			'marker'              => array_merge(
				$core_attributes,
				array(
					'markerUnits'         => true,
					'refX'                => true,
					'refY'                => true,
					'markerWidth'         => true,
					'markerHeight'        => true,
					'orient'              => true,
					'preserveAspectRatio' => true,
					'viewBox'             => true,
				)
			),
			// Animation elements.
			'animate'             => array_merge(
				$core_attributes,
				array(
					'attributeName' => true,
					'from'          => true,
					'to'            => true,
					'dur'           => true,
					'repeatCount'   => true,
					'begin'         => true,
					'end'           => true,
					'values'        => true,
					'keyTimes'      => true,
					'keySplines'    => true,
					'calcMode'      => true,
					'additive'      => true,
					'accumulate'    => true,
				)
			),
			'animateTransform'    => array_merge(
				$core_attributes,
				array(
					'attributeName' => true,
					'type'          => true,
					'from'          => true,
					'to'            => true,
					'dur'           => true,
					'repeatCount'   => true,
					'begin'         => true,
					'end'           => true,
					'values'        => true,
					'keyTimes'      => true,
					'keySplines'    => true,
					'calcMode'      => true,
					'additive'      => true,
					'accumulate'    => true,
				)
			),
		);

		$processor = WP_HTML_Processor::create_fragment( $icon_content );
		if ( ! $processor || ! $processor->next_token() || 'SVG' !== $processor->get_tag() ) {
			return '';
		}

		$svg   = $processor->serialize_token();
		$depth = $processor->get_current_depth();
		while ( $processor->next_token() && $processor->get_current_depth() > $depth ) {
			$svg .= $processor->serialize_token();
		}
		$svg .= '</svg>';
		return wp_kses( $svg, $allowed_tags );
	}

	/**
	 * Modified to also search in icon labels
	 */
	public function get_registered_icons( $search = '' ) {
		$icons = array();

		foreach ( $this->registered_icons as $icon ) {
			if ( ! empty( $search )
				&& false === stripos( $icon['name'], $search )
				&& false === stripos( $icon['label'], $search )
			) {
				continue;
			}

			$icon['content'] = $icon['content'] ?? $this->get_content( $icon['name'] );
			$icons[]         = $icon;
		}

		return $icons;
	}

	/**
	 * Redefined to break away from base class.
	 */
	protected static $instance = null;

	/**
	 * Redefined to access new `$instance`
	 */
	public static function get_instance() {
		if ( null === self::$instance ) {
			self::$instance = new self();
		}

		return self::$instance;
	}
}
