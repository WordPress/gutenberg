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

	// Text and background are skip-serialized onto the table (#42029).
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

	$preset_background_color          = array_key_exists( 'backgroundColor', $attributes )
		? "var:preset|color|{$attributes['backgroundColor']}"
		: null;
	$custom_background_color          = $color_styles['background'] ?? null;
	$color_block_styles['background'] = $preset_background_color ? $preset_background_color : $custom_background_color;

	$styles        = wp_style_engine_get_styles( array( 'color' => $color_block_styles ), array( 'convert_vars_to_classnames' => true ) );
	$inline_styles = $styles['css'] ?? '';
	$classnames    = empty( $styles['classnames'] ) ? array() : explode( ' ', $styles['classnames'] );
	$elements      = ( isset( $style_attributes['elements'] ) && is_array( $style_attributes['elements'] ) )
		? $style_attributes['elements']
		: array();
	if ( isset( $elements['link']['color']['text'] ) ) {
		$classnames[] = 'has-link-color';
	}

	$border_block_styles = ( isset( $style_attributes['border'] ) && is_array( $style_attributes['border'] ) )
		? $style_attributes['border']
		: array();

	if ( isset( $attributes['borderColor'] ) ) {
		$border_block_styles['color'] = "var:preset|color|{$attributes['borderColor']}";
	}

	$border_engine        = wp_style_engine_get_styles( array( 'border' => $border_block_styles ), array( 'convert_vars_to_classnames' => true ) );
	$border_styles        = $border_engine['css'] ?? '';
	$border_classes       = empty( $border_engine['classnames'] ) ? array() : explode( ' ', $border_engine['classnames'] );
	$has_split_borders    = block_core_calendar_has_split_borders( $border_block_styles );
	$block_gap_rules      = block_core_calendar_get_block_gap_style_rules( $attributes );
	$base_block_gap_css   = block_core_calendar_get_base_block_gap_css( $block_gap_rules );
	$responsive_gap_rules = block_core_calendar_get_responsive_block_gap_style_rules( $block_gap_rules );
	$wrapper_extra        = block_core_calendar_get_block_gap_wrapper_attributes( $responsive_gap_rules );

	$calendar = get_calendar( true, false );

	if ( empty( $calendar ) ) {
		$calendar = '';
	}

	$processor = new WP_HTML_Tag_Processor( $calendar );

	while ( $processor->next_tag() ) {
		$tag_name = $processor->get_tag();

		if ( 'TABLE' === $tag_name ) {
			block_core_calendar_merge_style_attribute( $processor, $inline_styles );
			block_core_calendar_merge_style_attribute( $processor, $border_styles );

			foreach ( $classnames as $classname ) {
				if ( ! empty( $classname ) ) {
					$processor->add_class( $classname );
				}
			}

			foreach ( $border_classes as $border_class ) {
				if ( ! empty( $border_class ) ) {
					$processor->add_class( $border_class );
				}
			}

			if ( $has_split_borders ) {
				$processor->add_class( 'has-individual-borders' );
			}
		}

		if ( 'CAPTION' === $tag_name && '' !== $base_block_gap_css ) {
			block_core_calendar_merge_style_attribute( $processor, 'margin-bottom:' . $base_block_gap_css );
		}
	}

	$calendar = $processor->get_updated_html();

	if ( ! empty( $responsive_gap_rules ) ) {
		block_core_calendar_enqueue_rendered_styles();
	}

	$wrapper_attributes = get_block_wrapper_attributes( $wrapper_extra );
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
 * Enqueues styles registered during Calendar block rendering.
 *
 * Dynamic blocks render after `wp_enqueue_scripts`, so block-supports styles
 * must be enqueued from the render callback to appear on the frontend.
 *
 * @since 7.1.0
 */
function block_core_calendar_enqueue_rendered_styles() {
	static $did_enqueue = false;

	if ( $did_enqueue ) {
		return;
	}

	gutenberg_enqueue_stored_styles();
	$did_enqueue = true;
}

/**
 * Returns the base (non-responsive) blockGap value.
 *
 * @since 7.1.0
 *
 * @param array $block_gap_rules Resolved block gap rules.
 * @return string CSS gap value, or an empty string when unset.
 */
function block_core_calendar_get_base_block_gap_css( $block_gap_rules ) {
	foreach ( $block_gap_rules as $block_gap_rule ) {
		if ( empty( $block_gap_rule['rules_group'] ) ) {
			return $block_gap_rule['value'];
		}
	}

	return '';
}

/**
 * Returns responsive blockGap rules that require the style engine.
 *
 * @since 7.1.0
 *
 * @param array $block_gap_rules Resolved block gap rules.
 * @return array[]
 */
function block_core_calendar_get_responsive_block_gap_style_rules( $block_gap_rules ) {
	$responsive_gap_rules = array();

	foreach ( $block_gap_rules as $block_gap_rule ) {
		if ( ! empty( $block_gap_rule['rules_group'] ) ) {
			$responsive_gap_rules[] = $block_gap_rule;
		}
	}

	return $responsive_gap_rules;
}

/**
 * Registers responsive instance blockGap styles and returns wrapper attributes.
 *
 * Base blockGap is output inline on the caption so server-side render previews
 * in the editor update immediately. Responsive values use the style engine.
 *
 * @since 7.1.0
 *
 * @param array $responsive_gap_rules Responsive block gap rules.
 * @return array Wrapper attributes to pass to get_block_wrapper_attributes().
 */
function block_core_calendar_get_block_gap_wrapper_attributes( $responsive_gap_rules ) {
	if ( empty( $responsive_gap_rules ) ) {
		return array();
	}

	$unique_class = wp_unique_id( 'wp-block-calendar-' );
	$selector     = ".wp-block-calendar.{$unique_class} table caption";
	$css_rules    = array();

	foreach ( $responsive_gap_rules as $responsive_gap_rule ) {
		$css_rules[] = array(
			'selector'     => $selector,
			'declarations' => array(
				'margin-bottom' => $responsive_gap_rule['value'],
			),
			'rules_group'  => $responsive_gap_rule['rules_group'],
		);
	}

	wp_style_engine_get_stylesheet_from_css_rules(
		$css_rules,
		array(
			'context' => 'block-supports',
		)
	);

	return array(
		'class' => $unique_class,
	);
}

/**
 * Builds blockGap style rules for the Calendar block caption spacing.
 *
 * Only instance values are supported. Global Styles blockGap is not applied
 * because the Calendar block does not have layout support.
 *
 * @since 7.1.0
 *
 * @param array $attributes Block attributes.
 * @return array[] {
 *     @type string      $value       Sanitized CSS gap value.
 *     @type string|null $rules_group Optional CSS rules group, such as a media query.
 * }
 */
function block_core_calendar_get_block_gap_style_rules( $attributes ) {
	$style_attr = ( isset( $attributes['style'] ) && is_array( $attributes['style'] ) )
		? $attributes['style']
		: array();

	if (
		defined( 'IS_GUTENBERG_PLUGIN' ) &&
		IS_GUTENBERG_PLUGIN &&
		function_exists( 'gutenberg_resolve_style_state_aliases' )
	) {
		$style_attr = gutenberg_resolve_style_state_aliases( $style_attr, 'core/calendar' );
	}

	$block_gap_rules = array();
	$spacing         = ( isset( $style_attr['spacing'] ) && is_array( $style_attr['spacing'] ) )
		? $style_attr['spacing']
		: array();

	if ( array_key_exists( 'blockGap', $spacing ) ) {
		$base_gap_css = block_core_calendar_normalize_gap_value( $spacing['blockGap'] );

		if ( '' !== $base_gap_css ) {
			$block_gap_rules[] = array(
				'value' => $base_gap_css,
			);
		}
	}

	$global_settings          = wp_get_global_settings();
	$viewport_settings        = $global_settings['viewport'] ?? null;
	$responsive_media_queries = array();

	foreach ( array( 'WP_Theme_JSON_Gutenberg', 'WP_Theme_JSON' ) as $theme_json_class_name ) {
		if ( method_exists( $theme_json_class_name, 'get_viewport_media_queries' ) ) {
			$responsive_media_queries = $theme_json_class_name::get_viewport_media_queries( $viewport_settings );
			break;
		}
	}

	foreach ( $responsive_media_queries as $breakpoint => $media_query ) {
		$viewport_style = $style_attr[ $breakpoint ] ?? null;

		if (
			! is_array( $viewport_style ) ||
			! is_array( $viewport_style['spacing'] ?? null ) ||
			! array_key_exists( 'blockGap', $viewport_style['spacing'] )
		) {
			continue;
		}

		$viewport_gap_css = block_core_calendar_normalize_gap_value( $viewport_style['spacing']['blockGap'] );

		if ( '' === $viewport_gap_css ) {
			continue;
		}

		$block_gap_rules[] = array(
			'value'       => $viewport_gap_css,
			'rules_group' => $media_query,
		);
	}

	return $block_gap_rules;
}

/**
 * Normalizes a blockGap value to a CSS-ready string.
 *
 * @since 7.1.0
 *
 * @param mixed $gap Block gap value.
 * @return string CSS gap value, or an empty string when unset or unsafe.
 */
function block_core_calendar_normalize_gap_value( $gap ) {
	if ( defined( 'IS_GUTENBERG_PLUGIN' ) && IS_GUTENBERG_PLUGIN && function_exists( 'gutenberg_sanitize_block_gap_value' ) ) {
		$gap = gutenberg_sanitize_block_gap_value( $gap );
	}

	if ( is_array( $gap ) ) {
		$gap = $gap['top'] ?? $gap['left'] ?? '';
	}

	$gap = is_string( $gap ) ? $gap : '';

	if ( '' === $gap ) {
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
 * Whether the block uses per-side border selections.
 *
 * @since 7.1.0
 *
 * @param array $border_block_styles Border styles from block attributes.
 * @return bool
 */
function block_core_calendar_has_split_borders( $border_block_styles ) {
	if ( ! is_array( $border_block_styles ) || empty( $border_block_styles ) ) {
		return false;
	}

	foreach ( array( 'top', 'right', 'bottom', 'left' ) as $side ) {
		if ( isset( $border_block_styles[ $side ] ) ) {
			return true;
		}
	}

	return false;
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
