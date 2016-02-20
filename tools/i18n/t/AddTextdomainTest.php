<?php
/**
 * Tests for add-textdomain.php
 *
 * @package wordpress-i18n
 * @subpackage tools
 */
error_reporting( E_ALL );
require_once dirname( dirname( __FILE__ ) ) . '/add-textdomain.php';

class AddTextDomainTest extends PHPUnit_Framework_TestCase {

	function setUp() {
		parent::setUp();
		$this->atd = new AddTextdomain();
	}

	function test_add() {
		// Copy to a new file, so that we don't corrupt the old one.
		copy( 'data/add-textdomain-0.php', 'data/add-textdomain-0-work.php' );
		$this->atd->process_file( 'test-domain', 'data/add-textdomain-0-work.php', true );
		$this->assertEquals( file_get_contents( 'data/add-textdomain-0-result.php' ), file_get_contents( 'data/add-textdomain-0-work.php' ) );
		unlink( 'data/add-textdomain-0-work.php' );
	}

	/**
	 * @dataProvider data_textdomain_sources
	 */
	function test_basic_add_textdomain( $source, $expected ) {
		$tokens = token_get_all( $source );
		$result = $this->atd->process_tokens( 'foo', $tokens );
		$this->assertEquals( $expected, $result );
	}

	function data_textdomain_sources() {
		return array(
			array( "<?php __('string'); ?>", "<?php __('string', 'foo'); ?>" ), // Simple single quotes
			array( '<?php __("string"); ?>', "<?php __(\"string\", 'foo'); ?>" ), // Simple double quotes
			array( "<?php __( 'string' ); ?>", "<?php __( 'string', 'foo' ); ?>" ), // Simple single quotes CS
			array( '<?php __( "string" ); ?>', "<?php __( \"string\", 'foo' ); ?>" ), // Simple double quotes CS
			array( "<?php __( 'string', 'string2' ); ?>", "<?php __( 'string', 'string2', 'foo' ); ?>" ), // Multiple string args
			array( '<?php __( \'string\', $var ); ?>', '<?php __( \'string\', $var, \'foo\' ); ?>' ), // Multiple string / var args
			array( "<?php __( 'string', 'foo' ); ?>", "<?php __( 'string', 'foo' ); ?>" ), // Existing textdomain
		);
	}
}
