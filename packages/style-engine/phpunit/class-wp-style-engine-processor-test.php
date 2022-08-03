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
	 * Should compile CSS rules.
	 */
	public function test_return_rules_as_css() {
		$a_nice_css_rule = new WP_Style_Engine_CSS_Rule( '.a-nice-rule' );
		$a_nice_css_rule->add_declarations(
			array(
				'color'            => 'var(--nice-color)',
				'background-color' => 'purple',
			)
		);
		$a_nicer_css_rule = new WP_Style_Engine_CSS_Rule( '.a-nicer-rule' );
		$a_nicer_css_rule->add_declarations(
			array(
				'font-family'      => 'Nice sans',
				'font-size'        => '1em',
				'background-color' => 'purple',
			)
		);
		$a_nice_processor = new WP_Style_Engine_Processor();
		$a_nice_processor->add_rules( array( $a_nice_css_rule, $a_nicer_css_rule ) );
		$this->assertEquals(
			'.a-nice-rule {color: var(--nice-color); background-color: purple;}.a-nicer-rule {font-family: Nice sans; font-size: 1em; background-color: purple;}',
			$a_nice_processor->get_css()
		);
	}

	/**
	 * Should compile CSS rules from the store.
	 */
	public function test_return_store_rules_as_css() {
		$a_nice_store = WP_Style_Engine_CSS_Rules_Store::get_store( 'nice' );
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
		$a_nice_renderer = new WP_Style_Engine_Processor();
		$a_nice_renderer->add_store( $a_nice_store );
		$this->assertEquals(
			'.a-nice-rule {color: var(--nice-color); background-color: purple;}.a-nicer-rule {font-family: Nice sans; font-size: 1em; background-color: purple;}',
			$a_nice_renderer->get_css()
		);
	}

	/**
	 * Should merge CSS declarations.
	 */
	public function test_dedupe_and_merge_css_declarations() {
		$an_excellent_rule      = new WP_Style_Engine_CSS_Rule( '.an-excellent-rule' );
		$an_excellent_processor = new WP_Style_Engine_Processor();
		$an_excellent_rule->add_declarations(
			array(
				'color'        => 'var(--excellent-color)',
				'border-style' => 'dotted',
			)
		);
		$an_excellent_processor->add_rules( $an_excellent_rule );

		$another_excellent_rule = new WP_Style_Engine_CSS_Rule( '.an-excellent-rule' );
		$another_excellent_rule->add_declarations(
			array(
				'color'        => 'var(--excellent-color)',
				'border-style' => 'dotted',
				'border-color' => 'brown',
			)
		);
		$an_excellent_processor->add_rules( $another_excellent_rule );
		$this->assertEquals(
			'.an-excellent-rule {color: var(--excellent-color); border-style: dotted; border-color: brown;}',
			$an_excellent_processor->get_css()
		);

		$yet_another_excellent_rule = new WP_Style_Engine_CSS_Rule( '.an-excellent-rule' );
		$yet_another_excellent_rule->add_declarations(
			array(
				'color'        => 'var(--excellent-color)',
				'border-style' => 'dashed',
				'border-width' => '2px',
			)
		);
		$an_excellent_processor->add_rules( $yet_another_excellent_rule );
		$this->assertEquals(
			'.an-excellent-rule {color: var(--excellent-color); border-style: dashed; border-color: brown; border-width: 2px;}',
			$an_excellent_processor->get_css()
		);
	}

	/**
	 * Should print out uncombined selectors duplicate CSS rules.
	 */
	public function test_output_verbose_css_rules() {
		$a_sweet_rule = new WP_Style_Engine_CSS_Rule(
			'.a-sweet-rule',
			array(
				'color'            => 'var(--sweet-color)',
				'background-color' => 'purple',
			)
		);

		$a_sweeter_rule = new WP_Style_Engine_CSS_Rule(
			'#an-even-sweeter-rule > marquee',
			array(
				'color'            => 'var(--sweet-color)',
				'background-color' => 'purple',
			)
		);

		$the_sweetest_rule = new WP_Style_Engine_CSS_Rule(
			'.the-sweetest-rule-of-all a',
			array(
				'color'            => 'var(--sweet-color)',
				'background-color' => 'purple',
			)
		);

		$a_sweet_processor = new WP_Style_Engine_Processor();
		$a_sweet_processor->add_rules( array( $a_sweet_rule, $a_sweeter_rule, $the_sweetest_rule ) );

		$this->assertEquals(
			'.a-sweet-rule {color: var(--sweet-color); background-color: purple;}#an-even-sweeter-rule > marquee {color: var(--sweet-color); background-color: purple;}.the-sweetest-rule-of-all a {color: var(--sweet-color); background-color: purple;}',
			$a_sweet_processor->get_css( array( 'optimize' => false ) )
		);
	}

	/**
	 * Should combine duplicate CSS rules.
	 */
	public function test_combine_css_rules() {
		$a_sweet_rule = new WP_Style_Engine_CSS_Rule(
			'.a-sweet-rule',
			array(
				'color'            => 'var(--sweet-color)',
				'background-color' => 'purple',
			)
		);

		$a_sweeter_rule = new WP_Style_Engine_CSS_Rule(
			'#an-even-sweeter-rule > marquee',
			array(
				'color'            => 'var(--sweet-color)',
				'background-color' => 'purple',
			)
		);

		$a_sweet_processor = new WP_Style_Engine_Processor();
		$a_sweet_processor->add_rules( array( $a_sweet_rule, $a_sweeter_rule ) );

		$this->assertEquals(
			'.a-sweet-rule,#an-even-sweeter-rule > marquee {color: var(--sweet-color); background-color: purple;}',
			$a_sweet_processor->get_css()
		);
	}
		/**
		 * Should combine and store CSS rules.
		 */
	public function test_combine_previously_added_css_rules() {
		$a_lovely_processor = new WP_Style_Engine_Processor();
		$a_lovely_rule      = new WP_Style_Engine_CSS_Rule(
			'.a-lovely-rule',
			array(
				'border-color' => 'purple',
			)
		);
		$a_lovely_processor->add_rules( $a_lovely_rule );
		$a_lovelier_rule = new WP_Style_Engine_CSS_Rule(
			'.a-lovelier-rule',
			array(
				'border-color' => 'purple',
			)
		);
		$a_lovely_processor->add_rules( $a_lovelier_rule );
		$this->assertEquals( '.a-lovely-rule,.a-lovelier-rule {border-color: purple;}', $a_lovely_processor->get_css() );

		$a_most_lovely_rule = new WP_Style_Engine_CSS_Rule(
			'.a-most-lovely-rule',
			array(
				'border-color' => 'purple',
			)
		);
		$a_lovely_processor->add_rules( $a_most_lovely_rule );

		$a_perfectly_lovely_rule = new WP_Style_Engine_CSS_Rule(
			'.a-perfectly-lovely-rule',
			array(
				'border-color' => 'purple',
			)
		);
		$a_lovely_processor->add_rules( $a_perfectly_lovely_rule );

		$this->assertEquals(
			'.a-lovely-rule,.a-lovelier-rule,.a-most-lovely-rule,.a-perfectly-lovely-rule {border-color: purple;}',
			$a_lovely_processor->get_css()
		);
	}
}
