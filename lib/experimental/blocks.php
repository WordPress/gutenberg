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

/**
 * Auto-insert a block as another block's first or last inner block.
 *
 * @param array $parsed_block The block being rendered.
 */
function gutenberg_auto_insert_child_block( $parsed_block ) {
	$block_patterns = WP_Block_Patterns_Registry::get_instance()->get_all_registered();

	foreach ( $block_patterns as $block_pattern ) {
		if ( ! isset( $block_pattern['autoInsert'] ) || ! isset( $block_pattern['blockTypes'] ) ) {
			continue;
		}

		// Is the current block listed among possible anchor blocks for the block pattern?
		$index = array_search( $parsed_block['blockName'], $block_pattern['blockTypes'], true );
		if ( false === $index ) {
			continue;
		}

		// Determine index of anchor block in $block_pattern['blockTypes'] and use it to look up matching relative position.
		if ( is_array( $block_pattern['autoInsert'] ) ) {
			$index = $index % count( $block_pattern['autoInsert'] ); // Wrap around in case the array is too short.
			if ( isset( $block_pattern['autoInsert'][ $index ] ) ) {
				$relative_position = $block_pattern['autoInsert'][ $index ];
			} // What if we don't have an autoInsert for this index?
		} else {
			$relative_position = $block_pattern['autoInsert'];
		}

		// Is the relative position of the block pattern set to first or last child?
		if ( 'firstChild' !== $relative_position && 'lastChild' !== $relative_position ) {
			continue;
		}

		$inserted_blocks = parse_blocks( $block_pattern['content'] );
		$inserted_block  = $inserted_blocks[0];

		if ( 'firstChild' === $relative_position ) {
			array_unshift( $parsed_block['innerBlocks'], $inserted_block );
			// Since WP_Block::render() iterates over `inner_content` (rather than `inner_blocks`)
			// when rendering blocks, we also need to prepend a value (`null`, to mark a block
			// location) to that array.
			array_unshift( $parsed_block['innerContent'], null );
		} elseif ( 'lastChild' === $relative_position ) {
			array_push( $parsed_block['innerBlocks'], $inserted_block );
			// Since WP_Block::render() iterates over `inner_content` (rather than `inner_blocks`)
			// when rendering blocks, we also need to prepend a value (`null`, to mark a block
			// location) to that array.
			array_push( $parsed_block['innerContent'], null );
		}
	}

	return $parsed_block;
}
add_filter( 'render_block_data', 'gutenberg_auto_insert_child_block', 10, 1 );

/**
 * Auto-insert blocks relative to a given block.
 *
 * @param string $block_content The block content.
 * @param array  $block         The full block, including name and attributes.
 */
function gutenberg_auto_insert_blocks( $block_content, $block ) {
	$block_patterns = WP_Block_Patterns_Registry::get_instance()->get_all_registered();

	foreach ( $block_patterns as $block_pattern ) {
		if ( ! isset( $block_pattern['autoInsert'] ) || ! isset( $block_pattern['blockTypes'] ) ) {
			continue;
		}

		// Is the current block listed among possible anchor blocks for the block pattern?
		$index = array_search( $block['blockName'], $block_pattern['blockTypes'], true );
		if ( false === $index ) {
			continue;
		}

		// Determine index of anchor block in $block_pattern['blockTypes'] and use it to look up matching relative position.
		if ( is_array( $block_pattern['autoInsert'] ) ) {
			$index = $index % count( $block_pattern['autoInsert'] ); // Wrap around in case the array is too short.
			if ( isset( $block_pattern['autoInsert'][ $index ] ) ) {
				$relative_position = $block_pattern['autoInsert'][ $index ];
			} // What if we don't have an autoInsert for this index?
		} else {
			$relative_position = $block_pattern['autoInsert'];
		}

		// Is the relative position of the block pattern set to before or after?
		if ( 'before' !== $relative_position && 'after' !== $relative_position ) {
			continue;
		}

		$inserted_blocks  = parse_blocks( $block_pattern['content'] );
		$inserted_content = render_block( $inserted_blocks[0] );

		if ( 'before' === $relative_position ) {
			$block_content = $inserted_content . $block_content;
		} elseif ( 'after' === $relative_position ) {
			$block_content = $block_content . $inserted_content;
		}
	}

	return $block_content;
}
add_filter( 'render_block', 'gutenberg_auto_insert_blocks', 10, 2 );
