<?php
/**
 * Test WP_Font_Collection::__construct().
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
	public function test_should_initialize_data() {
		$slug = new ReflectionProperty( WP_Font_Collection::class, 'slug' );
		$slug->setAccessible( true );

		$name = new ReflectionProperty( WP_Font_Collection::class, 'name' );
		$name->setAccessible( true );

		$description = new ReflectionProperty( WP_Font_Collection::class, 'description' );
		$description->setAccessible( true );

		$font_families = new ReflectionProperty( WP_Font_Collection::class, 'font_families' );
		$font_families->setAccessible( true );

		$config     = array(
			'name'          => 'My Collection',
			'description'   => 'My collection description',
			'font_families' => array( 'mock' ),
		);
		$collection = new WP_Font_Collection( 'my-collection', $config );

		$actual_slug = $slug->getValue( $collection );
		$this->assertSame( 'my-collection', $actual_slug, 'Provided slug and initialized slug should match.' );
		$slug->setAccessible( false );

		$actual_name = $name->getValue( $collection );
		$this->assertSame( 'My Collection', $actual_name, 'Provided name and initialized name should match.' );
		$name->setAccessible( false );

		$actual_description = $description->getValue( $collection );
		$this->assertSame( 'My collection description', $actual_description, 'Provided description and initialized description should match.' );
		$description->setAccessible( false );

		$actual_font_families = $font_families->getValue( $collection );
		$this->assertSame( array( 'mock' ), $actual_font_families, 'Provided font_families and initialized font_families should match.' );
		$font_families->setAccessible( false );
	}

	public function test_should_do_it_wrong_missing_font_families() {
		$this->setExpectedIncorrectUsage( 'WP_Font_Collection::__construct' );
		new WP_Font_Collection( 'my-collection' );
	}
}
