<?php
/**
 * Tests for server-rendered `@wordpress/ui` components.
 *
 * The build renders every combination of each component's variants with
 * React. These tests check that PHP renders the same markup, so a change to
 * the React component that the PHP template doesn't follow fails
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
			$cases[ $fixture['component'] . ': ' . wp_json_encode( $fixture['props'] ) . ' ' . ( $fixture['content'] ?? '' ) ] = array( $fixture );
		}
		return $cases;
	}

	/**
	 * @dataProvider data_react_fixtures
	 *
	 * @param array|null $fixture Props, content and React's render.
	 */
	public function test_renders_the_same_markup_as_react( $fixture ) {
		$html = gutenberg_get_ui_component( $fixture['component'], $fixture['props'], $fixture['content'] ?? null );

		$this->assertEqualHTML( self::normalize_html( $fixture['html'] ), self::normalize_html( $html ) );
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

	/**
	 * What PHP prints and the props React mounts with read entities the same
	 * way, so the text doesn't change when React takes over.
	 */
	public function test_reads_entities_the_same_in_a_native_fallback_and_react_props() {
		$processor = new WP_HTML_Tag_Processor(
			gutenberg_get_ui_component(
				'searchable-select-control',
				array(
					'label' => 'A &amp; B',
					'name'  => 'a&amp;b',
					'class' => 'is-&amp;',
					'items' => array(
						array(
							'value' => 'c&amp;d',
							'label' => 'C &amp; D',
						),
					),
				)
			)
		);

		$processor->next_tag( 'wp-ui-interactive' );
		$interactive = json_decode( $processor->get_attribute( 'data-interactive' ), true );
		$this->assertSame( 'A & B', $interactive['props']['label'] );
		$this->assertSame( 'C & D', $interactive['props']['items'][0]['label'] );

		$processor->next_tag( 'label' );
		$processor->next_token();
		$this->assertSame( 'A & B', $processor->get_modifiable_text() );

		$processor->next_tag( 'select' );
		$this->assertSame( 'a&b', $processor->get_attribute( 'name' ) );
		$this->assertSame( 'is-&', $processor->get_attribute( 'class' ) );

		$processor->next_tag( 'option' );
		$this->assertSame( 'c&d', $processor->get_attribute( 'value' ) );
		$processor->next_token();
		$this->assertSame( 'C & D', $processor->get_modifiable_text() );
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
		// Earlier tests have rendered components too, and styles aren't reset between tests.
		wp_dequeue_style( 'wp-ui-components' );
		$this->assertFalse( wp_style_is( 'wp-ui-components', 'enqueued' ) );

		gutenberg_get_ui_component( 'button', array(), 'Save' );

		$this->assertTrue( wp_style_is( 'wp-ui-components', 'enqueued' ) );
	}

	/**
	 * Removes what differs between React and PHP and isn't markup: the wrapper
	 * of interactive components, and generated IDs, which are numbered in the
	 * order they appear.
	 *
	 * @param string $html HTML.
	 * @return string HTML.
	 */
	private static function normalize_html( $html ) {
		$html      = preg_replace( '#</?wp-ui-interactive[^>]*>#', '', $html );
		$ids       = array();
		$processor = new WP_HTML_Tag_Processor( $html );

		while ( $processor->next_tag() ) {
			foreach ( array( 'id', 'for', 'aria-controls', 'aria-describedby', 'aria-labelledby' ) as $name ) {
				$value = $processor->get_attribute( $name );
				if ( ! is_string( $value ) ) {
					continue;
				}
				$renumbered = array();
				foreach ( preg_split( '/\s+/', trim( $value ) ) as $id ) {
					$ids[ $id ]   = $ids[ $id ] ?? 'id-' . count( $ids );
					$renumbered[] = $ids[ $id ];
				}
				$processor->set_attribute( $name, implode( ' ', $renumbered ) );
			}
		}

		return $processor->get_updated_html();
	}
}
