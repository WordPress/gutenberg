<?php
/**
 * Tests for the opt-in dark-scheme color data model in theme.json.
 *
 * Covers `settings.color.dark` (inline dark presets) emission, the single-value
 * fallback, and backward-compatible/opt-in behavior. See
 * sdd/dark-mode-site-editor/spec.md.
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
