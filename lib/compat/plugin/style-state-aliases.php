<?php
/**
 * Plugin-specific style state alias back compatibility.
 *
 * @package Gutenberg
 */

/**
 * Resolves temporary aliases for persisted style state keys to their canonical keys.
 *
 * This keeps compatibility for Gutenberg plugin content created before
 * responsive states used '@' and custom states used '-'. Remove after the
 * deprecation window ends.
 *
 * DO NOT BACKPORT TO CORE.
 *
 * @param array       $styles     Persisted style data.
 * @param string|null $block_name Current block name, when walking block styles.
 * @return array Style data with canonical style state keys.
 */
function gutenberg_resolve_style_state_aliases( $styles, $block_name = null ) {
	if ( ! is_array( $styles ) ) {
		return $styles;
	}

	$responsive_breakpoint_aliases = array(
		'@mobile' => 'mobile',
		'@tablet' => 'tablet',
	);

	foreach ( $responsive_breakpoint_aliases as $state => $legacy_state ) {
		if ( array_key_exists( $legacy_state, $styles ) && ! array_key_exists( $state, $styles ) ) {
			$styles[ $state ] = $styles[ $legacy_state ];
		}
		unset( $styles[ $legacy_state ] );
	}

	$block_custom_state_aliases = array(
		'core/navigation-link' => array(
			'-current' => '@current',
		),
	);

	if ( $block_name && isset( $block_custom_state_aliases[ $block_name ] ) ) {
		foreach ( $block_custom_state_aliases[ $block_name ] as $state => $legacy_state ) {
			if ( array_key_exists( $legacy_state, $styles ) && ! array_key_exists( $state, $styles ) ) {
				$styles[ $state ] = $styles[ $legacy_state ];
			}
			unset( $styles[ $legacy_state ] );
		}
	}

	foreach ( $styles as $key => $value ) {
		if ( ! is_array( $value ) ) {
			continue;
		}

		if ( 'blocks' === $key ) {
			foreach ( $value as $child_block_name => $child_value ) {
				$styles[ $key ][ $child_block_name ] = gutenberg_resolve_style_state_aliases( $child_value, $child_block_name );
			}
			continue;
		}

		if ( 'elements' === $key || 'variations' === $key ) {
			foreach ( $value as $child_key => $child_value ) {
				$styles[ $key ][ $child_key ] = gutenberg_resolve_style_state_aliases( $child_value, $block_name );
			}
			continue;
		}

		$styles[ $key ] = gutenberg_resolve_style_state_aliases( $value, $block_name );
	}

	return $styles;
}
