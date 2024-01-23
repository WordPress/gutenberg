<?php
/**
 * Temporary compatibility shims for block APIs present in Gutenberg.
 *
 * @package gutenberg
 */

/**
 * Shim for the `variation_callback` block type argument.
 *
 * @param array $args The block type arguments.
 * @return array The updated block type arguments.
 */
function gutenberg_register_block_type_args_shim( $args ) {
	if ( isset( $args['variation_callback'] ) && is_callable( $args['variation_callback'] ) ) {
		$args['variations'] = call_user_func( $args['variation_callback'] );
		unset( $args['variation_callback'] );
	}
	return $args;
}

if ( ! method_exists( 'WP_Block_Type', 'get_variations' ) ) {
	add_filter( 'register_block_type_args', 'gutenberg_register_block_type_args_shim' );
}


/**
 * Registers the metadata block attribute for all block types.
 *
 * @param array $args Array of arguments for registering a block type.
 * @return array $args
 */
function gutenberg_register_metadata_attribute( $args ) {
	// Setup attributes if needed.
	if ( ! isset( $args['attributes'] ) || ! is_array( $args['attributes'] ) ) {
		$args['attributes'] = array();
	}

	if ( ! array_key_exists( 'metadata', $args['attributes'] ) ) {
		$args['attributes']['metadata'] = array(
			'type' => 'object',
		);
	}

	return $args;
}
add_filter( 'register_block_type_args', 'gutenberg_register_metadata_attribute' );

require_once __DIR__ . '/block-bindings/index.php';

if ( ! function_exists( 'gutenberg_process_block_bindings' ) ) {
	/**
	 * Process the block bindings attribute.
	 *
	 * @param string   $block_content Block Content.
	 * @param array    $block Block attributes.
	 * @param WP_Block $block_instance The block instance.
	 */
	function gutenberg_process_block_bindings( $block_content, $block, $block_instance ) {

		// Allowed blocks that support block bindings.
		// TODO: Look for a mechanism to opt-in for this. Maybe adding a property to block attributes?
		$allowed_blocks = array(
			'core/paragraph' => array( 'content' ),
			'core/heading'   => array( 'content' ),
			'core/image'     => array( 'url', 'title', 'alt' ),
			'core/button'    => array( 'url', 'text' ),
		);

		// If the block doesn't have the bindings property or isn't one of the allowed block types, return.
		if ( ! isset( $block['attrs']['metadata']['bindings'] ) || ! isset( $allowed_blocks[ $block_instance->name ] ) ) {
			return $block_content;
		}

		// Assuming the following format for the bindings property of the "metadata" attribute:
		//
		// "bindings": {
		//   "title": {
		//     "source": {
		//       "name": "post_meta",
		//       "attributes": { "value": "text_custom_field" }
		//     }
		//   },
		//   "url": {
		//     "source": {
		//       "name": "post_meta",
		//       "attributes": { "value": "text_custom_field" }
		//     }
		//   }
		// }
		//

		$block_bindings_sources = wp_block_bindings_get_sources();
		$modified_block_content = $block_content;
		foreach ( $block['attrs']['metadata']['bindings'] as $binding_attribute => $binding_source ) {

			// If the attribute is not in the list, process next attribute.
			if ( ! in_array( $binding_attribute, $allowed_blocks[ $block_instance->name ], true ) ) {
				continue;
			}
			// If no source is provided, or that source is not registered, process next attribute.
			if ( ! isset( $binding_source['source'] ) || ! isset( $binding_source['source']['name'] ) || ! isset( $block_bindings_sources[ $binding_source['source']['name'] ] ) ) {
				continue;
			}

			$source_callback = $block_bindings_sources[ $binding_source['source']['name'] ]['apply'];
			// Get the value based on the source.
			if ( ! isset( $binding_source['source']['attributes'] ) ) {
				$source_args = array();
			} else {
				$source_args = $binding_source['source']['attributes'];
			}
			$source_value = $source_callback( $source_args, $block_instance, $binding_attribute );
			// If the value is null, process next attribute.
			if ( is_null( $source_value ) ) {
				continue;
			}

			// Process the HTML based on the block and the attribute.
			$modified_block_content = wp_block_bindings_replace_html( $modified_block_content, $block_instance->name, $binding_attribute, $source_value );
		}
		return $modified_block_content;
	}
}

add_filter( 'render_block', 'gutenberg_process_block_bindings', 20, 3 );
