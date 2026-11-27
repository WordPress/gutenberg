<?php
/**
 * Block visibility block support flag.
 *
 * @package gutenberg
 */

/**
 * Builds a media query for one saved block visibility range.
 *
 * @param mixed $range Saved range with exclusive minimum and inclusive maximum pixel bounds.
 * @return string|null Media query, or null for invalid data.
 */
function gutenberg_get_block_visibility_range_media_query( $range ) {
	if ( ! is_array( $range ) || ! is_string( $range['id'] ?? null ) || ! preg_match( '/^[a-z][a-z0-9-]*$/D', $range['id'] ) || ! array_key_exists( 'min', $range ) || ! array_key_exists( 'max', $range ) ) {
		return null;
	}

	$min = $range['min'];
	$max = $range['max'];
	foreach ( array( $min, $max ) as $bound ) {
		if ( null !== $bound && ( ( ! is_int( $bound ) && ! is_float( $bound ) ) || ! is_finite( $bound ) || $bound <= 0 ) ) {
			return null;
		}
	}
	if ( null !== $min && null !== $max && $max <= $min ) {
		return null;
	}

	if ( null === $min && null === $max ) {
		return '@media (width >= 0px)';
	}
	if ( null === $min ) {
		return sprintf( '@media (width <= %spx)', wp_json_encode( $max ) );
	}
	if ( null === $max ) {
		return sprintf( '@media (width > %spx)', wp_json_encode( $min ) );
	}
	return sprintf( '@media (%spx < width <= %spx)', wp_json_encode( $min ), wp_json_encode( $max ) );
}

/**
 * Render nothing if the block is hidden, or add viewport visibility styles.
 *
 * @param string $block_content Rendered block content.
 * @param array  $block         Block object.
 * @return string Filtered block content.
 */
function gutenberg_render_block_visibility_support( $block_content, $block ) {
	$block_type = WP_Block_Type_Registry::get_instance()->get_registered( $block['blockName'] );

	if ( ! $block_type ) {
		return $block_content;
	}

	$block_visibility = $block['attrs']['metadata']['blockVisibility'] ?? null;

	// Hide the block whenever the value is boolean false, regardless of the
	// block's current visibility support. This prevents blocks that previously
	// supported visibility from unintentionally appearing on the front end
	// after their support was disabled.
	if ( false === $block_visibility ) {
		return '';
	}

	if ( ! block_has_support( $block_type, 'visibility', true ) ) {
		return $block_content;
	}

	if ( is_array( $block_visibility ) && ! empty( $block_visibility ) ) {
		$visibility_queries = array();
		$viewport_config    = $block_visibility['viewport'] ?? null;

		if ( is_array( $viewport_config ) && $viewport_config ) {
			$viewport_media_queries = WP_Theme_JSON_Gutenberg::get_viewport_media_queries(
				gutenberg_get_global_settings( array( 'viewport' ) ),
				array( 'include_desktop' => true )
			);
			foreach ( $viewport_media_queries as $state => $media_query ) {
				$viewport = ltrim( $state, '@' );
				if ( false === ( $viewport_config[ $viewport ] ?? null ) ) {
					$visibility_queries[ 'wp-block-hidden-' . $viewport ] = $media_query;
				}
			}
		}

		$saved_ranges = $block_visibility['viewportRanges'] ?? null;
		if ( 1 === ( $saved_ranges['version'] ?? null ) && is_array( $saved_ranges['hidden'] ?? null ) ) {
			foreach ( $saved_ranges['hidden'] as $range ) {
				$media_query = gutenberg_get_block_visibility_range_media_query( $range );
				if ( null !== $media_query ) {
					// Two blocks can use the same range ID with different saved bounds.
					$visibility_queries[ 'wp-block-hidden-range-' . md5( $media_query ) ] = $media_query;
				}
			}
		}

		if ( ! $visibility_queries ) {
			return $block_content;
		}

		ksort( $visibility_queries );
		$css_rules = array();
		foreach ( $visibility_queries as $visibility_class => $media_query ) {
			$css_rules[] = array(
				'selector'     => '.' . $visibility_class,
				'declarations' => array(
					'display' => 'none !important',
				),
				'rules_group'  => $media_query,
			);
		}

		gutenberg_style_engine_get_stylesheet_from_css_rules(
			$css_rules,
			array(
				'context'  => 'block-supports',
				'prettify' => false,
			)
		);

		if ( ! empty( $block_content ) ) {
			$processor = new WP_HTML_Tag_Processor( $block_content );
			if ( $processor->next_tag() ) {
				$processor->add_class( implode( ' ', array_keys( $visibility_queries ) ) );

				/*
				 * Set all IMG tags to be `fetchpriority=auto` so that wp_get_loading_optimization_attributes() won't add
				 * `fetchpriority=high` or increment the media count to affect whether subsequent IMG tags get `loading=lazy`.
				 */
				do {
					if ( 'IMG' === $processor->get_tag() ) {
						$processor->set_attribute( 'fetchpriority', 'auto' );
					}
				} while ( $processor->next_tag() );
				$block_content = $processor->get_updated_html();
			}
		}
	}

	return $block_content;
}

if ( function_exists( 'wp_render_block_visibility_support' ) ) {
	remove_filter( 'render_block', 'wp_render_block_visibility_support' );
}
add_filter( 'render_block', 'gutenberg_render_block_visibility_support', 10, 2 );
