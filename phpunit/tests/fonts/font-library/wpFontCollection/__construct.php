<?php
/**
 * Test WP_Font_Collection constructor.
 *
 * @package WordPress
 * @subpackage Font Library
 *
 * @group fonts
 * @group font-library
 *
 * @covers WP_Font_Collection::__construct
 */
class Tests_Fonts_WpFontCollection_Construct extends WP_UnitTestCase {

	public function test_should_do_it_wrong_with_invalid_slug() {
		$this->setExpectedIncorrectUsage( 'WP_Font_Collection::__construct' );
		$mock_collection_data = array(
			'name'          => 'Test Collection',
			'font_families' => array( 'mock ' ),
		);

		$collection = new WP_Font_Collection( 'slug with spaces', $mock_collection_data );

		$this->assertSame( 'slug-with-spaces', $collection->slug, 'Slug is not sanitized.' );
	}
}
