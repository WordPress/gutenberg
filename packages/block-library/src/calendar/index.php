<?php
/**
 * Server-side rendering of the `core/calendar` block.
 *
 * @package WordPress
 */

/**
 * Renders the `core/calendar` block on server.
 *
 * @since 5.2.0
 *
 * @global int $monthnum.
 * @global int $year.
 *
 * @param array $attributes The block attributes.
 *
 * @return string Returns the block content.
 */
function render_block_core_calendar( $attributes ) {
	global $monthnum, $year;

	// Calendar shouldn't be rendered
	// when there are no published posts on the site.
	if ( ! block_core_calendar_has_published_posts() ) {
		if ( is_user_logged_in() ) {
			return '<div>' . __( 'The calendar block is hidden because there are no published posts.' ) . '</div>';
		}
		return '';
	}

	$previous_monthnum = $monthnum;
	$previous_year     = $year;

	if ( isset( $attributes['month'] ) && isset( $attributes['year'] ) ) {
		$permalink_structure = get_option( 'permalink_structure' );
		if (
			str_contains( $permalink_structure, '%monthnum%' ) &&
			str_contains( $permalink_structure, '%year%' )
		) {
			$monthnum = $attributes['month'];
			$year     = $attributes['year'];
		}
	}

	/*
	 * Text, background, and border are skip-serialized onto the table (#42029).
	 * Cell borders inherit from the table via style.scss (same pattern as Table).
	 */
	$color_attributes = array_intersect_key( $attributes, array_flip( array( 'textColor', 'backgroundColor' ) ) );
	foreach ( array( 'text', 'background' ) as $feature ) {
		if ( isset( $attributes['style']['color'][ $feature ] ) ) {
			$color_attributes['style']['color'][ $feature ] = $attributes['style']['color'][ $feature ];
		}
	}

	$color_styles  = wp_get_color_classes_and_styles( $color_attributes );
	$border_styles = wp_get_border_classes_and_styles(
		block_core_calendar_normalize_border_attributes( $attributes )
	);

	$table_styles  = ( $color_styles['style'] ?? '' ) . ( $border_styles['style'] ?? '' );
	$table_classes = trim( ( $color_styles['class'] ?? '' ) . ' ' . ( $border_styles['class'] ?? '' ) );

	if ( isset( $attributes['style']['elements']['link']['color']['text'] ) ) {
		$table_classes .= ' has-link-color';
	}

	$calendar  = get_calendar( array( 'display' => false ) );
	$calendar  = is_string( $calendar ) ? $calendar : '';
	$processor = new WP_HTML_Tag_Processor( $calendar );

	if ( $processor->next_tag( 'TABLE' ) ) {
		block_core_calendar_merge_style_attribute( $processor, $table_styles );

		foreach ( preg_split( '/\s+/', $table_classes, -1, PREG_SPLIT_NO_EMPTY ) as $classname ) {
			$processor->add_class( $classname );
		}
	}

	$calendar = $processor->get_updated_html();

	$wrapper_attributes = get_block_wrapper_attributes();
	$output             = sprintf(
		'<div %1$s>%2$s</div>',
		$wrapper_attributes,
		$calendar
	);

	$monthnum = $previous_monthnum;
	$year     = $previous_year;

	return $output;
}

/**
 * Registers the `core/calendar` block on server.
 *
 * @since 5.2.0
 */
function register_block_core_calendar() {
	register_block_type_from_metadata(
		__DIR__ . '/calendar',
		array(
			'render_callback' => 'render_block_core_calendar',
		)
	);
}

add_action( 'init', 'register_block_core_calendar' );

/**
 * Normalizes border attributes for application on the calendar table.
 *
 * Linked "all sides" selections are often stored as four identical per-side
 * objects. Flatten those so table inheritance paints a full cell grid. Mixed
 * per-side borders are left as-is for the edge SCSS selectors.
 *
 * @since 7.1.0
 *
 * @param array $attributes Block attributes.
 * @return array Attributes with a normalized border value.
 */
function block_core_calendar_normalize_border_attributes( $attributes ) {
	$border = $attributes['style']['border'] ?? null;
	if ( ! is_array( $border ) ) {
		return $attributes;
	}

	// Already a flat / all-sides border.
	if ( isset( $border['width'] ) || isset( $border['color'] ) || isset( $border['style'] ) ) {
		return $attributes;
	}

	$sides  = array( 'top', 'right', 'bottom', 'left' );
	$shared = null;

	foreach ( $sides as $side ) {
		if ( empty( $border[ $side ] ) || ! is_array( $border[ $side ] ) ) {
			return $attributes;
		}

		$current = array(
			'width' => $border[ $side ]['width'] ?? null,
			'color' => $border[ $side ]['color'] ?? null,
			'style' => $border[ $side ]['style'] ?? null,
		);

		if ( null === $shared ) {
			$shared = $current;
			continue;
		}

		foreach ( array( 'width', 'color', 'style' ) as $property ) {
			if ( ( $shared[ $property ] ?? null ) !== ( $current[ $property ] ?? null ) ) {
				return $attributes;
			}
		}
	}

	$flat_border = array_filter(
		$shared,
		static function ( $value ) {
			return null !== $value && '' !== $value;
		}
	);

	if ( array() === $flat_border ) {
		return $attributes;
	}

	$attributes['style']['border'] = $flat_border;

	return $attributes;
}

/**
 * Merges CSS declarations into a tag's existing style attribute.
 *
 * @since 7.1.0
 *
 * @param WP_HTML_Tag_Processor $processor      Tag processor positioned on a tag.
 * @param string                $additional_css CSS declarations to append.
 */
function block_core_calendar_merge_style_attribute( $processor, $additional_css ) {
	if ( ! is_string( $additional_css ) || '' === $additional_css ) {
		return;
	}

	$current_style = $processor->get_attribute( 'style' ) ?? '';
	$parts         = array_filter(
		array_map(
			static function ( $part ) {
				return trim( $part, " \t;" );
			},
			explode( ';', (string) $current_style . ';' . $additional_css )
		)
	);

	$processor->set_attribute( 'style', implode( ';', $parts ) . ';' );
}

/**
 * Returns whether or not there are any published posts.
 *
 * Used to hide the calendar block when there are no published posts.
 * This compensates for a known Core bug: https://core.trac.wordpress.org/ticket/12016
 *
 * @since 5.9.0
 *
 * @return bool Has any published posts or not.
 */
function block_core_calendar_has_published_posts() {
	// Multisite already has an option that stores the count of the published posts.
	// Let's use that for multisites.
	if ( is_multisite() ) {
		return 0 < (int) get_option( 'post_count' );
	}

	// On single sites we try our own cached option first.
	$has_published_posts = get_option( 'wp_calendar_block_has_published_posts', null );
	if ( null !== $has_published_posts ) {
		return (bool) $has_published_posts;
	}

	// No cache hit, let's update the cache and return the cached value.
	return block_core_calendar_update_has_published_posts();
}

/**
 * Queries the database for any published post and saves
 * a flag whether any published post exists or not.
 *
 * @since 5.9.0
 *
 * @global wpdb $wpdb WordPress database abstraction object.
 *
 * @return bool Has any published posts or not.
 */
function block_core_calendar_update_has_published_posts() {
	global $wpdb;
	$has_published_posts = (bool) $wpdb->get_var( "SELECT 1 as test FROM {$wpdb->posts} WHERE post_type = 'post' AND post_status = 'publish' LIMIT 1" );
	update_option( 'wp_calendar_block_has_published_posts', $has_published_posts );
	return $has_published_posts;
}

// We only want to register these functions and actions when
// we are on single sites. On multi sites we use `post_count` option.
if ( ! is_multisite() ) {
	/**
	 * Handler for updating the has published posts flag when a post is deleted.
	 *
	 * @since 5.9.0
	 *
	 * @param int $post_id Deleted post ID.
	 */
	function block_core_calendar_update_has_published_post_on_delete( $post_id ) {
		$post = get_post( $post_id );

		if ( ! $post || 'publish' !== $post->post_status || 'post' !== $post->post_type ) {
			return;
		}

		block_core_calendar_update_has_published_posts();
	}

	/**
	 * Handler for updating the has published posts flag when a post status changes.
	 *
	 * @since 5.9.0
	 *
	 * @param string  $new_status The status the post is changing to.
	 * @param string  $old_status The status the post is changing from.
	 * @param WP_Post $post       Post object.
	 */
	function block_core_calendar_update_has_published_post_on_transition_post_status( $new_status, $old_status, $post ) {
		if ( $new_status === $old_status ) {
			return;
		}

		if ( 'post' !== get_post_type( $post ) ) {
			return;
		}

		if ( 'publish' !== $new_status && 'publish' !== $old_status ) {
			return;
		}

		block_core_calendar_update_has_published_posts();
	}

	add_action( 'delete_post', 'block_core_calendar_update_has_published_post_on_delete' );
	add_action( 'transition_post_status', 'block_core_calendar_update_has_published_post_on_transition_post_status', 10, 3 );
}
