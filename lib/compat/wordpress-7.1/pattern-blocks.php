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
		// Bindings decide the content model: with `core/pattern-overrides`
		// bindings the registration owns the structure, only bound fields are
		// editable, and instances store just their overrides. Otherwise the
		// `render_callback` decides how the pattern is edited: inside its
		// server-rendered shell (SSR-islands) or bare (canvas).
		if ( str_contains( $block_type->pattern, 'core/pattern-overrides' ) ) {
			$editor_mode = 'synced-islands';
		} elseif ( empty( $block_type->render_callback ) ) {
			$editor_mode = 'canvas';
		} else {
			$editor_mode = 'ssr-islands';
		}

		// Structural lock for the editable blocks: 'all' prevents add/move/remove
		// while keeping the content editable and the generated controls visible.
		// Canvas blocks can soften it with `'patternLock' => false`. SSR-islands
		// blocks keep the lock for now: unlocked structure inside the shell has
		// no appender yet, so honoring the opt-out there is a follow-up.
		// phpcs:ignore WordPress.NamingConventions.ValidVariableName.UsedPropertyNotSnakeCase -- camelCase matches sibling block-registration args like supports.autoRegister.
		$lock = ( 'canvas' === $editor_mode && isset( $block_type->patternLock ) && false === $block_type->patternLock ) ? false : 'all';

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
 * the saved blocks when there are any, a content slot when the editor's SSR
 * preview renders the block bare, or the rendered pattern when an empty block
 * renders on the front end. The callback places `$content` like any other
 * content, with no branches.
 *
 * @param array $args Arguments passed to `register_block_type()`.
 * @return array Filtered arguments.
 */
function gutenberg_wrap_ssr_islands_render_callback( $args ) {
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

	// A synced pattern must render server-side (the post stores only the
	// overrides), so a block that doesn't bring a render_callback gets the
	// identity one: the pattern with the overrides applied, unwrapped.
	if ( empty( $args['render_callback'] ) ) {
		if ( ! str_contains( $args['pattern'], 'core/pattern-overrides' ) ) {
			return $args;
		}
		$args['render_callback'] = static function ( $attributes, $content ) {
			return $content;
		};
	}

	$original_render_callback = $args['render_callback'];
	$pattern                  = $args['pattern'];
	$is_synced                = str_contains( $pattern, 'core/pattern-overrides' );

	// The overrides binding resolves through the `pattern/overrides` context,
	// so the block stores them in a `content` attribute and provides it as
	// that context, like `core/block` does. The `{}` default is added on the
	// JS side: an empty PHP array would bootstrap as `[]`, and stdClass would
	// break the PHP bindings source, which array-accesses the context.
	if ( $is_synced ) {
		if ( ! isset( $args['attributes']['content'] ) ) {
			$args['attributes']['content'] = array( 'type' => 'object' );
		}
		if ( ! isset( $args['provides_context'] ) ) {
			$args['provides_context'] = array();
		}
		$args['provides_context']['pattern/overrides'] = 'content';
	}

	$args['render_callback'] = static function ( $attributes, $content, $block ) use ( $original_render_callback, $pattern, $is_synced ) {
		if ( '' === trim( (string) $content ) ) {
			$rest_route = isset( $GLOBALS['wp']->query_vars['rest_route'] ) ? $GLOBALS['wp']->query_vars['rest_route'] : '';
			if ( defined( 'REST_REQUEST' ) && REST_REQUEST && str_contains( $rest_route, '/block-renderer/' ) ) {
				// Only the editor's block-renderer preview renders the block
				// bare on purpose. Pass a slot as `$content` so the editor has
				// somewhere to portal the editable islands: one content area,
				// matching the single `$content` a callback receives.
				$content = '<wp-inner-block-slot data-slot-index="0" style="display:contents"></wp-inner-block-slot>';
			} elseif ( $is_synced ) {
				// The pattern renders as the block's inner blocks so the
				// instance context (the overrides) reaches the bindings.
				// Rendering the children directly, rather than re-entering
				// $block->render(), keeps the block's own `render_block`
				// filters (layout, typography, plugins) from running twice.
				$block->parsed_block['innerBlocks']  = parse_blocks( $pattern );
				$block->parsed_block['innerContent'] = array_fill( 0, count( $block->parsed_block['innerBlocks'] ), null );
				$block->refresh_context_dependents();
				$content = '';
				foreach ( $block->inner_blocks as $inner_block ) {
					$content .= $inner_block->render();
				}
			} else {
				// Everywhere else an empty block falls back to the pattern:
				// the front end, and REST renders like a post's
				// `content.rendered`, which must match the front end.
				$content = do_blocks( $pattern );
			}
		}

		return call_user_func( $original_render_callback, $attributes, $content, $block );
	};

	return $args;
}
add_filter( 'register_block_type_args', 'gutenberg_wrap_ssr_islands_render_callback' );
