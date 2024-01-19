<?php
/**
 * Test WP_Font_Collection::is_config_valid().
 *
 * @package WordPress
 * @subpackage Font Library
 *
 * @group fonts
 * @group font-library
 *
 * @covers WP_Font_Collection::is_config_valid
 */
class Tests_Fonts_WpFontCollection_IsConfigValid extends WP_UnitTestCase {

	/**
	 * @dataProvider data_is_config_valid
	 *
	 * @param array $config Font collection config options.
	 */
	public function test_is_config_valid( $config ) {
		$this->assertTrue( WP_Font_Collection::is_config_valid( $config ) );
	}

	public function data_is_config_valid() {
		return array(
			'with src'           => array(
				'config' => array(
					'slug'        => 'my-collection',
					'name'        => 'My Collection',
					'description' => 'My collection description',
					'src'         => 'my-collection-data.json',
				),
			),
			'with font families' => array(
				'config' => array(
					'slug'          => 'my-collection',
					'name'          => 'My Collection',
					'description'   => 'My collection description',
					'font_families' => array( 'mock' ),
				),
			),

		);
	}

	/**
	 * @dataProvider data_is_config_valid_should_call_doing_ti_wrong
	 *
	 * @param mixed  $config Config of the font collection.
	 */
	public function test_is_config_valid_should_call_doing_ti_wrong( $config ) {
		$this->setExpectedIncorrectUsage( 'WP_Font_Collection::is_config_valid', 'Should call _doing_it_wrong if the config is not valid.' );
		$this->assertFalse( WP_Font_Collection::is_config_valid( $config ), 'Should return false if the config is not valid.' );
	}

	public function data_is_config_valid_should_call_doing_ti_wrong() {
		return array(
			'with missing slug'               => array(
				'config' => array(
					'name'        => 'My Collection',
					'description' => 'My collection description',
					'src'         => 'my-collection-data.json',
				),
			),
			'with missing name'               => array(
				'config' => array(
					'slug'        => 'my-collection',
					'description' => 'My collection description',
					'src'         => 'my-collection-data.json',
				),
			),
			'with missing src'                => array(
				'config' => array(
					'slug'        => 'my-collection',
					'name'        => 'My Collection',
					'description' => 'My collection description',
				),
			),
			'with both src and font_families' => array(
				'config' => array(
					'slug'          => 'my-collection',
					'name'          => 'My Collection',
					'description'   => 'My collection description',
					'src'           => 'my-collection-data.json',
					'font_families' => array( 'mock' ),
				),
			),
			'without src or font_families'    => array(
				'config' => array(
					'slug'        => 'my-collection',
					'name'        => 'My Collection',
					'description' => 'My collection description',
				),
			),
			'with empty config'               => array(
				'config' => array(),
			),
			'without an array'                => array(
				'config' => 'not an array',
			),
		);
	}
}
