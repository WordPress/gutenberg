<?php
/**
 * Server-side rendering of the `core/accordion-heading` block.
 *
 * @package WordPress
 */

/**
 * Returns the SVG markup for a namespaced icon reference, or '' when the
 * reference is not usable (unknown icon or non-public collection).
 *
 * @since 7.2.0
 *
 * @param string $icon_name Namespaced icon reference, e.g. `core/plus`.
 * @return string The SVG markup, or '' when the icon is not available.
 */
function block_core_accordion_heading_get_icon_svg( $icon_name ) {
	// Icons in non-public collections are not available in the editor, so do
	// not render them either. This mirrors the `core/icon` block.
	$registered_icon = WP_Icons_Registry::get_instance()->get_registered_icon( $icon_name );
	if ( null !== $registered_icon ) {
		$icon_collection = WP_Icon_Collections_Registry::get_instance()->get_registered( $registered_icon['collection'] );
		if ( null !== $icon_collection && ! $icon_collection['public'] ) {
			return '';
		}
	}

	return wp_get_icon( $icon_name, array( 'size' => null ) );
}

/**
 * Renders the `core/accordion-heading` block on server.
 *
 * The saved markup is left untouched unless the block stores state-aware icon
 * references: a resting-state `icon` plus an `iconStates` map keyed by the
 * heading's own state names. For that content, the empty per-state spans the
 * block saves are filled with the matching registry SVGs, and the control's
 * own state (the `is-open` class) decides which span is visible.
 *
 * Every replacement is exact and bounded against the markup the block saves,
 * so content without the expected spans renders exactly as saved.
 *
 * @since 7.2.0
 *
 * @param array  $attributes The block attributes.
 * @param string $content    The block content.
 * @return string Returns the block content, with icon references resolved.
 */
function block_core_accordion_heading_render( $attributes, $content ) {
	$icon = $attributes['icon'] ?? '';
	if ( ! is_string( $icon ) || '' === $icon ) {
		return $content;
	}

	$rest_svg = block_core_accordion_heading_get_icon_svg( $icon );
	if ( ! is_string( $rest_svg ) || '' === $rest_svg ) {
		return $content;
	}

	$updated = str_replace(
		'<span data-icon-state="rest"></span>',
		'<span data-icon-state="rest">' . $rest_svg . '</span>',
		$content,
		$replaced
	);
	if ( 1 !== $replaced ) {
		// The saved markup does not carry the per-state spans, so it is not
		// stateful content and is rendered exactly as saved.
		return $content;
	}

	$icon_states   = is_array( $attributes['iconStates'] ?? null )
		? $attributes['iconStates']
		: array();
	$expanded_icon = $icon_states['expanded'] ?? '';
	$expanded_svg  = is_string( $expanded_icon ) && '' !== $expanded_icon
		? block_core_accordion_heading_get_icon_svg( $expanded_icon )
		: '';

	// Fill the expanded span when a usable reference is stored; otherwise drop
	// the empty span so the resting icon remains visible when the item is open.
	$updated = str_replace(
		'<span data-icon-state="expanded"></span>',
		is_string( $expanded_svg ) && '' !== $expanded_svg
			? '<span data-icon-state="expanded">' . $expanded_svg . '</span>'
			: '',
		$updated
	);

	return $updated;
}

/**
 * Registers the `core/accordion-heading` block on server.
 *
 * @since 7.2.0
 */
function register_block_core_accordion_heading() {
	register_block_type_from_metadata(
		__DIR__ . '/accordion-heading',
		array(
			'render_callback' => 'block_core_accordion_heading_render',
		)
	);
}
add_action( 'init', 'register_block_core_accordion_heading' );
