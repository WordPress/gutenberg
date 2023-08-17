<?php
/**
 * Temporary compatibility shims for block APIs present in Gutenberg.
 *
 * @package gutenberg
 */

/**
 * Checks whether the experimental Interactivity API should be used for a block.
 *
 * Note: This function is located here instead of in interactivity-api/blocks.php because it has to be available earler.
 *
 * @param string $block_name Block name.
 * @return bool Whether Interactivity API is used for block.
 */
function gutenberg_should_block_use_interactivity_api( $block_name ) {

	/**
	 * Filters whether the experimental Interactivity API should be used for a block.
	 *
	 * @since 6.3.0
	 *
	 * @param bool   $enabled    Whether Interactivity API is used for block.
	 * @param string $block_name Block name.
	 */
	return (bool) apply_filters( 'gutenberg_should_block_use_interactivity_api', true, $block_name );
}

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
		$callback = static function( $content, $block ) use ( $args, $block_name ) {

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


/**
 * Registers the metadata block attribute for block types.
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


$gutenberg_experiments = get_option( 'gutenberg-experiments' );
if ( $gutenberg_experiments && array_key_exists( 'gutenberg-connections', $gutenberg_experiments ) ) {

	/**
	 * Renders the block connections.
	 * Block connections allow to connect block attributes to custom fields or
	 * other data sources (in the future).
	 *
	 * Rendering block connections is a 3-step process:
	 * 1. Get the block attributes that have a connection. The connections are
	 *    added in the editor and stored in the block attributes.
	 * 2. For each "connected" attribute, get the value from the connection
	 *    source. For now, the only supported source is meta (custom fields).
	 * 3. Update the HTML of the block using the value from the connection. The
	 *    HTML can be replaced in two ways:
	 *      - If the attribute's "source" is `html`, replace the whole tag with the
	 *        value from the connection.
	 *      - If the attribute's "source" is `attribute`, replace the value of the
	 *        corresponding HTML attribute with the value from the connection.
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
			'core/image'     => array( 'url', 'title' ),
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
		$connected_attributes = _wp_array_get( $block['attrs'], array( 'connections', 'attributes' ), false );
		if ( ! $connected_attributes ) {
			return $block_content;
		}

		foreach ( $connected_attributes as $attribute_name => $attribute_value ) {

			// If the attribute is not in the allowlist, skip it.
			if ( ! in_array( $attribute_name, $blocks_attributes_allowlist[ $block['blockName'] ], true ) ) {
				continue;
			}

			// If the source value is not "meta_fields", skip it because the only supported
			// connection source is meta (custom fields) for now.
			if ( 'meta_fields' !== $attribute_value['source'] ) {
				continue;
			}

			// If the attribute does not have a source, skip it.
			if ( ! isset( $block_type->attributes[ $attribute_name ]['source'] ) ) {
				continue;
			}

			// If the attribute does not specify the name of the custom field, skip it.
			if ( ! isset( $attribute_value['value'] ) ) {
				continue;
			}

			// Get the content from the connection source.
			$connection_value = $connection_sources[ $attribute_value['source'] ](
				$block_instance,
				$attribute_value['value']
			);

			$attribute_config = $block_type->attributes[ $attribute_name ];

			// Generate the new block content with the custom value.
			$block_content = gutenberg_render_block_with_connection_value( $block_content, $connection_value, $attribute_config );

		}

		return $block_content;
	}
	add_filter( 'render_block', 'gutenberg_render_block_connections', 10, 3 );


	/**
	 * Renders the block with the custom value from a connection source.
	 *
	 * @param string $block_content The HTML of the block originally passed to the `render_block` filter.
	 * @param mixed  $custom_value The value obtained from the connection source (e.g. custom field).
	 * @param array  $attribute_config The configuration of the connected
	 * attribute. It should contain the following keys:
	 * - selector: The HTML selector of the element that should be updated.
	 * - source: The source of the connection. Currently, only "html" and "attribute" are supported.
	 * - attribute: The name of the attribute that should be updated. Only used if the `source` is "attribute".
	 */
	function gutenberg_render_block_with_connection_value( $block_content, $custom_value, $attribute_config ) {
		$tags               = new WP_HTML_Tag_Processor( $block_content );
		$block_selector_tag = $tags->next_tag(
			array(
				'tag_name' => $attribute_config['selector'],
			)
		);
		if ( ! $block_selector_tag ) {
			return $block_content;
		}

		// If the source is "html", it means that we should replace the whole tag with the meta value.
		if ( 'html' === $attribute_config['source'] ) {
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

			// If the source is an attribute, it means that we should replace the attribute value with the custom value.
		} elseif ( 'attribute' === $attribute_config['source'] ) {
			$tags->set_attribute( $attribute_config['attribute'], $custom_value );
			return $tags->get_updated_html();

		} else {
			// We don't support other sources yet.
			return $block_content;
		}
	}
}
