<?php
/**
 * Tests for the opt-in dark-scheme color data model in theme.json.
 *
 * Covers `settings.color.dark` (inline dark presets) emission, the single-value
 * fallback, and backward-compatible/opt-in behavior.
 *
 * @package Gutenberg
 */

class Theme_JSON_Dark_Scheme_Test extends WP_UnitTestCase {

	/**
	 * Builds a theme.json with a base palette and an optional dark override,
	 * then returns the generated CSS variables split around the dark gate.
	 *
	 * @param array $color The `settings.color` array to use.
	 * @return array {
	 *     @type string $full  The full variables stylesheet.
	 *     @type string $light Everything before the dark media query.
	 *     @type string $dark  Everything inside/after the dark media query ('' if none).
	 * }
	 */
	private function get_variables_split( $color ) {
		$theme_json = new WP_Theme_JSON_Gutenberg(
			array(
				'version'  => WP_Theme_JSON_Gutenberg::LATEST_SCHEMA,
				'settings' => array( 'color' => $color ),
			)
		);

		$full  = $theme_json->get_stylesheet( array( 'variables' ) );
		$parts = explode( '@media (prefers-color-scheme: dark)', $full, 2 );

		return array(
			'full'  => $full,
			'light' => $parts[0],
			'dark'  => $parts[1] ?? '',
		);
	}

	public function test_inline_dark_palette_emits_gated_override() {
		$result = $this->get_variables_split(
			array(
				'palette' => array(
					array(
						'slug'  => 'primary',
						'name'  => 'Primary',
						'color' => '#111111',
					),
				),
				'dark'    => array(
					'palette' => array(
						array(
							'slug'  => 'primary',
							'name'  => 'Primary',
							'color' => '#eeeeee',
						),
					),
				),
			)
		);

		// A dark gate is emitted.
		$this->assertStringContainsString( '@media (prefers-color-scheme: dark)', $result['full'] );
		// Base (light) value is emitted at the root, not inside the gate.
		$this->assertStringContainsString( '#111111', $result['light'] );
		// Dark value is emitted only inside the gate.
		$this->assertStringContainsString( '#eeeeee', $result['dark'] );
		$this->assertStringNotContainsString( '#eeeeee', $result['light'] );
		// The override targets the existing preset custom property.
		$this->assertStringContainsString( '--wp--preset--color--primary', $result['dark'] );
	}

	public function test_inline_dark_gradient_emits_gated_override() {
		$result = $this->get_variables_split(
			array(
				'gradients' => array(
					array(
						'slug'     => 'pop',
						'name'     => 'Pop',
						'gradient' => 'linear-gradient(#000, #111)',
					),
				),
				'dark'      => array(
					'gradients' => array(
						array(
							'slug'     => 'pop',
							'name'     => 'Pop',
							'gradient' => 'linear-gradient(#fff, #eee)',
						),
					),
				),
			)
		);

		$this->assertStringContainsString( '--wp--preset--gradient--pop', $result['dark'] );
		$this->assertStringContainsString( 'linear-gradient(#fff, #eee)', $result['dark'] );
	}

	public function test_single_value_slug_has_no_dark_override() {
		$result = $this->get_variables_split(
			array(
				'palette' => array(
					array(
						'slug'  => 'primary',
						'name'  => 'Primary',
						'color' => '#111111',
					),
					array(
						'slug'  => 'secondary',
						'name'  => 'Secondary',
						'color' => '#222222',
					),
				),
				'dark'    => array(
					'palette' => array(
						array(
							'slug'  => 'primary',
							'name'  => 'Primary',
							'color' => '#eeeeee',
						),
					),
				),
			)
		);

		// Overridden slug appears in the dark gate; unoverridden slug does not.
		$this->assertStringContainsString( '--wp--preset--color--primary', $result['dark'] );
		$this->assertStringNotContainsString( '--wp--preset--color--secondary', $result['dark'] );
	}

	public function test_dark_only_slug_is_ignored() {
		$result = $this->get_variables_split(
			array(
				'palette' => array(
					array(
						'slug'  => 'primary',
						'name'  => 'Primary',
						'color' => '#111111',
					),
				),
				'dark'    => array(
					'palette' => array(
						array(
							'slug'  => 'primary',
							'name'  => 'Primary',
							'color' => '#eeeeee',
						),
						array(
							'slug'  => 'midnight',
							'name'  => 'Midnight',
							'color' => '#000033',
						),
					),
				),
			)
		);

		/*
		 * A scheme section overrides base presets rather than introducing new
		 * ones, so a slug with no base preset emits nothing in either scheme.
		 */
		$this->assertStringContainsString( '--wp--preset--color--primary', $result['dark'] );
		$this->assertStringNotContainsString( '--wp--preset--color--midnight', $result['full'] );
	}

	public function test_dark_overrides_respond_to_data_scheme_attribute() {
		$result = $this->get_variables_split(
			array(
				'palette' => array(
					array(
						'slug'  => 'base',
						'name'  => 'Base',
						'color' => '#ffffff',
					),
				),
				'dark'    => array(
					'palette' => array(
						array(
							'slug'  => 'base',
							'name'  => 'Base',
							'color' => '#111111',
						),
					),
				),
			)
		);

		// Automatic dark (OS) applies unless the visitor opted out to light.
		$this->assertStringContainsString( ':root:not([data-scheme="light"])', $result['full'] );
		// An explicit dark choice forces the dark values regardless of OS.
		$this->assertStringContainsString( ':root[data-scheme="dark"]', $result['full'] );
		// Both scheme-scoped rules carry the dark value.
		$this->assertStringContainsString( '#111111', $result['dark'] );
	}

	public function test_light_scheme_emits_gated_override() {
		// A dark-by-default theme: base palette is dark, `light` is the override.
		$result = $this->get_variables_split(
			array(
				'palette' => array(
					array(
						'slug'  => 'base',
						'name'  => 'Base',
						'color' => '#111111',
					),
				),
				'light'   => array(
					'palette' => array(
						array(
							'slug'  => 'base',
							'name'  => 'Base',
							'color' => '#ffffff',
						),
					),
				),
			)
		);
		$full   = $result['full'];

		// Light override is gated on `prefers-color-scheme: light`, applied unless forced dark.
		$this->assertStringContainsString( '@media (prefers-color-scheme: light)', $full );
		$this->assertStringContainsString( ':root:not([data-scheme="dark"])', $full );
		// A forced-light choice re-asserts the light values.
		$this->assertStringContainsString( ':root[data-scheme="light"]', $full );
		$this->assertStringContainsString( '#ffffff', $full );
		// No dark gate is emitted when only `light` is defined.
		$this->assertStringNotContainsString( 'prefers-color-scheme: dark', $full );
	}

	public function test_light_and_dark_can_coexist() {
		$result = $this->get_variables_split(
			array(
				'palette' => array(
					array(
						'slug'  => 'base',
						'name'  => 'Base',
						'color' => '#888888',
					),
				),
				'light'   => array(
					'palette' => array(
						array(
							'slug'  => 'base',
							'name'  => 'Base',
							'color' => '#ffffff',
						),
					),
				),
				'dark'    => array(
					'palette' => array(
						array(
							'slug'  => 'base',
							'name'  => 'Base',
							'color' => '#000000',
						),
					),
				),
			)
		);
		$full   = $result['full'];

		$this->assertStringContainsString( '@media (prefers-color-scheme: light)', $full );
		$this->assertStringContainsString( '@media (prefers-color-scheme: dark)', $full );
		$this->assertStringContainsString( ':root[data-scheme="light"]', $full );
		$this->assertStringContainsString( ':root[data-scheme="dark"]', $full );
	}

	public function test_no_dark_key_emits_no_gate_and_is_unchanged() {
		$base_only = array(
			'palette' => array(
				array(
					'slug'  => 'primary',
					'name'  => 'Primary',
					'color' => '#111111',
				),
			),
		);

		// An absent dark section must not alter output at all (fully opt-in).
		$result = $this->get_variables_split( $base_only );

		$this->assertStringNotContainsString( '@media (prefers-color-scheme: dark)', $result['full'] );
		$this->assertStringContainsString( '#111111', $result['full'] );
	}
}
