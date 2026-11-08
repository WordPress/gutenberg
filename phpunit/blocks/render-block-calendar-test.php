<?php
/**
 * Calendar block rendering tests.
 *
 * @package WordPress
 * @subpackage Blocks
 */

/**
 * Tests for the Calendar block.
 *
 * @group blocks
 */
class Tests_Blocks_Render_Calendar extends WP_UnitTestCase {

	/**
	 * Published post used to satisfy the has-published-posts check.
	 *
	 * @var int
	 */
	private static $post_id;

	/**
	 * Fixture returned by the get_calendar filter.
	 *
	 * @var string
	 */
	private $calendar_markup;

	/**
	 * Original WP_Block_Supports::$block_to_render value.
	 *
	 * @var array|null
	 */
	private $original_block_supports;

	public static function wpSetUpBeforeClass( WP_UnitTest_Factory $factory ) {
		self::$post_id = $factory->post->create(
			array(
				'post_status' => 'publish',
				'post_title'  => 'Calendar test post',
			)
		);
	}

	public static function wpTearDownAfterClass() {
		wp_delete_post( self::$post_id, true );
	}

	public function set_up() {
		parent::set_up();

		if ( class_exists( 'WP_Style_Engine_CSS_Rules_Store_Gutenberg' ) ) {
			WP_Style_Engine_CSS_Rules_Store_Gutenberg::remove_all_stores();
		}

		$this->original_block_supports      = WP_Block_Supports::$block_to_render;
		WP_Block_Supports::$block_to_render = array(
			'blockName' => 'core/calendar',
			'attrs'     => array(),
		);

		update_option( 'wp_calendar_block_has_published_posts', true );

		$this->calendar_markup = '<table class="wp-calendar-table" style="display:table"><caption>August 2026</caption><thead><tr><th>Mon</th></tr></thead><tbody><tr><td>&nbsp;</td><td>1</td></tr></tbody></table>';
		add_filter( 'get_calendar', array( $this, 'filter_get_calendar' ) );
	}

	public function tear_down() {
		remove_filter( 'get_calendar', array( $this, 'filter_get_calendar' ) );
		WP_Block_Supports::$block_to_render = $this->original_block_supports;
		parent::tear_down();
	}

	/**
	 * Replaces get_calendar() output with a stable fixture.
	 *
	 * @param string $calendar_output Calendar HTML.
	 * @return string
	 */
	public function filter_get_calendar( $calendar_output ) { // phpcs:ignore VariableAnalysis.CodeAnalysis.VariableAnalysis.UnusedVariable
		return $this->calendar_markup;
	}

	/**
	 * @covers ::gutenberg_block_core_calendar_merge_style_attribute
	 */
	public function test_merge_style_attribute_keeps_existing_declarations() {
		$processor = new WP_HTML_Tag_Processor( '<table style="display:table">' );
		$processor->next_tag();
		gutenberg_block_core_calendar_merge_style_attribute( $processor, 'color:#111111' );

		$this->assertSame(
			'<table style="display:table;color:#111111;">',
			$processor->get_updated_html()
		);
	}

	/**
	 * @covers ::gutenberg_render_block_core_calendar
	 *
	 * @dataProvider data_color_classes_and_styles
	 *
	 * @param array       $attributes     Block attributes.
	 * @param string      $expected_class Expected table class attribute.
	 * @param string|null $expected_style Expected table style attribute.
	 */
	public function test_applies_color_classes_and_styles_to_table( $attributes, $expected_class, $expected_style ) {
		$html = gutenberg_render_block_core_calendar( $attributes );

		$processor = new WP_HTML_Tag_Processor( $html );

		$this->assertTrue( $processor->next_tag( 'TABLE' ) );
		$this->assertSame( $expected_class, $processor->get_attribute( 'class' ) );
		$this->assertSame( $expected_style, $processor->get_attribute( 'style' ) );
	}

	/**
	 * Data provider.
	 *
	 * @return array
	 */
	public function data_color_classes_and_styles() {
		return array(
			'preset colors'           => array(
				'attributes'     => array(
					'textColor'       => 'contrast',
					'backgroundColor' => 'base',
				),
				'expected_class' => 'wp-calendar-table has-text-color has-contrast-color has-background has-base-background-color',
				'expected_style' => 'display:table',
			),
			'custom colors'           => array(
				'attributes'     => array(
					'style' => array(
						'color' => array(
							'text'       => '#123456',
							'background' => '#abcdef',
						),
					),
				),
				'expected_class' => 'wp-calendar-table has-text-color has-background',
				'expected_style' => 'display:table;color:#123456;background-color:#abcdef;',
			),
			'link color'              => array(
				'attributes'     => array(
					'textColor' => 'contrast',
					'style'     => array(
						'elements' => array(
							'link' => array(
								'color' => array(
									'text' => '#ff0000',
								),
							),
						),
					),
				),
				'expected_class' => 'wp-calendar-table has-text-color has-contrast-color has-link-color',
				'expected_style' => 'display:table',
			),
			'gradient is not applied' => array(
				'attributes'     => array(
					'gradient' => 'vivid-cyan-blue-to-vivid-purple',
					'style'    => array(
						'color' => array(
							'gradient' => 'linear-gradient(135deg,rgb(6,147,227) 0%,rgb(155,81,224) 100%)',
						),
					),
				),
				'expected_class' => 'wp-calendar-table',
				'expected_style' => 'display:table',
			),
		);
	}

	/**
	 * Background stays on the table so nav links are not painted (#42029).
	 *
	 * @covers ::gutenberg_render_block_core_calendar
	 */
	public function test_render_applies_background_to_table_not_wrapper() {
		$html = gutenberg_render_block_core_calendar(
			array(
				'style' => array(
					'color' => array(
						'background' => '#eeeeee',
					),
				),
			)
		);

		$processor = new WP_HTML_Tag_Processor( $html );
		$processor->next_tag( 'DIV' );
		$this->assertStringNotContainsString( 'has-background', (string) $processor->get_attribute( 'class' ) );

		$processor->next_tag( 'TABLE' );
		$this->assertSame(
			array(
				'background-color' => '#eeeeee',
				'display'          => 'table',
			),
			$this->parse_style_attribute( $processor->get_attribute( 'style' ) )
		);
		$this->assertContains(
			'has-background',
			preg_split( '/\s+/', (string) $processor->get_attribute( 'class' ), -1, PREG_SPLIT_NO_EMPTY )
		);
	}

	/**
	 * Flat borders go on the table; cells inherit via style.scss.
	 *
	 * @covers ::gutenberg_render_block_core_calendar
	 */
	public function test_render_applies_custom_borders_to_table_only() {
		$html = gutenberg_render_block_core_calendar(
			array(
				'style' => array(
					'border' => array(
						'width' => '3px',
						'color' => '#111111',
						'style' => 'dashed',
					),
				),
			)
		);

		$processor = new WP_HTML_Tag_Processor( $html );
		$processor->next_tag( 'TABLE' );

		$this->assertSame(
			array(
				'border-color' => '#111111',
				'border-style' => 'dashed',
				'border-width' => '3px',
				'display'      => 'table',
			),
			$this->parse_style_attribute( $processor->get_attribute( 'style' ) )
		);
		$this->assertSame(
			array( 'wp-calendar-table', 'has-border-color' ),
			preg_split( '/\s+/', (string) $processor->get_attribute( 'class' ), -1, PREG_SPLIT_NO_EMPTY )
		);

		while ( $processor->next_tag( 'TD' ) ) {
			$this->assertNull( $processor->get_attribute( 'style' ) );
			$this->assertNull( $processor->get_attribute( 'class' ) );
		}
	}

	/**
	 * Preset borderColor must add has-border-color so SCSS inheritance fires.
	 *
	 * @covers ::gutenberg_render_block_core_calendar
	 */
	public function test_render_applies_border_color_preset_and_has_border_color_class() {
		$html = gutenberg_render_block_core_calendar(
			array(
				'borderColor' => 'contrast',
				'style'       => array(
					'border' => array(
						'width' => '2px',
						'style' => 'solid',
					),
				),
			)
		);

		$processor = new WP_HTML_Tag_Processor( $html );
		$processor->next_tag( 'TABLE' );
		$classes = preg_split( '/\s+/', (string) $processor->get_attribute( 'class' ), -1, PREG_SPLIT_NO_EMPTY );

		$this->assertContains( 'wp-calendar-table', $classes );
		$this->assertContains( 'has-border-color', $classes );
		$this->assertContains( 'has-contrast-border-color', $classes );
		$this->assertSame(
			array(
				'border-style' => 'solid',
				'border-width' => '2px',
				'display'      => 'table',
			),
			$this->parse_style_attribute( $processor->get_attribute( 'style' ) )
		);
	}

	/**
	 * Linked identical per-side borders flatten onto the table for cell inheritance.
	 *
	 * @covers ::gutenberg_render_block_core_calendar
	 * @covers ::gutenberg_block_core_calendar_normalize_border_attributes
	 */
	public function test_render_flattens_uniform_per_side_borders_onto_table() {
		$side = array(
			'width' => '2px',
			'color' => '#111111',
			'style' => 'solid',
		);
		$html = gutenberg_render_block_core_calendar(
			array(
				'style' => array(
					'border' => array(
						'top'    => $side,
						'right'  => $side,
						'bottom' => $side,
						'left'   => $side,
					),
				),
			)
		);

		$processor = new WP_HTML_Tag_Processor( $html );
		$processor->next_tag( 'TABLE' );

		$this->assertSame(
			array(
				'border-color' => '#111111',
				'border-style' => 'solid',
				'border-width' => '2px',
				'display'      => 'table',
			),
			$this->parse_style_attribute( $processor->get_attribute( 'style' ) )
		);
		$this->assertContains(
			'has-border-color',
			preg_split( '/\s+/', (string) $processor->get_attribute( 'class' ), -1, PREG_SPLIT_NO_EMPTY )
		);

		while ( $processor->next_tag( 'TD' ) ) {
			$this->assertNull( $processor->get_attribute( 'style' ) );
		}
	}

	/**
	 * Mixed per-side borders stay on the table for edge SCSS; cells stay clean.
	 *
	 * @covers ::gutenberg_render_block_core_calendar
	 */
	public function test_render_keeps_mixed_per_side_borders_on_table_only() {
		$html = gutenberg_render_block_core_calendar(
			array(
				'style' => array(
					'border' => array(
						'top' => array(
							'width' => '2px',
							'color' => '#111111',
							'style' => 'solid',
						),
					),
				),
			)
		);

		$processor = new WP_HTML_Tag_Processor( $html );
		$processor->next_tag( 'TABLE' );

		$this->assertSame(
			array(
				'border-top-color' => '#111111',
				'border-top-style' => 'solid',
				'border-top-width' => '2px',
				'display'          => 'table',
			),
			$this->parse_style_attribute( $processor->get_attribute( 'style' ) )
		);

		while ( $processor->next_tag( 'TD' ) ) {
			$this->assertNull( $processor->get_attribute( 'style' ) );
		}
		$processor = new WP_HTML_Tag_Processor( $html );
		$processor->next_tag( 'TABLE' );
		while ( $processor->next_tag( 'TH' ) ) {
			$this->assertNull( $processor->get_attribute( 'style' ) );
		}
	}

	/**
	 * Parses a style attribute into a property => value map.
	 *
	 * @param string|null $style Style attribute.
	 * @return array<string, string>
	 */
	private function parse_style_attribute( $style ) {
		$declarations = array();
		foreach ( explode( ';', (string) $style ) as $part ) {
			$part = trim( $part );
			if ( '' === $part || ! str_contains( $part, ':' ) ) {
				continue;
			}
			list( $property, $value )  = array_map( 'trim', explode( ':', $part, 2 ) );
			$declarations[ $property ] = $value;
		}
		ksort( $declarations );
		return $declarations;
	}

	/**
	 * @covers ::gutenberg_render_block_core_calendar
	 */
	public function test_render_does_not_fail_when_calendar_markup_is_empty() {
		$this->calendar_markup = '';
		$html                  = gutenberg_render_block_core_calendar( array() );

		$this->assertStringContainsString( 'wp-block-calendar', $html );
		$this->assertStringNotContainsString( '<table', $html );
	}

	/**
	 * Default / colored calendars must not invent border markup (trunk compat).
	 *
	 * @covers ::gutenberg_render_block_core_calendar
	 */
	public function test_render_without_border_support_values_matches_color_only_output() {
		$html = gutenberg_render_block_core_calendar(
			array(
				'textColor'       => 'contrast',
				'backgroundColor' => 'base',
			)
		);

		$processor = new WP_HTML_Tag_Processor( $html );
		$processor->next_tag( 'TABLE' );

		$this->assertSame(
			'wp-calendar-table has-text-color has-contrast-color has-background has-base-background-color',
			$processor->get_attribute( 'class' )
		);
		$this->assertSame( 'display:table', $processor->get_attribute( 'style' ) );
		$this->assertStringNotContainsString( 'has-border-color', (string) $processor->get_attribute( 'class' ) );
		$this->assertStringNotContainsString( 'border-', (string) $processor->get_attribute( 'style' ) );
	}
}
