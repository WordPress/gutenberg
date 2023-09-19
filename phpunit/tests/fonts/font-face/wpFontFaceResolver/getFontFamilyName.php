<?php
/**
 * Test case for WP_Font_Face_Resolver::get_fonts_from_theme_json().
 *
 * @since      6.4.0
 * @subpackage Fonts
 *
 * @package    WordPress
 */

// @core-merge this line of code is not needed when merging into Core.
require_once dirname( __DIR__ ) . '/base.php';

/**
 * @group  fonts
 * @group  fontface
 *
 * @covers WP_Font_Face_Resolver::get_font_family_name
 */
class Tests_Fonts_WPFontFaceResolver_GetFontFamilyName extends WP_Font_Face_UnitTestCase {
	private static $resolver;

	public static function set_up_before_class() {
		static::$resolver = new ReflectionMethod( WP_Font_Face_Resolver::class, 'get_font_family_name' );
		static::$resolver->setAccessible( true );

		parent::set_up_before_class();
	}

	public static function tear_down_after_class() {
		self::$resolver->setAccessible( false );

		parent::tear_down_after_class();
	}

	/**
	 * @dataProvider data_should_return_font_family_name
	 *
	 * @param array  $definition The font-family definition to test.
	 * @param string $expected   Expected font-family name.
	 */
	public function test_should_return_font_family_name( $definition, $expected ) {
		$actual = static::$resolver->invokeArgs( null, array( $definition ) );

		$this->assertSame( $actual, $expected );
	}

	/**
	 * Data provider.
	 *
	 * @return array
	 */
	public function data_should_return_font_family_name() {
		return array(
			'name and fontFamily declared'    => array(
				'definition' => array(
					'fontFamily' => 'DM Sans',
					'name'       => 'DM Sans',
					'slug'       => 'dm-sans',
					'fontFace'   => array(
						'fontFamily'  => 'DM Sans',
						'fontStretch' => 'normal',
						'fontStyle'   => 'italic',
						'fontWeight'  => '700',
						'src'         => array(
							'file:./assets/fonts/dm-sans/DMSans-Bold-Italic.woff2',
						),
					),
				),
				'expected'   => 'DM Sans',
			),
			'only name declared'              => array(
				'definition' => array(
					'name'     => 'DM Sans',
					'fontFace' => array(
						'fontFamily'  => 'DM Sans',
						'fontStretch' => 'normal',
						'fontStyle'   => 'italic',
						'fontWeight'  => '700',
						'src'         => array(
							'file:./assets/fonts/dm-sans/DMSans-Bold-Italic.woff2',
						),
					),
				),
				'expected'   => 'DM Sans',
			),
			'only fontFamily declared'        => array(
				'definition' => array(
					'fontFamily' => 'DM Sans',
					'slug'       => 'dm-sans',
					'fontFace'   => array(
						'fontFamily'  => 'DM Sans',
						'fontStretch' => 'normal',
						'fontStyle'   => 'italic',
						'fontWeight'  => '700',
						'src'         => array(
							'file:./assets/fonts/dm-sans/DMSans-Bold-Italic.woff2',
						),
					),
				),
				'expected'   => 'DM Sans',
			),
			'fontFamily comma-separated list' => array(
				'definition' => array(
					'fontFamily' => 'DM Sans, sans-serif',
					'slug'       => 'dm-sans',
					'fontFace'   => array(
						'fontFamily'  => 'DM Sans',
						'fontStretch' => 'normal',
						'fontStyle'   => 'italic',
						'fontWeight'  => '700',
						'src'         => array(
							'file:./assets/fonts/dm-sans/DMSans-Bold-Italic.woff2',
						),
					),
				),
				'expected'   => 'DM Sans',
			),
		);
	}

	public function test_should_return_empty_string_on_failure() {
		$definition = array(
			'slug'     => 'dm-sans',
			'fontFace' => array(
				'fontFamily'  => 'DM Sans',
				'fontStretch' => 'normal',
				'fontStyle'   => 'italic',
				'fontWeight'  => '700',
				'src'         => array(
					'file:./assets/fonts/dm-sans/DMSans-Bold-Italic.woff2',
				),
			),
		);

		$actual   = static::$resolver->invokeArgs( null, array( $definition ) );
		$expected = '';
		$this->assertSame( $actual, $expected );
	}
}
