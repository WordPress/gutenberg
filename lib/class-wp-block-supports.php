<?php
/**
 * Block support flags.
 *
 * @package gutenberg
 */

/**
 * Class encapsulating and implementing Block Supports.
 * 
 * @private
 */
class _WP_Block_Supports {

	/**
	 * Config.
	 *
	 * @var array
	 */
	private $block_supports = array();

	/**
	 * Container for the main instance of the class.
	 *
	 * @var _WP_Block_Supports|null
	 */
	private static $instance = null;

	/**
	 * Utility method to retrieve the main instance of the class.
	 *
	 * The instance will be created if it does not exist yet.
	 *
	 * @return _WP_Block_Supports The main instance.
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
	}

	/**
	 * Registers a block support.
	 *
	 * @param string $block_support_name Block support name.
	 * @param array  $block_support_config Array containing the properties of the block support.
	 */
	public function register( $block_support_name, $block_support_config ) {
		$this->block_supports[ $block_support_name ] = array_merge(
			$block_support_config,
			array( 'name' => $block_support_name )
		);
	}


	/**
	 * Generates an array of HTML attributes, such as classes, by applying to
	 * the given block all of the features that the block supports.
	 *
	 * @param  array $parsed_block Block as parsed from content.
	 * @return array               Array of HTML attributes.
	 */
	public function apply_block_supports( $parsed_block ) {
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

		// If no render_callback, assume styles have been previously handled.
		if ( ! $block_type || empty( $block_type ) ) {
			return array();
		}

		$output = array();
		foreach ( $this->block_supports as $name => $block_support_config ) {
			if ( ! isset( $block_support_config['apply'] ) ) {
				continue;
			}

			$new_attributes = call_user_func(
				$block_support_config['apply'],
				$block_type,
				$block_attributes
			);

			if ( ! empty( $new_attributes ) ) {
				foreach ( $new_attributes as $attribute_name => $attribute_value ) {
					if ( empty( $output[ $attribute_name ] ) ) {
						$output[ $attribute_name ] = $attribute_value;
					} else {
						$output[ $attribute_name ] .= " $attribute_value";
					}
				}
			}
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

			foreach ( $this->block_supports as $name => $block_support_config ) {
				if ( ! isset( $block_support_config['register_attribute'] ) ) {
					continue;
				}
	
				call_user_func(
					$block_support_config['register_attribute'],
					$block_type
				);
			}
		}
	}
}

/**
 * Generates a string of attributes by applying to the current block being
 * rendered all of the features that the block supports.
 *
 * @param array $extra_attributes Extra attributes to render on the block wrapper.
 * 
 * @return string String of HTML classes.
 */
function get_block_wrapper_attributes( $extra_attributes ) {
	global $current_parsed_block;
	$new_attributes = _WP_Block_Supports::get_instance()->apply_block_supports( $current_parsed_block );
	
	if ( empty( $new_attributes ) && empty( $extra_attributes ) ) {
		return '';
	}

	// This is hardcoded on purpose.
	// We only support a fixed list of attributes.
	$attributes_to_merge = array( 'style', 'class' );
	$attributes = array();
	foreach ( $attributes_to_merge as $attribute_name ) {
		if ( empty( $new_attributes[ $attribute_name ] ) && empty( $extra_attributes[ $attribute_name ] ) ) {
			continue;
		}

		if ( empty( $new_attributes[ $attribute_name ] ) ) {
			$attributes[ $attribute_name ] = $extra_attributes[ $attribute_name ];
			continue;
		}

		if ( empty( $extra_attributes[ $attribute_name ] ) ) {
			$attributes[ $attribute_name ] = $new_attributes[ $attribute_name ];
			continue;
		}

		$attributes[ $attribute_name ] = $extra_attributes[ $attribute_name ] . ' ' . $new_attributes[ $attribute_name ];
	}

	if ( empty( $attributes ) ) {
		return '';
	}

	$normalized_attributes = array();
	foreach ( $attributes as $key => $value ) {
		$normalized_attributes[] = $key . '="' . esc_attr( $value ) . '"';
	}

	return implode( ' ', $normalized_attributes );
}

add_action( 'init', array( '_WP_Block_Supports', 'init' ), 22 );
