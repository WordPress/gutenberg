<?php
/**
 * Tests the Style Engine Processor class.
 *
 * @package    Gutenberg
 * @subpackage style-engine
 */

/**
 * Tests for compiling and rendering styles from a store of CSS rules.
 *
 * @group style-engine
 * @coversDefaultClass WP_Style_Engine_Processor_Gutenberg
 */
class WP_Style_Engine_Processor_Test extends WP_UnitTestCase {
	/**
	 * Tests adding rules and returning compiled CSS rules.
	 *
	 * @covers ::add_rules
	 * @covers ::get_css
	 */
	public function test_should_return_rules_as_compiled_css() {
		$a_nice_css_rule = new WP_Style_Engine_CSS_Rule_Gutenberg( '.a-nice-rule' );
		$a_nice_css_rule->add_declarations(
			array(
				'color'            => 'var(--nice-color)',
				'background-color' => 'purple',
			)
		);
		$a_nicer_css_rule = new WP_Style_Engine_CSS_Rule_Gutenberg( '.a-nicer-rule' );
		$a_nicer_css_rule->add_declarations(
			array(
				'font-family'      => 'Nice sans',
				'font-size'        => '1em',
				'background-color' => 'purple',
			)
		);
		$a_nice_processor = new WP_Style_Engine_Processor_Gutenberg();
		$a_nice_processor->add_rules( array( $a_nice_css_rule, $a_nicer_css_rule ) );

		$this->assertSame(
			'.a-nice-rule{color:var(--nice-color);background-color:purple;}.a-nicer-rule{font-family:Nice sans;font-size:1em;background-color:purple;}',
			$a_nice_processor->get_css( array( 'prettify' => false ) )
		);
	}

	/**
	 * Tests compiling CSS rules and formatting them with new lines and indents.
	 *
	 * @covers ::get_css
	 */
	public function test_should_return_prettified_css_rules() {
		$a_wonderful_css_rule = new WP_Style_Engine_CSS_Rule_Gutenberg( '.a-wonderful-rule' );
		$a_wonderful_css_rule->add_declarations(
			array(
				'color'            => 'var(--wonderful-color)',
				'background-color' => 'orange',
			)
		);
		$a_very_wonderful_css_rule = new WP_Style_Engine_CSS_Rule_Gutenberg( '.a-very_wonderful-rule' );
		$a_very_wonderful_css_rule->add_declarations(
			array(
				'color'            => 'var(--wonderful-color)',
				'background-color' => 'orange',
			)
		);
		$a_more_wonderful_css_rule = new WP_Style_Engine_CSS_Rule_Gutenberg( '.a-more-wonderful-rule' );
		$a_more_wonderful_css_rule->add_declarations(
			array(
				'font-family'      => 'Wonderful sans',
				'font-size'        => '1em',
				'background-color' => 'orange',
			)
		);
		$a_wonderful_processor = new WP_Style_Engine_Processor_Gutenberg();
		$a_wonderful_processor->add_rules( array( $a_wonderful_css_rule, $a_very_wonderful_css_rule, $a_more_wonderful_css_rule ) );

		$expected = '.a-more-wonderful-rule {
	font-family: Wonderful sans;
	font-size: 1em;
	background-color: orange;
}
.a-wonderful-rule,
.a-very_wonderful-rule {
	color: var(--wonderful-color);
	background-color: orange;
}
';
		$this->assertSame(
			$expected,
			$a_wonderful_processor->get_css( array( 'prettify' => true ) )
		);
	}

	/**
	 * Tests adding a store and compiling CSS rules from that store.
	 *
	 * @covers ::add_store
	 */
	public function test_should_return_store_rules_as_css() {
		$a_nice_store = WP_Style_Engine_CSS_Rules_Store_Gutenberg::get_store( 'nice' );
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
		$a_nice_renderer = new WP_Style_Engine_Processor_Gutenberg();
		$a_nice_renderer->add_store( $a_nice_store );
		$this->assertSame(
			'.a-nice-rule{color:var(--nice-color);background-color:purple;}.a-nicer-rule{font-family:Nice sans;font-size:1em;background-color:purple;}',
			$a_nice_renderer->get_css( array( 'prettify' => false ) )
		);
	}

	/**
	 * Tests that CSS declarations are merged and deduped in the final CSS rules output.
	 *
	 * @covers ::add_rules
	 * @covers ::get_css
	 */
	public function test_should_dedupe_and_merge_css_declarations() {
		$an_excellent_rule      = new WP_Style_Engine_CSS_Rule_Gutenberg( '.an-excellent-rule' );
		$an_excellent_processor = new WP_Style_Engine_Processor_Gutenberg();
		$an_excellent_rule->add_declarations(
			array(
				'color'        => 'var(--excellent-color)',
				'border-style' => 'dotted',
			)
		);
		$an_excellent_processor->add_rules( $an_excellent_rule );

		$another_excellent_rule = new WP_Style_Engine_CSS_Rule_Gutenberg( '.an-excellent-rule' );
		$another_excellent_rule->add_declarations(
			array(
				'color'        => 'var(--excellent-color)',
				'border-style' => 'dotted',
				'border-color' => 'brown',
			)
		);
		$an_excellent_processor->add_rules( $another_excellent_rule );
		$this->assertSame(
			'.an-excellent-rule{color:var(--excellent-color);border-style:dotted;border-color:brown;}',
			$an_excellent_processor->get_css( array( 'prettify' => false ) ),
			'Return value of get_css() does not match expectations with new, deduped and merged declarations.'
		);

		$yet_another_excellent_rule = new WP_Style_Engine_CSS_Rule_Gutenberg( '.an-excellent-rule' );
		$yet_another_excellent_rule->add_declarations(
			array(
				'color'        => 'var(--excellent-color)',
				'border-style' => 'dashed',
				'border-width' => '2px',
			)
		);
		$an_excellent_processor->add_rules( $yet_another_excellent_rule );
		$this->assertSame(
			'.an-excellent-rule{color:var(--excellent-color);border-style:dashed;border-color:brown;border-width:2px;}',
			$an_excellent_processor->get_css( array( 'prettify' => false ) ),
			'Return value of get_css() does not match expectations with deduped and merged declarations.'
		);
	}

	/**
	 * Tests printing out 'unoptimized' CSS, that is, uncombined selectors and duplicate CSS rules.
	 *
	 * @covers ::get_css
	 */
	public function test_should_not_optimize_css_output() {
		$a_sweet_rule = new WP_Style_Engine_CSS_Rule_Gutenberg(
			'.a-sweet-rule',
			array(
				'color'            => 'var(--sweet-color)',
				'background-color' => 'purple',
			)
		);

		$a_sweeter_rule = new WP_Style_Engine_CSS_Rule_Gutenberg(
			'#an-even-sweeter-rule > marquee',
			array(
				'color'            => 'var(--sweet-color)',
				'background-color' => 'purple',
			)
		);

		$the_sweetest_rule = new WP_Style_Engine_CSS_Rule_Gutenberg(
			'.the-sweetest-rule-of-all a',
			array(
				'color'            => 'var(--sweet-color)',
				'background-color' => 'purple',
			)
		);

		$a_sweet_processor = new WP_Style_Engine_Processor_Gutenberg();
		$a_sweet_processor->add_rules( array( $a_sweet_rule, $a_sweeter_rule, $the_sweetest_rule ) );

		$this->assertSame(
			'.a-sweet-rule{color:var(--sweet-color);background-color:purple;}#an-even-sweeter-rule > marquee{color:var(--sweet-color);background-color:purple;}.the-sweetest-rule-of-all a{color:var(--sweet-color);background-color:purple;}',
			$a_sweet_processor->get_css(
				array(
					'optimize' => false,
					'prettify' => false,
				)
			)
		);
	}

	/**
	 * Tests that 'optimized' CSS is output, that is, that duplicate CSS rules are combined under their corresponding selectors.
	 *
	 * @covers ::get_css
	 */
	public function test_should_optimize_css_output_by_default() {
		$a_sweet_rule = new WP_Style_Engine_CSS_Rule_Gutenberg(
			'.a-sweet-rule',
			array(
				'color'            => 'var(--sweet-color)',
				'background-color' => 'purple',
			)
		);

		$a_sweeter_rule = new WP_Style_Engine_CSS_Rule_Gutenberg(
			'#an-even-sweeter-rule > marquee',
			array(
				'color'            => 'var(--sweet-color)',
				'background-color' => 'purple',
			)
		);

		$a_sweet_processor = new WP_Style_Engine_Processor_Gutenberg();
		$a_sweet_processor->add_rules( array( $a_sweet_rule, $a_sweeter_rule ) );

		$this->assertSame(
			'.a-sweet-rule,#an-even-sweeter-rule > marquee{color:var(--sweet-color);background-color:purple;}',
			$a_sweet_processor->get_css( array( 'prettify' => false ) )
		);
	}

	/**
	 * Tests that incoming CSS rules are merged with existing CSS rules.
	 *
	 * @covers ::add_rules
	 */
	public function test_should_combine_previously_added_css_rules() {
		$a_lovely_processor = new WP_Style_Engine_Processor_Gutenberg();
		$a_lovely_rule      = new WP_Style_Engine_CSS_Rule_Gutenberg(
			'.a-lovely-rule',
			array(
				'border-color' => 'purple',
			)
		);
		$a_lovely_processor->add_rules( $a_lovely_rule );
		$a_lovelier_rule = new WP_Style_Engine_CSS_Rule_Gutenberg(
			'.a-lovelier-rule',
			array(
				'border-color' => 'purple',
			)
		);
		$a_lovely_processor->add_rules( $a_lovelier_rule );
		$this->assertSame(
			'.a-lovely-rule,.a-lovelier-rule{border-color:purple;}',
			$a_lovely_processor->get_css( array( 'prettify' => false ) ),
			'Return value of get_css() does not match expectations when combining 2 CSS rules'
		);

		$a_most_lovely_rule = new WP_Style_Engine_CSS_Rule_Gutenberg(
			'.a-most-lovely-rule',
			array(
				'border-color' => 'purple',
			)
		);
		$a_lovely_processor->add_rules( $a_most_lovely_rule );

		$a_perfectly_lovely_rule = new WP_Style_Engine_CSS_Rule_Gutenberg(
			'.a-perfectly-lovely-rule',
			array(
				'border-color' => 'purple',
			)
		);
		$a_lovely_processor->add_rules( $a_perfectly_lovely_rule );

		$this->assertSame(
			'.a-lovely-rule,.a-lovelier-rule,.a-most-lovely-rule,.a-perfectly-lovely-rule{border-color:purple;}',
			$a_lovely_processor->get_css( array( 'prettify' => false ) ),
			'Return value of get_css() does not match expectations when combining 4 CSS rules'
		);
	}
}
