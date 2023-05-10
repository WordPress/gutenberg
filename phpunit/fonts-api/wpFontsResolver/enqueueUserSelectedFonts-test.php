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
	const FONTS_THEME = 'fonts-block-theme';
	/**
	 * Administrator ID.
	 *
	 * @var int
	 */
	private static $administrator_id = 0;

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
		$fonts = array(
			'font1-400-normal' => array(
				'fontFamily' => 'var:preset|font-family|font1',
				'fontStyle'  => 'normal',
				'fontWeight' => '400',
			),
			'font1-400-italic' => array(
				'fontFamily' => 'var:preset|font-family|font1',
				'fontStyle'  => 'italic',
				'fontWeight' => '400',
			),
			'font2-600-normal' => array(
				'fontFamily' => 'var:preset|font-family|font2',
				'fontStyle'  => 'normal',
				'fontWeight' => '600',
			),
			'font2-600-italic' => array(
				'fontFamily' => 'var:preset|font-family|font2',
				'fontStyle'  => 'italic',
				'fontWeight' => '600',
			),
			'font3-900-normal' => array(
				'fontFamily' => 'var:preset|font-family|font3',
				'fontStyle'  => 'normal',
				'fontWeight' => '900',
			),
		);

		return array(
			'link'                  => array(
				'styles'   => array(
					'elements' => array(
						'link' => array(
							'typography' => $fonts['font1-400-italic'],
						),
					),
				),
				'expected' => array( 'font1' ),
			),
			'heading'               => array(
				'styles'   => array(
					'elements' => array(
						'heading' => array(
							'typography' => $fonts['font2-600-italic'],
						),
					),
				),
				'expected' => array( 'font2' ),
			),
			'caption'               => array(
				'styles'   => array(
					'elements' => array(
						'caption' => array(
							'typography' => $fonts['font2-600-normal'],
						),
					),
				),
				'expected' => array( 'font2' ),
			),
			'button'                => array(
				'styles'   => array(
					'elements' => array(
						'button' => array(
							'typography' => $fonts['font1-400-normal'],
						),
					),
				),
				'expected' => array( 'font1' ),
			),
			'text'                  => array(
				'styles'   => array(
					'typography' => $fonts['font1-400-normal'],
				),
				'expected' => array( 'font1' ),
			),
			'all elements'          => array(
				'styles'   => array(
					'elements' => array(
						'link'    => array(
							'typography' => $fonts['font1-400-italic'],
						),
						'heading' => array(
							'typography' => $fonts['font2-600-italic'],
						),
						'caption' => array(
							'typography' => $fonts['font2-600-normal'],
						),
						'button'  => array(
							'typography' => $fonts['font1-400-normal'],
						),
					),
				),
				'expected' => array( 'font1', 'font2' ),
			),
			'all elements and text' => array(
				'styles'   => array(
					'elements'   => array(
						'link'    => array(
							'typography' => $fonts['font1-400-italic'],
						),
						'heading' => array(
							'typography' => $fonts['font2-600-italic'],
						),
						'caption' => array(
							'typography' => $fonts['font3-900-normal'],
						),
						'button'  => array(
							'typography' => $fonts['font1-400-normal'],
						),
					),
					'typography' => $fonts['font1-400-normal'],
				),
				'expected' => array( 'font1', 'font2', 'font3' ),
			),
			'with invalid element'  => array(
				'styles'   => array(
					'elements' => array(
						'button'  => array(
							'typography' => $fonts['font1-400-normal'],
						),
						'invalid' => array(
							'typography' => $fonts['font3-900-normal'],
						),
					),
				),
				'expected' => array( 'font1' ),
			),
		);
	}

	/**
	 * Sets up the global styles.
	 *
	 * @param array $styles User-selected styles structure.
	 */
	private function set_up_global_styles( array $styles ) {
		switch_theme( static::FONTS_THEME );

		if ( empty( $styles ) ) {
			return;
		}

		// Make sure there is data from the user origin.
		wp_set_current_user( self::$administrator_id );
		$user_cpt = WP_Theme_JSON_Resolver::get_user_data_from_wp_global_styles( wp_get_theme(), true );
		$config   = json_decode( $user_cpt['post_content'], true );

		// Add the test styles.
		$config['styles'] = $styles;

		// Update the global styles and settings post.
		$user_cpt['post_content'] = wp_json_encode( $config );
		wp_update_post( $user_cpt, true, false );
	}
}
