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
		// Opt into an SSR preview instead of canvas editing; falls through to the
		// SSR registration (needs a render_callback).
		// phpcs:ignore WordPress.NamingConventions.ValidVariableName.UsedPropertyNotSnakeCase -- camelCase matches sibling block-registration args like supports.autoRegister.
		if ( isset( $block_type->patternEditorPreview ) && 'ssr' === $block_type->patternEditorPreview ) {
			continue;
		}
		// `lock` mode: 'contentOnly' (default) locks tightly but its section UI
		// hides the generated controls; `false` keeps them visible with a softer
		// lock (`'patternLock' => false`).
		// phpcs:ignore WordPress.NamingConventions.ValidVariableName.UsedPropertyNotSnakeCase -- camelCase matches sibling block-registration args like supports.autoRegister.
		$lock = ( isset( $block_type->patternLock ) && false === $block_type->patternLock ) ? false : 'contentOnly';

		$pattern_blocks[ $block_name ] = array(
			'markup'            => $block_type->pattern,
			'lock'              => $lock,
			'hasRenderCallback' => ! empty( $block_type->render_callback ),
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
