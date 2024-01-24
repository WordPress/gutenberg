<?php
/**
 * Interactivity API: WP_Interactivity_API class.
 *
 * @package WordPress
 * @subpackage Interactivity API
 */

if ( ! class_exists( 'WP_Interactivity_API' ) ) {
	/**
	 * Class used to process the Interactivity API in the server.
	 */
	class WP_Interactivity_API {
		/**
		 * Holds the mapping of directive attribute names to their processor methods.
		 *
		 * @since 6.5.0
		 * @var array
		 */
		private static $directive_processors = array(
			'data-wp-interactive' => 'data_wp_interactive_processor',
			'data-wp-context'     => 'data_wp_context_processor',
			'data-wp-bind'        => 'data_wp_bind_processor',
			'data-wp-class'       => 'data_wp_class_processor',
			'data-wp-style'       => 'data_wp_style_processor',
			'data-wp-text'        => 'data_wp_text_processor',
		);

		/**
		 * Holds the initial state of the different Interactivity API stores.
		 *
		 * This state is used during the server directive processing. Then, it is
		 * serialized and sent to the client as part of the interactivity data to be
		 * recovered during the hydration of the client interactivity stores.
		 *
		 * @since 6.5.0
		 * @var array
		 */
		private $state_data = array();

		/**
		 * Holds the configuration required by the different Interactivity API stores.
		 *
		 * This configuration is serialized and sent to the client as part of the
		 * interactivity data and can be accessed by the client interactivity stores.
		 *
		 * @since 6.5.0
		 * @var array
		 */
		private $config_data = array();

		/**
		 * Gets and/or sets the initial state of an Interactivity API store for a
		 * given namespace.
		 *
		 * If state for that store namespace already exists, it merges the new
		 * provided state with the existing one.
		 *
		 * @since 6.5.0
		 *
		 * @param string $store_namespace The unique store namespace identifier.
		 * @param array  $state           Optional. The array that will be merged with the existing state for the specified
		 *                                store namespace.
		 * @return array The current state for the specified store namespace.
		 */
		public function state( string $store_namespace, array $state = null ): array {
			if ( ! isset( $this->state_data[ $store_namespace ] ) ) {
				$this->state_data[ $store_namespace ] = array();
			}
			if ( is_array( $state ) ) {
				$this->state_data[ $store_namespace ] = array_replace_recursive(
					$this->state_data[ $store_namespace ],
					$state
				);
			}
			return $this->state_data[ $store_namespace ];
		}

		/**
		 * Gets and/or sets the configuration of the Interactivity API for a given
		 * store namespace.
		 *
		 * If configuration for that store namespace exists, it merges the new
		 * provided configuration with the existing one.
		 *
		 * @since 6.5.0
		 *
		 * @param string $store_namespace The unique store namespace identifier.
		 * @param array  $config          Optional. The array that will be merged with the existing configuration for the
		 *                                specified store namespace.
		 * @return array The current configuration for the specified store namespace.
		 */
		public function config( string $store_namespace, array $config = null ): array {
			if ( ! isset( $this->config_data[ $store_namespace ] ) ) {
				$this->config_data[ $store_namespace ] = array();
			}
			if ( is_array( $config ) ) {
				$this->config_data[ $store_namespace ] = array_replace_recursive(
					$this->config_data[ $store_namespace ],
					$config
				);
			}
			return $this->config_data[ $store_namespace ];
		}

		/**
		 * Prints the serialized client-side interactivity data.
		 *
		 * Encodes the config and initial state into JSON and prints them inside a
		 * script tag of type "application/json". Once in the browser, the state will
		 * be parsed and used to hydrate the client-side interactivity stores and the
		 * configuration will be available using a `getConfig` utility.
		 *
		 * @since 6.5.0
		 */
		public function print_client_interactivity_data() {
			$store      = array();
			$has_state  = ! empty( $this->state_data );
			$has_config = ! empty( $this->config_data );

			if ( $has_state || $has_config ) {
				if ( $has_config ) {
					$store['config'] = $this->config_data;
				}
				if ( $has_state ) {
					$store['state'] = $this->state_data;
				}
				wp_print_inline_script_tag(
					wp_json_encode(
						$store,
						JSON_HEX_TAG | JSON_HEX_AMP
					),
					array(
						'type' => 'application/json',
						'id'   => 'wp-interactivity-data',
					)
				);
			}
		}

		/**
		 * Registers the `@wordpress/interactivity` script modules.
		 *
		 * @since 6.5.0
		 */
		public function register_script_modules() {
			wp_register_script_module(
				'@wordpress/interactivity',
				gutenberg_url( '/build/interactivity/index.min.js' ),
				array(),
				defined( 'GUTENBERG_VERSION' ) ? GUTENBERG_VERSION : get_bloginfo( 'version' )
			);

			wp_register_script_module(
				'@wordpress/interactivity-router',
				gutenberg_url( '/build/interactivity/router.min.js' ),
				array( '@wordpress/interactivity' ),
				defined( 'GUTENBERG_VERSION' ) ? GUTENBERG_VERSION : get_bloginfo( 'version' )
			);
		}

		/**
		 * Adds the necessary hooks for the Interactivity API.
		 *
		 * @since 6.5.0
		 */
		public function add_hooks() {
			add_action( 'wp_footer', array( $this, 'print_client_interactivity_data' ) );
		}

		/**
		 * Processes the interactivity directives contained within the HTML content
		 * and updates the markup accordingly.
		 *
		 * @since 6.5.0
		 *
		 * @param string $html The HTML content to process.
		 * @return string The processed HTML content. It returns the original content when the HTML contains unbalanced tags.
		 */
		public function process_directives( string $html ): string {
			$p               = new WP_Interactivity_API_Directives_Processor( $html );
			$tag_stack       = array();
			$namespace_stack = array();
			$context_stack   = array();
			$unbalanced      = false;

			$directive_processor_prefixes          = array_keys( self::$directive_processors );
			$directive_processor_prefixes_reversed = array_reverse( $directive_processor_prefixes );

			while ( $p->next_tag( array( 'tag_closers' => 'visit' ) ) && false === $unbalanced ) {
				$tag_name = $p->get_tag();

				if ( $p->is_tag_closer() ) {
					list( $opening_tag_name, $directives_prefixes ) = end( $tag_stack );

					if ( 0 === count( $tag_stack ) || $opening_tag_name !== $tag_name ) {

						/*
						 * If the tag stack is empty or the matching opening tag is not the
						 * same than the closing tag, it means the HTML is unbalanced and it
						 * stops processing it.
						 */
						$unbalanced = true;
						continue;
					} else {

						/*
						 * It removes the last tag from the stack.
						 */
						array_pop( $tag_stack );

						/*
						 * If the matching opening tag didn't have any directives, it can skip
						 * the processing.
						 */
						if ( 0 === count( $directives_prefixes ) ) {
							continue;
						}
					}
				} else {
					$directives_prefixes = array();

					foreach ( $p->get_attribute_names_with_prefix( 'data-wp-' ) as $attribute_name ) {

						/*
						 * Extracts the directive prefix to see if there is a server directive
						 * processor registered for that directive.
						 */
						list( $directive_prefix ) = $this->extract_prefix_and_suffix( $attribute_name );
						if ( array_key_exists( $directive_prefix, self::$directive_processors ) ) {
							$directives_prefixes[] = $directive_prefix;
						}
					}

					/*
					 * If this is not a void element, it adds it to the tag stack so it can
					 * process its closing tag and check for unbalanced tags.
					 */
					if ( ! $p->is_void() ) {
						$tag_stack[] = array( $tag_name, $directives_prefixes );
					}
				}

				/*
				 * Sorts the attributes by the order of the `directives_processor` array
				 * and checks what directives are present in this element. The processing
				 * order is reversed for tag closers.
				 */
				$directives_prefixes = array_intersect(
					$p->is_tag_closer()
						? $directive_processor_prefixes_reversed
						: $directive_processor_prefixes,
					$directives_prefixes
				);

				// Executes the directive processors present in this element.
				foreach ( $directives_prefixes as $directive_prefix ) {
					$func = is_array( self::$directive_processors[ $directive_prefix ] )
						? self::$directive_processors[ $directive_prefix ]
						: array( $this, self::$directive_processors[ $directive_prefix ] );
					call_user_func_array(
						$func,
						array( $p, &$context_stack, &$namespace_stack )
					);
				}
			}

			/*
			 * It returns the original content if the HTML is unbalanced because
			 * unbalanced HTML is not safe to process. In that case, the Interactivity
			 * API runtime will update the HTML on the client side during the hydration.
			 */
			return $unbalanced || 0 < count( $tag_stack ) ? $html : $p->get_updated_html();
		}

		/**
		 * Evaluates the reference path passed to a directive based on the current
		 * store namespace, state and context.
		 *
		 * @since 6.5.0
		 *
		 * @param string|true $directive_value   The directive attribute value string or `true` when it's a boolean attribute.
		 * @param string      $default_namespace The default namespace to use if none is explicitly defined in the directive
		 *                                       value.
		 * @param array|false $context           The current context for evaluating the directive or false if there is no
		 *                                       context.
		 * @return mixed|null The result of the evaluation. Null if the reference path doesn't exist.
		 */
		private function evaluate( $directive_value, string $default_namespace, $context = false ) {
			list( $ns, $path ) = $this->extract_directive_value( $directive_value, $default_namespace );
			if ( empty( $path ) ) {
				return null;
			}

			$store = array(
				'state'   => isset( $this->state_data[ $ns ] ) ? $this->state_data[ $ns ] : array(),
				'context' => isset( $context[ $ns ] ) ? $context[ $ns ] : array(),
			);

			// Checks if the reference path is preceded by a negator operator (!).
			$should_negate_value = '!' === $path[0];
			$path                = $should_negate_value ? substr( $path, 1 ) : $path;

			// Extracts the value from the store using the reference path.
			$path_segments = explode( '.', $path );
			$current       = $store;
			foreach ( $path_segments as $path_segment ) {
				if ( isset( $current[ $path_segment ] ) ) {
					$current = $current[ $path_segment ];
				} else {
					return null;
				}
			}

			// Returns the opposite if it contains a negator operator (!).
			return $should_negate_value ? ! $current : $current;
		}

		/**
		 * Extracts the directive attribute name to separate and return the directive
		 * prefix and an optional suffix.
		 *
		 * The suffix is the string after the first double hyphen and the prefix is
		 * everything that comes before the suffix.
		 *
		 * Example:
		 *
		 *     extract_prefix_and_suffix( 'data-wp-interactive' )   => array( 'data-wp-interactive', null )
		 *     extract_prefix_and_suffix( 'data-wp-bind--src' )     => array( 'data-wp-bind', 'src' )
		 *     extract_prefix_and_suffix( 'data-wp-foo--and--bar' ) => array( 'data-wp-foo', 'and--bar' )
		 *
		 * @since 6.5.0
		 *
		 * @param string $directive_name The directive attribute name.
		 * @return array An array containing the directive prefix and optional suffix.
		 */
		private function extract_prefix_and_suffix( string $directive_name ): array {
			return explode( '--', $directive_name, 2 );
		}

		/**
		 * Parses and extracts the namespace and reference path from the given
		 * directive attribute value.
		 *
		 * If the value doesn't contain an explicit namespace, it returns the
		 * default one. If the value contains a JSON object instead of a reference
		 * path, the function tries to parse it and return the resulting array. If
		 * the value contains strings that reprenset booleans ("true" and "false"),
		 * numbers ("1" and "1.2") or "null", the function also transform them to
		 * regular booleans, numbers and `null`.
		 *
		 * Example:
		 *
		 *     extract_directive_value( 'actions.foo', 'myPlugin' )                      => array( 'myPlugin', 'actions.foo' )
		 *     extract_directive_value( 'otherPlugin::actions.foo', 'myPlugin' )         => array( 'otherPlugin', 'actions.foo' )
		 *     extract_directive_value( '{ "isOpen": false }', 'myPlugin' )              => array( 'myPlugin', array( 'isOpen' => false ) )
		 *     extract_directive_value( 'otherPlugin::{ "isOpen": false }', 'myPlugin' ) => array( 'otherPlugin', array( 'isOpen' => false ) )
		 *
		 * @since 6.5.0
		 *
		 * @param string|true $directive_value   The directive attribute value. It can be `true` when it's a boolean
		 *                                       attribute.
		 * @param string|null $default_namespace Optional. The default namespace if none is explicitly defined.
		 * @return array An array containing the namespace in the first item and the JSON, the reference path, or null on the
		 *               second item.
		 */
		private function extract_directive_value( $directive_value, $default_namespace = null ): array {
			if ( empty( $directive_value ) || is_bool( $directive_value ) ) {
				return array( $default_namespace, null );
			}

			// Replaces the value and namespace if there is a namespace in the value.
			if ( 1 === preg_match( '/^([\w\-_\/]+)::./', $directive_value ) ) {
				list($default_namespace, $directive_value) = explode( '::', $directive_value, 2 );
			}

			/*
			 * Tries to decode the value as a JSON object. If it fails and the value
			 * isn't `null`, it returns the value as it is. Otherwise, it returns the
			 * decoded JSON or null for the string `null`.
			 */
			$decoded_json = json_decode( $directive_value, true );
			if ( null !== $decoded_json || 'null' === $directive_value ) {
				$directive_value = $decoded_json;
			}

			return array( $default_namespace, $directive_value );
		}


		/**
		 * Processes the `data-wp-interactive` directive.
		 *
		 * It adds the default store namespace defined in the directive value to the
		 * stack so it's available for the nested interactivity elements.
		 *
		 * @since 6.5.0
		 *
		 * @param WP_Interactivity_API_Directives_Processor $p               The directives processor instance.
		 * @param array                                     $context_stack   The reference to the context stack.
		 * @param array                                     $namespace_stack The reference to the store namespace stack.
		 */
		private function data_wp_interactive_processor( WP_Interactivity_API_Directives_Processor $p, array &$context_stack, array &$namespace_stack ) {
			// In closing tags, it removes the last namespace from the stack.
			if ( $p->is_tag_closer() ) {
				return array_pop( $namespace_stack );
			}

			// Tries to decode the `data-wp-interactive` attribute value.
			$attribute_value = $p->get_attribute( 'data-wp-interactive' );
			$decoded_json    = is_string( $attribute_value ) && ! empty( $attribute_value )
				? json_decode( $attribute_value, true )
				: null;

			/*
			 * Pushes the newly defined namespace or the current one if the
			 * `data-wp-interactive` definition was invalid or does not contain a
			 * namespace. It does so because the function pops out the current namespace
			 * from the stack whenever it finds a `data-wp-interactive`'s closing tag,
			 * independently of whether the previous `data-wp-interactive` definition
			 * contained a valid namespace.
			 */
			$namespace_stack[] = isset( $decoded_json['namespace'] )
				? $decoded_json['namespace']
				: end( $namespace_stack );
		}

		/**
		 * Processes the `data-wp-context` directive.
		 *
		 * It adds the context defined in the directive value to the stack so it's
		 * available for the nested interactivity elements.
		 *
		 * @since 6.5.0
		 *
		 * @param WP_Interactivity_API_Directives_Processor $p               The directives processor instance.
		 * @param array                                     $context_stack   The reference to the context stack.
		 * @param array                                     $namespace_stack The reference to the store namespace stack.
		 */
		private function data_wp_context_processor( WP_Interactivity_API_Directives_Processor $p, array &$context_stack, array &$namespace_stack ) {
			// In closing tags, it removes the last context from the stack.
			if ( $p->is_tag_closer() ) {
				return array_pop( $context_stack );
			}

			$attribute_value = $p->get_attribute( 'data-wp-context' );
			$namespace_value = end( $namespace_stack );

			// Separates the namespace from the context JSON object.
			list( $namespace_value, $decoded_json ) = is_string( $attribute_value ) && ! empty( $attribute_value )
				? $this->extract_directive_value( $attribute_value, $namespace_value )
				: array( $namespace_value, null );

			/*
			 * If there is a namespace, it adds a new context to the stack merging the
			 * previous context with the new one.
			 */
			if ( is_string( $namespace_value ) ) {
				array_push(
					$context_stack,
					array_replace_recursive(
						end( $context_stack ) !== false ? end( $context_stack ) : array(),
						array( $namespace_value => is_array( $decoded_json ) ? $decoded_json : array() )
					)
				);
			} else {
				/*
				 * If there is no namespace, it pushes the current context to the stack.
				 * It needs to do so because the function pops out the current context
				 * from the stack whenever it finds a `data-wp-context`'s closing tag.
				 */
				array_push( $context_stack, end( $context_stack ) );
			}
		}

		/**
		 * Processes the `data-wp-bind` directive.
		 *
		 * It updates or removes the bound attributes based on the evaluation of its
		 * associated reference.
		 *
		 * @since 6.5.0
		 *
		 * @param WP_Interactivity_API_Directives_Processor $p               The directives processor instance.
		 * @param array                                     $context_stack   The reference to the context stack.
		 * @param array                                     $namespace_stack The reference to the store namespace stack.
		 */
		private function data_wp_bind_processor( WP_Interactivity_API_Directives_Processor $p, array &$context_stack, array &$namespace_stack ) {
			if ( ! $p->is_tag_closer() ) {
				$all_bind_directives = $p->get_attribute_names_with_prefix( 'data-wp-bind--' );

				foreach ( $all_bind_directives as $attribute_name ) {
					list( , $bound_attribute ) = $this->extract_prefix_and_suffix( $attribute_name );
					if ( empty( $bound_attribute ) ) {
						return;
					}

					$attribute_value = $p->get_attribute( $attribute_name );
					$result          = $this->evaluate( $attribute_value, end( $namespace_stack ), end( $context_stack ) );

					if ( null !== $result && ( false !== $result || '-' === $bound_attribute[4] ) ) {
						/*
						 * If the result of the evaluation is a boolean and the attribute is
						 * `aria-` or `data-, convert it to a string "true" or "false". It
						 * follows the exact same logic as Preact because it needs to
						 * replicate what Preact will later do in the client:
						 * https://github.com/preactjs/preact/blob/ea49f7a0f9d1ff2c98c0bdd66aa0cbc583055246/src/diff/props.js#L131C24-L136
						 */
						if ( is_bool( $result ) && '-' === $bound_attribute[4] ) {
							$result = $result ? 'true' : 'false';
						}
						$p->set_attribute( $bound_attribute, $result );
					} else {
						$p->remove_attribute( $bound_attribute );
					}
				}
			}
		}


		/**
		 * Processes the `data-wp-class` directive.
		 *
		 * It adds or removes CSS classes in the current HTML element based on the
		 * evaluation of its associated references.
		 *
		 * @since 6.5.0
		 *
		 * @param WP_Interactivity_API_Directives_Processor $p               The directives processor instance.
		 * @param array                                     $context_stack   The reference to the context stack.
		 * @param array                                     $namespace_stack The reference to the store namespace stack.
		 */
		private function data_wp_class_processor( WP_Interactivity_API_Directives_Processor $p, array &$context_stack, array &$namespace_stack ) {
			if ( ! $p->is_tag_closer() ) {
				$all_class_directives = $p->get_attribute_names_with_prefix( 'data-wp-class--' );

				foreach ( $all_class_directives as $attribute_name ) {
					list( , $class_name ) = $this->extract_prefix_and_suffix( $attribute_name );
					if ( empty( $class_name ) ) {
						return;
					}

					$attribute_value = $p->get_attribute( $attribute_name );
					$result          = $this->evaluate( $attribute_value, end( $namespace_stack ), end( $context_stack ) );

					if ( $result ) {
						$p->add_class( $class_name );
					} else {
						$p->remove_class( $class_name );
					}
				}
			}
		}

		/**
		 * Processes the `data-wp-style` directive.
		 *
		 * It updates the style attribute value of the current HTML element based on
		 * the evaluation of its associated references.
		 *
		 * @since 6.5.0
		 *
		 * @param WP_Interactivity_API_Directives_Processor $p               The directives processor instance.
		 * @param array                                     $context_stack   The reference to the context stack.
		 * @param array                                     $namespace_stack The reference to the store namespace stack.
		 */
		private function data_wp_style_processor( WP_Interactivity_API_Directives_Processor $p, array &$context_stack, array &$namespace_stack ) {
			if ( ! $p->is_tag_closer() ) {
				$all_style_attributes = $p->get_attribute_names_with_prefix( 'data-wp-style--' );

				foreach ( $all_style_attributes as $attribute_name ) {
					list( , $style_property ) = $this->extract_prefix_and_suffix( $attribute_name );
					if ( empty( $style_property ) ) {
						continue;
					}

					$directive_attribute_value = $p->get_attribute( $attribute_name );
					$style_property_value      = $this->evaluate( $directive_attribute_value, end( $namespace_stack ), end( $context_stack ) );
					$style_attribute_value     = $p->get_attribute( 'style' );
					$style_attribute_value     = ( $style_attribute_value && ! is_bool( $style_attribute_value ) ) ? $style_attribute_value : '';

					/*
					 * Checks first if the style property is not falsy and the style
					 * attribute value is not empty because if it is, it doesn't need to
					 * update the attribute value.
					 */
					if ( $style_property_value || ( ! $style_property_value && $style_attribute_value ) ) {
						$style_attribute_value = $this->set_style_property( $style_attribute_value, $style_property, $style_property_value );
						/*
						 * If the style attribute value is not empty, it sets it. Otherwise,
						 * it removes it.
						 */
						if ( ! empty( $style_attribute_value ) ) {
							$p->set_attribute( 'style', $style_attribute_value );
						} else {
							$p->remove_attribute( 'style' );
						}
					}
				}
			}
		}

		/**
		 * Sets an individual style property in the `style` attribute of an HTML
		 * element, updating or removing the property when necessary.
		 *
		 * If a property is modified, it is added at the end of the list to make sure
		 * that it overrides the previous ones.
		 *
		 * @since 6.5.0
		 *
		 * Example:
		 *
		 *     set_style_property( 'color:green;', 'color', 'red' )      => 'color:red;'
		 *     set_style_property( 'background:green;', 'color', 'red' ) => 'background:green;color:red;'
		 *     set_style_property( 'color:green;', 'color', null )       => ''
		 *
		 * @param string            $style_attribute_value The current style attribute value.
		 * @param string            $style_property_name   The style property name to set.
		 * @param string|false|null $style_property_value  The value to set for the style property. With false, null or an
		 *                                                 empty string, it removes the style property.
		 * @return string The new style attribute value after the specified property has been added, updated or removed.
		 */
		private function set_style_property( string $style_attribute_value, string $style_property_name, $style_property_value ): string {
			$style_assignments    = explode( ';', $style_attribute_value );
			$result               = array();
			$style_property_value = ! empty( $style_property_value ) ? rtrim( trim( $style_property_value ), ';' ) : null;
			$new_style_property   = $style_property_value ? $style_property_name . ':' . $style_property_value . ';' : '';

			// Generate an array with all the properties but the modified one.
			foreach ( $style_assignments as $style_assignment ) {
				if ( empty( trim( $style_assignment ) ) ) {
					continue;
				}
				list( $name, $value ) = explode( ':', $style_assignment );
				if ( trim( $name ) !== $style_property_name ) {
					$result[] = trim( $name ) . ':' . trim( $value ) . ';';
				}
			}

			// Add the new/modified property at the end of the list.
			array_push( $result, $new_style_property );

			return implode( '', $result );
		}

		/**
		 * Processes the `data-wp-text` directive.
		 *
		 * It updates the inner content of the current HTML element based on the
		 * evaluation of its associated reference.
		 *
		 * @since 6.5.0
		 *
		 * @param WP_Interactivity_API_Directives_Processor $p               The directives processor instance.
		 * @param array                                     $context_stack   The reference to the context stack.
		 * @param array                                     $namespace_stack The reference to the store namespace stack.
		 */
		private function data_wp_text_processor( WP_Interactivity_API_Directives_Processor $p, array &$context_stack, array &$namespace_stack ) {
			if ( ! $p->is_tag_closer() ) {
				$attribute_value = $p->get_attribute( 'data-wp-text' );
				$result          = $this->evaluate( $attribute_value, end( $namespace_stack ), end( $context_stack ) );

				/*
				 * Follows the same logic as Preact in the client and only changes the
				 * content if the value is a string or a number. Otherwise, it removes the
				 * content.
				 */
				if ( is_string( $result ) || is_numeric( $result ) ) {
					$p->set_content_between_balanced_tags( esc_html( $result ) );
				} else {
					$p->set_content_between_balanced_tags( '' );
				}
			}
		}
	}

}
