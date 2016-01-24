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

	function __construct() {
		$this->atd = new AddTextdomain;
	}

	function test_add() {
		# copy to a new file, so that we don't corrupt the old one
		copy( 'data/add-textdomain-0.php', 'data/add-textdomain-0-work.php' );
		$this->atd->process_file( 'test-domain', 'data/add-textdomain-0-work.php', true );
		$this->assertEquals( file_get_contents( 'data/add-textdomain-0-result.php' ), file_get_contents( 'data/add-textdomain-0-work.php' ) );
		unlink( 'data/add-textdomain-0-work.php' );
	}
}
