<?php
/**
 * Tests for hooked blocks rendering.
 *
 * @package WordPress
 * @subpackage Blocks
 * @since 6.5.0
 *
 * @group blocks
 */
class Tests_Blocks_RegisterBlockCorePostExcerptLengthFilter extends WP_UnitTestCase {
	/**
	 *
	 * @dataProvider data_register_block_core_post_excerpt_length_filter
	 * @param $excerpt_length
	 *
	 * @return void
	 */
	public function test_register_block_core_post_excerpt_length_filter( $excerpt_length, $expected_excerpt_length, $rest_api_enabled, $context ) {
		$_REQUEST['context'] = $context;
		if ( $rest_api_enabled && ! defined( 'REST_REQUEST' ) ) {
			define( REST_REQUEST, true );
		}
		$result = register_block_core_post_excerpt_length_filter( $excerpt_length );

		$this->assertSame( $expected_excerpt_length, $result );
	}

	public function data_register_block_core_post_excerpt_length_filter() {
		return array(
			'rest_api_disabled_non_edit_context' => array(
				10,
				10,
				false,
				'',
			),
			'rest_api_enabled_non_edit_context'  => array(
				10,
				10,
				true,
				'',
			),
			'rest_api_enabled_edit_context'      => array(
				10,
				10,
				true,
				'edit'
			),
		);
	}
}
