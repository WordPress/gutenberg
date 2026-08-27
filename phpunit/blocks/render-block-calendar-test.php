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
	 * @covers ::gutenberg_block_core_calendar_get_block_gap_css
	 */
	public function test_block_gap_css_converts_spacing_preset_to_custom_property() {
		$css = gutenberg_block_core_calendar_get_block_gap_css(
			array(
				'style' => array(
					'spacing' => array(
						'blockGap' => 'var:preset|spacing|40',
					),
				),
			)
		);

		$this->assertSame( 'var(--wp--preset--spacing--40)', $css );
	}

	/**
	 * @covers ::gutenberg_block_core_calendar_get_block_gap_css
	 */
	public function test_block_gap_css_rejects_unsafe_values() {
		$css = gutenberg_block_core_calendar_get_block_gap_css(
			array(
				'style' => array(
					'spacing' => array(
						'blockGap' => '1px) url(https://example.com)',
					),
				),
			)
		);

		$this->assertSame( '', $css );
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
	public function test_render_applies_custom_borders_to_date_and_pad_cells() {
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
		while ( $processor->next_tag( 'TD' ) ) {
			$this->assertStringContainsString( '3px', (string) $processor->get_attribute( 'style' ) );
		}
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

		$this->assertStringContainsString( 'margin-bottom:2rem', (string) $processor->get_attribute( 'style' ) );
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
