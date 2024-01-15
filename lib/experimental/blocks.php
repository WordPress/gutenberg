<?php
/**
 * Temporary compatibility shims for block APIs present in Gutenberg.
 *
 * @package gutenberg
 */

if ( ! function_exists( 'wp_enqueue_block_view_script' ) ) {
	/**
	 * Enqueues a frontend script for a specific block.
	 *
	 * Scripts enqueued using this function will only get printed
	 * when the block gets rendered on the frontend.
	 *
	 * @since 6.2.0
	 *
	 * @param string $block_name The block name, including namespace.
	 * @param array  $args       An array of arguments [handle,src,deps,ver,media,textdomain].
	 *
	 * @return void
	 */
	function wp_enqueue_block_view_script( $block_name, $args ) {
		$args = wp_parse_args(
			$args,
			array(
				'handle'     => '',
				'src'        => '',
				'deps'       => array(),
				'ver'        => false,
				'in_footer'  => false,

				// Additional args to allow translations for the script's textdomain.
				'textdomain' => '',
			)
		);

		/**
		 * Callback function to register and enqueue scripts.
		 *
		 * @param string $content When the callback is used for the render_block filter,
		 *                        the content needs to be returned so the function parameter
		 *                        is to ensure the content exists.
		 * @return string Block content.
		 */
		$callback = static function ( $content, $block ) use ( $args, $block_name ) {

			// Sanity check.
			if ( empty( $block['blockName'] ) || $block_name !== $block['blockName'] ) {
				return $content;
			}

			// Register the stylesheet.
			if ( ! empty( $args['src'] ) ) {
				wp_register_script( $args['handle'], $args['src'], $args['deps'], $args['ver'], $args['in_footer'] );
			}

			// Enqueue the stylesheet.
			wp_enqueue_script( $args['handle'] );

			// If a textdomain is defined, use it to set the script translations.
			if ( ! empty( $args['textdomain'] ) && in_array( 'wp-i18n', $args['deps'], true ) ) {
				wp_set_script_translations( $args['handle'], $args['textdomain'], $args['domainpath'] );
			}

			return $content;
		};

		/*
		 * The filter's callback here is an anonymous function because
		 * using a named function in this case is not possible.
		 *
		 * The function cannot be unhooked, however, users are still able
		 * to dequeue the script registered/enqueued by the callback
		 * which is why in this case, using an anonymous function
		 * was deemed acceptable.
		 */
		add_filter( 'render_block', $callback, 10, 2 );
	}
}




$gutenberg_experiments = get_option( 'gutenberg-experiments' );
if ( $gutenberg_experiments && (
	array_key_exists( 'gutenberg-block-bindings', $gutenberg_experiments ) ||
	array_key_exists( 'gutenberg-pattern-partial-syncing', $gutenberg_experiments )
) ) {

	require_once __DIR__ . '/block-bindings/index.php';
		// Allowed blocks that support block bindings.
	// TODO: Look for a mechanism to opt-in for this. Maybe adding a property to block attributes?
	global $block_bindings_allowed_blocks;
	$block_bindings_allowed_blocks = array(
		'core/paragraph' => array( 'content' ),
		'core/heading'   => array( 'content' ),
		'core/image'     => array( 'url', 'title', 'alt' ),
		'core/button'    => array( 'url', 'text' ),
	);
	if ( ! function_exists( 'process_block_bindings' ) ) {
		/**
		 * Process the block bindings attribute.
		 *
		 * @param string   $block_content Block Content.
		 * @param array    $block Block attributes.
		 * @param WP_Block $block_instance The block instance.
		 */
		function process_block_bindings( $block_content, $block, $block_instance ) {
			// If the block doesn't have the bindings property, return.
			if ( ! isset( $block['attrs']['metadata']['bindings'] ) ) {
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
			global $block_bindings_allowed_blocks;
			global $block_bindings_sources;
			$modified_block_content = $block_content;
			foreach ( $block['attrs']['metadata']['bindings'] as $binding_attribute => $binding_source ) {
				// If the block is not in the list, stop processing.
				if ( ! isset( $block_bindings_allowed_blocks[ $block['blockName'] ] ) ) {
					return $block_content;
				}
				// If the attribute is not in the list, process next attribute.
				if ( ! in_array( $binding_attribute, $block_bindings_allowed_blocks[ $block['blockName'] ], true ) ) {
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
				$modified_block_content = block_bindings_replace_html( $modified_block_content, $block['blockName'], $binding_attribute, $source_value );
			}
			return $modified_block_content;
		}

		// Add filter only to the blocks in the list.
		foreach ( $block_bindings_allowed_blocks as $block_name => $attributes ) {
			add_filter( 'render_block_' . $block_name, 'process_block_bindings', 20, 3 );
		}
	}
}
