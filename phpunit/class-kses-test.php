<?php
/**
 * Tests that serialized HTML is not altered by KSES.
 *
 * @package Gutenberg
 */

require_once dirname( __FILE__ ) . '/../lib/kses.php';

class KSES_Test extends WP_UnitTestCase {
	protected static $fixtures_dir;

	/**
	 * Generates a normalized array of tag names and attributes.
	 * Takes into account how kses alters CSS.
	 *
	 * @param string $html HTML.
	 * @return array Normalized list of tags and attributes.
	 */
	function get_normalized_dom( $html ) {
		$normalized = array();
		$document   = new DOMDocument();
		libxml_use_internal_errors( true ); // Avoid errors with HTML5 elements.
		$document->loadHTML( $html );
		$node_list = $document->getElementsByTagName( '*' );
		foreach ( $node_list as $node ) {
			$node_repr = array(
				'tag_name'    => $node->tagName,
				'attributes' => array(),
			);
			foreach ( $node->attributes as $attr ) {
				$name  = $attr->name;
				$value = $attr->value;

				// Normalise css.
				if ( 'style' === $name && ';' === substr( $value, -1 ) ) {
					$value = substr( $value, 0, -1 );
				}

				$node_repr['attributes'][ $name ] = $value;
			}
			$normalized[] = $node_repr;
		}
		libxml_clear_errors();
		return $normalized;
	}

	function assert_html_is_equivalent( $expected_html, $actual_html, $message ) {
		$expected = $this->get_normalized_dom( $expected_html );
		$actual   = $this->get_normalized_dom( $actual_html );
		$this->assertEquals( $expected, $actual, $message );
	}

	function kses_test_filenames() {
		self::$fixtures_dir = dirname( dirname( __FILE__ ) ) . '/test/integration/full-content/fixtures';

		// Exclude fixtures that would require admin to save,
		// and so wouldn't go through kses.
		$fixture_files = array_filter(
			glob( self::$fixtures_dir . '/*.serialized.html' ),
			array( $this, 'is_saved_through_kses' )
		);

		return array_map(
			array( $this, 'filename_to_args' ),
			$fixture_files
		);
	}

	function is_saved_through_kses( $filename ) {
		$admin_only = array(
			// Freeform HTML.
			'core__html.serialized.html',
			// Currently broken for non-admin users, https://github.com/WordPress/gutenberg/issues/2539 .
			'core__cover-image.serialized.html',
		);

		foreach ( $admin_only as $excluded ) {
			if ( substr( $filename, -strlen( $excluded ) ) === $excluded ) {
				return false;
			}
		}

		return true;
	}

	function filename_to_args( $filename ) {
		return array( $filename );
	}

	function strip_r( $input ) {
		return str_replace( "\r", '', $input );
	}

	/**
	 * @dataProvider kses_test_filenames
	 */
	function test_kses_does_not_alter_output( $html_path ) {
		$html      = self::strip_r( file_get_contents( $html_path ) );
		$kses_html = wp_unslash( wp_filter_post_kses( $html ) );

		$this->assert_html_is_equivalent(
			$html,
			$kses_html,
			"File '$html_path' was altered by kses"
		);
	}
}
