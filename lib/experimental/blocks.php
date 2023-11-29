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
if ( $gutenberg_experiments && array_key_exists( 'gutenberg-connections', $gutenberg_experiments ) ) {
	require_once __DIR__ . '/block-bindings-api/index.php';
	// Whitelist of blocks that support block bindings.
	// We should look for a mechanism to opt-in for this. Maybe adding a property to block attributes?
	global $block_bindings_whitelist;
	$block_bindings_whitelist = array(
		'core/paragraph' => array( 'content' ),
		'core/image'     => array( 'url', 'title' ),
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
			// If the block doesn't have the bindings attribute, return.
			if ( ! isset( $block['attrs']['bindings'] ) ) {
				return $block_content;
			}

			// Assuming the following format for the bindings attribute:
			//
			// "bindings": [
			// {
			// "attribute": "title",
			// "source": { "name": "metadata", "params": "custom_field_1" }
			// },
			// {
			// "attribute": "url",
			// "source": { "name": "metadata", "params": "custom_field_2" }
			// },
			// ]
			// .
			global $block_bindings_whitelist;
			global $block_bindings_sources;
			$modified_block_content = $block_content;
			foreach ( $block['attrs']['bindings'] as $binding ) {
				if ( ! isset( $block_bindings_whitelist[ $block['blockName'] ] ) ) {
					continue;
				}
				if ( ! in_array( $binding['attribute'], $block_bindings_whitelist[ $block['blockName'] ], true ) ) {
					continue;
				}
				// Get the value based on the source.
				// We might want to move this to its own function if it gets more complex.
				// We pass $block_content, $block, $block_instance to the source callback in case sources want to use them.
				$source_value = $block_bindings_sources[ $binding['source']['name'] ]['apply_source']( $binding['source']['params'], $block_content, $block, $block_instance );

				// Process the HTML based on the block and the attribute.
				$modified_block_content = block_bindings_replace_html( $modified_block_content, $block['blockName'], $binding['attribute'], $source_value );
			}
			return $modified_block_content;
		}

		// Add filter only to the blocks in the whitelist.
		foreach ( $block_bindings_whitelist as $block_name => $attributes ) {
			add_filter( 'render_block_' . $block_name, 'process_block_bindings', 20, 3 );
		}
	}
}
