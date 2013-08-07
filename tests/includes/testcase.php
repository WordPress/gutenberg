<?php

require_once dirname( __FILE__ ) . '/factory.php';
require_once dirname( __FILE__ ) . '/trac.php';

class WP_UnitTestCase extends PHPUnit_Framework_TestCase {

	protected static $forced_tickets = array();

	/**
	 * @var WP_UnitTest_Factory
	 */
	protected $factory;

	function setUp() {
		set_time_limit(0);

		global $wpdb;
		$wpdb->suppress_errors = false;
		$wpdb->show_errors = true;
		$wpdb->db_connect();
		ini_set('display_errors', 1 );
		$this->factory = new WP_UnitTest_Factory;
		$this->clean_up_global_scope();
		$this->start_transaction();
		add_filter( 'wp_die_handler', array( $this, 'get_wp_die_handler' ) );
	}

	function tearDown() {
		global $wpdb;
		$wpdb->query( 'ROLLBACK' );
		remove_filter( 'dbdelta_create_queries', array( $this, '_create_temporary_tables' ) );
		remove_filter( 'query', array( $this, '_drop_temporary_tables' ) );
		remove_filter( 'wp_die_handler', array( $this, 'get_wp_die_handler' ) );
	}

	function clean_up_global_scope() {
		$_GET = array();
		$_POST = array();
		$this->flush_cache();
	}

	function flush_cache() {
		global $wp_object_cache;
		$wp_object_cache->group_ops = array();
		$wp_object_cache->stats = array();
		$wp_object_cache->memcache_debug = array();
		$wp_object_cache->cache = array();
		if ( method_exists( $wp_object_cache, '__remoteset' ) ) {
			$wp_object_cache->__remoteset();
		}
		wp_cache_flush();
		wp_cache_add_global_groups( array( 'users', 'userlogins', 'usermeta', 'user_meta', 'site-transient', 'site-options', 'site-lookup', 'blog-lookup', 'blog-details', 'rss', 'global-posts', 'blog-id-cache' ) );
		wp_cache_add_non_persistent_groups( array( 'comment', 'counts', 'plugins' ) );
	}

	function start_transaction() {
		global $wpdb;
		$wpdb->query( 'SET autocommit = 0;' );
		$wpdb->query( 'START TRANSACTION;' );
		add_filter( 'dbdelta_create_queries', array( $this, '_create_temporary_tables' ) );
		add_filter( 'query', array( $this, '_drop_temporary_tables' ) );
	}

	function _create_temporary_tables( $queries ) {
		return str_replace( 'CREATE TABLE', 'CREATE TEMPORARY TABLE', $queries );
	}

	function _drop_temporary_tables( $query ) {
		if ( 'DROP TABLE' === substr( $query, 0, 10 ) )
			return 'DROP TEMPORARY TABLE ' . substr( $query, 10 );
		return $query;
	}

	function get_wp_die_handler( $handler ) {
		return array( $this, 'wp_die_handler' );
	}

	function wp_die_handler( $message ) {
		throw new WPDieException( $message );
	}

	function assertWPError( $actual, $message = '' ) {
		$this->assertInstanceOf( 'WP_Error', $actual, $message );
	}

	function assertEqualFields( $object, $fields ) {
		foreach( $fields as $field_name => $field_value ) {
			if ( $object->$field_name != $field_value ) {
				$this->fail();
			}
		}
	}

	function assertDiscardWhitespace( $expected, $actual ) {
		$this->assertEquals( preg_replace( '/\s*/', '', $expected ), preg_replace( '/\s*/', '', $actual ) );
	}

	function assertEqualSets( $expected, $actual ) {
		$this->assertEquals( array(), array_diff( $expected, $actual ) );
		$this->assertEquals( array(), array_diff( $actual, $expected ) );
	}

	function go_to( $url ) {
		// note: the WP and WP_Query classes like to silently fetch parameters
		// from all over the place (globals, GET, etc), which makes it tricky
		// to run them more than once without very carefully clearing everything
		$_GET = $_POST = array();
		foreach (array('query_string', 'id', 'postdata', 'authordata', 'day', 'currentmonth', 'page', 'pages', 'multipage', 'more', 'numpages', 'pagenow') as $v) {
			if ( isset( $GLOBALS[$v] ) ) unset( $GLOBALS[$v] );
		}
		$parts = parse_url($url);
		if (isset($parts['scheme'])) {
			$req = $parts['path'];
			if (isset($parts['query'])) {
				$req .= '?' . $parts['query'];
				// parse the url query vars into $_GET
				parse_str($parts['query'], $_GET);
			}
		} else {
			$req = $url;
		}
		if ( ! isset( $parts['query'] ) ) {
			$parts['query'] = '';
		}

		$_SERVER['REQUEST_URI'] = $req;
		unset($_SERVER['PATH_INFO']);

		$this->flush_cache();
		unset($GLOBALS['wp_query'], $GLOBALS['wp_the_query']);
		$GLOBALS['wp_the_query'] =& new WP_Query();
		$GLOBALS['wp_query'] =& $GLOBALS['wp_the_query'];
		$GLOBALS['wp'] =& new WP();

		// clean out globals to stop them polluting wp and wp_query
		foreach ($GLOBALS['wp']->public_query_vars as $v) {
			unset($GLOBALS[$v]);
		}
		foreach ($GLOBALS['wp']->private_query_vars as $v) {
			unset($GLOBALS[$v]);
		}

		$GLOBALS['wp']->main($parts['query']);
	}

	protected function checkRequirements() {
		parent::checkRequirements();
		if ( WP_TESTS_FORCE_KNOWN_BUGS )
			return;
		$tickets = PHPUnit_Util_Test::getTickets( get_class( $this ), $this->getName( false ) );
		foreach ( $tickets as $ticket ) {
			if ( is_numeric( $ticket ) ) {
				$this->knownWPBug( $ticket );
			} elseif ( 'UT' == substr( $ticket, 0, 2 ) ) {
				$ticket = substr( $ticket, 2 );
				if ( $ticket && is_numeric( $ticket ) )
					$this->knownUTBug( $ticket );
			} elseif ( 'Plugin' == substr( $ticket, 0, 6 ) ) {
				$ticket = substr( $ticket, 6 );
				if ( $ticket && is_numeric( $ticket ) )
					$this->knownPluginBug( $ticket );
			}
		}
	}

	/**
	 * Skips the current test if there is an open WordPress ticket with id $ticket_id
	 */
	function knownWPBug( $ticket_id ) {
		if ( WP_TESTS_FORCE_KNOWN_BUGS || in_array( $ticket_id, self::$forced_tickets ) )
			return;
		if ( ! TracTickets::isTracTicketClosed( 'http://core.trac.wordpress.org', $ticket_id ) )
			$this->markTestSkipped( sprintf( 'WordPress Ticket #%d is not fixed', $ticket_id ) );
	}

	/**
	 * Skips the current test if there is an open unit tests ticket with id $ticket_id
	 */
	function knownUTBug( $ticket_id ) {
		if ( WP_TESTS_FORCE_KNOWN_BUGS || in_array( 'UT' . $ticket_id, self::$forced_tickets ) )
			return;
		if ( ! TracTickets::isTracTicketClosed( 'http://unit-tests.trac.wordpress.org', $ticket_id ) )
			$this->markTestSkipped( sprintf( 'Unit Tests Ticket #%d is not fixed', $ticket_id ) );
	}

	/**
	 * Skips the current test if there is an open plugin ticket with id $ticket_id
	 */
	function knownPluginBug( $ticket_id ) {
		if ( WP_TESTS_FORCE_KNOWN_BUGS || in_array( 'Plugin' . $ticket_id, self::$forced_tickets ) )
			return;
		if ( ! TracTickets::isTracTicketClosed( 'http://plugins.trac.wordpress.org', $ticket_id ) )
			$this->markTestSkipped( sprintf( 'WordPress Plugin Ticket #%d is not fixed', $ticket_id ) );
	}

	public static function forceTicket( $ticket ) {
		self::$forced_tickets[] = $ticket;
	}

	/**
	 * Define constants after including files.
	 */
	function prepareTemplate( $template ) {
		$template->setVar( array( 'constants' => '' ) );
		$template->setVar( array( 'wp_constants' => PHPUnit_Util_GlobalState::getConstantsAsString() ) );
		parent::prepareTemplate( $template );
	}

	/**
	 * Returns the name of a temporary file
	 */
	function temp_filename() {
		$tmp_dir = '';
		$dirs = array( 'TMP', 'TMPDIR', 'TEMP' );
		foreach( $dirs as $dir )
			if ( isset( $_ENV[$dir] ) && !empty( $_ENV[$dir] ) ) {
				$tmp_dir = $dir;
				break;
			}
		if ( empty( $tmp_dir ) ) {
			$tmp_dir = '/tmp';
		}
		$tmp_dir = realpath( $dir );
		return tempnam( $tmp_dir, 'wpunit' );
	}
}
