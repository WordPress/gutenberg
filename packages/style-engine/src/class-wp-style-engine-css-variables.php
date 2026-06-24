<?php
/**
 * WP_Style_Engine_CSS_Variables
 *
 * Builds CSS custom property declarations and rules.
 *
 * @package gutenberg
 */

if ( ! class_exists( 'WP_Style_Engine_CSS_Variables' ) ) {
	/**
	 * Builds CSS custom property declarations and rules.
	 *
	 * @access private
	 */
	class WP_Style_Engine_CSS_Variables {
		/**
		 * CSS variable declarations, grouped by selector.
		 *
		 * @var array
		 */
		protected $declarations_by_selector = array();

		/**
		 * Adds a CSS custom property declaration for a selector.
		 *
		 * @param string $selector CSS selector.
		 * @param string $name     CSS custom property name.
		 * @param mixed  $value    CSS custom property value.
		 * @return WP_Style_Engine_CSS_Variables Returns the object to allow chaining methods.
		 */
		public function add_declaration( $selector, $name, $value ) {
			if ( ! is_string( $selector ) || '' === $selector || ! is_string( $name ) || '' === $name ) {
				return $this;
			}

			if ( ! isset( $this->declarations_by_selector[ $selector ] ) ) {
				$this->declarations_by_selector[ $selector ] = array();
			}

			$this->declarations_by_selector[ $selector ][] = array(
				'name'  => $name,
				'value' => $value,
			);

			return $this;
		}

		/**
		 * Adds CSS custom property declarations for a selector.
		 *
		 * The declarations can be an associative name/value map or an ordered list
		 * of arrays with `name` and `value` keys.
		 *
		 * @param string $selector     CSS selector.
		 * @param array  $declarations CSS custom property declarations.
		 * @return WP_Style_Engine_CSS_Variables Returns the object to allow chaining methods.
		 */
		public function add_declarations( $selector, $declarations ) {
			if ( empty( $declarations ) || ! is_array( $declarations ) ) {
				return $this;
			}

			foreach ( $declarations as $name => $value ) {
				if ( is_array( $value ) && array_key_exists( 'name', $value ) && array_key_exists( 'value', $value ) ) {
					$name  = $value['name'];
					$value = $value['value'];
				}

				$this->add_declaration( $selector, $name, $value );
			}

			return $this;
		}

		/**
		 * Adds CSS custom property declarations generated from a nested value tree.
		 *
		 * @param string $selector CSS selector.
		 * @param array  $values   Nested values.
		 * @param array  $options  {
		 *     Optional. An array of options. Default empty array.
		 *
		 *     @type string $prefix Prefix to prepend to each custom property name. Default empty string.
		 *     @type string $token  Token to use between nested levels. Default '--'.
		 * }
		 * @return WP_Style_Engine_CSS_Variables Returns the object to allow chaining methods.
		 */
		public function add_declarations_from_values( $selector, $values, $options = array() ) {
			$declarations = static::get_declarations_from_values( $values, $options );
			return $this->add_declarations( $selector, $declarations );
		}

		/**
		 * Returns CSS rules for the collected custom property declarations.
		 *
		 * @return array CSS rules.
		 */
		public function get_rules() {
			$rules = array();

			foreach ( $this->declarations_by_selector as $selector => $declarations ) {
				if ( empty( $declarations ) ) {
					continue;
				}

				$rules[] = array(
					'selector'     => $selector,
					'declarations' => $declarations,
				);
			}

			return $rules;
		}

		/**
		 * Returns CSS custom property declarations generated from a nested value tree.
		 *
		 * @param array $values  Nested values.
		 * @param array $options {
		 *     Optional. An array of options. Default empty array.
		 *
		 *     @type string $prefix Prefix to prepend to each custom property name. Default empty string.
		 *     @type string $token  Token to use between nested levels. Default '--'.
		 * }
		 * @return array CSS custom property declarations.
		 */
		public static function get_declarations_from_values( $values, $options = array() ) {
			if ( empty( $values ) || ! is_array( $values ) ) {
				return array();
			}

			$options = wp_parse_args(
				$options,
				array(
					'prefix' => '',
					'token'  => '--',
				)
			);

			$declarations = array();
			$css_vars     = static::flatten_tree( $values, '', $options['token'] );

			foreach ( $css_vars as $key => $value ) {
				$declarations[] = array(
					'name'  => $options['prefix'] . $key,
					'value' => $value,
				);
			}

			return $declarations;
		}

		/**
		 * Given a tree, creates a flattened one by merging the keys and binding
		 * the leaf values to the new keys.
		 *
		 * It also transforms camelCase names into kebab-case and substitutes `/`
		 * with `-`.
		 *
		 * @param array  $tree   Input tree to process.
		 * @param string $prefix Optional. Prefix to prepend to each variable. Default empty string.
		 * @param string $token  Optional. Token to use between levels. Default '--'.
		 * @return array The flattened tree.
		 */
		public static function flatten_tree( $tree, $prefix = '', $token = '--' ) {
			$result = array();
			foreach ( $tree as $property => $value ) {
				$new_key = $prefix . str_replace(
					'/',
					'-',
					strtolower( _wp_to_kebab_case( $property ) )
				);

				if ( is_array( $value ) ) {
					$new_prefix        = $new_key . $token;
					$flattened_subtree = static::flatten_tree( $value, $new_prefix, $token );
					foreach ( $flattened_subtree as $subtree_key => $subtree_value ) {
						$result[ $subtree_key ] = $subtree_value;
					}
				} else {
					$result[ $new_key ] = $value;
				}
			}
			return $result;
		}
	}
}
