<?php
/**
 * Block support flags.
 *
 * @package gutenberg
 */

/**
 * Class encapsulating and implementing Block Supports.
 */
class WP_Block_Supports {

	/**
	 * Config.
	 *
	 * @var array
	 */
	private $config;

	/**
	 * Container for the main instance of the class.
	 *
	 * @var WP_Block_Supports|null
	 */
	private static $instance = null;

	/**
	 * Constructor.
	 */
	public function __construct() {
		$this->load_config();
	}

	/**
	 * Utility method to retrieve the main instance of the class.
	 *
	 * The instance will be created if it does not exist yet.
	 *
	 * @return WP_Block_Supports The main instance.
	 */
	public static function get_instance() {
		if ( null === self::$instance ) {
			self::$instance = new self();
		}

		return self::$instance;
	}

	/**
	 * TODO.
	 */
	public static function init() {
		$instance = self::get_instance();
		$instance->register_attributes();
		add_action( 'wp_footer', array( $instance, 'enqueue_styles' ) );
		add_filter( 'render_block', array( $instance, 'apply_block_supports' ), 10, 2 );
	}

	/**
	 * Enqueues an empty style to which inline styles may be attached.
	 */
	public function enqueue_styles() {
		wp_enqueue_style( 'wp-block-supports' );
	}

	/**
	 * Generates an array of HTML attributes, such as classes, by applying to
	 * the given block all of the features that the block supports.
	 *
	 * @param  array $parsed_block Block as parsed from content.
	 * @return array               Array of HTML attributes.
	 */
	public function get_new_block_attributes( $parsed_block ) {
		if (
			empty( $parsed_block ) ||
			! isset( $parsed_block['attrs'] ) ||
			! isset( $parsed_block['blockName'] )
		) {
			// TODO: handle as error?
			return array();
		}

		$block_attributes = $parsed_block['attrs'];
		$block_type       = WP_Block_Type_Registry::get_instance()->get_registered(
			$parsed_block['blockName']
		);

		if ( empty( $block_type ) ) {
			// TODO: handle as error?
			return array();
		}

		$output = array();
		foreach ( $this->config as $feature_name => $feature_config ) {
			if (
				! $this->get_block_support(
					$block_type->supports,
					$feature_name,
					$feature_config['default']
				)
			) {
				continue;
			}
			$new_attributes = call_user_func(
				$feature_config['callback'],
				// Pick from $block_attributes according to feature attributes.
				array_intersect_key(
					$block_attributes,
					array_flip( array_keys( $feature_config['attributes'] ) )
				),
				$block_type->name
			);
			if ( ! empty( $new_attributes ) ) {
				foreach ( $new_attributes as $attribute_name => $attribute_value ) {
					if ( empty( $output[ $attribute_name ] ) ) {
						$output[ $attribute_name ] = '';
					}
					$output[ $attribute_name ] .= " $attribute_value";
				}
			}
		}
		return $output;
	}

	/**
	 * TODO.
	 *
	 * @param  string $block_content Rendered block content.
	 * @param  array  $block         Block object.
	 * @return string                Transformed block content.
	 */
	public function apply_block_supports( $block_content, $block ) {
		if ( ! isset( $block['attrs'] ) ) {
			return $block_content;
		}

		$block_type = WP_Block_Type_Registry::get_instance()->get_registered( $block['blockName'] );
		// If no render_callback, assume styles have been previously handled.
		if ( ! $block_type || ! $block_type->render_callback ) {
			return $block_content;
		}

		$new_attributes = $this->get_new_block_attributes( $block );
		if ( ! empty( $new_attributes ) ) {
			return $this->inject_attributes( $block_content, $new_attributes );
		}

		return $block_content;
	}

	/**
	 * Constructs the configuration for all supported block-supports features.
	 */
	private function load_config() {
		$this->config = array(
			'align'            => array(
				'attributes' => array(
					'align' => array(
						'type' => 'string',
						'enum' => array( 'left', 'center', 'right', 'wide', 'full', '' ),
					),
				),
				'callback'   => function( $attributes ) {
					if ( empty( $attributes['align'] ) ) {
						return false;
					}

					return array(
						'class' => sprintf(
							'align%s',
							$attributes['align']
						),
					);
				},
				'default'    => false,
			),
			'className'        => array(
				'attributes' => array(),
				'callback'   => function( $attributes, $block_name ) {
					$classes = 'HELLO-FROM-className wp-block-' . preg_replace(
						'/^core-/',
						'',
						str_replace( '/', '-', $block_name )
					);

					/**
					 * Filters the default block className for server rendered blocks.
					 *
					 * @param string     $class_name The current applied classname.
					 * @param string     $block_name The block name.
					 */
					$classes = apply_filters( 'block_default_classname', $classes, $block_name );

					return array( 'class' => $classes );
				},
				'default'    => true,
			),
			'color.background' => array(
				'attributes' => array(
					'backgroundColor' => array(
						'type' => 'string',
					),
				),
				'callback'   => '__return_false',
				'default'    => array( false, true ),
			),
			'color.gradients'  => array(
				'attributes' => array(
					'gradient' => array(
						'type' => 'string',
					),
				),
				'callback'   => '__return_false',
				'default'    => array( false, false ),
			),
			'color.link'       => array(
				'attributes' => array(),
				'callback'   => '__return_false',
				'default'    => array( false, false ),
			),
			'color.text'       => array(
				'attributes' => array(
					'style'     => array(
						'type' => 'object',
					),
					'textColor' => array(
						'type' => 'string',
					),
				),
				'callback'   => function( $attributes ) {
					$has_named_text_color = array_key_exists( 'textColor', $attributes );
					$has_custom_text_color = isset( $attributes['style']['color']['text'] );
					$classes = '';

					// Apply required generic class.
					if ( $has_custom_text_color || $has_named_text_color ) {
						$classes .= ' has-text-color';
					}
					// Apply color class or inline style.
					if ( $has_named_text_color ) {
						$classes .= sprintf( ' has-%s-color', $attributes['textColor'] );
					} elseif ( $has_custom_text_color ) {
						$generated_class_name = uniqid( 'wp-block-colortext-' );
						$classes .= " $generated_class_name";
						wp_add_inline_style(
							'wp-block-supports',
							sprintf(
								// TODO: how do systematically and confidently address specificity?
								// should we just go back to proper inline styles?
								// of course, there's also the blunt tool that is !important.
								':root:root:root .%s { color: %s; }',
								$generated_class_name,
								$attributes['style']['color']['text']
							)
						);
					}
					return array( 'class' => $classes );
				},
				'default'    => array( false, true ),
			),
			'customClassName'  => array(
				'attributes' => array(
					'className' => array(
						'type' => 'string',
					),
				),
				'callback'   => function( $attributes ) {
					return array_key_exists( 'className', $attributes ) ?
						array( 'class' => $attributes['className'] ) :
						false;
				},
				'default'    => true,
			),
			'fontSize'         => array(
				'attributes' => array(
					'style'    => array(
						'type' => 'object',
					),
					'fontSize' => array(
						'type' => 'string',
					),
				),
				'callback'   => function( $attributes, $block_name ) {
					$has_named_font_size = array_key_exists( 'fontSize', $attributes );
					$has_custom_font_size = isset( $attributes['style']['typography']['fontSize'] );

					$classes = '';
					if ( $has_named_font_size ) {
						$classes = sprintf( 'has-%s-font-size', $attributes['fontSize'] );
					} elseif ( $has_custom_font_size ) {
						$generated_class_name = uniqid( 'wp-block-fontsize-' );
						$classes = $generated_class_name;
						wp_add_inline_style(
							'wp-block-supports',
							sprintf(
								'.%s { font-size: %spx; }',
								$generated_class_name,
								$attributes['style']['typography']['fontSize']
							)
						);
					}

					return array( 'class' => $classes );
				},
				'default'    => false,
			),
			'lineHeight'       => array(
				'attributes' => array(
					'style' => array(
						'type' => 'object',
					),
				),
				'callback'   => function( $attributes, $block_name ) {
					$has_line_height = isset( $attributes['style']['typography']['lineHeight'] );

					$classes = '';
					if ( $has_line_height ) {
						$generated_class_name = uniqid( 'wp-block-lineheight-' );
						$classes = $generated_class_name;
						wp_add_inline_style(
							'wp-block-supports',
							sprintf(
								'.%s { line-height: %s; }',
								$generated_class_name,
								$attributes['style']['typography']['lineHeight']
							)
						);
					}

					return array( 'class' => $classes );
				},
				'default'    => false,
			),
		);
	}

	/**
	 * TODO.
	 *
	 * @param  array         $block_supports Supports object.
	 * @param  string        $feature_name   Feature name.
	 * @param  boolean|array $default        Default value if support no found.
	 * @return any                           Supports data.
	 */
	private function get_block_support( $block_supports, $feature_name, $default = false ) {
		$path    = explode( '.', $feature_name );
		$default = (array) $default;
		if ( count( $path ) !== count( $default ) ) {
			return false;
		}
		$partial_path = array();
		foreach ( $path as $i => $subkey ) {
			$partial_path[] = $subkey;
			$result         = gutenberg_experimental_get(
				$block_supports,
				$partial_path,
				$default[ $i ]
			);
			if ( ! $result ) {
				break;
			}
		}
		return $result;
	}

	/**
	 * TODO.
	 *
	 * @param  string $input      HTML input.
	 * @param  array  $attributes Array of HTML attributes to insert at the
	 *                            root element.
	 * @return string             HTML with class(es) inserted.
	 */
	private function inject_attributes( $input, $attributes ) {
		$output = $input;

		foreach ( $attributes as $attribute_name => $attribute_value ) {
			$close_token        = '>';
			$attribute_token    = "$attribute_name=\"";
			$close_position     = strpos( $output, $close_token );
			$attribute_position = strpos( $output, $attribute_token );

			// Unexpected. Bail.
			if ( false === $close_position ) {
				return $input;
			}

			// If the first HTML element in the string does not contain our
			// attribute...
			if ( ! $attribute_position || $close_position < $attribute_position ) {
				// then inject a new one at the end of the tag.
				$output = substr_replace(
					$output,
					" $attribute_name=\"$attribute_value\">",
					$close_position,
					strlen( $close_token )
				);
				continue;
			}
			// Otherwise, overwrite the opening of the attribute in order to
			// inject our value.
			$output = substr_replace(
				$output,
				"$attribute_name=\"$attribute_value ",
				$attribute_position,
				strlen( $attribute_token )
			);
		}

		return $output;
	}

	/**
	 * TODO.
	 */
	private function register_attributes() {
		wp_register_style( 'wp-block-supports', false );

		$block_registry         = WP_Block_Type_Registry::get_instance();
		$registered_block_types = $block_registry->get_all_registered();
		foreach ( $registered_block_types as $block_type ) {
			if ( ! property_exists( $block_type, 'supports' ) ) {
				continue;
			}
			if ( ! $block_type->attributes ) {
				$block_type->attributes = array();
			}
			foreach ( $this->config as $feature_name => $feature_config ) {
				if (
					! $this->get_block_support(
						$block_type->supports,
						$feature_name,
						$feature_config['default']
					)
				) {
					continue;
				}
				foreach ( $feature_config['attributes'] as $attribute_name => $attribute_schema ) {
					if ( ! array_key_exists( $attribute_name, $block_type->attributes ) ) {
						$block_type->attributes[ $attribute_name ] = $attribute_schema;
					}
				}
			}
		}
	}
}

/**
 * Generates a string of classes by applying to the current block being
 * rendered all of the features that the block supports.
 *
 * @return string String of HTML classes.
 */
function gutenberg_block_supports_classes() {
	global $current_parsed_block;
	$new_attributes = WP_Block_Supports::get_instance()->get_new_block_attributes( $current_parsed_block );
	return empty( $new_attributes ) ? '' : $new_attributes['class'];
}

add_action( 'init', array( 'WP_Block_Supports', 'init' ), 22 );
