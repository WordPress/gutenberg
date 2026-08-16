<?php
/**
 * Widget Type Composer: code-registered widget definitions.
 *
 * Loaded only when the `gutenberg-widget-type-composer` experiment is on
 * (gated from `lib/load.php`).
 *
 * A widget definition is a composition of blocks. This file provides the
 * in-memory, code-registered origin: definitions declared via
 * `gutenberg_register_widget_def()` live in a per-request registry, carry their
 * composition `content` inline, and create no database row. The resolver in
 * `dashboard-widgets/widget-types.php` walks this registry on `init` and
 * registers each entry as a Widget Type with `origin = 'code-registered'`.
 *
 * The CPT-stored origin is added in a later step.
 *
 * @package gutenberg
 */

/**
 * Registers a code-defined widget definition.
 *
 * Mirrors the spirit of `register_block_pattern()`: the definition is stored in
 * an in-memory registry for the lifetime of the request, no database row is
 * created, and the registration is the canonical source of truth.
 *
 * Calling the function twice for the same `$name` overwrites the previous entry.
 * When the second call carries arguments identical to the first the overwrite is
 * silent; when they differ, the function emits `_doing_it_wrong` so conflicts
 * surface during development.
 *
 * Example:
 *
 *     add_action( 'init', function () {
 *         gutenberg_register_widget_def( 'my-plugin/quick-stats', array(
 *             'title'       => __( 'Quick stats', 'my-plugin' ),
 *             'description' => __( 'Headline numbers for today.', 'my-plugin' ),
 *             'icon'        => 'chart-bar',
 *             'content'     => '<!-- wp:my-plugin/stats /-->',
 *         ) );
 *     }, 15 );
 *
 * @param string $name Definition identifier (namespaced, e.g. `core/latest-posts`).
 * @param array  $args {
 *     Definition arguments.
 *
 *     @type string $title       Optional. Display title surfaced by the host.
 *     @type string $description Optional. Short description.
 *     @type string $icon        Optional. Icon identifier (Dashicon slug or
 *                               registered icon name).
 *     @type string $category    Optional. Grouping category.
 *     @type string $content     Required. Block markup defining the composition.
 * }
 * @return bool True on success, false when validation fails.
 */
function gutenberg_register_widget_def( $name, $args = array() ) {
	if ( ! is_string( $name ) || '' === $name ) {
		_doing_it_wrong(
			__FUNCTION__,
			esc_html__( 'Widget Definition name must be a non-empty string.', 'gutenberg' ),
			'Gutenberg 23.2'
		);
		return false;
	}

	if ( empty( $args['content'] ) || ! is_string( $args['content'] ) ) {
		_doing_it_wrong(
			__FUNCTION__,
			sprintf(
				/* translators: %s: Widget Definition name. */
				esc_html__( 'Widget Definition "%s" is missing the required `content` argument.', 'gutenberg' ),
				esc_html( $name )
			),
			'Gutenberg 23.2'
		);
		return false;
	}

	$registry = &gutenberg_get_widget_def_registry_ref();

	$next = array_merge(
		array(
			'title'       => '',
			'description' => '',
			'icon'        => '',
			'category'    => '',
			'content'     => '',
		),
		$args,
		array( 'name' => $name )
	);

	if ( isset( $registry[ $name ] ) && $registry[ $name ] != $next ) { // phpcs:ignore Universal.Operators.StrictComparisons.LooseNotEqual
		_doing_it_wrong(
			__FUNCTION__,
			sprintf(
				/* translators: %s: Widget Definition name. */
				esc_html__( 'Widget Definition "%s" is already registered with different arguments. The previous registration is being overwritten.', 'gutenberg' ),
				esc_html( $name )
			),
			'Gutenberg 23.2'
		);
	}

	$registry[ $name ] = $next;

	return true;
}

/**
 * Returns all code-registered widget definitions.
 *
 * @return array<string, array<string, mixed>> Map of `$name => $args`.
 */
function gutenberg_get_registered_widget_defs() {
	return gutenberg_get_widget_def_registry_ref();
}

/**
 * Internal accessor that returns the in-memory registry by reference.
 *
 * Wrapped in a function so the static survives across calls without leaking a
 * top-level mutable global.
 *
 * @access private
 *
 * @return array<string, array<string, mixed>> Registry by reference.
 */
function &gutenberg_get_widget_def_registry_ref() {
	static $registry = array();
	return $registry;
}
