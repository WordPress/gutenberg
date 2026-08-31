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
	 * @var int
	 */
	protected static $post_id;

	/**
	 * @var string
	 */
	private $calendar_markup;

	/**
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

		$this->calendar_markup = '<table class="wp-calendar-table" style="display:table"><caption>August 2026</caption><thead><tr><th>Mon</th></tr></thead><tbody><tr><td class="pad">&nbsp;</td><td>1</td></tr></tbody></table>';
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
	 * @covers ::gutenberg_block_core_calendar_normalize_gap_value
	 */
	public function test_normalize_gap_value_converts_spacing_preset_to_custom_property() {
		$css = gutenberg_block_core_calendar_normalize_gap_value( 'var:preset|spacing|40' );

		$this->assertSame( 'var(--wp--preset--spacing--40)', $css );
	}

	/**
	 * @covers ::gutenberg_block_core_calendar_normalize_gap_value
	 */
	public function test_normalize_gap_value_rejects_unsafe_values() {
		$css = gutenberg_block_core_calendar_normalize_gap_value( '1px) url(https://example.com)' );

		$this->assertSame( '', $css );
	}

	/**
	 * @covers ::gutenberg_block_core_calendar_get_block_gap_style_rules
	 */
	public function test_block_gap_style_rules_use_instance_value() {
		$rules = gutenberg_block_core_calendar_get_block_gap_style_rules(
			array(
				'style' => array(
					'spacing' => array(
						'blockGap' => '2rem',
					),
				),
			)
		);

		$this->assertSame( '2rem', $rules[0]['value'] );
	}

	/**
	 * @covers ::gutenberg_block_core_calendar_get_block_gap_style_rules
	 */
	public function test_block_gap_style_rules_ignore_global_styles_without_instance_value() {
		$rules = gutenberg_block_core_calendar_get_block_gap_style_rules( array() );

		$this->assertSame( array(), $rules );
	}

	/**
	 * @covers ::gutenberg_block_core_calendar_merge_style_attribute
	 */
	public function test_merge_style_attribute_keeps_existing_declarations() {
		$processor = new WP_HTML_Tag_Processor( '<table style="display:table"></table>' );
		$processor->next_tag();
		gutenberg_block_core_calendar_merge_style_attribute( $processor, 'color:#111111' );

		$this->assertSame(
			'<table style="display:table;color:#111111"></table>',
			$processor->get_updated_html()
		);
	}

	/**
	 * @covers ::gutenberg_render_block_core_calendar
	 */
	public function test_render_applies_text_color_to_table_without_dropping_existing_styles() {
		$html = gutenberg_render_block_core_calendar(
			array(
				'style' => array(
					'color' => array(
						'text' => '#111111',
					),
				),
			)
		);

		$processor = new WP_HTML_Tag_Processor( $html );
		$processor->next_tag( 'TABLE' );
		$style = (string) $processor->get_attribute( 'style' );

		$this->assertStringContainsString( 'display:table', $style );
		$this->assertStringContainsString( 'color:#111111', $style );
	}

	/**
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
		$this->assertStringContainsString( 'background-color:#eeeeee', (string) $processor->get_attribute( 'style' ) );
	}

	/**
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
		$table_style = (string) $processor->get_attribute( 'style' );

		$this->assertStringContainsString( '3px', $table_style );
		$this->assertStringContainsString( 'border', $table_style );

		while ( $processor->next_tag( 'TD' ) ) {
			$this->assertSame( '', (string) $processor->get_attribute( 'style' ) );
		}
	}

	/**
	 * @covers ::gutenberg_block_core_calendar_has_split_borders
	 */
	public function test_has_split_borders_detects_per_side_values() {
		$this->assertTrue(
			gutenberg_block_core_calendar_has_split_borders(
				array(
					'top' => array(
						'width' => '2px',
					),
				)
			)
		);
		$this->assertFalse(
			gutenberg_block_core_calendar_has_split_borders(
				array(
					'width' => '2px',
				)
			)
		);
	}

	/**
	 * @covers ::gutenberg_render_block_core_calendar
	 */
	public function test_render_applies_block_spacing_to_caption() {
		$html = gutenberg_render_block_core_calendar(
			array(
				'style' => array(
					'spacing' => array(
						'blockGap' => '2rem',
					),
				),
			)
		);

		$processor = new WP_HTML_Tag_Processor( $html );
		$processor->next_tag( 'CAPTION' );

		$this->assertStringContainsString(
			'margin-bottom:2rem',
			(string) $processor->get_attribute( 'style' )
		);
	}

	/**
	 * @covers ::gutenberg_render_block_core_calendar
	 */
	public function test_render_does_not_insert_spacer_when_calendar_markup_is_empty() {
		$this->calendar_markup = '';
		$html                  = gutenberg_render_block_core_calendar( array() );

		$this->assertStringNotContainsString( '&nbsp;', $html );
		$this->assertStringContainsString( 'wp-block-calendar', $html );
	}
}
