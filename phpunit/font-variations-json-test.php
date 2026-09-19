<?php
/**
 * Tests that font variation policies reach the editor as objects.
 *
 * @package gutenberg
 */

class Tests_Font_Variations_JSON extends WP_UnitTestCase {

	/**
	 * A policy with an axis that has no options, as theme.json declares it.
	 *
	 * @var array
	 */
	private static $policy = array(
		'roboto-flex' => array(
			'GRAD' => array(
				'min' => -50,
				'max' => 50,
			),
			'opsz' => array(),
		),
	);

	public function tear_down() {
		remove_filter( 'wp_theme_json_data_theme', array( $this, 'add_policy' ) );
		WP_Theme_JSON_Resolver_Gutenberg::clean_cached_data();
		wp_cache_flush_group( 'theme_json' );
		parent::tear_down();
	}

	/**
	 * Adds the policy to the theme's settings, at the root and for Heading.
	 *
	 * @param WP_Theme_JSON_Data_Gutenberg $theme_json Theme data.
	 * @return WP_Theme_JSON_Data_Gutenberg
	 */
	public function add_policy( $theme_json ) {
		return $theme_json->update_with(
			array(
				'version'  => WP_Theme_JSON_Gutenberg::LATEST_SCHEMA,
				'settings' => array(
					'typography' => array( 'fontVariations' => self::$policy ),
					'blocks'     => array(
						'core/heading' => array(
							'typography' => array( 'fontVariations' => self::$policy ),
						),
					),
				),
			)
		);
	}

	public function test_empty_axis_policies_are_encoded_as_objects() {
		$settings = array(
			'typography' => array(
				'fontVariations' => array_merge( self::$policy, array( 'inter' => array() ) ),
			),
			'blocks'     => array(
				'core/heading' => array(
					'typography' => array( 'fontVariations' => self::$policy ),
				),
				'core/list'    => array(
					'typography' => array( 'fontSize' => true ),
				),
			),
		);

		$this->assertSame( '{"roboto-flex":{"GRAD":{"min":-50,"max":50},"opsz":[]},"inter":[]}', wp_json_encode( $settings['typography']['fontVariations'] ), 'Without preparation, empty policies become lists.' );

		$prepared = gutenberg_prepare_font_variations_for_json( $settings );

		$this->assertSame( '{"roboto-flex":{"GRAD":{"min":-50,"max":50},"opsz":{}},"inter":{}}', wp_json_encode( $prepared['typography']['fontVariations'] ) );
		$this->assertSame( '{"roboto-flex":{"GRAD":{"min":-50,"max":50},"opsz":{}}}', wp_json_encode( $prepared['blocks']['core/heading']['typography']['fontVariations'] ) );
		$this->assertSame( $settings['blocks']['core/list'], $prepared['blocks']['core/list'], 'Other settings are left as they are.' );
	}

	public function test_block_editor_settings_send_axis_policies_as_objects() {
		add_filter( 'wp_theme_json_data_theme', array( $this, 'add_policy' ) );
		WP_Theme_JSON_Resolver_Gutenberg::clean_cached_data();
		wp_cache_flush_group( 'theme_json' );

		$settings = gutenberg_get_block_editor_settings( array() );
		$features = $settings['__experimentalFeatures'];

		$this->assertSame( '{"roboto-flex":{"GRAD":{"min":-50,"max":50},"opsz":{}}}', wp_json_encode( $features['typography']['fontVariations'] ) );
		$this->assertSame( '{"roboto-flex":{"GRAD":{"min":-50,"max":50},"opsz":{}}}', wp_json_encode( $features['blocks']['core/heading']['typography']['fontVariations'] ) );
	}
}
