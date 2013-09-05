<?php
/**
 * Tests for not-gettexted.php
 *
 * @package wordpress-i18n
 * @subpackage tools
 */
error_reporting( E_ALL );
require_once dirname( dirname( __FILE__ ) ) . '/not-gettexted.php';

class NotGettextedTest extends PHPUnit_Framework_TestCase {

	function __construct() {
		$this->ng = new NotGettexted;
	}

	function test_make_string_aggregator() {
		global $baba;
		$f = $this->ng->make_string_aggregator( 'baba', 'baba.php' );
		call_user_func( $f, 'x', 'y', 'z' );
		call_user_func( $f, 'a', 'b', 'c' );
		$this->assertEquals( array( array( 'x', 'y', 'baba.php', 'z'), array( 'a', 'b', 'baba.php', 'c' ) ), $baba );
	}

	function test_walk() {
		$code = '
<?php
	$s = 8;
echo /* WP_I18N_GUGU*/ 	"yes" /* /WP_I18N_UGU		*/;
	if ($x == "18181") { wp_die(sprintf(/*WP_I18N_DIE*/\'We died %d times!\'/*WP_I18N_DIE*/)); }
?>';
		$tokens = token_get_all($code);
		$this->assertEquals( '', $this->ng->walk_tokens( $tokens, array($this->ng, 'ignore_token'), array($this->ng, 'ignore_token') ) );
		$this->assertEquals( '"yes"\'We died %d times!\'', $this->ng->walk_tokens( $tokens, array($this->ng, 'unchanged_token'), array($this->ng, 'ignore_token') ) );
		$this->assertEquals( $code, $this->ng->walk_tokens( $tokens, array($this->ng, 'unchanged_token'), array($this->ng, 'unchanged_token') ) );
		$this->assertEquals( $code, $this->ng->walk_tokens( $tokens, array($this->ng, 'unchanged_token'), array($this->ng, 'unchanged_token') ) );
	}

	function test_replace() {
		# copy to a new file, so that we don't corrupt the old one
		copy( 'data/not-gettexted-0.php', 'data/not-gettexted-0-work.php' );
		$this->ng->command_replace( 'data/not-gettexted-0.mo', 'data/not-gettexted-0-work.php' );
		$this->assertEquals( file_get_contents( 'data/not-gettexted-0-result.php' ), file_get_contents( 'data/not-gettexted-0-work.php' ) );
		unlink( 'data/not-gettexted-0-work.php' );
	}
}
