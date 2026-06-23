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
					'label'     => $icon_data['label'],
					'file_path' => $icons_directory . $icon_data['filePath'],
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
	 *                            If not provided, the content will be retrieved from the `file_path` if set.
	 *                            If both `content` and `file_path` are not set, the icon will not be registered.
	 *     @type string $file_path Optional. The full path to the file containing the icon content.
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

		$allowed_keys = array_fill_keys( array( 'label', 'content', 'file_path' ), 1 );
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
			( ! isset( $icon_properties['content'] ) && ! isset( $icon_properties['file_path'] ) ) ||
			( isset( $icon_properties['content'] ) && isset( $icon_properties['file_path'] ) )
		) {
			_doing_it_wrong(
				__METHOD__,
				__( 'Icons must provide either `content` or `file_path`.', 'gutenberg' ),
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
	 * Builds the allowed attribute list for wp_kses() from attribute names.
	 *
	 * @param non-empty-string ...$attribute_names Attribute names to allow.
	 * @return array<non-empty-string, true> Attribute names mapped to true.
	 */
	private function get_allowed_attribute_list( ...$attribute_names ): array {
		return array_fill_keys( $attribute_names, true );
	}

	/**
	 * Sanitizes the icon SVG content.
	 *
	 * Uses WP_HTML_Processor to extract the SVG element in its entirety before
	 * applying wp_kses. This avoids issues where HTML tags like <p> inside the
	 * content would terminate the SVG element when parsed as HTML, and ensures
	 * proper handling of SVG structure including self-closing tags.
	 *
	 * The signature is intentionally left without type declarations to stay
	 * compatible with the parent WP_Icons_Registry::sanitize_icon_content()
	 * shipped in WordPress core, which declares none.
	 *
	 * @param string $icon_content The icon SVG content to sanitize.
	 * @return string The sanitized icon SVG content.
	 */
	protected function sanitize_icon_content( $icon_content ) {
		// Core attributes applicable to most elements. `data-*` is a wildcard
		// supported by wp_kses() and matches any data attribute.
		$core_attributes = $this->get_allowed_attribute_list( 'class', 'data-*', 'id', 'style' );

		/**
		 * ARIA and accessibility attributes. wp_kses() does not support an
		 * `aria-*` wildcard, so every ARIA state and property is listed
		 * explicitly. The list mirrors the WAI-ARIA states and properties.
		 *
		 * @link https://www.w3.org/TR/wai-aria-1.2/#state_prop_def
		 */
		$aria_attributes = $this->get_allowed_attribute_list(
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
			'focusable',
			'role',
			'tabindex',
		);

		// Presentation attributes for graphics elements (shapes, text, use, image).
		$presentation_attributes = $this->get_allowed_attribute_list(
			'clip-path',
			'clip-rule',
			'color',
			'color-interpolation',
			'color-rendering',
			'display',
			'fill',
			'fill-opacity',
			'fill-rule',
			'filter',
			'mask',
			'opacity',
			'paint-order',
			'stroke',
			'stroke-dasharray',
			'stroke-dashoffset',
			'stroke-linecap',
			'stroke-linejoin',
			'stroke-miterlimit',
			'stroke-opacity',
			'stroke-width',
			'transform',
			'vector-effect',
			'visibility',
		);

		// Marker attributes (only for shape elements).
		$marker_attributes = $this->get_allowed_attribute_list( 'marker-end', 'marker-mid', 'marker-start' );

		// Container attributes for grouping elements.
		$container_attributes = $this->get_allowed_attribute_list(
			'clip-path',
			'display',
			'filter',
			'mask',
			'opacity',
			'transform',
			'visibility',
		);

		/**
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
				$this->get_allowed_attribute_list(
					'height',
					'preserveaspectratio',
					'viewbox',
					'width',
					'x',
					'xmlns',
					'xmlns:xlink',
					'y',
				)
			),
			// Basic shape elements (with markers).
			'path'                => array_merge(
				$core_attributes,
				$aria_attributes,
				$presentation_attributes,
				$marker_attributes,
				$this->get_allowed_attribute_list(
					'd',
					'pathlength',
				)
			),
			'circle'              => array_merge(
				$core_attributes,
				$aria_attributes,
				$presentation_attributes,
				$marker_attributes,
				$this->get_allowed_attribute_list(
					'cx',
					'cy',
					'r',
				)
			),
			'ellipse'             => array_merge(
				$core_attributes,
				$aria_attributes,
				$presentation_attributes,
				$marker_attributes,
				$this->get_allowed_attribute_list(
					'cx',
					'cy',
					'rx',
					'ry',
				)
			),
			'line'                => array_merge(
				$core_attributes,
				$aria_attributes,
				$presentation_attributes,
				$marker_attributes,
				$this->get_allowed_attribute_list(
					'x1',
					'x2',
					'y1',
					'y2',
				)
			),
			'polygon'             => array_merge(
				$core_attributes,
				$aria_attributes,
				$presentation_attributes,
				$marker_attributes,
				$this->get_allowed_attribute_list(
					'points',
				)
			),
			'polyline'            => array_merge(
				$core_attributes,
				$aria_attributes,
				$presentation_attributes,
				$marker_attributes,
				$this->get_allowed_attribute_list(
					'points',
				)
			),
			'rect'                => array_merge(
				$core_attributes,
				$aria_attributes,
				$presentation_attributes,
				$marker_attributes,
				$this->get_allowed_attribute_list(
					'height',
					'rx',
					'ry',
					'width',
					'x',
					'y',
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
				$this->get_allowed_attribute_list(
					'preserveaspectratio',
					'viewbox',
					'viewtarget',
					'zoomandpan',
				)
			),
			'symbol'              => array_merge(
				$core_attributes,
				$aria_attributes,
				$container_attributes,
				$this->get_allowed_attribute_list(
					'height',
					'preserveaspectratio',
					'viewbox',
					'width',
					'x',
					'y',
				)
			),
			'use'                 => array_merge(
				$core_attributes,
				$aria_attributes,
				$presentation_attributes,
				$this->get_allowed_attribute_list(
					'height',
					'href',
					'width',
					'x',
					'xlink:href',
					'y',
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
				$this->get_allowed_attribute_list(
					'href',
					'rel',
					'target',
					'type',
					'xlink:href',
				)
			),
			'clippath'            => array_merge(
				$core_attributes,
				$this->get_allowed_attribute_list(
					'clippathunits',
					'transform',
				)
			),
			'mask'                => array_merge(
				$core_attributes,
				$this->get_allowed_attribute_list(
					'height',
					'maskcontentunits',
					'maskunits',
					'width',
					'x',
					'y',
				)
			),
			// Gradient elements.
			'lineargradient'      => array_merge(
				$core_attributes,
				$this->get_allowed_attribute_list(
					'gradienttransform',
					'gradientunits',
					'href',
					'spreadmethod',
					'x1',
					'x2',
					'xlink:href',
					'y1',
					'y2',
				)
			),
			'radialgradient'      => array_merge(
				$core_attributes,
				$this->get_allowed_attribute_list(
					'cx',
					'cy',
					'fr',
					'fx',
					'fy',
					'gradienttransform',
					'gradientunits',
					'href',
					'r',
					'spreadmethod',
					'xlink:href',
				)
			),
			'stop'                => array_merge(
				$core_attributes,
				$this->get_allowed_attribute_list(
					'offset',
					'stop-color',
					'stop-opacity',
				)
			),
			// Pattern element.
			'pattern'             => array_merge(
				$core_attributes,
				$this->get_allowed_attribute_list(
					'height',
					'href',
					'patterncontentunits',
					'patterntransform',
					'patternunits',
					'preserveaspectratio',
					'viewbox',
					'width',
					'x',
					'xlink:href',
					'y',
				)
			),
			// Filter elements.
			'filter'              => array_merge(
				$core_attributes,
				$this->get_allowed_attribute_list(
					'filterunits',
					'height',
					'primitiveunits',
					'width',
					'x',
					'y',
				)
			),
			'feblend'             => $this->get_allowed_attribute_list(
				'in',
				'in2',
				'mode',
				'result',
			),
			'fecolormatrix'       => $this->get_allowed_attribute_list(
				'in',
				'result',
				'type',
				'values',
			),
			'fecomponenttransfer' => $this->get_allowed_attribute_list(
				'in',
				'result',
			),
			'fecomposite'         => $this->get_allowed_attribute_list(
				'in',
				'in2',
				'k1',
				'k2',
				'k3',
				'k4',
				'operator',
				'result',
			),
			'feconvolvematrix'    => $this->get_allowed_attribute_list(
				'bias',
				'divisor',
				'edgemode',
				'in',
				'kernelmatrix',
				'order',
				'preservealpha',
				'result',
				'targetx',
				'targety',
			),
			'fediffuselighting'   => $this->get_allowed_attribute_list(
				'diffuseconstant',
				'in',
				'result',
				'surfacescale',
			),
			'fedisplacementmap'   => $this->get_allowed_attribute_list(
				'in',
				'in2',
				'result',
				'scale',
				'xchannelselector',
				'ychannelselector',
			),
			'fedistantlight'      => $this->get_allowed_attribute_list(
				'azimuth',
				'elevation',
			),
			'feflood'             => $this->get_allowed_attribute_list(
				'flood-color',
				'flood-opacity',
				'result',
			),
			'fegaussianblur'      => $this->get_allowed_attribute_list(
				'edgemode',
				'in',
				'result',
				'stddeviation',
			),
			'feimage'             => $this->get_allowed_attribute_list(
				'href',
				'preserveaspectratio',
				'result',
				'xlink:href',
			),
			'femerge'             => $this->get_allowed_attribute_list(
				'result',
			),
			'femergenode'         => $this->get_allowed_attribute_list(
				'in',
			),
			'femorphology'        => $this->get_allowed_attribute_list(
				'in',
				'operator',
				'radius',
				'result',
			),
			'feoffset'            => $this->get_allowed_attribute_list(
				'dx',
				'dy',
				'in',
				'result',
			),
			'fepointlight'        => $this->get_allowed_attribute_list(
				'x',
				'y',
				'z',
			),
			'fespecularlighting'  => $this->get_allowed_attribute_list(
				'in',
				'result',
				'specularconstant',
				'specularexponent',
				'surfacescale',
			),
			'fespotlight'         => $this->get_allowed_attribute_list(
				'limitingconeangle',
				'pointsatx',
				'pointsaty',
				'pointsatz',
				'specularexponent',
				'x',
				'y',
				'z',
			),
			'fetile'              => $this->get_allowed_attribute_list(
				'in',
				'result',
			),
			'feturbulence'        => $this->get_allowed_attribute_list(
				'basefrequency',
				'numoctaves',
				'result',
				'seed',
				'stitchtiles',
				'type',
			),
			'fefunca'             => $this->get_allowed_attribute_list(
				'amplitude',
				'exponent',
				'intercept',
				'offset',
				'slope',
				'tablevalues',
				'type',
			),
			'fefuncb'             => $this->get_allowed_attribute_list(
				'amplitude',
				'exponent',
				'intercept',
				'offset',
				'slope',
				'tablevalues',
				'type',
			),
			'fefuncg'             => $this->get_allowed_attribute_list(
				'amplitude',
				'exponent',
				'intercept',
				'offset',
				'slope',
				'tablevalues',
				'type',
			),
			'fefuncr'             => $this->get_allowed_attribute_list(
				'amplitude',
				'exponent',
				'intercept',
				'offset',
				'slope',
				'tablevalues',
				'type',
			),
			// Text elements.
			'text'                => array_merge(
				$core_attributes,
				$aria_attributes,
				$presentation_attributes,
				$this->get_allowed_attribute_list(
					'alignment-baseline',
					'baseline-shift',
					'dominant-baseline',
					'dx',
					'dy',
					'font-family',
					'font-size',
					'font-style',
					'font-variant',
					'font-weight',
					'lengthadjust',
					'letter-spacing',
					'rotate',
					'text-anchor',
					'text-decoration',
					'textlength',
					'word-spacing',
					'writing-mode',
					'x',
					'y',
				)
			),
			'tspan'               => array_merge(
				$core_attributes,
				$aria_attributes,
				$presentation_attributes,
				$this->get_allowed_attribute_list(
					'dx',
					'dy',
					'font-family',
					'font-size',
					'font-style',
					'font-weight',
					'lengthadjust',
					'rotate',
					'text-anchor',
					'text-decoration',
					'textlength',
					'x',
					'y',
				)
			),
			'textpath'            => array_merge(
				$core_attributes,
				$aria_attributes,
				$presentation_attributes,
				$this->get_allowed_attribute_list(
					'href',
					'method',
					'spacing',
					'startoffset',
					'text-anchor',
					'xlink:href',
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
				$this->get_allowed_attribute_list(
					'height',
					'href',
					'preserveaspectratio',
					'width',
					'x',
					'xlink:href',
					'y',
				)
			),
			// Marker element.
			'marker'              => array_merge(
				$core_attributes,
				$this->get_allowed_attribute_list(
					'markerheight',
					'markerunits',
					'markerwidth',
					'orient',
					'preserveaspectratio',
					'refx',
					'refy',
					'viewbox',
				)
			),
			// Animation elements.
			'animate'             => array_merge(
				$core_attributes,
				$this->get_allowed_attribute_list(
					'accumulate',
					'additive',
					'attributename',
					'begin',
					'calcmode',
					'dur',
					'end',
					'from',
					'keysplines',
					'keytimes',
					'repeatcount',
					'to',
					'values',
				)
			),
			'animatemotion'       => array_merge(
				$core_attributes,
				$this->get_allowed_attribute_list(
					'accumulate',
					'additive',
					'begin',
					'calcmode',
					'dur',
					'end',
					'from',
					'keypoints',
					'keysplines',
					'keytimes',
					'path',
					'repeatcount',
					'rotate',
					'to',
					'values',
				)
			),
			'animatetransform'    => array_merge(
				$core_attributes,
				$this->get_allowed_attribute_list(
					'accumulate',
					'additive',
					'attributename',
					'begin',
					'calcmode',
					'dur',
					'end',
					'from',
					'keysplines',
					'keytimes',
					'repeatcount',
					'to',
					'type',
					'values',
				)
			),
			'set'                 => array_merge(
				$core_attributes,
				$this->get_allowed_attribute_list(
					'attributename',
					'begin',
					'dur',
					'end',
					'repeatcount',
					'to',
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

		// Require the SVG namespace to reject a foreign-namespaced `<svg>`.
		if ( 'SVG' !== $processor->get_tag() || 'svg' !== $processor->get_namespace() ) {
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
	 * Redefined to read the icon content from the `file_path` property.
	 *
	 * @param string $icon_name Icon name including namespace.
	 * @return string|null The content of the icon, if found.
	 */
	protected function get_content( $icon_name ) {
		if ( ! isset( $this->registered_icons[ $icon_name ]['content'] ) ) {
			$content = file_get_contents(
				$this->registered_icons[ $icon_name ]['file_path']
			);
			$content = $this->sanitize_icon_content( $content );

			if ( empty( $content ) ) {
				wp_trigger_error(
					__METHOD__,
					__( 'Icon content does not contain valid SVG markup.', 'gutenberg' )
				);
				return null;
			}

			$this->registered_icons[ $icon_name ]['content'] = $content;
		}
		return $this->registered_icons[ $icon_name ]['content'];
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
			} elseif ( ! empty( $icon['file_path'] ) ) {
				$icon_properties['file_path'] = $icon['file_path'];
			} else {
				continue;
			}
			$register_method->invoke( $gutenberg_registry, $icon['name'], $icon_properties );
		}
	}
	$property->setValue( null, $gutenberg_registry );
}
add_action( 'init', 'gutenberg_override_wp_icons_registry', 1 );
