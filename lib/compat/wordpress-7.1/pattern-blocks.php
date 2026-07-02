<?php
/**
 * Pattern-backed PHP-only block registration (prototype, WordPress 7.1+).
 *
 * Lets a PHP-only block (`supports.autoRegister`) use a block pattern for its
 * editable content. The pattern is a block-markup string, like a registered
 * pattern's `content`. In the editor it becomes real inner blocks locked to the
 * pattern structure. When saved, it serializes as normal block markup, so it can
 * render on the frontend without ServerSideRender.
 *
 * Gated behind the `gutenberg-pattern-blocks` experiment.
 *
 * @package gutenberg
 */

/**
 * Exposes auto-registered pattern block markup to the editor.
 *
 * Auto-registered blocks that declare a `pattern` property (and have no
 * `render_callback`) are passed to JavaScript as a map of block name to pattern
 * markup. The client registers each one with an editor view made of real inner
 * blocks. This complements the ServerSideRender collection in auto-register.php,
 * which only includes blocks with a `render_callback`.
 */
function gutenberg_enqueue_auto_register_pattern_blocks() {
	if ( ! gutenberg_is_experiment_enabled( 'gutenberg-pattern-blocks' ) ) {
		return;
	}

	$pattern_blocks    = array();
	$registered_blocks = WP_Block_Type_Registry::get_instance()->get_all_registered();

	foreach ( $registered_blocks as $block_name => $block_type ) {
		// `pattern` is an arbitrary registration arg, available as a public
		// property because WP_Block_Type::set_props() assigns unknown args.
		if ( empty( $block_type->supports['autoRegister'] ) || empty( $block_type->pattern ) || ! is_string( $block_type->pattern ) ) {
			continue;
		}
		// A pattern block with a `render_callback` renders as SSR-islands: the
		// editor renders that shell server-side and portals the editable pattern
		// blocks into its slots (WYSIWYG). Without a render_callback the blocks are
		// the output and are edited bare.
		$editor_mode = ! empty( $block_type->render_callback ) ? 'ssr-islands' : 'canvas';

		// Structural lock for the editable blocks: 'all' prevents add/move/remove
		// while keeping the content editable and the generated controls visible.
		// Soften it with `'patternLock' => false`.
		// phpcs:ignore WordPress.NamingConventions.ValidVariableName.UsedPropertyNotSnakeCase -- camelCase matches sibling block-registration args like supports.autoRegister.
		$lock = ( isset( $block_type->patternLock ) && false === $block_type->patternLock ) ? false : 'all';

		$pattern_blocks[ $block_name ] = array(
			'markup'            => $block_type->pattern,
			'lock'              => $lock,
			'hasRenderCallback' => ! empty( $block_type->render_callback ),
			'editorMode'        => $editor_mode,
		);
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
 * Guarantees an SSR-islands render callback a non-empty `$content`.
 *
 * The editor shell needs a `<wp-inner-block-slot>` marker wherever the content
 * goes, and only the block's own callback knows where that is. Instead of
 * making every author detect the editor context and emit the marker by hand,
 * this wraps the callback at registration so `$content` is always filled in:
 * the saved blocks when there are any, one slot per top-level pattern block
 * when the editor's SSR preview renders the block bare, or the rendered
 * pattern when an empty block renders on the front end. The callback places
 * `$content` like any other content, with no branches.
 *
 * @param array $args Arguments passed to `register_block_type()`.
 * @return array Filtered arguments.
 */
function gutenberg_wrap_ssr_islands_render_callback( $args ) {
	if (
		empty( $args['supports']['autoRegister'] ) ||
		empty( $args['pattern'] ) ||
		! is_string( $args['pattern'] ) ||
		empty( $args['render_callback'] )
	) {
		return $args;
	}

	if ( ! gutenberg_is_experiment_enabled( 'gutenberg-pattern-blocks' ) ) {
		return $args;
	}

	// One slot per top-level pattern block; the editable islands portal into
	// them by index. `parse_blocks()` also returns whitespace nodes with a null
	// block name; the filter drops them.
	$top_level_blocks = array_filter(
		parse_blocks( $args['pattern'] ),
		static function ( $block ) {
			return ! empty( $block['blockName'] );
		}
	);
	$slot_count       = max( 1, count( $top_level_blocks ) );

	$original_render_callback = $args['render_callback'];
	$pattern                  = $args['pattern'];

	$args['render_callback'] = static function ( $attributes, $content, $block ) use ( $original_render_callback, $slot_count, $pattern ) {
		if ( '' === trim( (string) $content ) ) {
			if ( defined( 'REST_REQUEST' ) && REST_REQUEST ) {
				// The editor's SSR preview renders the block bare. Pass the
				// slots as `$content` so the editor has somewhere to portal the
				// editable islands.
				$slots = '';
				for ( $index = 0; $index < $slot_count; $index++ ) {
					$slots .= sprintf(
						'<wp-inner-block-slot data-slot-index="%d" style="display:contents"></wp-inner-block-slot>',
						$index
					);
				}
				$content = $slots;
			} else {
				// An empty block on the front end falls back to the pattern,
				// matching the default content the editor seeds.
				$content = do_blocks( $pattern );
			}
		}

		return call_user_func( $original_render_callback, $attributes, $content, $block );
	};

	return $args;
}
add_filter( 'register_block_type_args', 'gutenberg_wrap_ssr_islands_render_callback' );
