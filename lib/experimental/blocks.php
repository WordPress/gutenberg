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
	array_key_exists( 'gutenberg-connections', $gutenberg_experiments ) ||
	array_key_exists( 'gutenberg-pattern-partial-syncing', $gutenberg_experiments )
) ) {
	/**
	 * Renders the block meta attributes.
	 *
	 * @param string   $block_content Block Content.
	 * @param array    $block Block attributes.
	 * @param WP_Block $block_instance The block instance.
	 */
	function gutenberg_render_block_connections( $block_content, $block, $block_instance ) {
		$connection_sources = require __DIR__ . '/connection-sources/index.php';
		$block_type         = $block_instance->block_type;

		// Allowlist of blocks that support block connections.
		// Currently, we only allow the following blocks and attributes:
		// - Paragraph: content.
		// - Image: url.
		$blocks_attributes_allowlist = array(
			'core/paragraph' => array( 'content' ),
			'core/image'     => array( 'url' ),
		);

		// Whitelist of the block types that support block connections.
		// Currently, we only allow the Paragraph and Image blocks to use block connections.
		if ( ! in_array( $block['blockName'], array_keys( $blocks_attributes_allowlist ), true ) ) {
			return $block_content;
		}

		// If for some reason, the block type is not found, skip it.
		if ( null === $block_type ) {
			return $block_content;
		}

		// If the block does not have support for block connections, skip it.
		if ( ! block_has_support( $block_type, array( '__experimentalConnections' ), false ) ) {
			return $block_content;
		}

		// Get all the attributes that have a connection.
		$connected_attributes = $block['attrs']['connections']['attributes'] ?? false;
		if ( ! $connected_attributes ) {
			return $block_content;
		}

		foreach ( $connected_attributes as $attribute_name => $attribute_value ) {

			// If the attribute is not in the allowlist, skip it.
			if ( ! in_array( $attribute_name, $blocks_attributes_allowlist[ $block['blockName'] ], true ) ) {
				continue;
			}

			// Skip if the source value is not "meta_fields" or "pattern_attributes".
			if ( 'meta_fields' !== $attribute_value['source'] && 'pattern_attributes' !== $attribute_value['source'] ) {
				continue;
			}

			// If the attribute does not have a source, skip it.
			if ( ! isset( $block_type->attributes[ $attribute_name ]['source'] ) ) {
				continue;
			}

			if ( 'pattern_attributes' === $attribute_value['source'] ) {
				if ( ! _wp_array_get( $block_instance->attributes, array( 'metadata', 'id' ), false ) ) {
					continue;
				}

				$custom_value = $connection_sources[ $attribute_value['source'] ]( $block_instance );
			} else {
				// If the attribute does not specify the name of the custom field, skip it.
				if ( ! isset( $attribute_value['value'] ) ) {
					continue;
				}

				// Get the content from the connection source.
				$custom_value = $connection_sources[ $attribute_value['source'] ](
					$block_instance,
					$attribute_value['value']
				);
			}

			if ( false === $custom_value ) {
				continue;
			}

			$tags  = new WP_HTML_Tag_Processor( $block_content );
			$found = $tags->next_tag(
				array(
					// TODO: In the future, when blocks other than Paragraph and Image are
					// supported, we should build the full query from CSS selector.
					'tag_name' => $block_type->attributes[ $attribute_name ]['selector'],
				)
			);
			if ( ! $found ) {
				return $block_content;
			}
			$tag_name     = $tags->get_tag();
			$markup       = "<$tag_name>$custom_value</$tag_name>";
			$updated_tags = new WP_HTML_Tag_Processor( $markup );
			$updated_tags->next_tag();

			// Get all the attributes from the original block and add them to the new markup.
			$names = $tags->get_attribute_names_with_prefix( '' );
			foreach ( $names as $name ) {
				$updated_tags->set_attribute( $name, $tags->get_attribute( $name ) );
			}

			return $updated_tags->get_updated_html();
		}

		return $block_content;
	}

	add_filter( 'render_block', 'gutenberg_render_block_connections', 10, 3 );
}
