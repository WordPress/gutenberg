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




// TODO: Wrap this with a check for the experimental Custom Sources API.

/**
 * Renders the block meta attributes.
 *
 * @param string   $block_content Block Content.
 * @param array    $block Block attributes.
 * @param WP_Block $block_instance The block instance.
 */
function gutenberg_render_custom_sources( $block_content, $block, $block_instance ) {
	$meta_custom_source = require __DIR__ . '/custom-sources/meta.php';
	$block_type         = $block_instance->block_type;

	// Not sure if we need it, it was in Riad's PR.
	if ( null === $block_type ) {
		return $block_content;
	}

	// Whitelist of the block types that support custom sources
	// Currently, we only allow the Paragraph and Image blocks to use custom sources.
	if ( ! in_array( $block_type->name, array( 'core/paragraph', 'core/image' ), true ) ) {
		return $block_content;
	}

	// Get all the attributes that have a connection.
	$connected_attributes = _wp_array_get( $block_type->attributes, array( 'connections', 'attributes' ), false );
	if ( ! $connected_attributes ) {
		return $block_content;
	}

	foreach ( $connected_attributes as $attribute_name => $attribute_value ) {
		// If the source value is not meta, skip it because we only support meta
		// sources for now.
		if ( 'meta' !== $attribute_value['source'] ) {
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

		$block_content = $meta_custom_source['apply_source'](
			$block_content,
			$block_instance,
			$attribute_value['value'],
			$block_type->attributes[ $attribute_name ]
		);
	}

	return $block_content;
}

add_filter( 'render_block', 'gutenberg_render_custom_sources', 10, 3 );




// ----- This is just for testing, remove later -----

/**
 * Registers a custom meta
 */
function gutenberg_init_test_summary_meta_field() {
	register_meta(
		'post',
		'test_custom_field',
		array(
			'show_in_rest' => true,
			'single'       => true,
			'type'         => 'string',
			'default'      => 'hello this is a custom field test',
		)
	);
	register_meta(
		'post',
		'second_test_custom_field',
		array(
			'show_in_rest' => true,
			'single'       => true,
			'type'         => 'string',
			'default'      => 'second custom field test',
		)
	);
}
add_action( 'init', 'gutenberg_init_test_summary_meta_field' );
