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

	// Text stays on the table so cell content inherits it. Background serializes
	// on the wrapper so padding is filled (see #64345). Skip-serializing text
	// still matches #42029 for the text color path.
	$style_attributes = ( isset( $attributes['style'] ) && is_array( $attributes['style'] ) )
		? $attributes['style']
		: array();

	$color_block_styles = array();

	$color_styles               = ( isset( $style_attributes['color'] ) && is_array( $style_attributes['color'] ) )
		? $style_attributes['color']
		: array();
	$preset_text_color          = array_key_exists( 'textColor', $attributes ) ? "var:preset|color|{$attributes['textColor']}" : null;
	$custom_text_color          = $color_styles['text'] ?? null;
	$color_block_styles['text'] = $preset_text_color ? $preset_text_color : $custom_text_color;

	$styles        = wp_style_engine_get_styles( array( 'color' => $color_block_styles ), array( 'convert_vars_to_classnames' => true ) );
	$inline_styles = $styles['css'] ?? '';
	$classnames    = empty( $styles['classnames'] ) ? array() : explode( ' ', $styles['classnames'] );
	$elements      = ( isset( $style_attributes['elements'] ) && is_array( $style_attributes['elements'] ) )
		? $style_attributes['elements']
		: array();
	if ( isset( $elements['link']['color']['text'] ) ) {
		$classnames[] = 'has-link-color';
	}

	$block_gap_css = block_core_calendar_get_block_gap_css( $attributes );

	$border_block_styles = ( isset( $style_attributes['border'] ) && is_array( $style_attributes['border'] ) )
		? $style_attributes['border']
		: array();

	if ( isset( $attributes['borderColor'] ) ) {
		$border_block_styles['color'] = "var:preset|color|{$attributes['borderColor']}";
	}

	// Generate border styles and classes.
	$border_engine  = wp_style_engine_get_styles( array( 'border' => $border_block_styles ), array( 'convert_vars_to_classnames' => true ) );
	$border_styles  = $border_engine['css'] ?? '';
	$border_classes = empty( $border_engine['classnames'] ) ? array() : explode( ' ', $border_engine['classnames'] );
	$calendar       = get_calendar( true, false );

	if ( empty( $calendar ) ) {
		$calendar = '';
	}

	$processor = new WP_HTML_Tag_Processor( $calendar );

	while ( $processor->next_tag() ) {
		$tag_name = $processor->get_tag();

		// Apply text color classes and styles to the main table.
		if ( 'TABLE' === $tag_name ) {
			block_core_calendar_merge_style_attribute( $processor, $inline_styles );

			foreach ( $classnames as $classname ) {
				if ( ! empty( $classname ) ) {
					$processor->add_class( $classname );
				}
			}
		}

		if ( 'CAPTION' === $tag_name && '' !== $block_gap_css ) {
			block_core_calendar_merge_style_attribute( $processor, 'margin-bottom:' . $block_gap_css );
		}

		// Default CSS outlines every cell. A chosen border applies to all cells,
		// including leading/trailing pad cells.
		if ( 'TH' === $tag_name || 'TD' === $tag_name ) {
			foreach ( $border_classes as $border_class ) {
				if ( ! empty( $border_class ) ) {
					$processor->add_class( $border_class );
				}
			}

			block_core_calendar_merge_style_attribute( $processor, $border_styles );
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

	$current_style  = $processor->get_attribute( 'style' ) ?? '';
	$combined_style = trim( (string) $current_style, ';' );

	if ( '' !== $combined_style ) {
		$combined_style .= ';';
	}

	$processor->set_attribute( 'style', $combined_style . trim( $additional_css, ';' ) );
}

/**
 * Returns a CSS value for the Calendar block's blockGap, used as space between
 * the month/year caption and the date grid.
 *
 * Instance styles win over Global Styles. Block-level blockGap is not emitted
 * by layout styles (Calendar has no layout support), so Global Styles are read
 * here and applied as caption margin-bottom.
 *
 * @since 7.1.0
 *
 * @param array $attributes Block attributes.
 * @return string CSS gap value, or an empty string when unset or unsafe.
 */
function block_core_calendar_get_block_gap_css( $attributes ) {
	$style   = ( isset( $attributes['style'] ) && is_array( $attributes['style'] ) )
		? $attributes['style']
		: array();
	$spacing = ( isset( $style['spacing'] ) && is_array( $style['spacing'] ) )
		? $style['spacing']
		: array();
	$gap     = $spacing['blockGap'] ?? null;

	if ( ( null === $gap || '' === $gap ) && function_exists( 'wp_get_global_styles' ) ) {
		$gap = wp_get_global_styles(
			array( 'spacing', 'blockGap' ),
			array( 'block_name' => 'core/calendar' )
		);
	}

	if ( is_array( $gap ) ) {
		$gap = $gap['top'] ?? $gap['left'] ?? '';
	}

	$gap = is_string( $gap ) ? $gap : '';

	if ( '' === $gap || preg_match( '%[\\\(&=}]|/\*%', $gap ) ) {
		return '';
	}

	if ( str_contains( $gap, 'var:preset|spacing|' ) ) {
		$index_to_splice = strrpos( $gap, '|' ) + 1;
		$slug            = _wp_to_kebab_case( substr( $gap, $index_to_splice ) );
		return "var(--wp--preset--spacing--$slug)";
	}

	return $gap;
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
