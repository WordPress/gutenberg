<?php
/**
 * Unit tests covering WP_HTML_Tag_Processor functionality.
 *
 * @package WordPress
 * @subpackage HTML
 */

if ( ! function_exists( 'esc_attr' ) ) {
	function esc_attr( $s ) {
		return str_replace( '"', '&quot;', $s );
	}
}

if ( ! class_exists( 'WP_UnitTestCase' ) ) {
	abstract class WP_UnitTestCase extends \PHPUnit\Framework\TestCase {}
}

require_once __DIR__ . '/../../lib/experimental/html/index.php';

/**
 * Runs tests in isolated PHP process for verifying behaviors
 * that depend on the `WP_DEBUG` constant value, if set.
 *
 * @group html
 *
 * @coversDefaultClass WP_HTML_Tag_Processor
 */
class WP_HTML_Tag_Processor_Isolated_Test extends WP_UnitTestCase {
	// phpcs:disable WordPress.NamingConventions.ValidVariableName.PropertyNotSnakeCase
	protected $runTestInSeparateProcess = true;

	/**
	 * Attribute names with invalid characters should be rejected.
	 *
	 * When WP_DEBUG is set we want to throw an error to alert a
	 * developer that they are sending invalid attribute names.
	 *
	 * @dataProvider data_invalid_attribute_names
	 * @covers set_attribute
	 */
	public function test_set_attribute_throw_when_given_invalid_attribute_names_in_debug_mode( $attribute_name ) {
		define( 'WP_DEBUG', true );
		$p = new WP_HTML_Tag_Processor( '<span></span>' );

		$this->expectException( Exception::class );

		$p->next_tag();
		$p->set_attribute( $attribute_name, 'test' );

		$this->assertEquals( '<span></span>', (string) $p );
	}

	/**
	 * Attribute names with invalid characters should be rejected.
	 *
	 * When WP_DEBUG isn't set we want to quietly fail to set the
	 * invalid attribute to avoid breaking the HTML and to do so
	 * without breaking the entire page.
	 *
	 * @dataProvider data_invalid_attribute_names
	 * @covers set_attribute
	 */
	public function test_set_attribute_silently_fails_when_given_invalid_attribute_names_outside_of_debug_mode( $attribute_name ) {
		$p = new WP_HTML_Tag_Processor( '<span></span>' );

		$p->next_tag();
		$p->set_attribute( $attribute_name, 'test' );

		$this->assertEquals( '<span></span>', (string) $p );
	}

	/**
	 * Data provider with invalid HTML attribute names.
	 *
	 * @return array {
	 *     @type string $attribute_name Text considered invalid for HTML attribute names.
	 * }
	 */
	public function data_invalid_attribute_names() {
		return array(
			'controls_null'    => array( "i\x00d" ),
			'controls_newline' => array( "\nbroken-expectations" ),
			'space'            => array( 'aria label' ),
			'double-quote'     => array( '"id"' ),
			'single-quote'     => array( "'id'" ),
			'greater-than'     => array( 'sneaky>script' ),
			'solidus'          => array( 'data/test-id' ),
			'equals'           => array( 'checked=checked' ),
			'noncharacters_1'  => array( html_entity_decode( 'anything&#xFDD0;' ) ),
			'noncharacters_2'  => array( html_entity_decode( 'te&#xFFFF;st' ) ),
			'noncharacters_3'  => array( html_entity_decode( 'te&#x2FFFE;st' ) ),
			'noncharacters_4'  => array( html_entity_decode( 'te&#xDFFFF;st' ) ),
			'noncharacters_5'  => array( html_entity_decode( '&#x10FFFE;' ) ),
			'wp_no_lt'         => array( 'id<script' ),
			'wp_no_amp'        => array( 'class&lt;script' ),
		);
	}

	/**
	 * Attribute names with only valid characters should not be rejected.
	 *
	 * > Attributes have a name and a value. Attribute names must
	 * > consist of one or more characters other than controls,
	 * > U+0020 SPACE, U+0022 ("), U+0027 ('), U+003E (>),
	 * > U+002F (/), U+003D (=), and noncharacters.
	 *
	 * @see https://html.spec.whatwg.org/#attributes-2
	 *
	 * @dataProvider data_valid_attribute_names
	 * @covers set_attribute
	 */
	public function test_set_attribute_does_not_reject_valid_attribute_names( $attribute_name ) {
		define( 'WP_DEBUG', true );
		$p = new WP_HTML_Tag_Processor( '<span></span>' );

		$p->next_tag();
		$p->set_attribute( $attribute_name, 'test' );

		$this->assertEquals( "<span $attribute_name=\"test\"></span>", (string) $p );
	}

	/**
	 * Data provider with valid HTML attribute names.
	 *
	 * @return array {
	 *     @type string $attribute_name Text considered valid for HTML attribute names.
	 * }
	 */
	public function data_valid_attribute_names() {
		return array(
			'ascii_letters'         => array( 'abcdefghijklmnopqrstuwxyzABCDEFGHIJKLMNOPQRSTUWXYZ' ),
			'ascii_numbers'         => array( '0123456789' ),
			'symbols'               => array( '!@#$%^*()[]{};:\\||,.?`~£§±' ),
			'emoji'                 => array( '❌' ),
			'utf8_diacritics'       => array( 'ÁÄÂÀÃÅČÇĆĎÉĚËÈÊẼĔȆĞÍÌÎÏİŇÑÓÖÒÔÕØŘŔŠŞŤÚŮÜÙÛÝŸŽáäâàãåčçćďéěëèêẽĕȇğíìîïıňñóöòôõøðřŕšşťúůüùûýÿžþÞĐđßÆa' ),
			'hebrew_accents'        => array( html_entity_decode( '&#x059D;a' ) ),
			// See https://arxiv.org/abs/2111.00169.
			'rtl_magic'             => array( html_entity_decode( '&#x2067;&#x2066;abc&#x2069;&#x2066;def&#x2069;&#x2069;' ) ),
			// Only a single unicode "noncharacter" should be rejected. Specific byte segments used in the "noncharacter" sequence are valid.
			'noncharacter_segments' => array( "\xFF\xFE" ),
		);
	}

}
