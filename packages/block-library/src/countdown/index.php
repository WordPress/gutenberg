<?php
/**
 * Server-side rendering of the `core/countdown` block.
 *
 * @package WordPress
 */

/**
 * Renders the Countdown block.
 *
 * @since 23.4.0
 *
 * @param array    $attributes Block attributes.
 * @param string   $content    The block rendered content.
 * @param WP_Block $block      The block object.
 *
 * @return string Rendered block content.
 */
function render_block_core_countdown( $attributes, $content, $block ) {
	$end_time              = $attributes['endTime'] ?? '';
	$show_days             = $attributes['showDays'] ?? true;
	$show_hours            = $attributes['showHours'] ?? true;
	$show_minutes          = $attributes['showMinutes'] ?? true;
	$show_seconds          = $attributes['showSeconds'] ?? true;
	$action_on_end         = $attributes['actionOnEnd'] ?? 'none';
	$action_value          = $attributes['actionValue'] ?? '';
	$bg_color              = isset( $attributes['bgColor'] ) ? $attributes['bgColor'] : '#ffffff';
	$border_color          = isset( $attributes['borderColor'] ) ? $attributes['borderColor'] : '#000000';
	$inner_blocks_behavior = $attributes['innerBlocksBehavior'] ?? 'revealOnEnd';
	$is_evergreen          = $attributes['isEvergreen'] ?? false;
	$e_days                = $attributes['evergreenDays'] ?? 0;
	$e_hours               = $attributes['evergreenHours'] ?? 0;
	$e_minutes             = $attributes['evergreenMinutes'] ?? 15;
	$evergreen_duration    = ( $e_days * DAY_IN_SECONDS ) + ( $e_hours * HOUR_IN_SECONDS ) + ( $e_minutes * MINUTE_IN_SECONDS );

	$post_id  = get_the_ID() ? get_the_ID() : 0;
	$timer_id = 'wp-countdown-' . md5( wp_json_encode( $attributes ) . $post_id );

	$current_time = time();

	if ( $is_evergreen ) {
		$is_expired       = false;
		$remaining_time   = $evergreen_duration;
		$end_time_utc_iso = '';
	} else {
		$end_time_gmt = $end_time
			? get_gmt_from_date( $end_time )
			: gmdate( 'Y-m-d H:i:s', $current_time + HOUR_IN_SECONDS );
		$end_time_ts  = strtotime( $end_time_gmt . ' +0000' );

		/**
         * Filters the absolute end time (Unix timestamp) for the countdown.
         *
         * @since 23.4.0
         * @param int      $end_time_ts The calculated Unix timestamp of the end time.
         * @param array    $attributes  The block attributes.
         * @param WP_Block $block       The block instance.
         */
        $end_time_ts = (int) apply_filters( 'core_countdown_end_time_ts', $end_time_ts, $attributes, $block );

		$remaining_time   = $end_time_ts - $current_time;
		$is_expired       = 0 >= $remaining_time;
		$end_time_utc_iso = gmdate( 'Y-m-d\TH:i:s\Z', $end_time_ts );
	}

	/**
     * Filters whether the countdown is considered expired.
     *
     * @since 23.4.0
     *
     * @param bool     $is_expired Whether the countdown has reached 0.
     * @param array    $attributes The block attributes.
     * @param WP_Block $block      The block instance.
     */
    $is_expired = apply_filters( 'core_countdown_is_expired', $is_expired, $attributes, $block );

	if ( ! $is_evergreen ) {
		$naturally_expired = 0 >= $remaining_time;
		if ( $is_expired !== $naturally_expired ) {
			$end_time_ts      = $is_expired
				? $current_time - 1
				: $current_time + max( 1, $remaining_time );
			$remaining_time   = $end_time_ts - $current_time;
			$end_time_utc_iso = gmdate( 'Y-m-d\TH:i:s\Z', $end_time_ts );
		}
	}

	$is_frontend_request = ! is_admin()
		&& ! ( defined( 'REST_REQUEST' ) && REST_REQUEST )
		&& ! wp_doing_cron()
		&& ! ( defined( 'WP_CLI' ) && WP_CLI );

	if ( $is_expired && 'redirect' === $action_on_end && $is_frontend_request ) {
		$valid_url = wp_http_validate_url( $action_value );
		if ( $valid_url ) {
			wp_redirect( $valid_url );
			exit;
		}
	}

	$total_seconds = (int) floor( $remaining_time );
	$total_minutes = (int) floor( $total_seconds / MINUTE_IN_SECONDS );
	$total_hours   = (int) floor( $total_seconds / HOUR_IN_SECONDS );
	$total_days    = (int) floor( $total_seconds / DAY_IN_SECONDS );

	$years_left   = (int) floor( $total_days / 365 );
	$days_left    = $total_days % 365;
	$hours_left   = $total_hours % 24;
	$minutes_left = $total_minutes % 60;
	$seconds_left = $total_seconds % 60;

	$has_inner_blocks = ! empty( trim( (string) $content ) );

	$should_render_inner = false;
	if ( 'redirect' !== $action_on_end && $has_inner_blocks && ! $is_evergreen ) {
		if ( 'hideOnEnd' === $inner_blocks_behavior && ! $is_expired ) {
			$should_render_inner = true;
		} elseif ( 'revealOnEnd' === $inner_blocks_behavior && $is_expired ) {
			$should_render_inner = true;
		}
	}

	if ( 'hide' === $action_on_end && $is_expired && ! $should_render_inner ) {
		return '';
	}

	if ( $is_expired ) {
		/**
		 * Fires when a Countdown block is rendered on the server and has reached (or passed) its end time.
		 *
		 * Note: This action fires on every server side render of an expired countdown,
		 * not just a single time when the countdown first ends.
		 *
		 * @since 23.4.0
		 *
		 * @param array    $attributes The block attributes.
		 * @param WP_Block $block      The block instance.
		 */
		do_action( 'core_countdown_expired', $attributes, $block );
	}

	$data_attrs = sprintf(
		'data-end-time="%1$s" data-server-expired="%2$s" data-show-days="%3$s" data-show-hours="%4$s" data-show-minutes="%5$s" data-show-seconds="%6$s" data-action-on-end="%7$s" data-action-value="%8$s" data-has-inner-blocks="%9$s" data-is-evergreen="%10$s" data-evergreen-duration="%11$s" data-timer-id="%12$s"',
		esc_attr( $end_time_utc_iso ),
		$is_expired ? 'true' : 'false',
		$show_days ? 'true' : 'false',
		$show_hours ? 'true' : 'false',
		$show_minutes ? 'true' : 'false',
		$show_seconds ? 'true' : 'false',
		esc_attr( $action_on_end ),
		esc_attr( $action_value ),
		$has_inner_blocks ? 'true' : 'false',
		$is_evergreen ? 'true' : 'false',
		esc_attr( $evergreen_duration ),
		esc_attr( $timer_id )
	);

	$wrapper_attributes = get_block_wrapper_attributes(
		array(
			'class' => $is_expired ? 'is-expired' : '',
		)
	);

	$inner_blocks_classes = 'countdown-inner-blocks';
	if ( 'hideOnEnd' === $inner_blocks_behavior ) {
		$inner_blocks_classes .= ' countdown-inner-blocks--hide-on-end';
	}

	$show_timer = ! $is_expired || 'none' === $action_on_end;

	$output = '';

	if ( $show_timer ) {
		$output .= '<div class="countdown">';

		$box_template = '<div class="countdown-box %1$s" style="background-color: %2$s; border-color: %3$s;"><span class="countdown-value">%4$s</span><small>%5$s</small></div>';

		if ( $years_left > 0 && ! $is_expired ) {
			$output .= sprintf( $box_template, 'countdown-years', esc_attr( $bg_color ), esc_attr( $border_color ), esc_html( $years_left ), __( 'Years' ) );
		}
		if ( $show_days ) {
			$output .= sprintf( $box_template, 'countdown-days', esc_attr( $bg_color ), esc_attr( $border_color ), $is_expired ? '0' : esc_html( $days_left ), __( 'Days' ) );
		}
		if ( $show_hours ) {
			$output .= sprintf( $box_template, 'countdown-hours', esc_attr( $bg_color ), esc_attr( $border_color ), $is_expired ? '0' : esc_html( $hours_left ), __( 'Hours' ) );
		}
		if ( $show_minutes ) {
			$output .= sprintf( $box_template, 'countdown-minutes', esc_attr( $bg_color ), esc_attr( $border_color ), $is_expired ? '0' : esc_html( $minutes_left ), __( 'Minutes' ) );
		}
		if ( $show_seconds ) {
			$output .= sprintf( $box_template, 'countdown-seconds', esc_attr( $bg_color ), esc_attr( $border_color ), $is_expired ? '0' : esc_html( $seconds_left ), __( 'Seconds' ) );
		}

		$output .= '</div>';
	}

	if ( 'showMessage' === $action_on_end ) {
		$message_style = $is_expired ? 'display: block;' : 'display: none;';
		$message_text  = $action_value ? $action_value : __( 'Countdown Ended' );
		$output       .= sprintf( '<div class="countdown-end-message" style="%1$s">%2$s</div>', esc_attr( $message_style ), esc_html( $message_text ) );
	}

	if ( $should_render_inner ) {
		$inner_style = ( $is_evergreen && 'revealOnEnd' === $inner_blocks_behavior ) ? ' style="display: none;"' : '';
		$output     .= sprintf( '<div class="%1$s"%2$s>%3$s</div>', esc_attr( $inner_blocks_classes ), $inner_style, $content );
	}

	return sprintf(
		'<div %1$s %2$s>%3$s</div>',
		$data_attrs,
		$wrapper_attributes,
		$output
	);
}

/**
 * Registers the `countdown` block.
 *
 * @since 23.4.0
 */
function register_block_core_countdown() {
	register_block_type_from_metadata(
		__DIR__ . '/countdown',
		array(
			'render_callback' => 'render_block_core_countdown',
		)
	);
}

add_action( 'init', 'register_block_core_countdown' );
