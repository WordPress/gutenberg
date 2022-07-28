<?php
/**
 * Tests the Style Engine Renderer class.
 *
 * @package    Gutenberg
 * @subpackage style-engine
 */
require __DIR__ . '/../class-wp-style-engine-css-rules-store.php';
require __DIR__ . '/../class-wp-style-engine-css-rule.php';
require __DIR__ . '/../class-wp-style-engine-css-declarations.php';
require __DIR__ . '/../class-wp-style-engine-processor.php';

/**
 * Tests for compiling and rendering styles from a store of CSS rules.
 */
class WP_Style_Engine_Processor_Test extends WP_UnitTestCase {
	/**
	 * Should compile CSS rules from the store.
	 */
	public function test_return_store_rules_as_css() {
		$a_nice_store    = WP_Style_Engine_CSS_Rules_Store_Gutenberg::get_store( 'nice' );
		$a_nice_renderer = new WP_Style_Engine_Processor_Gutenberg( $a_nice_store );
		$a_nice_store->add_rule( '.a-nice-rule' )->add_declarations(
			array(
				'color'            => 'var(--nice-color)',
				'background-color' => 'purple',
			)
		);
		$a_nice_store->add_rule( '.a-nicer-rule' )->add_declarations(
			array(
				'font-family'      => 'Nice sans',
				'font-size'        => '1em',
				'background-color' => 'purple',
			)
		);

		$this->assertEquals( '.a-nice-rule {color: var(--nice-color); background-color: purple;}.a-nicer-rule {font-family: Nice sans; font-size: 1em; background-color: purple;}', $a_nice_renderer->get_css() );
	}

	/**
	 * Should merge CSS declarations.
	 */
	public function test_dedupe_and_merge_css_declarations() {
		$an_excellent_store    = WP_Style_Engine_CSS_Rules_Store_Gutenberg::get_store( 'excellent' );
		$an_excellent_renderer = new WP_Style_Engine_Processor_Gutenberg( $an_excellent_store );
		$an_excellent_store->add_rule( '.an-excellent-rule' )->add_declarations(
			array(
				'color'        => 'var(--excellent-color)',
				'border-style' => 'dotted',
			)
		);
		$an_excellent_store->add_rule( '.an-excellent-rule' )->add_declarations(
			array(
				'color'        => 'var(--excellent-color)',
				'border-style' => 'dotted',
				'border-color' => 'brown',
			)
		);

		$this->assertEquals( '.an-excellent-rule {color: var(--excellent-color); border-style: dotted; border-color: brown;}', $an_excellent_renderer->get_css() );

		$an_excellent_store->add_rule( '.an-excellent-rule' )->add_declarations(
			array(
				'color'        => 'var(--excellent-color)',
				'border-style' => 'dashed',
				'border-width' => '2px',
			)
		);

		$this->assertEquals( '.an-excellent-rule {color: var(--excellent-color); border-style: dashed; border-color: brown; border-width: 2px;}', $an_excellent_renderer->get_css() );
	}

	/**
	 * Should combine duplicate CSS rules.
	 */
	public function test_combine_css_rules() {
		$a_sweet_store    = WP_Style_Engine_CSS_Rules_Store_Gutenberg::get_store( 'sweet' );
		$a_sweet_renderer = new WP_Style_Engine_Processor_Gutenberg( $a_sweet_store );
		$a_sweet_store->add_rule( '.a-sweet-rule' )->add_declarations(
			array(
				'color'            => 'var(--sweet-color)',
				'background-color' => 'purple',
			)
		);
		$a_sweet_store->add_rule( '#an-even-sweeter-rule > marquee' )->add_declarations(
			array(
				'color'            => 'var(--sweet-color)',
				'background-color' => 'purple',
			)
		);

		$this->assertEquals( '.a-sweet-rule,#an-even-sweeter-rule > marquee {color: var(--sweet-color); background-color: purple;}', $a_sweet_renderer->get_css() );
	}

	/**
	 * Should combine and store CSS rules.
	 */
	public function test_store_combined_css_rules() {
		$a_lovely_store    = WP_Style_Engine_CSS_Rules_Store_Gutenberg::get_store( 'lovely' );
		$a_lovely_renderer = new WP_Style_Engine_Processor_Gutenberg( $a_lovely_store );
		$a_lovely_store->add_rule( '.a-lovely-rule' )->add_declarations(
			array(
				'border-color' => 'purple',
			)
		);
		$a_lovely_store->add_rule( '.a-lovelier-rule' )->add_declarations(
			array(
				'border-color' => 'purple',
			)
		);

		$this->assertEquals( '.a-lovely-rule,.a-lovelier-rule {border-color: purple;}', $a_lovely_renderer->get_css() );

		$a_lovely_store->add_rule( '.a-most-lovely-rule' )->add_declarations(
			array(
				'border-color' => 'purple',
			)
		);
		$a_lovely_store->add_rule( '.a-perfectly-lovely-rule' )->add_declarations(
			array(
				'border-color' => 'purple',
			)
		);

		$this->assertEquals( '.a-lovely-rule,.a-lovelier-rule,.a-most-lovely-rule,.a-perfectly-lovely-rule {border-color: purple;}', $a_lovely_renderer->get_css() );
	}
}
