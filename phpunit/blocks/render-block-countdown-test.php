<?php
/**
 * Tests for the gutenberg_render_block_core_countdown() function.
 *
 * @package WordPress
 * @subpackage Blocks
 *
 * @covers ::gutenberg_render_block_core_countdown
 * @group blocks
 */

$gutenberg_root = dirname( __DIR__ );
while ( ! file_exists( $gutenberg_root . '/packages/block-library/src/countdown/index.php' ) ) {
    $gutenberg_root = dirname( $gutenberg_root );
    if ( '/' === $gutenberg_root || '\\' === $gutenberg_root ) {
		break;
	}

}
if ( file_exists( $gutenberg_root . '/packages/block-library/src/countdown/index.php' ) ) {
    require_once $gutenberg_root . '/packages/block-library/src/countdown/index.php';
}

class Test_Render_Block_Core_Countdown extends WP_UnitTestCase {

    private $original_timezone_string;
    private $original_gmt_offset;

    public function set_up() {
        parent::set_up();
        $this->original_timezone_string = get_option( 'timezone_string' );
        $this->original_gmt_offset      = get_option( 'gmt_offset' );

        $registry = WP_Block_Type_Registry::get_instance();
        if ( ! $registry->is_registered( 'core/countdown' ) && function_exists( 'register_block_core_countdown' ) ) {
            register_block_core_countdown();
        }
    }

    public function tear_down() {
        update_option( 'timezone_string', $this->original_timezone_string );
        update_option( 'gmt_offset', $this->original_gmt_offset );
        parent::tear_down();
    }

    private function get_attributes( array $overrides = array() ) {
        $defaults = array(
            'endTime'             => '',
            'showDays'            => true,
            'showHours'           => true,
            'showMinutes'         => true,
            'showSeconds'         => true,
            'actionOnEnd'         => 'hide',
            'actionValue'         => '',
            'bgColor'             => '#ffffff',
            'borderColor'         => '#000000',
            'innerBlocksBehavior' => 'revealOnEnd',
            'isEvergreen'         => false,
            'evergreenDays'       => 0,
            'evergreenHours'      => 0,
            'evergreenMinutes'    => 15,
        );

        return array_merge( $defaults, $overrides );
    }

    private function render( array $attribute_overrides = array(), $content = '' ) {
        $attributes = $this->get_attributes( $attribute_overrides );
        
        $parsed_block = array(
            'blockName'    => 'core/countdown',
            'attrs'        => $attributes,
            'innerContent' => array( $content ),
            'innerHTML'    => $content,
        );

        return render_block( $parsed_block );
    }

    public function test_renders_countdown_wrapper_when_not_expired() {
        $end_time = gmdate( 'Y-m-d\TH:i:s', time() + HOUR_IN_SECONDS );
        $output   = $this->render( array( 'endTime' => $end_time ) );

        $this->assertStringContainsString( 'wp-block-countdown', $output );
        $this->assertStringContainsString( 'class="countdown"', $output );
        $this->assertStringNotContainsString( 'is-expired', $output );
    }

    public function test_defaults_to_one_hour_from_now_when_end_time_empty() {
        $output = $this->render( array( 'endTime' => '' ) );

        $this->assertStringContainsString( 'class="countdown"', $output );
        $this->assertStringNotContainsString( 'is-expired', $output );
        $this->assertMatchesRegularExpression( '/countdown-days.*?countdown-value">0</s', $output );
    }

    public function test_show_flags_control_which_boxes_render() {
        $end_time = gmdate( 'Y-m-d\TH:i:s', time() + HOUR_IN_SECONDS );
        $output   = $this->render(
            array(
                'endTime'     => $end_time,
                'showDays'    => false,
                'showHours'   => true,
                'showMinutes' => false,
                'showSeconds' => false,
            )
        );

        $this->assertStringNotContainsString( 'countdown-days', $output );
        $this->assertStringContainsString( 'countdown-hours', $output );
        $this->assertStringNotContainsString( 'countdown-minutes', $output );
        $this->assertStringNotContainsString( 'countdown-seconds', $output );
    }

    public function test_appearance_colors_applied_to_boxes() {
        $future = gmdate( 'Y-m-d\TH:i:s', time() + HOUR_IN_SECONDS );
        $output = $this->render(
            array(
                'endTime'     => $future,
                'bgColor'     => '#ff0000',
                'borderColor' => '#00ff00',
            )
        );

        $this->assertStringContainsString( 'background-color: #ff0000', $output );
        $this->assertStringContainsString( 'border-color: #00ff00', $output );
    }

    public function test_hide_action_renders_nothing_once_expired() {
        $end_time = gmdate( 'Y-m-d\TH:i:s', time() - MINUTE_IN_SECONDS );
        $output   = $this->render( array( 'endTime' => $end_time, 'actionOnEnd' => 'hide' ) );
        $this->assertSame( '', trim( $output ) );
    }

    public function test_hide_action_still_renders_before_expiry() {
        $end_time = gmdate( 'Y-m-d\TH:i:s', time() + HOUR_IN_SECONDS );
        $output   = $this->render( array( 'endTime' => $end_time, 'actionOnEnd' => 'hide' ) );
        $this->assertNotSame( '', trim( $output ) );
        $this->assertStringContainsString( 'class="countdown"', $output );
    }

    public function test_none_action_keeps_timer_visible_at_zero() {
        $end_time = gmdate( 'Y-m-d\TH:i:s', time() - MINUTE_IN_SECONDS );
        $output   = $this->render( array( 'endTime' => $end_time, 'actionOnEnd' => 'none' ) );
        $this->assertStringContainsString( 'class="countdown"', $output );
        $this->assertStringContainsString( 'is-expired', $output );
        $this->assertMatchesRegularExpression( '/countdown-days.*?countdown-value">0</s', $output );
    }

    public function test_show_message_hidden_before_expiry_visible_after() {
        $future = gmdate( 'Y-m-d\TH:i:s', time() + HOUR_IN_SECONDS );
        $past   = gmdate( 'Y-m-d\TH:i:s', time() - MINUTE_IN_SECONDS );

        $before = $this->render( array( 'endTime' => $future, 'actionOnEnd' => 'showMessage', 'actionValue' => 'Sale Ended!' ) );
        $after  = $this->render( array( 'endTime' => $past, 'actionOnEnd' => 'showMessage', 'actionValue' => 'Sale Ended!' ) );

        $this->assertStringContainsString( 'display: none;', $before );
        $this->assertStringContainsString( 'Sale Ended!', $before );
        $this->assertStringContainsString( 'display: block;', $after );
        $this->assertStringContainsString( 'Sale Ended!', $after );
    }

    public function test_show_message_falls_back_to_default_text_when_empty() {
        $past   = gmdate( 'Y-m-d\TH:i:s', time() - MINUTE_IN_SECONDS );
        $output = $this->render( array( 'endTime' => $past, 'actionOnEnd' => 'showMessage', 'actionValue' => '' ) );
        $this->assertStringContainsString( 'Countdown Ended', $output );
    }

    public function test_show_message_escapes_html_in_action_value() {
        $past   = gmdate( 'Y-m-d\TH:i:s', time() - MINUTE_IN_SECONDS );
        $output = $this->render( array( 'endTime' => $past, 'actionOnEnd' => 'showMessage', 'actionValue' => '<script>alert(1)</script>' ) );
        $this->assertStringNotContainsString( '<script>alert(1)</script>', $output );
        $this->assertStringContainsString( '&lt;script&gt;', $output );
    }

    public function test_redirect_is_skipped_in_admin_context() {
        set_current_screen( 'edit-post' );
        $this->assertTrue( is_admin() );

        $past   = gmdate( 'Y-m-d\TH:i:s', time() - MINUTE_IN_SECONDS );
        $output = $this->render( array( 'endTime' => $past, 'actionOnEnd' => 'redirect', 'actionValue' => 'https://example.com/sale-over' ) );
        $this->assertIsString( $output );

        set_current_screen( 'front' );
    }

    public function test_redirect_is_skipped_for_invalid_url() {
        $past   = gmdate( 'Y-m-d\TH:i:s', time() - MINUTE_IN_SECONDS );
        $output = $this->render( array( 'endTime' => $past, 'actionOnEnd' => 'redirect', 'actionValue' => 'not-a-valid-url' ) );
        $this->assertIsString( $output );
    }

    public function test_expired_action_fires_only_when_expired() {
        $fired = 0;
        $cb    = function () use ( &$fired ) { ++$fired; };
        add_action( 'core_countdown_expired', $cb );

        $this->render( array( 'endTime' => gmdate( 'Y-m-d\TH:i:s', time() + HOUR_IN_SECONDS ) ) );
        $this->assertSame( 0, $fired, 'Hook should not fire before expiry.' );

        $this->render( array( 'endTime' => gmdate( 'Y-m-d\TH:i:s', time() - MINUTE_IN_SECONDS ), 'actionOnEnd' => 'showMessage' ) );
        $this->assertSame( 1, $fired, 'Hook should fire once render happens past expiry.' );

        remove_action( 'core_countdown_expired', $cb );
    }

    public function test_expired_action_does_not_fire_when_hide_short_circuits() {
        $fired = 0;
        $cb    = function () use ( &$fired ) { ++$fired; };
        add_action( 'core_countdown_expired', $cb );

        $this->render( array( 'endTime' => gmdate( 'Y-m-d\TH:i:s', time() - MINUTE_IN_SECONDS ), 'actionOnEnd' => 'hide' ) );
        $this->assertSame( 0, $fired );
        remove_action( 'core_countdown_expired', $cb );
    }

    public function test_expired_action_receives_attributes_and_block_instance() {
        $received_attributes = null;
        $received_block      = null;
        $cb                  = function ( $attributes, $block ) use ( &$received_attributes, &$received_block ) {
            $received_attributes = $attributes;
            $received_block      = $block;
        };
        add_action( 'core_countdown_expired', $cb, 10, 2 );

        $this->render( array( 'endTime' => gmdate( 'Y-m-d\TH:i:s', time() - MINUTE_IN_SECONDS ), 'actionOnEnd' => 'showMessage', 'actionValue' => 'Custom message' ) );

        $this->assertIsArray( $received_attributes );
        $this->assertSame( 'Custom message', $received_attributes['actionValue'] );
        $this->assertInstanceOf( WP_Block::class, $received_block );

        remove_action( 'core_countdown_expired', $cb, 10 );
    }

    public function test_end_time_is_interpreted_in_site_timezone() {
        update_option( 'timezone_string', '' );
        update_option( 'gmt_offset', 5.5 );

        $now_utc         = time();
        $site_local_time = gmdate( 'Y-m-d\TH:i:s', $now_utc + HOUR_IN_SECONDS + ( 5.5 * HOUR_IN_SECONDS ) );
        $output = $this->render( array( 'endTime' => $site_local_time ) );

        $this->assertStringNotContainsString( 'is-expired', $output );
        $this->assertMatchesRegularExpression( '/countdown-hours.*?countdown-value">[01]</s', $output );
    }

    public function test_uses_real_utc_now_not_a_shifted_current_time() {
        update_option( 'timezone_string', '' );
        update_option( 'gmt_offset', -8 );

        $now_utc         = time();
        $site_local_time = gmdate( 'Y-m-d\TH:i:s', $now_utc - MINUTE_IN_SECONDS + ( -8 * HOUR_IN_SECONDS ) );
        $output = $this->render( array( 'endTime' => $site_local_time, 'actionOnEnd' => 'none' ) );

        $this->assertStringContainsString( 'is-expired', $output );
    }

    public function test_years_box_appears_for_long_durations() {
        $end_time = gmdate( 'Y-m-d\TH:i:s', time() + ( 400 * DAY_IN_SECONDS ) );
        $output   = $this->render( array( 'endTime' => $end_time ) );

        $this->assertStringContainsString( 'countdown-years', $output );
        $this->assertMatchesRegularExpression( '/countdown-years.*?countdown-value">1</s', $output );
        $this->assertMatchesRegularExpression( '/countdown-days.*?countdown-value">35</s', $output );
    }

    public function test_years_box_absent_for_short_durations() {
        $end_time = gmdate( 'Y-m-d\TH:i:s', time() + HOUR_IN_SECONDS );
        $output   = $this->render( array( 'endTime' => $end_time ) );
        $this->assertStringNotContainsString( 'countdown-years', $output );
    }

    public function test_evergreen_mode_is_never_marked_expired_server_side() {
        $output = $this->render( array( 'isEvergreen' => true, 'evergreenDays' => 0, 'evergreenHours' => 0, 'evergreenMinutes' => 15, 'actionOnEnd' => 'hide' ) );
        $this->assertNotSame( '', trim( $output ) );
        $this->assertStringNotContainsString( 'is-expired', $output );
    }

    public function test_evergreen_data_attributes_present_and_consistent() {
        $attributes = array( 'isEvergreen' => true, 'evergreenDays' => 1, 'evergreenHours' => 2, 'evergreenMinutes' => 30 );
        $output1 = $this->render( $attributes );
        $output2 = $this->render( $attributes );

        $this->assertStringContainsString( 'data-is-evergreen="true"', $output1 );

        $expected_duration = ( 1 * DAY_IN_SECONDS ) + ( 2 * HOUR_IN_SECONDS ) + ( 30 * MINUTE_IN_SECONDS );
        $this->assertStringContainsString( 'data-evergreen-duration="' . $expected_duration . '"', $output1 );

        preg_match( '/data-timer-id="([^"]+)"/', $output1, $m1 );
        preg_match( '/data-timer-id="([^"]+)"/', $output2, $m2 );
        $this->assertNotEmpty( $m1[1] );
        $this->assertSame( $m1[1], $m2[1] );
    }

    public function test_evergreen_timer_id_differs_for_different_attributes() {
        $output1 = $this->render( array( 'isEvergreen' => true, 'evergreenMinutes' => 10 ) );
        $output2 = $this->render( array( 'isEvergreen' => true, 'evergreenMinutes' => 20 ) );

        preg_match( '/data-timer-id="([^"]+)"/', $output1, $m1 );
        preg_match( '/data-timer-id="([^"]+)"/', $output2, $m2 );
        $this->assertNotSame( $m1[1], $m2[1] );
    }

    public function test_inner_blocks_render_when_reveal_on_end_and_expired() {
        $past   = gmdate( 'Y-m-d\TH:i:s', time() - MINUTE_IN_SECONDS );
        $output = $this->render( array( 'endTime' => $past, 'actionOnEnd' => 'showMessage', 'innerBlocksBehavior' => 'revealOnEnd' ), '<p>Buy now button</p>' );

        $this->assertStringContainsString( 'countdown-inner-blocks', $output );
        $this->assertStringContainsString( 'Buy now button', $output );
    }

    public function test_inner_blocks_absent_when_reveal_on_end_and_not_expired() {
        $future = gmdate( 'Y-m-d\TH:i:s', time() + HOUR_IN_SECONDS );
        $output = $this->render( array( 'endTime' => $future, 'innerBlocksBehavior' => 'revealOnEnd' ), '<p>Buy now button</p>' );

        $this->assertStringNotContainsString( 'Buy now button', $output );
        $this->assertStringNotContainsString( 'countdown-inner-blocks', $output );
    }

    public function test_inner_blocks_render_when_hide_on_end_and_not_expired() {
        $future = gmdate( 'Y-m-d\TH:i:s', time() + HOUR_IN_SECONDS );
        $output = $this->render( array( 'endTime' => $future, 'innerBlocksBehavior' => 'hideOnEnd' ), '<p>Early bird content</p>' );
        $this->assertStringContainsString( 'Early bird content', $output );
    }

    public function test_inner_blocks_absent_when_hide_on_end_and_expired() {
        $past   = gmdate( 'Y-m-d\TH:i:s', time() - MINUTE_IN_SECONDS );
        $output = $this->render( array( 'endTime' => $past, 'actionOnEnd' => 'showMessage', 'innerBlocksBehavior' => 'hideOnEnd' ), '<p>Early bird content</p>' );
        $this->assertStringNotContainsString( 'Early bird content', $output );
    }

    public function test_no_inner_blocks_markup_emitted_when_no_content() {
        $future = gmdate( 'Y-m-d\TH:i:s', time() + HOUR_IN_SECONDS );
        $output = $this->render( array( 'endTime' => $future ), '' );
        $this->assertStringNotContainsString( 'countdown-inner-blocks', $output );
        $this->assertStringContainsString( 'data-has-inner-blocks="false"', $output );
    }

    public function test_evergreen_mode_strips_inner_blocks_for_security() {
        $output = $this->render( array( 'isEvergreen' => true, 'innerBlocksBehavior' => 'revealOnEnd' ), '<p>Secret promo code</p>' );
        $this->assertStringNotContainsString( 'Secret promo code', $output );
        $this->assertStringNotContainsString( 'countdown-inner-blocks', $output );
    }

    public function test_data_attributes_are_individually_quoted() {
        $output = $this->render( array( 'actionOnEnd' => 'redirect', 'actionValue' => 'https://example.com/?a=1&b=2' ) );
        $this->assertStringContainsString( 'data-action-value="https://example.com/?a=1&amp;b=2"', $output );
    }

    public function test_show_flags_are_serialized_as_string_booleans() {
        $output = $this->render( array( 'showDays' => true, 'showHours' => false, 'showMinutes' => true, 'showSeconds' => false ) );
        $this->assertStringContainsString( 'data-show-days="true"', $output );
        $this->assertStringContainsString( 'data-show-hours="false"', $output );
        $this->assertStringContainsString( 'data-show-minutes="true"', $output );
        $this->assertStringContainsString( 'data-show-seconds="false"', $output );
    }

	public function test_is_expired_filter_can_force_expired_state() {
		add_filter( 'core_countdown_is_expired', '__return_true' );

		$future = gmdate( 'Y-m-d\TH:i:s', time() + WEEK_IN_SECONDS );
		$output = $this->render( array( 'endTime' => $future, 'actionOnEnd' => 'showMessage', 'actionValue' => 'Filter worked!' ) );

		$this->assertStringContainsString( 'is-expired', $output );
		$this->assertStringContainsString( 'Filter worked!', $output );
		$this->assertStringContainsString( 'display: block;', $output );

		remove_filter( 'core_countdown_is_expired', '__return_true' );
	}

	public function test_is_expired_filter_can_force_not_expired_state() {
		add_filter( 'core_countdown_is_expired', '__return_false' );

		$past   = gmdate( 'Y-m-d\TH:i:s', time() - MINUTE_IN_SECONDS );
		$output = $this->render( array( 'endTime' => $past, 'actionOnEnd' => 'hide' ) );

		$this->assertNotSame( '', trim( $output ) );
		$this->assertStringNotContainsString( 'is-expired', $output );

		remove_filter( 'core_countdown_is_expired', '__return_false' );
	}

	public function test_is_expired_filter_receives_attributes_and_block() {
		$received_attrs = null;
		$cb = function ( $is_expired, $attributes, $block ) use ( &$received_attrs ) {
			$received_attrs = $attributes;
			return $is_expired;
		};
		add_filter( 'core_countdown_is_expired', $cb, 10, 3 );

		$this->render( array( 'actionOnEnd' => 'showMessage', 'actionValue' => 'x' ) );

		$this->assertIsArray( $received_attrs );
		$this->assertSame( 'showMessage', $received_attrs['actionOnEnd'] );

		remove_filter( 'core_countdown_is_expired', $cb, 10 );
	}

	public function test_end_time_ts_filter_overrides_displayed_digits() {
        add_filter( 'core_countdown_end_time_ts', function () {
            return time() + 3665; 
        } );

        $future = gmdate( 'Y-m-d\TH:i:s', time() + WEEK_IN_SECONDS );
        $output = $this->render( array( 'endTime' => $future ) );
        $this->assertMatchesRegularExpression( '/countdown-hours.*?countdown-value">1</s', $output );
        $this->assertMatchesRegularExpression( '/countdown-minutes.*?countdown-value">1</s', $output );
        $this->assertMatchesRegularExpression( '/countdown-seconds.*?countdown-value">5</s', $output );

        remove_all_filters( 'core_countdown_end_time_ts' );
    }

    public function test_end_time_ts_filter_receives_attributes_and_block() {
        $received_block = null;
        $cb = function ( $end_time_ts, $attributes, $block ) use ( &$received_block ) {
            $received_block = $block;
            return $end_time_ts;
        };
        add_filter( 'core_countdown_end_time_ts', $cb, 10, 3 );

        $this->render();

        $this->assertInstanceOf( WP_Block::class, $received_block );

        remove_filter( 'core_countdown_end_time_ts', $cb, 10 );
    }

	public function test_is_expired_filter_forces_consistent_data_end_time() {
		add_filter( 'core_countdown_is_expired', '__return_true' );

		$future = gmdate( 'Y-m-d\TH:i:s', time() + WEEK_IN_SECONDS );
		$output = $this->render( array( 'endTime' => $future, 'actionOnEnd' => 'none' ) );

		$this->assertStringContainsString( 'data-server-expired="true"', $output );

		remove_filter( 'core_countdown_is_expired', '__return_true' );
	}

	public function test_is_expired_filter_forces_consistent_data_end_time_even_when_naturally_not_expired() {
		add_filter( 'core_countdown_is_expired', '__return_true' );

		$future = gmdate( 'Y-m-d\TH:i:s', time() + WEEK_IN_SECONDS );
		$output = $this->render( array( 'endTime' => $future, 'actionOnEnd' => 'showMessage', 'actionValue' => 'Filter worked!' ) );

		preg_match( '/data-end-time="([^"]+)"/', $output, $m );
		$this->assertNotEmpty( $m[1] );
		$this->assertLessThanOrEqual( time(), strtotime( $m[1] ), 'data-end-time should be pushed into the past to match the forced is_expired state.' );

		remove_filter( 'core_countdown_is_expired', '__return_true' );
	}
}
