<?php

class WP_Icons_Registry_Gutenberg extends WP_Icons_Registry {
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
	 * Registers an icon.
	 *
	 * @param string $icon_name       Icon name including namespace.
	 * @param array  $icon_properties {
	 *     List of properties for the icon.
	 *
	 *     @type string $label    Required. A human-readable label for the icon.
	 *     @type string $content  Optional. SVG markup for the icon.
	 *                            If not provided, the content will be retrieved from the `filePath` if set.
	 *                            If both `content` and `filePath` are not set, the icon will not be registered.
	 *     @type string $filePath Optional. The full path to the file containing the icon content.
	 * }
	 * @return bool True if the icon was registered with success and false otherwise.
	 */
	protected function register( $icon_name, $icon_properties ) {
		if ( ! isset( $icon_name ) || ! is_string( $icon_name ) ) {
			_doing_it_wrong(
				__METHOD__,
				__( 'Icon name must be a string.', 'gutenberg' ),
				'7.0.0'
			);
			return false;
		}

		if ( preg_match( '/[A-Z]/', $icon_name ) ) {
			_doing_it_wrong(
				__METHOD__,
				__( 'Icon names must not contain uppercase characters.', 'gutenberg' ),
				'7.1.0'
			);
			return false;
		}

		$name_matcher = '/^[a-z][a-z0-9-]*\/[a-z][a-z0-9-]*$/';
		if ( ! preg_match( $name_matcher, $icon_name ) ) {
			_doing_it_wrong(
				__METHOD__,
				__( 'Icon names must contain a namespace prefix. Example: my-plugin/my-custom-icon', 'gutenberg' ),
				'7.1.0'
			);
			return false;
		}

		if ( $this->is_registered( $icon_name ) ) {
			_doing_it_wrong(
				__METHOD__,
				__( 'Icon is already registered.', 'gutenberg' ),
				'7.1.0'
			);
			return false;
		}

		$allowed_keys = array_fill_keys( array( 'label', 'content', 'filePath' ), 1 );
		foreach ( array_keys( $icon_properties ) as $key ) {
			if ( ! array_key_exists( $key, $allowed_keys ) ) {
				_doing_it_wrong(
					__METHOD__,
					sprintf(
						// translators: %s is the name of any user-provided key
						__( 'Invalid icon property: "%s".', 'gutenberg' ),
						$key
					),
					'7.0.0'
				);
				return false;
			}
		}

		if ( ! isset( $icon_properties['label'] ) || ! is_string( $icon_properties['label'] ) ) {
			_doing_it_wrong(
				__METHOD__,
				__( 'Icon label must be a string.', 'gutenberg' ),
				'7.0.0'
			);
			return false;
		}

		if (
			( ! isset( $icon_properties['content'] ) && ! isset( $icon_properties['filePath'] ) ) ||
			( isset( $icon_properties['content'] ) && isset( $icon_properties['filePath'] ) )
		) {
			_doing_it_wrong(
				__METHOD__,
				__( 'Icons must provide either `content` or `filePath`.', 'gutenberg' ),
				'7.0.0'
			);
			return false;
		}

		if ( isset( $icon_properties['content'] ) ) {
			if ( ! is_string( $icon_properties['content'] ) ) {
				_doing_it_wrong(
					__METHOD__,
					__( 'Icon content must be a string.', 'gutenberg' ),
					'7.0.0'
				);
				return false;
			}

			$sanitized_icon_content = $this->sanitize_icon_content( $icon_properties['content'] );
			if ( empty( $sanitized_icon_content ) ) {
				_doing_it_wrong(
					__METHOD__,
					__( 'Icon content does not contain valid SVG markup.', 'gutenberg' ),
					'7.0.0'
				);
				return false;
			}
		}

		$icon = array_merge(
			$icon_properties,
			array( 'name' => $icon_name )
		);

		$this->registered_icons[ $icon_name ] = $icon;

		return true;
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
	protected function sanitize_icon_content( string $icon_content ): string {
		// Core attributes applicable to most elements. `data-*` is a wildcard
		// supported by wp_kses() and matches any data attribute.
		$core_attributes = array_fill_keys(
			array( 'id', 'class', 'style', 'data-*' ),
			true
		);

		/*
		 * ARIA and accessibility attributes. wp_kses() does not support an
		 * `aria-*` wildcard, so every ARIA state and property is listed
		 * explicitly. The list mirrors the WAI-ARIA states and properties.
		 *
		 * @see https://www.w3.org/TR/wai-aria-1.2/#state_prop_def
		 */
		$aria_attributes = array_fill_keys(
			array(
				'aria-activedescendant',
				'aria-atomic',
				'aria-autocomplete',
				'aria-busy',
				'aria-checked',
				'aria-colcount',
				'aria-colindex',
				'aria-colspan',
				'aria-controls',
				'aria-current',
				'aria-describedby',
				'aria-description',
				'aria-details',
				'aria-disabled',
				'aria-dropeffect',
				'aria-errormessage',
				'aria-expanded',
				'aria-flowto',
				'aria-grabbed',
				'aria-haspopup',
				'aria-hidden',
				'aria-invalid',
				'aria-keyshortcuts',
				'aria-label',
				'aria-labelledby',
				'aria-level',
				'aria-live',
				'aria-modal',
				'aria-multiline',
				'aria-multiselectable',
				'aria-orientation',
				'aria-owns',
				'aria-placeholder',
				'aria-posinset',
				'aria-pressed',
				'aria-readonly',
				'aria-relevant',
				'aria-required',
				'aria-roledescription',
				'aria-rowcount',
				'aria-rowindex',
				'aria-rowspan',
				'aria-selected',
				'aria-setsize',
				'aria-sort',
				'aria-valuemax',
				'aria-valuemin',
				'aria-valuenow',
				'aria-valuetext',
				'role',
				'focusable',
				'tabindex',
			),
			true
		);

		// Presentation attributes for graphics elements (shapes, text, use, image).
		$presentation_attributes = array_fill_keys(
			array(
				'fill',
				'fill-opacity',
				'fill-rule',
				'stroke',
				'stroke-width',
				'stroke-linecap',
				'stroke-linejoin',
				'stroke-miterlimit',
				'stroke-dasharray',
				'stroke-dashoffset',
				'stroke-opacity',
				'opacity',
				'transform',
				'clip-path',
				'clip-rule',
				'mask',
				'filter',
				'visibility',
				'display',
				'color',
				'color-interpolation',
				'color-rendering',
				'vector-effect',
				'paint-order',
			),
			true
		);

		// Marker attributes (only for shape elements).
		$marker_attributes = array_fill_keys(
			array( 'marker-start', 'marker-mid', 'marker-end' ),
			true
		);

		// Container attributes for grouping elements.
		$container_attributes = array_fill_keys(
			array(
				'transform',
				'clip-path',
				'mask',
				'filter',
				'visibility',
				'display',
				'opacity',
			),
			true
		);

		/*
		 * Allowed tags for wp_kses(). WP_HTML_Processor::normalize() with
		 * constraints (similar structure to this array) is proposed to improve
		 * HTML/SVG sanitization in the future.
		 *
		 * @link https://github.com/dmsnell/wordpress-develop/pull/20
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
					'pathlength' => true,
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
			'view'                => array_merge(
				$core_attributes,
				array(
					'viewbox'             => true,
					'preserveaspectratio' => true,
					'zoomandpan'          => true,
					'viewtarget'          => true,
				)
			),
			'symbol'              => array_merge(
				$core_attributes,
				$aria_attributes,
				$container_attributes,
				array(
					'viewbox'             => true,
					'preserveaspectratio' => true,
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
			'switch'              => array_merge(
				$core_attributes,
				$aria_attributes,
				$container_attributes
			),
			// Linking element.
			'a'                   => array_merge(
				$core_attributes,
				$aria_attributes,
				$presentation_attributes,
				$container_attributes,
				array(
					'href'       => true,
					'xlink:href' => true,
					'target'     => true,
					'rel'        => true,
					'type'       => true,
				)
			),
			'clippath'            => array_merge(
				$core_attributes,
				array(
					'clippathunits' => true,
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
					'maskunits'        => true,
					'maskcontentunits' => true,
				)
			),
			// Gradient elements.
			'lineargradient'      => array_merge(
				$core_attributes,
				array(
					'x1'                => true,
					'x2'                => true,
					'y1'                => true,
					'y2'                => true,
					'gradientunits'     => true,
					'gradienttransform' => true,
					'spreadmethod'      => true,
					'href'              => true,
					'xlink:href'        => true,
				)
			),
			'radialgradient'      => array_merge(
				$core_attributes,
				array(
					'cx'                => true,
					'cy'                => true,
					'r'                 => true,
					'fx'                => true,
					'fy'                => true,
					'fr'                => true,
					'gradientunits'     => true,
					'gradienttransform' => true,
					'spreadmethod'      => true,
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
					'patternunits'        => true,
					'patterncontentunits' => true,
					'patterntransform'    => true,
					'viewbox'             => true,
					'preserveaspectratio' => true,
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
					'filterunits'    => true,
					'primitiveunits' => true,
				)
			),
			'feblend'             => array(
				'in'     => true,
				'in2'    => true,
				'mode'   => true,
				'result' => true,
			),
			'fecolormatrix'       => array(
				'in'     => true,
				'type'   => true,
				'values' => true,
				'result' => true,
			),
			'fecomponenttransfer' => array(
				'in'     => true,
				'result' => true,
			),
			'fecomposite'         => array(
				'in'       => true,
				'in2'      => true,
				'operator' => true,
				'k1'       => true,
				'k2'       => true,
				'k3'       => true,
				'k4'       => true,
				'result'   => true,
			),
			'feconvolvematrix'    => array(
				'in'            => true,
				'order'         => true,
				'kernelmatrix'  => true,
				'divisor'       => true,
				'bias'          => true,
				'targetx'       => true,
				'targety'       => true,
				'edgemode'      => true,
				'preservealpha' => true,
				'result'        => true,
			),
			'fediffuselighting'   => array(
				'in'              => true,
				'surfacescale'    => true,
				'diffuseconstant' => true,
				'result'          => true,
			),
			'fedisplacementmap'   => array(
				'in'               => true,
				'in2'              => true,
				'scale'            => true,
				'xchannelselector' => true,
				'ychannelselector' => true,
				'result'           => true,
			),
			'fedistantlight'      => array(
				'azimuth'   => true,
				'elevation' => true,
			),
			'feflood'             => array(
				'flood-color'   => true,
				'flood-opacity' => true,
				'result'        => true,
			),
			'fegaussianblur'      => array(
				'in'           => true,
				'stddeviation' => true,
				'edgemode'     => true,
				'result'       => true,
			),
			'feimage'             => array(
				'href'                => true,
				'xlink:href'          => true,
				'preserveaspectratio' => true,
				'result'              => true,
			),
			'femerge'             => array(
				'result' => true,
			),
			'femergenode'         => array(
				'in' => true,
			),
			'femorphology'        => array(
				'in'       => true,
				'operator' => true,
				'radius'   => true,
				'result'   => true,
			),
			'feoffset'            => array(
				'in'     => true,
				'dx'     => true,
				'dy'     => true,
				'result' => true,
			),
			'fepointlight'        => array(
				'x' => true,
				'y' => true,
				'z' => true,
			),
			'fespecularlighting'  => array(
				'in'               => true,
				'surfacescale'     => true,
				'specularconstant' => true,
				'specularexponent' => true,
				'result'           => true,
			),
			'fespotlight'         => array(
				'x'                 => true,
				'y'                 => true,
				'z'                 => true,
				'pointsatx'         => true,
				'pointsaty'         => true,
				'pointsatz'         => true,
				'specularexponent'  => true,
				'limitingconeangle' => true,
			),
			'fetile'              => array(
				'in'     => true,
				'result' => true,
			),
			'feturbulence'        => array(
				'basefrequency' => true,
				'numoctaves'    => true,
				'seed'          => true,
				'stitchtiles'   => true,
				'type'          => true,
				'result'        => true,
			),
			'fefunca'             => array(
				'type'        => true,
				'tablevalues' => true,
				'slope'       => true,
				'intercept'   => true,
				'amplitude'   => true,
				'exponent'    => true,
				'offset'      => true,
			),
			'fefuncb'             => array(
				'type'        => true,
				'tablevalues' => true,
				'slope'       => true,
				'intercept'   => true,
				'amplitude'   => true,
				'exponent'    => true,
				'offset'      => true,
			),
			'fefuncg'             => array(
				'type'        => true,
				'tablevalues' => true,
				'slope'       => true,
				'intercept'   => true,
				'amplitude'   => true,
				'exponent'    => true,
				'offset'      => true,
			),
			'fefuncr'             => array(
				'type'        => true,
				'tablevalues' => true,
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
					'textlength'         => true,
					'lengthadjust'       => true,
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
					'textlength'      => true,
					'lengthadjust'    => true,
					'text-anchor'     => true,
					'font-family'     => true,
					'font-size'       => true,
					'font-weight'     => true,
					'font-style'      => true,
					'text-decoration' => true,
				)
			),
			'textpath'            => array_merge(
				$core_attributes,
				$aria_attributes,
				$presentation_attributes,
				array(
					'href'        => true,
					'xlink:href'  => true,
					'startoffset' => true,
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
					'preserveaspectratio' => true,
				)
			),
			// Marker element.
			'marker'              => array_merge(
				$core_attributes,
				array(
					'markerunits'         => true,
					'refx'                => true,
					'refy'                => true,
					'markerwidth'         => true,
					'markerheight'        => true,
					'orient'              => true,
					'preserveaspectratio' => true,
					'viewbox'             => true,
				)
			),
			// Animation elements.
			'animate'             => array_merge(
				$core_attributes,
				array(
					'attributename' => true,
					'from'          => true,
					'to'            => true,
					'dur'           => true,
					'repeatcount'   => true,
					'begin'         => true,
					'end'           => true,
					'values'        => true,
					'keytimes'      => true,
					'keysplines'    => true,
					'calcmode'      => true,
					'additive'      => true,
					'accumulate'    => true,
				)
			),
			'animatemotion'       => array_merge(
				$core_attributes,
				array(
					'path'        => true,
					'keypoints'   => true,
					'rotate'      => true,
					'keytimes'    => true,
					'keysplines'  => true,
					'calcmode'    => true,
					'from'        => true,
					'to'          => true,
					'values'      => true,
					'dur'         => true,
					'repeatcount' => true,
					'begin'       => true,
					'end'         => true,
					'additive'    => true,
					'accumulate'  => true,
				)
			),
			'animatetransform'    => array_merge(
				$core_attributes,
				array(
					'attributename' => true,
					'type'          => true,
					'from'          => true,
					'to'            => true,
					'dur'           => true,
					'repeatcount'   => true,
					'begin'         => true,
					'end'           => true,
					'values'        => true,
					'keytimes'      => true,
					'keysplines'    => true,
					'calcmode'      => true,
					'additive'      => true,
					'accumulate'    => true,
				)
			),
			'set'                 => array_merge(
				$core_attributes,
				array(
					'attributename' => true,
					'to'            => true,
					'begin'         => true,
					'dur'           => true,
					'end'           => true,
					'repeatcount'   => true,
				)
			),
		);

		$processor = WP_HTML_Processor::create_fragment( $icon_content );
		if ( ! $processor ) {
			return '';
		}

		// Skip leading comments, XML declarations, doctype, and whitespace to
		// reach the root SVG element.
		while ( $processor->next_token() ) {
			$token_type = $processor->get_token_type();
			if ( '#tag' === $token_type ) {
				break;
			}
			if (
				'#comment' === $token_type
				|| '#doctype' === $token_type
				|| ( '#text' === $token_type && '' === trim( $processor->get_modifiable_text() ) )
			) {
				continue;
			}
			// Any other leading token (e.g. non-whitespace text) is invalid.
			return '';
		}

		if ( 'SVG' !== $processor->get_tag() ) {
			return '';
		}

		$svg   = $processor->serialize_token();
		$depth = $processor->get_current_depth();
		while ( $processor->next_token() && $processor->get_current_depth() >= $depth ) {
			$svg .= $processor->serialize_token();
		}
		if (
			null !== $processor->get_last_error()
			|| $processor->paused_at_incomplete_token()
		) {
			return '';
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

/**
 * Forces WP_Icons_Registry_Gutenberg instantiation and overrides WP_Icons_Registry
 * so that all code using WP_Icons_Registry::{method_name}() receives the Gutenberg
 * registry.
 */
function gutenberg_override_wp_icons_registry() {
	$reflection = new ReflectionClass( WP_Icons_Registry::class );
	$property   = $reflection->getProperty( 'instance' );
	/*
		* ReflectionProperty::setAccessible is:
		* - redundant as of 8.1.0, which made all properties accessible
		* - deprecated as of 8.5.0
		* - needed until 8.1.0, as property `instance` is private
		*/
	if ( PHP_VERSION_ID < 80100 ) {
		$property->setAccessible( true );
	}
	$original_registry  = $property->getValue( null );
	$gutenberg_registry = WP_Icons_Registry_Gutenberg::get_instance();

	// If the original registry was already instantiated, replay any icons outside
	// the `core/` namespace onto the Gutenberg registry so they are not lost.
	if ( null !== $original_registry ) {
		$register_method = new ReflectionMethod( WP_Icons_Registry_Gutenberg::class, 'register' );
		/*
		 * ReflectionMethod::setAccessible is:
		 * - redundant as of 8.1.0, which made all properties accessible
		 * - deprecated as of 8.5.0
		 * - needed until 8.1.0, as property `instance` is private
		 */
		if ( PHP_VERSION_ID < 80100 ) {
			$register_method->setAccessible( true );
		}
		foreach ( $original_registry->get_registered_icons() as $icon ) {
			if ( strpos( $icon['name'], 'core/' ) === 0 ) {
				continue;
			}
			$icon_properties = array( 'label' => $icon['label'] );
			if ( ! empty( $icon['content'] ) ) {
				$icon_properties['content'] = $icon['content'];
			} elseif ( ! empty( $icon['filePath'] ) ) {
				$icon_properties['filePath'] = $icon['filePath'];
			} else {
				continue;
			}
			$register_method->invoke( $gutenberg_registry, $icon['name'], $icon_properties );
		}
	}
	$property->setValue( null, $gutenberg_registry );
}
add_action( 'init', 'gutenberg_override_wp_icons_registry', 1 );
