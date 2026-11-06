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

		$this->assertEqualHTML( $fixture['html'], $html );
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
}
