<?php
/**
 * Unit tests covering WP_HTML_Tag_Processor rewind functionality.
 *
 * @package WordPress
 * @subpackage HTML
 */

require_once __DIR__ . '/../../lib/experimental/html/index.php';

class WP_HTML_Tag_Processor_Rewind_Test {
	/**
	 * @ticket 56299
	 *
	 * @covers set_bookmark
	 */
	public function test_bookmark() {
		$p = new WP_HTML_Tag_Processor( '<ul><li>One</li><li>Two</li><li>Three</li></ul>' );
		$p->next_tag( 'li' );
		$p->set_bookmark( 'first li' );
		$p->next_tag( 'li' );
		$p->set_bookmark( 'second li' );
		$p->set_attribute( 'foo-2', 'bar-2' );
		$p->rewind( 'first li' );
		$p->set_attribute( 'foo-1', 'bar-1' );
		$p->rewind( 'second li' );
		$p->next_tag( 'li' );
		$p->set_attribute( 'foo-3', 'bar-3' );
		$this->assertEquals(
			'<ul><li foo-1="bar-1">One</li><li foo-2="bar-2">Two</li><li foo-3="bar-3">Three</li></ul>',
			$p->get_updated_html()
		);
	}
}
