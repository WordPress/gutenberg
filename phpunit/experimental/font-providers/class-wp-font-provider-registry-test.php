<?php
/**
 * Unit tests covering WP_Font_Provider_Registry and the font provider output.
 *
 * @package gutenberg
 */
class WP_Test_Font_Provider_Registry extends WP_UnitTestCase {

	/**
	 * @var WP_Font_Provider_Registry
	 */
	protected $registry;

	public function set_up() {
		parent::set_up();
		$this->registry = WP_Font_Provider_Registry::get_instance();
	}

	public function tear_down() {
		foreach ( $this->registry->get_all_registered() as $provider ) {
			$this->registry->unregister( $provider['slug'] );
		}
		parent::tear_down();
	}

	/**
	 * A provider with one family whose face declares its own family name.
	 *
	 * @return array Font provider properties.
	 */
	private static function get_provider_args() {
		return array(
			'label'        => 'Example Korean Fallback',
			'description'  => 'Korean script fallback.',
			'fontFamilies' => array(
				array(
					'name'       => 'Noto Sans KR',
					'slug'       => 'noto-sans-kr',
					'fontFamily' => '"Noto Sans KR", sans-serif',
					'fontFace'   => array(
						array(
							'fontFamily'   => 'Example Hangul',
							'fontWeight'   => '100 900',
							'fontStyle'    => 'normal',
							'unicodeRange' => 'U+AC00-D7A3',
							'src'          => 'https://example.org/fonts/hangul.woff2',
						),
						array(
							'fontFamily' => 'Noto Sans KR',
							'fontWeight' => '400',
							'src'        => array( 'https://example.org/fonts/noto-sans-kr.woff2' ),
						),
					),
				),
			),
		);
	}

	/**
	 * Adds a font with a face to the theme data.
	 *
	 * @param WP_Theme_JSON_Data $theme_json Theme data.
	 * @return WP_Theme_JSON_Data Theme data with the font.
	 */
	public function add_theme_font( $theme_json ) {
		return $theme_json->update_with(
			array(
				'version'  => 3,
				'settings' => array(
					'typography' => array(
						'fontFamilies' => array(
							array(
								'name'       => 'Example Theme Font',
								'slug'       => 'example-theme-font',
								'fontFamily' => '"Example Theme Font", serif',
								'fontFace'   => array(
									array(
										'fontFamily' => 'Example Theme Font',
										'src'        => array( 'https://example.org/fonts/theme.woff2' ),
									),
								),
							),
						),
					),
				),
			)
		);
	}

	public function test_register_valid_provider() {
		$this->assertTrue( $this->registry->register( 'example-kr', self::get_provider_args() ) );

		$provider = $this->registry->get_registered( 'example-kr' );
		$this->assertSame( 'example-kr', $provider['slug'] );
		$this->assertSame( 'Example Korean Fallback', $provider['label'] );
		$this->assertCount( 1, $provider['fontFamilies'] );
		$this->assertSame( 'Example Hangul', $provider['fontFamilies'][0]['fontFace'][0]['fontFamily'], 'A face keeps its own family name.' );
		$this->assertSame( 'normal', $provider['fontFamilies'][0]['fontFace'][1]['fontStyle'], 'A missing fontStyle takes the printed default.' );
		$this->assertSame( '400', $provider['fontFamilies'][0]['fontFace'][1]['fontWeight'], 'The given fontWeight is kept.' );
	}

	public function test_register_function_uses_registry() {
		$this->assertTrue( wp_register_font_provider( 'example-kr', self::get_provider_args() ) );
		$this->assertTrue( $this->registry->is_registered( 'example-kr' ) );
		$this->assertTrue( wp_unregister_font_provider( 'example-kr' ) );
		$this->assertFalse( $this->registry->is_registered( 'example-kr' ) );
	}

	/**
	 * @dataProvider data_invalid_providers
	 * @expectedIncorrectUsage WP_Font_Provider_Registry::register
	 *
	 * @param string $slug Provider slug.
	 * @param mixed  $args Provider properties.
	 */
	public function test_register_rejects_invalid_provider( $slug, $args ) {
		$this->assertFalse( $this->registry->register( $slug, $args ) );
		$this->assertSame( array(), $this->registry->get_all_registered() );
	}

	public static function data_invalid_providers() {
		$valid  = self::get_provider_args();
		$family = $valid['fontFamilies'][0];

		$no_face_family = $family;
		unset( $no_face_family['fontFace'][1]['fontFamily'] );
		$no_src                         = $family;
		$no_src['fontFace'][0]['src']   = '';
		$no_faces                       = $family;
		$no_faces['fontFace']           = array();
		$bad_name                       = $family;
		$bad_name['name']               = array( 'Noto' );
		$twice                          = $valid;
		$twice['fontFamilies'][]        = $family;
		$unknown                        = $valid;
		$unknown['usage']               = array( 'emoji' => array() );
		$no_label                       = $valid;
		$no_label['label']              = '';
		$empty_families                 = $valid;
		$empty_families['fontFamilies'] = array();
		$keyed_families                 = $valid;
		$keyed_families['fontFamilies'] = array( 'kr' => $family );

		return array(
			'uppercase slug'          => array( 'Example-KR', $valid ),
			'args not an array'       => array( 'example-kr', 'Example' ),
			'unknown property'        => array( 'example-kr', $unknown ),
			'empty label'             => array( 'example-kr', $no_label ),
			'no families'             => array( 'example-kr', $empty_families ),
			'families not a list'     => array( 'example-kr', $keyed_families ),
			'face without fontFamily' => array( 'example-kr', array_merge( $valid, array( 'fontFamilies' => array( $no_face_family ) ) ) ),
			'face without src'        => array( 'example-kr', array_merge( $valid, array( 'fontFamilies' => array( $no_src ) ) ) ),
			'family without faces'    => array( 'example-kr', array_merge( $valid, array( 'fontFamilies' => array( $no_faces ) ) ) ),
			'name not a string'       => array( 'example-kr', array_merge( $valid, array( 'fontFamilies' => array( $bad_name ) ) ) ),
			'family slug used twice'  => array( 'example-kr', $twice ),
		);
	}

	/**
	 * @expectedIncorrectUsage WP_Font_Provider_Registry::register
	 */
	public function test_register_rejects_duplicate_slug() {
		$this->assertTrue( $this->registry->register( 'example-kr', self::get_provider_args() ) );
		$this->assertFalse( $this->registry->register( 'example-kr', self::get_provider_args() ) );
	}

	/**
	 * @expectedIncorrectUsage WP_Font_Provider_Registry::unregister
	 */
	public function test_unregister_missing_provider() {
		$this->assertFalse( $this->registry->unregister( 'missing' ) );
	}

	public function test_get_font_faces_keeps_the_face_family_name() {
		$this->registry->register( 'example-kr', self::get_provider_args() );

		$fonts = $this->registry->get_font_faces();

		$this->assertCount( 1, $fonts );
		$this->assertSame( 'Example Hangul', $fonts[0][0]['font-family'], 'A face that names its family keeps that name.' );
		$this->assertSame( 'U+AC00-D7A3', $fonts[0][0]['unicode-range'], 'Properties are converted to kebab-case.' );
		$this->assertSame( 'Noto Sans KR', $fonts[0][1]['font-family'] );
	}

	public function test_family_name_with_a_comma_is_kept_whole() {
		$args                                  = self::get_provider_args();
		$args['fontFamilies'][0]['fontFamily'] = '"ACME, Inc.", sans-serif';
		$args['fontFamilies'][0]['fontFace']   = array(
			array(
				'fontFamily' => 'ACME, Inc.',
				'src'        => 'https://example.org/fonts/acme.woff2',
			),
		);
		$this->registry->register( 'example-acme', $args );

		$fonts = $this->registry->get_font_faces();

		$this->assertSame( 'ACME, Inc.', $fonts[0][0]['font-family'] );
		$this->assertStringContainsString( 'font-family:"ACME, Inc."', get_echo( 'gutenberg_print_font_provider_font_faces' ) );
	}

	public function test_print_does_nothing_without_providers() {
		add_filter( 'wp_theme_json_data_theme', array( $this, 'add_theme_font' ) );
		wp_clean_theme_json_cache();
		$this->assertStringContainsString( 'Example Theme Font', get_echo( 'wp_print_font_faces' ), 'The theme has a font that wp_print_font_faces() prints.' );

		$output = get_echo( 'gutenberg_print_font_provider_font_faces' );

		remove_filter( 'wp_theme_json_data_theme', array( $this, 'add_theme_font' ) );
		wp_clean_theme_json_cache();

		$this->assertSame( '', $output, 'wp_print_font_faces() would print the theme fonts again if it were called with an empty list.' );
	}

	public function test_print_outputs_provider_faces() {
		$this->registry->register( 'example-kr', self::get_provider_args() );

		$output = get_echo( 'gutenberg_print_font_provider_font_faces' );

		$this->assertStringContainsString( 'font-family:"Example Hangul"', $output );
		$this->assertStringContainsString( 'unicode-range:U+AC00-D7A3;', $output );
		$this->assertStringContainsString( 'https://example.org/fonts/noto-sans-kr.woff2', $output );
	}

	public function test_print_is_hooked_to_wp_head() {
		$this->assertSame( 50, has_action( 'wp_head', 'gutenberg_print_font_provider_font_faces' ) );
	}

	public function test_editor_styles_include_provider_faces() {
		$this->registry->register( 'example-kr', self::get_provider_args() );

		$settings = gutenberg_add_font_provider_font_faces_to_editor(
			array( '__unstableResolvedAssets' => array( 'styles' => '<style>/* existing */</style>' ) )
		);

		$this->assertStringStartsWith( '<style>/* existing */</style>', $settings['__unstableResolvedAssets']['styles'] );
		$this->assertStringContainsString( 'font-family:"Example Hangul"', $settings['__unstableResolvedAssets']['styles'] );
	}

	public function test_editor_styles_unchanged_without_providers() {
		$settings = array( '__unstableResolvedAssets' => array( 'styles' => '<style>/* existing */</style>' ) );

		$this->assertSame( $settings, gutenberg_add_font_provider_font_faces_to_editor( $settings ) );
	}

	public function test_provider_families_are_not_font_choices() {
		$this->registry->register( 'example-kr', self::get_provider_args() );
		wp_clean_theme_json_cache();

		$families = wp_get_global_settings( array( 'typography', 'fontFamilies' ) );
		$slugs    = array();
		foreach ( (array) $families as $origin ) {
			foreach ( (array) $origin as $family ) {
				$slugs[] = $family['slug'] ?? '';
			}
		}

		$this->assertNotContains( 'noto-sans-kr', $slugs );
	}
}
