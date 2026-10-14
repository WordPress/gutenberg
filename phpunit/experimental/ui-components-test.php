<?php
/**
 * Tests for server-rendered `@wordpress/ui` components.
 *
 * The markup comes from snapshots of the React components, so these tests
 * check how PHP fills them in: each example the build renders with React must
 * come out the same from PHP, and props must be validated and escaped. They
 * also fail when the React markup changed and the committed snapshots weren't
 * updated, so every React change is reviewed for its PHP impact.
 *
 * @package gutenberg
 *
 * @covers Gutenberg_UI_Components
 */

require_once dirname( __DIR__, 2 ) . '/lib/experimental/ui-components/load.php';

class Gutenberg_UI_Components_Test extends WP_UnitTestCase {

	public function set_up() {
		parent::set_up();

		if ( ! gutenberg_ui_components()->is_available() ) {
			$this->markTestSkipped( 'Run `npm run build` to build packages/ui/build-php.' );
		}
	}

	/**
	 * React renders of every component example.
	 *
	 * @return array
	 */
	public function data_examples() {
		$file = dirname( __DIR__, 2 ) . '/packages/ui/build-php/test/examples.json';
		if ( ! is_readable( $file ) ) {
			return array( 'not built' => array( null ) );
		}

		$cases = array();
		foreach ( json_decode( file_get_contents( $file ), true ) as $example ) {
			$cases[ $example['component'] . ': ' . $example['name'] ] = array( $example );
		}
		return $cases;
	}

	/**
	 * @dataProvider data_examples
	 *
	 * @param array|null $example Example props with the React render.
	 */
	public function test_renders_the_same_markup_as_react( $example ) {
		$html = gutenberg_get_ui_component( $example['component'], $example['props'] );

		$this->assertSame(
			self::normalize_html( $example['html'] ),
			self::normalize_html( $html ),
			"React:\n{$example['html']}\nPHP:\n{$html}"
		);
	}

	/**
	 * Components with a committed snapshot.
	 *
	 * @return array
	 */
	public function data_components() {
		$cases = array();
		foreach ( glob( dirname( __DIR__, 2 ) . '/packages/ui/php/*/component.json' ) as $file ) {
			$cases[ basename( dirname( $file ) ) ] = array( dirname( $file ) );
		}
		return $cases;
	}

	/**
	 * @dataProvider data_components
	 *
	 * @param string $dir Component directory.
	 */
	public function test_snapshot_is_up_to_date_with_react( $dir ) {
		$name = json_decode( file_get_contents( $dir . '/component.json' ), true )['name'];

		$this->assertSame(
			file_get_contents( dirname( __DIR__, 2 ) . "/packages/ui/build-php/test/snapshots/{$name}.html" ),
			file_get_contents( $dir . '/snapshot.html' ),
			"The React markup of {$name} changed. Check it on Tools → UI Components, then run `npm run update-php-snapshots --workspace @wordpress/ui` and commit the snapshot."
		);
	}

	public function test_deprecated_props_and_values_map_to_their_replacements() {
		$dir = get_temp_dir() . 'wp-ui-components-test/';
		wp_mkdir_p( $dir );
		file_put_contents(
			$dir . 'manifest.php',
			'<?php return ' . var_export(
				array(
					'version'    => '1.0.0',
					'components' => array(
						'badge' => array(
							'props'        => array(
								'label'  => array(
									'type'     => 'string',
									'required' => true,
								),
								'intent' => array(
									'type'    => 'string',
									'enum'    => array( 'neutral', 'warning' ),
									'default' => 'neutral',
								),
							),
							'variants'     => array( 'intent' ),
							'snapshots'    => array(
								'intent=neutral' => array( '<span>', array( 'slot', 'label', 'text' ), '</span>' ),
								'intent=warning' => array( '<span class="warning">', array( 'slot', 'label', 'text' ), '</span>' ),
							),
							'deprecations' => array(
								array(
									'prop'        => 'text',
									'replacement' => 'label',
									'since'       => '1.0.0',
								),
								array(
									'prop'        => 'intent',
									'value'       => 'caution',
									'replacement' => 'warning',
									'since'       => '1.0.0',
								),
							),
						),
					),
				),
				true
			) . ';'
		);
		$components = new Gutenberg_UI_Components( $dir, 'https://example.org/' );

		$this->setExpectedDeprecated( 'Gutenberg_UI_Components::render' );
		$this->assertSame(
			'<span class="warning">Saved</span>',
			$components->render(
				'badge',
				array(
					'text'   => 'Saved',
					'intent' => 'caution',
				)
			)
		);

		unlink( $dir . 'manifest.php' );
	}

	public function test_a_bundled_copy_uses_its_own_asset_handles() {
		$bundled = new Gutenberg_UI_Components(
			dirname( __DIR__, 2 ) . '/packages/ui/build-php',
			'https://example.org/my-plugin/ui/',
			'my-plugin-ui-'
		);

		$bundled->render( 'button', array( 'label' => 'Save' ) );

		$this->assertTrue( wp_style_is( 'my-plugin-ui-components', 'enqueued' ) );
		$this->assertStringStartsWith( 'https://example.org/my-plugin/ui/', wp_styles()->registered['my-plugin-ui-components']->src );
	}

	/**
	 * @dataProvider data_loose_booleans
	 *
	 * @param mixed $value A value `rest_validate_value_from_schema()` accepts as a boolean.
	 */
	public function test_accepts_the_values_wordpress_treats_as_booleans( $value ) {
		$this->assertSame(
			gutenberg_get_ui_component(
				'button',
				array(
					'label'    => 'Save',
					'disabled' => true,
				)
			),
			gutenberg_get_ui_component(
				'button',
				array(
					'label'    => 'Save',
					'disabled' => $value,
				)
			)
		);
	}

	public function data_loose_booleans() {
		return array(
			'int'    => array( 1 ),
			'string' => array( '1' ),
			'word'   => array( 'true' ),
		);
	}

	public function test_escapes_text_and_attribute_slots() {
		$html = gutenberg_get_ui_component(
			'button',
			array(
				'label' => '<script>alert(1)</script>',
				'class' => '"><script>',
			)
		);

		$this->assertStringNotContainsString( '<script>', $html );
		$this->assertStringContainsString( '&lt;script&gt;alert(1)&lt;/script&gt;', $html );
	}

	/**
	 * @expectedIncorrectUsage Gutenberg_UI_Components::render
	 */
	public function test_unknown_component_renders_nothing() {
		$this->assertSame( '', gutenberg_get_ui_component( 'not-a-component' ) );
	}

	/**
	 * @expectedIncorrectUsage Gutenberg_UI_Components::render
	 */
	public function test_missing_required_prop_renders_nothing() {
		$this->assertSame( '', gutenberg_get_ui_component( 'button' ) );
	}

	/**
	 * @expectedIncorrectUsage Gutenberg_UI_Components::render
	 */
	public function test_invalid_prop_value_falls_back_to_default() {
		$this->assertSame(
			gutenberg_get_ui_component( 'button', array( 'label' => 'Save' ) ),
			gutenberg_get_ui_component(
				'button',
				array(
					'label' => 'Save',
					'type'  => '"><script>',
				)
			)
		);
	}

	/**
	 * @expectedIncorrectUsage Gutenberg_UI_Components::render
	 */
	public function test_unknown_prop_is_ignored() {
		$this->assertSame(
			gutenberg_get_ui_component( 'button', array( 'label' => 'Save' ) ),
			gutenberg_get_ui_component(
				'button',
				array(
					'label'   => 'Save',
					'onClick' => 'alert(1)',
				)
			)
		);
	}

	/**
	 * Normalizes HTML so two renders can be compared: attributes and class names
	 * are sorted, whitespace-only text is dropped, IDs and the attributes that
	 * refer to them are numbered in order of appearance, and self-closing SVG tags
	 * and inline styles are written one way.
	 *
	 * @param string $html HTML.
	 * @return array List of tokens.
	 */
	private static function normalize_html( $html ) {
		$tokens    = array();
		$ids       = array();
		$processor = new WP_HTML_Tag_Processor( $html );

		while ( $processor->next_token() ) {
			$type = $processor->get_token_type();

			if ( '#text' === $type ) {
				$text = trim( $processor->get_modifiable_text() );
				if ( '' !== $text ) {
					$tokens[] = $text;
				}
				continue;
			}

			if ( '#tag' !== $type ) {
				continue;
			}

			if ( $processor->is_tag_closer() ) {
				$tokens[] = '</' . strtolower( $processor->get_tag() ) . '>';
				continue;
			}

			$attributes = array();
			foreach ( $processor->get_attribute_names_with_prefix( '' ) as $name ) {
				$value = $processor->get_attribute( $name );
				if ( in_array( $name, array( 'id', 'for', 'aria-controls', 'aria-describedby', 'aria-labelledby' ), true ) ) {
					$references = array();
					foreach ( preg_split( '/\s+/', trim( (string) $value ) ) as $id ) {
						if ( ! isset( $ids[ $id ] ) ) {
							$ids[ $id ] = '#' . count( $ids );
						}
						$references[] = $ids[ $id ];
					}
					$value = implode( ' ', $references );
				}
				if ( 'class' === $name ) {
					$classes = preg_split( '/\s+/', trim( (string) $value ) );
					sort( $classes );
					$value = implode( ' ', $classes );
				} elseif ( 'style' === $name ) {
					$value = preg_replace( '/\s*([:;])\s*/', '$1', trim( (string) $value, ' ;' ) );
				}
				$attributes[ $name ] = true === $value ? '' : $value;
			}
			ksort( $attributes );

			$tokens[] = array(
				'tag'        => strtolower( $processor->get_tag() ),
				'attributes' => $attributes,
			);
			if ( $processor->has_self_closing_flag() ) {
				$tokens[] = '</' . strtolower( $processor->get_tag() ) . '>';
			}
		}

		return $tokens;
	}
}
