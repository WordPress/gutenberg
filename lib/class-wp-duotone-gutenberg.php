<?php
/**
 * WP_Duotone_Gutenberg class
 *
 * Parts of this source were derived and modified from colord,
 * released under the MIT license.
 *
 * https://github.com/omgovich/colord
 *
 * Copyright (c) 2020 Vlad Shilov omgovich@ya.ru
 *
 * Permission is hereby granted, free of charge, to any person obtaining
 * a copy of this software and associated documentation files (the
 * "Software"), to deal in the Software without restriction, including
 * without limitation the rights to use, copy, modify, merge, publish,
 * distribute, sublicense, and/or sell copies of the Software, and to
 * permit persons to whom the Software is furnished to do so, subject to
 * the following conditions:
 *
 * The above copyright notice and this permission notice shall be
 * included in all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND,
 * EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
 * MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND
 * NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE
 * LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION
 * OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION
 * WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
 *
 * @package gutenberg
 * @since 6.3.0
 */

/**
 * Manages which duotone filters need to be output on the page.
 *
 * @access public
 */
class WP_Duotone_Gutenberg {
	/**
	 * An array of Duotone presets from global, theme, and custom styles.
	 *
	 * Example:
	 * [
	 *      'blue-orange' =>
	 *          [
	 *              'slug'  => 'blue-orange',
	 *              'colors' => [ '#0000ff', '#ffcc00' ],
	 *          ]
	 *      ],
	 *      …
	 * ]
	 *
	 * @since 6.3.0
	 * @var array
	 */
	private static $global_styles_presets = array();

	/**
	 * An array of block names from global, theme, and custom styles that have duotone presets. We'll use this to quickly
	 * check if a block being rendered needs to have duotone applied, and which duotone preset to use.
	 *
	 * Example:
	 *  [
	 *      'core/featured-image' => 'blue-orange',
	 *       …
	 *  ]
	 *
	 * @since 6.3.0
	 * @var array
	 */
	private static $global_styles_block_names = array();

	/**
	 * An array of Duotone SVG and CSS output needed for the frontend duotone rendering based on what is
	 * being output on the page. Organized by a slug of the preset/color group and the information needed
	 * to generate the SVG and CSS at render.
	 *
	 * Example:
	 *  [
	 *      'blue-orange' => [
	 *          'slug'  => 'blue-orange',
	 *          'colors' => [ '#0000ff', '#ffcc00' ],
	 *      ],
	 *      'wp-duotone-000000-ffffff-2' => [
	 *          'slug' => 'wp-duotone-000000-ffffff-2',
	 *          'colors' => [ '#000000', '#ffffff' ],
	 *      ],
	 * ]
	 *
	 * @since 6.3.0
	 * @var array
	 */
	private static $output = array();

	/**
	 * Prefix used for generating and referencing duotone CSS custom properties.
	 */
	const CSS_VAR_PREFIX = '--wp--preset--duotone--';

	/**
	 * Prefix used for generating and referencing duotone filter IDs.
	 */
	const FILTER_ID_PREFIX = 'wp-duotone-';

	/**
	 * Direct port of colord's clamp function. Using min/max instead of
	 * nested ternaries.
	 *
	 * @see https://github.com/omgovich/colord/blob/3f859e03b0ca622eb15480f611371a0f15c9427f/src/helpers.ts#L23
	 *
	 * @param float $number The number to clamp.
	 * @param float $min   The minimum value.
	 * @param float $max   The maximum value.
	 * @return float The clamped value.
	 */
	private static function colord_clamp( $number, $min = 0, $max = 1 ) {
		return $number > $max ? $max : ( $number > $min ? $number : $min );
	}

	/**
	 * Direct port of colord's clampHue function.
	 *
	 * @see https://github.com/omgovich/colord/blob/3f859e03b0ca622eb15480f611371a0f15c9427f/src/helpers.ts#L32
	 *
	 * @param float $degrees The hue to clamp.
	 * @return float The clamped hue.
	 */
	private static function colord_clamp_hue( $degrees ) {
		$degrees = is_finite( $degrees ) ? $degrees % 360 : 0;
		return $degrees > 0 ? $degrees : $degrees + 360;
	}

	/**
	 * Direct port of colord's parseHue function.
	 *
	 * @see https://github.com/omgovich/colord/blob/3f859e03b0ca622eb15480f611371a0f15c9427f/src/helpers.ts#L40
	 *
	 * @param float  $value The hue value to parse.
	 * @param string $unit  The unit of the hue value.
	 * @return float The parsed hue value.
	 */
	private static function colord_parse_hue( $value, $unit = 'deg' ) {
		$angle_units = array(
			'grad' => 360 / 400,
			'turn' => 360,
			'rad'  => 360 / ( M_PI * 2 ),
		);

		$factor = $angle_units[ $unit ];
		if ( ! $factor ) {
			$factor = 1;
		}

		return (float) $value * $factor;
	}

	/**
	 * Direct port of colord's parseHex function.
	 *
	 * @see https://github.com/omgovich/colord/blob/3f859e03b0ca622eb15480f611371a0f15c9427f/src/colorModels/hex.ts#L8
	 *
	 * @param string $hex The hex string to parse.
	 * @return array|null An array of RGBA values or null if the hex string is invalid.
	 */
	private static function colord_parse_hex( $hex ) {
		$is_match = preg_match(
			'/^#([0-9a-f]{3,8})$/i',
			$hex,
			$hex_match
		);

		if ( ! $is_match ) {
			return null;
		}

		$hex = $hex_match[1];

		if ( 4 >= strlen( $hex ) ) {
			return array(
				'r' => (int) base_convert( $hex[0] . $hex[0], 16, 10 ),
				'g' => (int) base_convert( $hex[1] . $hex[1], 16, 10 ),
				'b' => (int) base_convert( $hex[2] . $hex[2], 16, 10 ),
				'a' => 4 === strlen( $hex ) ? round( base_convert( $hex[3] . $hex[3], 16, 10 ) / 255, 2 ) : 1,
			);
		}

		if ( 6 === strlen( $hex ) || 8 === strlen( $hex ) ) {
			return array(
				'r' => (int) base_convert( substr( $hex, 0, 2 ), 16, 10 ),
				'g' => (int) base_convert( substr( $hex, 2, 2 ), 16, 10 ),
				'b' => (int) base_convert( substr( $hex, 4, 2 ), 16, 10 ),
				'a' => 8 === strlen( $hex ) ? round( (int) base_convert( substr( $hex, 6, 2 ), 16, 10 ) / 255, 2 ) : 1,
			);
		}

		return null;
	}

	/**
	 * Direct port of colord's clampRgba function.
	 *
	 * @see https://github.com/omgovich/colord/blob/3f859e03b0ca622eb15480f611371a0f15c9427f/src/colorModels/rgb.ts#L5
	 *
	 * @param array $rgba The RGBA array to clamp.
	 * @return array The clamped RGBA array.
	 */
	private static function colord_clamp_rgba( $rgba ) {
		$rgba['r'] = self::colord_clamp( $rgba['r'], 0, 255 );
		$rgba['g'] = self::colord_clamp( $rgba['g'], 0, 255 );
		$rgba['b'] = self::colord_clamp( $rgba['b'], 0, 255 );
		$rgba['a'] = self::colord_clamp( $rgba['a'] );

		return $rgba;
	}

	/**
	 * Direct port of colord's parseRgbaString function.
	 *
	 * @see https://github.com/omgovich/colord/blob/3f859e03b0ca622eb15480f611371a0f15c9427f/src/colorModels/rgbString.ts#L18
	 *
	 * @param string $input The RGBA string to parse.
	 * @return array|null An array of RGBA values or null if the RGB string is invalid.
	 */
	private static function colord_parse_rgba_string( $input ) {
		// Functional syntax.
		$is_match = preg_match(
			'/^rgba?\(\s*([+-]?\d*\.?\d+)(%)?\s*,\s*([+-]?\d*\.?\d+)(%)?\s*,\s*([+-]?\d*\.?\d+)(%)?\s*(?:,\s*([+-]?\d*\.?\d+)(%)?\s*)?\)$/i',
			$input,
			$match
		);

		if ( ! $is_match ) {
			// Whitespace syntax.
			$is_match = preg_match(
				'/^rgba?\(\s*([+-]?\d*\.?\d+)(%)?\s+([+-]?\d*\.?\d+)(%)?\s+([+-]?\d*\.?\d+)(%)?\s*(?:\/\s*([+-]?\d*\.?\d+)(%)?\s*)?\)$/i',
				$input,
				$match
			);
		}

		if ( ! $is_match ) {
			return null;
		}

		// For some reason, preg_match doesn't include empty matches at the end
		// of the array, so we add them manually to make things easier later.
		for ( $i = 1; $i <= 8; $i++ ) {
			if ( ! isset( $match[ $i ] ) ) {
				$match[ $i ] = '';
			}
		}

		if ( $match[2] !== $match[4] || $match[4] !== $match[6] ) {
			return null;
		}

		return self::colord_clamp_rgba(
			array(
				'r' => (float) $match[1] / ( $match[2] ? 100 / 255 : 1 ),
				'g' => (float) $match[3] / ( $match[4] ? 100 / 255 : 1 ),
				'b' => (float) $match[5] / ( $match[6] ? 100 / 255 : 1 ),
				'a' => '' === $match[7] ? 1 : (float) $match[7] / ( $match[8] ? 100 : 1 ),
			)
		);
	}

	/**
	 * Direct port of colord's clampHsla function.
	 *
	 * @see https://github.com/omgovich/colord/blob/3f859e03b0ca622eb15480f611371a0f15c9427f/src/colorModels/hsl.ts#L6
	 *
	 * @param array $hsla The HSLA array to clamp.
	 * @return array The clamped HSLA array.
	 */
	private static function colord_clamp_hsla( $hsla ) {
		$hsla['h'] = self::colord_clamp_hue( $hsla['h'] );
		$hsla['s'] = self::colord_clamp( $hsla['s'], 0, 100 );
		$hsla['l'] = self::colord_clamp( $hsla['l'], 0, 100 );
		$hsla['a'] = self::colord_clamp( $hsla['a'] );

		return $hsla;
	}

	/**
	 * Direct port of colord's hsvaToRgba function.
	 *
	 * @see https://github.com/omgovich/colord/blob/3f859e03b0ca622eb15480f611371a0f15c9427f/src/colorModels/hsv.ts#L52
	 *
	 * @param array $hsva The HSVA array to convert.
	 * @return array The RGBA array.
	 */
	private static function colord_hsva_to_rgba( $hsva ) {
		$h = ( $hsva['h'] / 360 ) * 6;
		$s = $hsva['s'] / 100;
		$v = $hsva['v'] / 100;
		$a = $hsva['a'];

		$hh     = floor( $h );
		$b      = $v * ( 1 - $s );
		$c      = $v * ( 1 - ( $h - $hh ) * $s );
		$d      = $v * ( 1 - ( 1 - $h + $hh ) * $s );
		$module = $hh % 6;

		return array(
			'r' => array( $v, $c, $b, $b, $d, $v )[ $module ] * 255,
			'g' => array( $d, $v, $v, $c, $b, $b )[ $module ] * 255,
			'b' => array( $b, $b, $d, $v, $v, $c )[ $module ] * 255,
			'a' => $a,
		);
	}

	/**
	 * Direct port of colord's hslaToHsva function.
	 *
	 * @see https://github.com/omgovich/colord/blob/3f859e03b0ca622eb15480f611371a0f15c9427f/src/colorModels/hsl.ts#L33
	 *
	 * @param array $hsla The HSLA array to convert.
	 * @return array The HSVA array.
	 */
	private static function colord_hsla_to_hsva( $hsla ) {
		$h = $hsla['h'];
		$s = $hsla['s'];
		$l = $hsla['l'];
		$a = $hsla['a'];

		$s *= ( $l < 50 ? $l : 100 - $l ) / 100;

		return array(
			'h' => $h,
			's' => $s > 0 ? ( ( 2 * $s ) / ( $l + $s ) ) * 100 : 0,
			'v' => $l + $s,
			'a' => $a,
		);
	}

	/**
	 * Direct port of colord's hslaToRgba function.
	 *
	 * @see https://github.com/omgovich/colord/blob/3f859e03b0ca622eb15480f611371a0f15c9427f/src/colorModels/hsl.ts#L55
	 *
	 * @param array $hsla The HSLA array to convert.
	 * @return array The RGBA array.
	 */
	private static function colord_hsla_to_rgba( $hsla ) {
		return self::colord_hsva_to_rgba( self::colord_hsla_to_hsva( $hsla ) );
	}

	/**
	 * Direct port of colord's parseHslaString function.
	 *
	 * @see https://github.com/omgovich/colord/blob/3f859e03b0ca622eb15480f611371a0f15c9427f/src/colorModels/hslString.ts#L17
	 *
	 * @param string $input The HSLA string to parse.
	 * @return array|null An array of RGBA values or null if the RGB string is invalid.
	 */
	private static function colord_parse_hsla_string( $input ) {
		// Functional syntax.
		$is_match = preg_match(
			'/^hsla?\(\s*([+-]?\d*\.?\d+)(deg|rad|grad|turn)?\s*,\s*([+-]?\d*\.?\d+)%\s*,\s*([+-]?\d*\.?\d+)%\s*(?:,\s*([+-]?\d*\.?\d+)(%)?\s*)?\)$/i',
			$input,
			$match
		);

		if ( ! $is_match ) {
			// Whitespace syntax.
			$is_match = preg_match(
				'/^hsla?\(\s*([+-]?\d*\.?\d+)(deg|rad|grad|turn)?\s+([+-]?\d*\.?\d+)%\s+([+-]?\d*\.?\d+)%\s*(?:\/\s*([+-]?\d*\.?\d+)(%)?\s*)?\)$/i',
				$input,
				$match
			);
		}

		if ( ! $is_match ) {
			return null;
		}

		// For some reason, preg_match doesn't include empty matches at the end
		// of the array, so we add them manually to make things easier later.
		for ( $i = 1; $i <= 6; $i++ ) {
			if ( ! isset( $match[ $i ] ) ) {
				$match[ $i ] = '';
			}
		}

		$hsla = self::colord_clamp_hsla(
			array(
				'h' => self::colord_parse_hue( $match[1], $match[2] ),
				's' => (float) $match[3],
				'l' => (float) $match[4],
				'a' => '' === $match[5] ? 1 : (float) $match[5] / ( $match[6] ? 100 : 1 ),
			)
		);

		return self::colord_hsla_to_rgba( $hsla );
	}

	/**
	 * Direct port of colord's parse function simplified for our use case. This
	 * version only supports string parsing and only returns RGBA values.
	 *
	 * @see https://github.com/omgovich/colord/blob/3f859e03b0ca622eb15480f611371a0f15c9427f/src/parse.ts#L37
	 *
	 * @param string $input The string to parse.
	 * @return array|null An array of RGBA values or null if the string is invalid.
	 */
	private static function colord_parse( $input ) {
		$result = self::colord_parse_hex( $input );

		if ( ! $result ) {
			$result = self::colord_parse_rgba_string( $input );
		}

		if ( ! $result ) {
			$result = self::colord_parse_hsla_string( $input );
		}

		return $result;
	}

	/**
	 * Get all possible duotone presets from global and theme styles and store as slug => [ colors array ]
	 * We only want to process this one time. On block render we'll access and output only the needed presets for that page.
	 */
	public static function set_global_styles_presets() {
		// Get the per block settings from the theme.json.
		$tree              = gutenberg_get_global_settings();
		$presets_by_origin = _wp_array_get( $tree, array( 'color', 'duotone' ), array() );

		foreach ( $presets_by_origin as $presets ) {
			foreach ( $presets as $preset ) {
				self::$global_styles_presets[ _wp_to_kebab_case( $preset['slug'] ) ] = array(
					'slug'   => $preset['slug'],
					'colors' => $preset['colors'],
				);
			}
		}
	}

	/**
	 * Scrape all block names from global styles and store in self::$global_styles_block_names
	 */
	public static function set_global_style_block_names() {
		// Get the per block settings from the theme.json.
		$tree        = WP_Theme_JSON_Resolver_Gutenberg::get_merged_data();
		$block_nodes = $tree->get_styles_block_nodes();
		$theme_json  = $tree->get_raw_data();

		foreach ( $block_nodes as $block_node ) {
			// This block definition doesn't include any duotone settings. Skip it.
			if ( empty( $block_node['duotone'] ) ) {
				continue;
			}

			// Value looks like this: 'var(--wp--preset--duotone--blue-orange)' or 'var:preset|duotone|default-filter'.
			$duotone_attr_path = array_merge( $block_node['path'], array( 'filter', 'duotone' ) );
			$duotone_attr      = _wp_array_get( $theme_json, $duotone_attr_path, array() );

			if ( empty( $duotone_attr ) ) {
				continue;
			}
			// If it has a duotone filter preset, save the block name and the preset slug.
			$slug = self::gutenberg_get_slug_from_attr( $duotone_attr );

			if ( $slug && $slug !== $duotone_attr ) {
				self::$global_styles_block_names[ $block_node['name'] ] = $slug;
			}
		}
	}

	/**
	 * Take the inline CSS duotone variable from a block and return the slug. Handles styles slugs like:
	 * var:preset|duotone|default-filter
	 * var(--wp--preset--duotone--blue-orange)
	 *
	 * @param string $duotone_attr The duotone attribute from a block.
	 * @return string The slug of the duotone preset or an empty string if no slug is found.
	 */
	private static function gutenberg_get_slug_from_attr( $duotone_attr ) {
		// Uses Branch Reset Groups `(?|…)` to return one capture group.
		preg_match( '/(?|var:preset\|duotone\|(\S+)|var\(--wp--preset--duotone--(\S+)\))/', $duotone_attr, $matches );

		return ! empty( $matches[1] ) ? $matches[1] : '';
	}

	/**
	 * Check if we have a valid duotone preset.
	 *
	 * @param string $duotone_attr The duotone attribute from a block.
	 * @return bool True if the duotone preset present and valid.
	 */
	private static function is_preset( $duotone_attr ) {
		$slug = self::gutenberg_get_slug_from_attr( $duotone_attr );

		return array_key_exists( $slug, self::$global_styles_presets );
	}

	/**
	 * Get the CSS variable name for a duotone preset.
	 *
	 * @param string $slug The slug of the duotone preset.
	 * @return string The CSS variable name.
	 */
	private static function get_css_custom_property_name( $slug ) {
		return self::CSS_VAR_PREFIX . $slug;
	}

	/**
	 * Get the ID of the duotone filter.
	 *
	 * @param string $slug The slug of the duotone preset.
	 * @return string The ID of the duotone filter.
	 */
	private static function get_filter_id( $slug ) {
		return self::FILTER_ID_PREFIX . $slug;
	}

	/**
	 * Gets the SVG for the duotone filter definition.
	 *
	 * @param string $filter_id The ID of the filter.
	 * @param array  $colors    An array of color strings.
	 * @return string An SVG with a duotone filter definition.
	 */
	private static function get_filter_svg( $filter_id, $colors ) {
		$duotone_values = array(
			'r' => array(),
			'g' => array(),
			'b' => array(),
			'a' => array(),
		);

		foreach ( $colors as $color_str ) {
			$color = self::colord_parse( $color_str );

			$duotone_values['r'][] = $color['r'] / 255;
			$duotone_values['g'][] = $color['g'] / 255;
			$duotone_values['b'][] = $color['b'] / 255;
			$duotone_values['a'][] = $color['a'];
		}

		ob_start();

		?>

		<svg
			xmlns="http://www.w3.org/2000/svg"
			viewBox="0 0 0 0"
			width="0"
			height="0"
			focusable="false"
			role="none"
			style="visibility: hidden; position: absolute; left: -9999px; overflow: hidden;"
		>
			<defs>
				<filter id="<?php echo esc_attr( $filter_id ); ?>">
					<feColorMatrix
						color-interpolation-filters="sRGB"
						type="matrix"
						values="
							.299 .587 .114 0 0
							.299 .587 .114 0 0
							.299 .587 .114 0 0
							.299 .587 .114 0 0
						"
					/>
					<feComponentTransfer color-interpolation-filters="sRGB" >
						<feFuncR type="table" tableValues="<?php echo esc_attr( implode( ' ', $duotone_values['r'] ) ); ?>" />
						<feFuncG type="table" tableValues="<?php echo esc_attr( implode( ' ', $duotone_values['g'] ) ); ?>" />
						<feFuncB type="table" tableValues="<?php echo esc_attr( implode( ' ', $duotone_values['b'] ) ); ?>" />
						<feFuncA type="table" tableValues="<?php echo esc_attr( implode( ' ', $duotone_values['a'] ) ); ?>" />
					</feComponentTransfer>
					<feComposite in2="SourceGraphic" operator="in" />
				</filter>
			</defs>
		</svg>

		<?php

		$svg = ob_get_clean();

		if ( ! SCRIPT_DEBUG ) {
			// Clean up the whitespace.
			$svg = preg_replace( "/[\r\n\t ]+/", ' ', $svg );
			$svg = str_replace( '> <', '><', $svg );
			$svg = trim( $svg );
		}

		return $svg;
	}

	/**
	 * Get the CSS variable for a duotone preset.
	 *
	 * @param string $slug The slug of the duotone preset.
	 * @return string The CSS variable.
	 */
	private static function get_css_var( $slug ) {
		return 'var(' . self::get_css_custom_property_name( $slug ) . ')';
	}

	/**
	 * Get the CSS declaration for a duotone preset.
	 * Example: --wp--preset--duotone--blue-orange: url('#wp-duotone-blue-orange');
	 *
	 * @param array $filter_data The duotone data for presets and custom filters.
	 * @return string The CSS declaration.
	 */
	private static function get_css_custom_property_declaration( $filter_data ) {
		$declaration_value                = self::get_filter_css_property_value_from_preset( $filter_data );
		$duotone_preset_css_property_name = self::get_css_custom_property_name( $filter_data['slug'] );
		return $duotone_preset_css_property_name . ': ' . $declaration_value . ';';
	}

	/**
	 * Outputs all necessary SVG for duotone filters, CSS for classic themes.
	 */
	public static function output_footer_assets() {
		foreach ( self::$output as $filter_data ) {

			// SVG will be output on the page later.
			$filter_svg = self::get_filter_svg_from_preset( $filter_data );

			echo $filter_svg;

			// This is for classic themes - in block themes, the CSS is added in the head via wp_add_inline_style in the wp_enqueue_scripts action.
			if ( ! wp_is_block_theme() ) {
				wp_add_inline_style( 'core-block-supports', 'body{' . self::get_css_custom_property_declaration( $filter_data ) . '}' );
			}
		}
	}

	/**
	 * Adds the duotone SVGs and CSS custom properties to the editor settings so
	 * they can be pulled in by the EditorStyles component in JS and rendered in
	 * the post editor.
	 *
	 * @param array $settings The block editor settings from the `block_editor_settings_all` filter.
	 * @return array The editor settings with duotone SVGs and CSS custom properties.
	 */
	public static function add_editor_settings( $settings ) {
		$duotone_svgs = '';
		$duotone_css  = 'body{';
		foreach ( self::$global_styles_presets as $filter_data ) {
			$duotone_svgs .= self::get_filter_svg_from_preset( $filter_data );
			$duotone_css  .= self::get_css_custom_property_declaration( $filter_data );
		}
		$duotone_css .= '}';

		if ( ! isset( $settings['styles'] ) ) {
			$settings['styles'] = array();
		}

		$settings['styles'][] = array(
			'assets'         => $duotone_svgs,
			// The 'svgs' type is new in 6.3 and requires the corresponding JS changes in the EditorStyles component to work.
			'__unstableType' => 'svgs',
			'isGlobalStyles' => false,
		);

		$settings['styles'][] = array(
			'css'            => $duotone_css,
			// This must be set and must be something other than 'theme' or they will be stripped out in the post editor <Editor> component.
			'__unstableType' => 'presets',
			// These styles are no longer generated by global styles, so this must be false or they will be stripped out in gutenberg_get_block_editor_settings.
			'isGlobalStyles' => false,
		);

		return $settings;
	}

	/**
	 * Appends the used global style duotone filter CSS Vars to the inline global styles CSS
	 */
	public static function output_global_styles() {

		if ( empty( self::$output ) ) {
			return;
		}

		$duotone_css_vars = '';

		foreach ( self::$output as $filter_data ) {
			if ( ! array_key_exists( $filter_data['slug'], self::$global_styles_presets ) ) {
				continue;
			}

			$duotone_css_vars .= self::get_css_custom_property_declaration( $filter_data );
		}

		if ( ! empty( $duotone_css_vars ) ) {
			wp_add_inline_style( 'global-styles', 'body{' . $duotone_css_vars . '}' );
		}
	}

	/**
	 * Get the CSS selector for a block type.
	 *
	 * @param string $block_name The block name.
	 *
	 * @return string The CSS selector or null if there is no support.
	 */
	private static function get_selector( $block_name ) {
		$block_type = WP_Block_Type_Registry::get_instance()->get_registered( $block_name );

		if ( $block_type && property_exists( $block_type, 'supports' ) ) {
			// Backwards compatibility with `supports.color.__experimentalDuotone`
			// is provided via the `block_type_metadata_settings` filter. If
			// `supports.filter.duotone` has not been set and the experimental
			// property has been, the experimental property value is copied into
			// `supports.filter.duotone`.
			$duotone_support = _wp_array_get( $block_type->supports, array( 'filter', 'duotone' ), false );
			if ( ! $duotone_support ) {
				return null;
			}

			// If the experimental duotone support was set, that value is to be
			// treated as a selector and requires scoping.
			$experimental_duotone = _wp_array_get( $block_type->supports, array( 'color', '__experimentalDuotone' ), false );
			if ( $experimental_duotone ) {
				$root_selector = wp_get_block_css_selector( $block_type );
				return is_string( $experimental_duotone )
					? WP_Theme_JSON_Gutenberg::scope_selector( $root_selector, $experimental_duotone )
					: $root_selector;
			}

			// Regular filter.duotone support uses filter.duotone selectors with fallbacks.
			return wp_get_block_css_selector( $block_type, array( 'filter', 'duotone' ), true );
		}
	}

	/**
	 * Render out the duotone CSS styles and SVG.
	 *
	 * @param  string $block_content Rendered block content.
	 * @param  array  $block         Block object.
	 * @return string                Filtered block content.
	 */
	public static function render_duotone_support( $block_content, $block ) {
		$duotone_selector = self::get_selector( $block['blockName'] );

		// The block should have a duotone attribute or have duotone defined in its theme.json to be processed.
		$has_duotone_attribute     = isset( $block['attrs']['style']['color']['duotone'] );
		$has_global_styles_duotone = array_key_exists( $block['blockName'], self::$global_styles_block_names );

		if (
			empty( $block_content ) ||
			! $duotone_selector ||
			( ! $has_duotone_attribute && ! $has_global_styles_duotone )
		) {
			return $block_content;
		}

		// Generate the pieces needed for rendering a duotone to the page.
		if ( $has_duotone_attribute ) {

			// Possible values for duotone attribute:
			// 1. Array of colors - e.g. array('#000000', '#ffffff').
			// 2. Variable for an existing Duotone preset - e.g. 'var:preset|duotone|green-blue' or 'var(--wp--preset--duotone--green-blue)''
			// 3. A CSS string - e.g. 'unset' to remove globally applied duotone.

			$duotone_attr = $block['attrs']['style']['color']['duotone'];
			$is_preset    = is_string( $duotone_attr ) && self::is_preset( $duotone_attr );
			$is_css       = is_string( $duotone_attr ) && ! $is_preset;
			$is_custom    = is_array( $duotone_attr );

			if ( $is_preset ) {

				// Extract the slug from the preset variable string.
				$slug = self::gutenberg_get_slug_from_attr( $duotone_attr );

				// Utilize existing preset CSS custom property.
				$declaration_value = self::get_css_var( $slug );

				self::$output[ $slug ] = self::$global_styles_presets[ $slug ];

			} elseif ( $is_css ) {
				// Build a unique slug for the filter based on the CSS value.
				$slug = wp_unique_id( sanitize_key( $duotone_attr . '-' ) );

				// Pass through the CSS value.
				$declaration_value = $duotone_attr;
			} elseif ( $is_custom ) {
				// Build a unique slug for the filter based on the array of colors.
				$slug = wp_unique_id( sanitize_key( implode( '-', $duotone_attr ) . '-' ) );

				$filter_data = array(
					'slug'   => $slug,
					'colors' => $duotone_attr,
				);
				// Build a customized CSS filter property for unique slug.
				$declaration_value = self::get_filter_css_property_value_from_preset( $filter_data );

				self::$output[ $slug ] = $filter_data;
			}
		} elseif ( $has_global_styles_duotone ) {
			$slug = self::$global_styles_block_names[ $block['blockName'] ];

			// Utilize existing preset CSS custom property.
			$declaration_value = self::get_css_var( $slug );

			self::$output[ $slug ] = self::$global_styles_presets[ $slug ];
		}

		// - Applied as a class attribute to the block wrapper.
		// - Used as a selector to apply the filter to the block.
		$filter_id = self::get_filter_id_from_preset( array( 'slug' => $slug ) );

		// Build the CSS selectors to which the filter will be applied.
		$selectors = explode( ',', $duotone_selector );

		$selectors_scoped = array();
		foreach ( $selectors as $selector_part ) {
			// Assuming the selector part is a subclass selector (not a tag name)
			// so we can prepend the filter id class. If we want to support elements
			// such as `img` or namespaces, we'll need to add a case for that here.
			$selectors_scoped[] = '.' . $filter_id . trim( $selector_part );
		}

		$selector = implode( ', ', $selectors_scoped );

		// We only want to add the selector if we have it in the output already, essentially skipping 'unset'.
		if ( array_key_exists( $slug, self::$output ) ) {
			self::$output[ $slug ]['selector'] = $selector;
		}

		// Pass styles to the block-supports stylesheet via the style engine.
		// This ensures that Duotone styles are included in a single stylesheet,
		// avoiding multiple style tags or multiple stylesheets being output to
		// the site frontend.
		gutenberg_style_engine_get_stylesheet_from_css_rules(
			array(
				array(
					'selector'     => $selector,
					'declarations' => array(
						// !important is needed because these styles
						// render before global styles,
						// and they should be overriding the duotone
						// filters set by global styles.
						'filter' => $declaration_value . ' !important',
					),
				),
			),
			array(
				'context' => 'block-supports',
			)
		);

		// Like the layout hook, this assumes the hook only applies to blocks with a single wrapper.
		$tags = new WP_HTML_Tag_Processor( $block_content );
		if ( $tags->next_tag() ) {
			$tags->add_class( $filter_id );
		}

		return $tags->get_updated_html();
	}

	/**
	 * Migrate the old experimental duotone support flag to its stabilized location
	 * under `supports.filter.duotone` and sets.
	 *
	 * @param array $settings Current block type settings.
	 * @param array $metadata Block metadata as read in via block.json.
	 *
	 * @return array Filtered block type settings.
	 */
	public static function migrate_experimental_duotone_support_flag( $settings, $metadata ) {
		$duotone_support = _wp_array_get( $metadata, array( 'supports', 'color', '__experimentalDuotone' ), null );

		if ( ! isset( $settings['supports']['filter']['duotone'] ) && null !== $duotone_support ) {
			_wp_array_set( $settings, array( 'supports', 'filter', 'duotone' ), (bool) $duotone_support );
		}

		return $settings;
	}

	/**
	 * Gets the SVG for the duotone filter definition from a preset.
	 *
	 * @param array $preset The duotone preset.
	 * @return string The SVG for the filter definition.
	 */
	public static function get_filter_svg_from_preset( $preset ) {
		$filter_id = '';
		if ( isset( $preset['slug'] ) ) {
			$filter_id = self::get_filter_id( $preset['slug'] );
		}
		return self::get_filter_svg( $filter_id, $preset['colors'] );
	}

	/**
	 * Gets the CSS filter property value from a preset.
	 *
	 * @param array $preset The duotone preset.
	 * @return string The CSS filter property value.
	 */
	public static function get_filter_css_property_value_from_preset( $preset ) {
		if ( isset( $preset['colors'] ) && is_string( $preset['colors'] ) ) {
			return $preset['colors'];
		}

		$filter_id = '';
		if ( isset( $preset['slug'] ) ) {
			$filter_id = self::get_filter_id( $preset['slug'] );
		}

		return 'url(#' . $filter_id . ')';
	}
}
