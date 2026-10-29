<?php
/**
 * Tests for server-rendered `@wordpress/ui` components.
 *
 * The build renders every combination of each component's variants with
 * React. These tests check that PHP renders the same markup, so a change to
 * the React component that the PHP template or recipe doesn't follow fails
 * here. They also check how props are validated and escaped.
 *
 * @package gutenberg
 */

require_once dirname( __DIR__, 2 ) . '/lib/experimental/ui-components/load.php';

class Gutenberg_UI_Components_Test extends WP_UnitTestCase {

	public function set_up() {
		parent::set_up();

		if ( ! gutenberg_ui_components_get_manifest() ) {
			$this->markTestSkipped( 'Run `npm run build` to build packages/ui/build-php.' );
		}
	}

	/**
	 * React renders of every combination of variants.
	 *
	 * @return array
	 */
	public function data_react_fixtures() {
		$file = dirname( __DIR__, 2 ) . '/packages/ui/build-php/test/fixtures.json';
		if ( ! is_readable( $file ) ) {
			return array( 'not built' => array( null ) );
		}

		$cases = array();
		foreach ( json_decode( file_get_contents( $file ), true ) as $fixture ) {
			$cases[ $fixture['component'] . ': ' . wp_json_encode( $fixture['props'] ) . ' ' . $fixture['content'] ] = array( $fixture );
		}
		return $cases;
	}

	/**
	 * @dataProvider data_react_fixtures
	 *
	 * @param array|null $fixture Props, content and React's render.
	 */
	public function test_renders_the_same_markup_as_react( $fixture ) {
		$html = gutenberg_get_ui_component( $fixture['component'], $fixture['props'], $fixture['content'] );

		$this->assertSame(
			self::normalize_html( $fixture['html'] ),
			self::normalize_html( $html ),
			"React:\n{$fixture['html']}\nPHP:\n{$html}"
		);
	}

	public function test_escapes_text_and_attributes() {
		$html = gutenberg_get_ui_component(
			'button',
			array( 'class' => '" onclick="alert(1)' ),
			'<script>alert(1)</script>'
		);

		$this->assertStringNotContainsString( '<script>', $html );
		$this->assertStringNotContainsString( '" onclick="', $html );
	}

	public function test_invalid_props_fall_back_to_their_default() {
		$this->setExpectedIncorrectUsage( 'gutenberg_get_ui_component' );

		$this->assertSame(
			gutenberg_get_ui_component( 'button', array(), 'Save' ),
			gutenberg_get_ui_component( 'button', array( 'variant' => 'sparkly' ), 'Save' )
		);
	}

	/**
	 * @dataProvider data_missing_content
	 *
	 * @param mixed $content Content that isn't text, or is empty.
	 */
	public function test_missing_required_content_renders_nothing( $content ) {
		$this->setExpectedIncorrectUsage( 'gutenberg_get_ui_component' );

		$this->assertSame( '', gutenberg_get_ui_component( 'button', array(), $content ) );
	}

	/**
	 * @return array
	 */
	public function data_missing_content() {
		return array(
			'none'  => array( null ),
			'empty' => array( '' ),
			'array' => array( array( 'Save' ) ),
		);
	}

	public function test_a_select_prints_a_native_fallback() {
		$html = gutenberg_get_ui_component(
			'searchable-select-control',
			array(
				'label' => 'Base <country>',
				'name'  => 'country',
				'items' => array(
					array(
						'value' => 'ES',
						'label' => 'Spain',
					),
					array(
						'value' => 'PT',
						'label' => 'Portugal',
					),
				),
				'value' => 'PT',
			)
		);

		$this->assertStringContainsString( '<select', $html );
		$this->assertStringContainsString( 'name="country"', $html );
		$this->assertMatchesRegularExpression( '/<option value="PT"\s+selected=[\'"]selected[\'"]>Portugal<\/option>/', $html );
		$this->assertStringContainsString( 'Base &lt;country&gt;', $html );
		$this->assertStringContainsString( '<wp-ui-interactive', $html );
		$this->assertTrue( wp_script_is( 'wp-ui-interactive', 'enqueued' ) );
	}

	public function test_an_interactive_component_gets_react_props() {
		$html = gutenberg_get_ui_component(
			'switch-control',
			array(
				'label'   => 'Enable coupons',
				'name'    => 'enable_coupons',
				'checked' => true,
			)
		);

		$this->assertStringContainsString( '&quot;defaultChecked&quot;:true', $html );
		$this->assertStringContainsString( '&quot;component&quot;:&quot;SwitchControl&quot;', $html );
	}

	public function test_each_switch_gets_its_own_ids() {
		$first  = gutenberg_get_ui_component(
			'switch-control',
			array(
				'label' => 'Enable taxes',
				'name'  => 'enable_taxes',
			)
		);
		$second = gutenberg_get_ui_component(
			'switch-control',
			array(
				'label' => 'Enable coupons',
				'name'  => 'enable_coupons',
			)
		);

		preg_match( '/<label id="[^"]+" for="([^"]+)"/', $first, $first_for );
		preg_match( '/<label id="[^"]+" for="([^"]+)"/', $second, $second_for );
		$this->assertNotSame( $first_for[1], $second_for[1] );
	}

	public function test_static_components_load_no_script() {
		wp_dequeue_script( 'wp-ui-interactive' );

		gutenberg_get_ui_component( 'button', array(), 'Save' );

		$this->assertFalse( wp_script_is( 'wp-ui-interactive', 'enqueued' ) );
	}

	public function test_an_unknown_component_renders_nothing() {
		$this->setExpectedIncorrectUsage( 'gutenberg_get_ui_component' );

		$this->assertSame( '', gutenberg_get_ui_component( 'not-a-component' ) );
	}

	public function test_rendering_enqueues_the_stylesheet() {
		gutenberg_get_ui_component( 'button', array(), 'Save' );

		$this->assertTrue( wp_style_is( 'wp-ui-components', 'enqueued' ) );
	}

	/**
	 * Turns HTML into a list of tokens to compare, ignoring the order of
	 * attributes and classes, the wrappers for interactive components, and
	 * generated IDs, which differ between React and PHP.
	 *
	 * @param string $html HTML.
	 * @return array Tokens.
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

			if ( '#tag' !== $type || 'WP-UI-INTERACTIVE' === $processor->get_tag() ) {
				continue;
			}

			if ( $processor->is_tag_closer() ) {
				$tokens[] = '</' . strtolower( $processor->get_tag() ) . '>';
				continue;
			}

			$attributes = array();
			foreach ( $processor->get_attribute_names_with_prefix( '' ) as $name ) {
				$value = $processor->get_attribute( $name );
				if ( 'class' === $name ) {
					$classes = preg_split( '/\s+/', trim( (string) $value ) );
					sort( $classes );
					$value = implode( ' ', $classes );
				}
				if ( in_array( $name, array( 'id', 'for', 'aria-controls', 'aria-describedby', 'aria-labelledby' ), true ) ) {
					$value = implode(
						' ',
						array_map(
							static function ( $id ) use ( &$ids ) {
								$ids[ $id ] = $ids[ $id ] ?? '#' . count( $ids );
								return $ids[ $id ];
							},
							preg_split( '/\s+/', trim( (string) $value ) )
						)
					);
				}
				$attributes[ $name ] = true === $value ? '' : $value;
			}
			ksort( $attributes );

			$tokens[] = array(
				'tag'        => strtolower( $processor->get_tag() ),
				'attributes' => $attributes,
			);
		}

		return $tokens;
	}
}
