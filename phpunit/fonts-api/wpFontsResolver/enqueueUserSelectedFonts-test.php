<?php
/**
 * WP_Fonts_Resolver::enqueue_user_selected_fonts() tests.
 *
 * @package    WordPress
 * @subpackage Fonts API
 */

require_once __DIR__ . '/../wp-fonts-testcase.php';

/**
 * @group  fontsapi
 * @covers WP_Fonts_Resolver::enqueue_user_selected_fonts
 */
class Tests_Fonts_WpFontsResolver_EnqueueUserSelectedFonts extends WP_Fonts_TestCase {

	public static function set_up_before_class() {
		self::$requires_switch_theme_fixtures = true;

		parent::set_up_before_class();

		self::$administrator_id = self::factory()->user->create(
			array(
				'role'       => 'administrator',
				'user_email' => 'administrator@example.com',
			)
		);
	}

	/**
	 * @dataProvider data_should_not_enqueue_when_no_user_selected_fonts
	 *
	 * @param array $styles Optional. Test styles. Default empty array.
	 */
	public function test_should_not_enqueue_when_no_user_selected_fonts( $styles = array() ) {
		$this->set_up_global_styles( $styles );

		$mock = $this->set_up_mock( 'enqueue' );
		$mock->expects( $this->never() )
			->method( 'enqueue' );

		$expected = array();
		$this->assertSame( $expected, WP_Fonts_Resolver::enqueue_user_selected_fonts() );
	}

	/**
	 * Data provider.
	 *
	 * @return array
	 */
	public function data_should_not_enqueue_when_no_user_selected_fonts() {
		return array(
			'no user-selected styles' => array(),
			'invalid element'         => array(
				array(
					'elements' => array(
						'invalid' => array(
							'typography' => array(
								'fontFamily' => 'var:preset|font-family|font1',
								'fontStyle'  => 'normal',
								'fontWeight' => '400',
							),
						),
					),
				),
			),
		);
	}

	/**
	 * @dataProvider data_should_enqueue_when_user_selected_fonts
	 *
	 * @param array $styles   Test styles.
	 * @param array $expected Expected results.
	 */
	public function test_should_enqueue_when_user_selected_fonts( $styles, $expected ) {
		$mock = $this->set_up_mock( 'enqueue' );
		$mock->expects( $this->once() )
			->method( 'enqueue' )
			->with(
				$this->identicalTo( $expected )
			);

		$this->set_up_global_styles( $styles );

		$this->assertSameSets( $expected, WP_Fonts_Resolver::enqueue_user_selected_fonts() );
	}

	/**
	 * Data provider.
	 *
	 * @return array
	 */
	public function data_should_enqueue_when_user_selected_fonts() {
		$global_styles = $this->get_mock_user_selected_fonts_global_styles();

		return array(
			'heading, caption, text'   => array(
				'styles'   => $global_styles['font1'],
				'expected' => array( 'font1' ),
			),
			'heading, button'          => array(
				'styles'   => $global_styles['font2'],
				'expected' => array( 'font2' ),
			),
			'text'                     => array(
				'styles'   => $global_styles['font3'],
				'expected' => array( 'font3' ),
			),
			'all'                      => array(
				'styles'   => $global_styles['all'],
				'expected' => array(
					0 => 'font1',
					// font1 occurs 2 more times and gets removed as duplicates.
					3 => 'font2',
					4 => 'font3',
				),
			),
			'all with invalid element' => array(
				'styles'   => $global_styles['all with invalid element'],
				'expected' => array(
					0 => 'font1',
					// font1 occurs 2 more times and gets removed as duplicates.
					3 => 'font2',
					// Skips font2 for the "invalid" element.
					4 => 'font3',
				),
			),
		);
	}
}
