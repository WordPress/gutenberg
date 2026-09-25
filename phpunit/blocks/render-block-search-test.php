<?php
/**
 * Search block rendering tests.
 *
 * @package WordPress
 * @subpackage Blocks
 */

/**
 * Tests for the Search block.
 *
 * @group blocks
 */
class Tests_Blocks_Render_Search extends WP_UnitTestCase {

	/**
	 * Returns the name and value of every hidden input in the rendered markup.
	 *
	 * @param string $markup Rendered block markup.
	 * @return array[] List of `array( name, value )` pairs.
	 */
	private function get_hidden_inputs( string $markup ): array {
		$inputs    = array();
		$processor = new WP_HTML_Tag_Processor( $markup );
		while ( $processor->next_tag( 'INPUT' ) ) {
			if ( 'hidden' === $processor->get_attribute( 'type' ) ) {
				$inputs[] = array( $processor->get_attribute( 'name' ), $processor->get_attribute( 'value' ) );
			}
		}
		return $inputs;
	}

	public function test_should_render_a_hidden_input_for_a_scalar_query_param(): void {
		$rendered = do_blocks( '<!-- wp:search {"query":{"post_type":"page"}} /-->' );

		$this->assertSame(
			array( array( 'post_type', 'page' ) ),
			$this->get_hidden_inputs( $rendered )
		);
	}

	public function test_should_render_a_hidden_input_per_value_for_an_array_query_param(): void {
		$rendered = do_blocks( '<!-- wp:search {"query":{"post_type":["post","page"]}} /-->' );

		$this->assertSame(
			array(
				array( 'post_type[]', 'post' ),
				array( 'post_type[]', 'page' ),
			),
			$this->get_hidden_inputs( $rendered )
		);
	}

	public function test_should_skip_nested_array_values_in_query_params(): void {
		$rendered = do_blocks( '<!-- wp:search {"query":{"post_type":["post",["page"]]}} /-->' );

		$this->assertSame(
			array( array( 'post_type[]', 'post' ) ),
			$this->get_hidden_inputs( $rendered )
		);
	}
}
