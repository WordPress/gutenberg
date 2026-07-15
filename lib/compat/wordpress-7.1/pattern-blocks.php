<?php
/**
 * Pattern-backed PHP-only block registration.
 *
 * @package gutenberg
 */

/**
 * Exposes pattern markup for auto-registered blocks to the editor.
 *
 * The existing auto-register payload contains only block names, while
 * pattern-backed blocks also need their markup.
 */
function gutenberg_enqueue_auto_register_pattern_blocks() {
	if ( ! gutenberg_is_experiment_enabled( 'gutenberg-pattern-blocks' ) ) {
		return;
	}

	$pattern_blocks    = array();
	$registered_blocks = WP_Block_Type_Registry::get_instance()->get_all_registered();

	foreach ( $registered_blocks as $block_name => $block_type ) {
		// WP_Block_Type::set_props() exposes unknown registration arguments as
		// public properties, so `pattern` is available even though it is not declared.
		if ( empty( $block_type->supports['autoRegister'] ) || empty( $block_type->pattern ) || ! is_string( $block_type->pattern ) ) {
			continue;
		}

		$pattern_blocks[ $block_name ] = $block_type->pattern;
	}

	if ( ! empty( $pattern_blocks ) ) {
		wp_add_inline_script(
			'wp-block-library',
			sprintf( 'window.__unstableAutoRegisterBlockPatterns = %s;', wp_json_encode( $pattern_blocks ) ),
			'before'
		);
	}
}
add_action( 'enqueue_block_editor_assets', 'gutenberg_enqueue_auto_register_pattern_blocks' );

/**
 * Sets up server rendering for blocks that register a pattern.
 *
 * @param array  $args       Arguments passed to `register_block_type()`.
 * @param string $block_name Block type name.
 * @return array Filtered arguments.
 */
function gutenberg_apply_pattern_block_rendering( $args, $block_name ) {
	if (
		empty( $args['supports']['autoRegister'] ) ||
		empty( $args['pattern'] ) ||
		! is_string( $args['pattern'] )
	) {
		return $args;
	}

	if ( ! gutenberg_is_experiment_enabled( 'gutenberg-pattern-blocks' ) ) {
		return $args;
	}

	// Replacing a callback without warning could skip permission checks or other
	// author logic.
	if ( ! empty( $args['render_callback'] ) ) {
		_doing_it_wrong(
			'register_block_type',
			sprintf(
				/* translators: %s: block name. */
				__( 'Block "%s" registers both a pattern and a render_callback. A pattern replaces server rendering, so the callback is ignored.', 'gutenberg' ),
				$block_name
			),
			'7.1.0'
		);
	}

	// Overrides live in `content` and reach bound blocks through context. Force the
	// schema so PHP and JS validate them consistently.
	$args['attributes']['content'] = array( 'type' => 'object' );
	if ( ! isset( $args['provides_context'] ) ) {
		$args['provides_context'] = array();
	}
	$args['provides_context']['pattern/overrides'] = 'content';

	// The pattern is not saved in the block content, so HTML editing is disabled
	// unless the block explicitly opts in.
	if ( ! isset( $args['supports']['html'] ) ) {
		$args['supports']['html'] = false;
	}

	$args['skip_inner_blocks'] = true;

	$args['render_callback'] = static function ( $attributes, $content, $block ) {
		// A pattern can contain another instance of the same block. Render that nested
		// instance as empty, matching `core/block`, to avoid infinite recursion.
		static $rendering = array();
		if ( isset( $rendering[ $block->name ] ) ) {
			return '';
		}
		$rendering[ $block->name ] = true;

		// A later registration filter may replace the pattern, so read the current
		// value here. The pattern enters the content after the embed filters have run,
		// so handle embeds before parsing it.
		global $wp_embed;
		$pattern = $wp_embed->run_shortcode( $block->block_type->pattern );
		$pattern = $wp_embed->autoembed( $pattern );

		// Rebuilding the children also passes this block's override context to them.
		$block->parsed_block['innerBlocks']  = parse_blocks( $pattern );
		$block->parsed_block['innerContent'] = array_fill( 0, count( $block->parsed_block['innerBlocks'] ), null );
		$block->refresh_context_dependents();

		// Match WP_Block::render()'s child filters here. Calling the host's render()
		// would run the host and its `render_block` filters twice.
		$output = '';
		foreach ( $block->inner_blocks as $inner_block ) {
			/** This filter is documented in wp-includes/blocks.php */
			$pre_render = apply_filters( 'pre_render_block', null, $inner_block->parsed_block, $block );
			if ( null !== $pre_render ) {
				$output .= $pre_render;
				continue;
			}

			$source_block        = $inner_block->parsed_block;
			$inner_block_context = $inner_block->context;

			/** This filter is documented in wp-includes/blocks.php */
			$inner_block->parsed_block = apply_filters( 'render_block_data', $inner_block->parsed_block, $source_block, $block );

			/** This filter is documented in wp-includes/blocks.php */
			$inner_block->context = apply_filters( 'render_block_context', $inner_block->context, $inner_block->parsed_block, $block );

			if ( $inner_block->context !== $inner_block_context ) {
				$inner_block->refresh_context_dependents();
			} elseif ( $inner_block->parsed_block !== $source_block ) {
				$inner_block->refresh_parsed_block_dependents();
			}

			$output .= $inner_block->render();
		}

		unset( $rendering[ $block->name ] );

		// Use the same wrapper as the editor so block classes and support attributes
		// are available on both sides.
		return sprintf( '<div %1$s>%2$s</div>', get_block_wrapper_attributes(), $output );
	};

	return $args;
}
add_filter( 'register_block_type_args', 'gutenberg_apply_pattern_block_rendering', 10, 2 );
