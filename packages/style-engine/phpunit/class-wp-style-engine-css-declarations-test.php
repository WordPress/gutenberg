<?php
/**
 * Tests the Style Engine CSS declarations class.
 *
 * @package    Gutenberg
 * @subpackage style-engine
 */

require __DIR__ . '/../class-wp-style-engine-css-declarations.php';

/**
 * Tests for registering, storing and generating CSS declarations.
 */
class WP_Style_Engine_CSS_Declarations_Test extends WP_UnitTestCase {
	/**
	 * Should set declarations on instantiation.
	 */
	public function test_instantiate_with_declarations() {
		$input_declarations = array(
			'margin-top' => '10px',
			'font-size'  => '2rem',
		);
		$css_declarations   = new WP_Style_Engine_CSS_Declarations( $input_declarations );
		$this->assertSame( $input_declarations, $css_declarations->get_declarations() );
	}

	/**
	 * Should add declarations.
	 */
	public function test_add_declarations() {
		$input_declarations = array(
			'padding' => '20px',
			'color'   => 'var(--wp--preset--elbow-patches)',
		);
		$css_declarations   = new WP_Style_Engine_CSS_Declarations();
		$css_declarations->add_declarations( $input_declarations );
		$this->assertSame( $input_declarations, $css_declarations->get_declarations() );
	}

	/**
	 * Should add declarations.
	 */
	public function test_add_a_single_declaration() {
		$input_declarations = array(
			'border-width'     => '1%',
			'background-color' => 'var(--wp--preset--english-mustard)',
		);
		$css_declarations   = new WP_Style_Engine_CSS_Declarations( $input_declarations );
		$extra_declaration  = array(
			'letter-spacing' => '1.5px',
		);
		$css_declarations->add_declarations( $extra_declaration );
		$this->assertSame( array_merge( $input_declarations, $extra_declaration ), $css_declarations->get_declarations() );
	}

	/**
	 * Should sanitize properties before storing.
	 */
	public function test_sanitize_properties() {
		$input_declarations = array(
			'^--wp--style--sleepy-potato$' => '40px',
			'<background-//color>'         => 'var(--wp--preset--english-mustard)',
		);
		$css_declarations   = new WP_Style_Engine_CSS_Declarations( $input_declarations );

		$this->assertSame(
			array(
				'--wp--style--sleepy-potato' => '40px',
				'background-color'           => 'var(--wp--preset--english-mustard)',
			),
			$css_declarations->get_declarations()
		);
	}

	/**
	 * Should compile css declarations into a css declarations block string.
	 */
	public function test_generate_css_declarations_string() {
		$input_declarations = array(
			'color'                  => 'red',
			'border-top-left-radius' => '99px',
			'text-decoration'        => 'underline',
		);
		$css_declarations   = new WP_Style_Engine_CSS_Declarations( $input_declarations );

		$this->assertSame(
			'color:red;border-top-left-radius:99px;text-decoration:underline;',
			$css_declarations->get_declarations_string()
		);
	}

	/**
	 * Should compile css declarations into a prettified css declarations block string.
	 */
	public function test_generate_prettified_css_declarations_string() {
		$input_declarations = array(
			'color'                  => 'red',
			'border-top-left-radius' => '99px',
			'text-decoration'        => 'underline',
		);
		$css_declarations   = new WP_Style_Engine_CSS_Declarations( $input_declarations );

		$this->assertSame(
			'color: red; border-top-left-radius: 99px; text-decoration: underline;',
			$css_declarations->get_declarations_string( true )
		);
	}

	/**
	 * Should compile css declarations into a prettified and indented css declarations block string.
	 */
	public function test_generate_prettified_with_indent_css_declarations_string() {
		$input_declarations = array(
			'color'                  => 'red',
			'border-top-left-radius' => '99px',
			'text-decoration'        => 'underline',
		);
		$css_declarations   = new WP_Style_Engine_CSS_Declarations( $input_declarations );

		$this->assertSame(
			'	color: red;
	border-top-left-radius: 99px;
	text-decoration: underline;',
			$css_declarations->get_declarations_string( true, 1 )
		);
	}

	/**
	 * Should compile css declarations into a css declarations block string.
	 */
	public function test_generate_prettified_with_more_indents_css_declarations_string() {
		$input_declarations = array(
			'color'                  => 'red',
			'border-top-left-radius' => '99px',
			'text-decoration'        => 'underline',
		);
		$css_declarations   = new WP_Style_Engine_CSS_Declarations( $input_declarations );

		$this->assertSame(
			'		color: red;
		border-top-left-radius: 99px;
		text-decoration: underline;',
			$css_declarations->get_declarations_string( true, 2 )
		);
	}

	/**
	 * Should escape values and run the CSS through safecss_filter_attr.
	 */
	public function test_remove_unsafe_properties_and_values() {
		$input_declarations = array(
			'color'        => 'url("https://wordpress.org")',
			'margin-right' => '10em',
			'potato'       => 'uppercase',
		);
		$css_declarations   = new WP_Style_Engine_CSS_Declarations( $input_declarations );

		$this->assertSame(
			'margin-right:10em;',
			$css_declarations->get_declarations_string()
		);
	}

	/**
	 * Should allow calc, clamp, min, max, and minmax CSS functions.
	 */
	public function test_allow_particular_css_functions() {
		$input_declarations = array(
			'background'       => 'var(--wp--preset--color--primary, 10px)', // Simple var().
			'font-size'        => 'clamp(36.00rem, calc(32.00rem + 10.00vw), 40.00rem)', // Nested clamp().
			'width'            => 'min(150vw, 100px)',
			'min-width'        => 'max(150vw, 100px)',
			'max-width'        => 'minmax(400px, 50%)',
			'padding'          => 'calc(80px * -1)',
			'background-image' => 'url("https://wordpress.org")',
			'line-height'      => 'url("https://wordpress.org")',
			'margin'           => 'illegalfunction(30px)',
		);
		$css_declarations   = new WP_Style_Engine_CSS_Declarations( $input_declarations );

		$this->assertSame(
			'background:var(--wp--preset--color--primary, 10px);font-size:clamp(36.00rem, calc(32.00rem + 10.00vw), 40.00rem);width:min(150vw, 100px);min-width:max(150vw, 100px);max-width:minmax(400px, 50%);padding:calc(80px * -1);background-image:url("https://wordpress.org");',
			$css_declarations->get_declarations_string()
		);
	}

	/**
	 * Should remove a declaration
	 */
	public function test_remove_declaration() {
		$input_declarations = array(
			'color'       => 'tomato',
			'margin'      => '10em 10em 20em 1px',
			'font-family' => 'Happy Font serif',
		);
		$css_declarations   = new WP_Style_Engine_CSS_Declarations( $input_declarations );

		$this->assertSame(
			'color:tomato;margin:10em 10em 20em 1px;font-family:Happy Font serif;',
			$css_declarations->get_declarations_string()
		);

		$css_declarations->remove_declaration( 'color' );
		$this->assertSame(
			'margin:10em 10em 20em 1px;font-family:Happy Font serif;',
			$css_declarations->get_declarations_string()
		);
	}

	/**
	 * Should remove declarations
	 */
	public function test_remove_declarations() {
		$input_declarations = array(
			'color'       => 'cucumber',
			'margin'      => '10em 10em 20em 1px',
			'font-family' => 'Happy Font serif',
		);
		$css_declarations   = new WP_Style_Engine_CSS_Declarations( $input_declarations );

		$this->assertSame(
			'color:cucumber;margin:10em 10em 20em 1px;font-family:Happy Font serif;',
			$css_declarations->get_declarations_string()
		);

		$css_declarations->remove_declarations( array( 'color', 'margin' ) );
		$this->assertSame(
			'font-family:Happy Font serif;',
			$css_declarations->get_declarations_string()
		);
	}
}
