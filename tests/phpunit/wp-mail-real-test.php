<?php
/**
 * wp-mail-real-test.php
 *
 * Test script for wp_mail with real addresses.
 */

// parse options
$options = 'v:r:d';
if (is_callable('getopt')) {
	$opts = getopt($options);
} else {
	include( dirname(__FILE__) . '/wp-testlib/getopt.php' );
	$opts = getoptParser::getopt($options);
}

define('DIR_TESTROOT', realpath(dirname(__FILE__)));

define('TEST_WP', true);
define('WP_DEBUG', array_key_exists('d', $opts) );

if (!empty($opts['r']))
	define('DIR_WP', realpath($opts['r']));
else
	if (!empty($opts['v']))
		define('DIR_WP', DIR_TESTROOT.'/wordpress-'.$opts['v']);
	else
		define('DIR_WP', DIR_TESTROOT.'/wordpress');

// make sure all useful errors are displayed during setup
error_reporting(E_ALL & ~E_DEPRECATED);
ini_set('display_errors', true);

require_once(DIR_TESTROOT.'/wp-testlib/utils.php');

// configure wp
require_once(DIR_TESTROOT.'/wp-config.php');
define('ABSPATH', realpath(DIR_WP).'/');

// install wp
define('WP_BLOG_TITLE', rand_str());
define('WP_USER_NAME', rand_str());
define('WP_USER_EMAIL', rand_str().'@example.com');

// initialize wp
define('WP_INSTALLING', 1);
$_SERVER['PATH_INFO'] = $_SERVER['SCRIPT_NAME']; // prevent a warning from some sloppy code in wp-settings.php
require_once(ABSPATH.'wp-settings.php');

drop_tables();

require_once(ABSPATH.'wp-admin/includes/upgrade.php');
wp_install(WP_BLOG_TITLE, WP_USER_NAME, WP_USER_EMAIL, true);

// make sure we're installed
assert(true == is_blog_installed());

define('PHPUnit_MAIN_METHOD', false);
$original_wpdb = $GLOBALS['wpdb'];

// hide warnings during testing, since that's the normal WP behaviour
if ( !WP_DEBUG ) {
	error_reporting(E_ALL ^ E_NOTICE);
}

$to = "To <wp.mail.testing@gmail.com>";
$from = "From <wp.mail.testing+from@gmail.com>";
$cc = "CC <wp.mail.testing+cc@gmail.com>";
$bcc = "BCC <wp.mail.testing+bcc@gmail.com>";
$subject = "RFC2822 Testing";
$message = "My RFC822 Test Message";
$headers[] = "From: {$from}";
$headers[] = "CC: {$cc}";

$_SERVER['SERVER_NAME'] = 'example.com';
wp_mail( $to, $subject, $message, $headers );

$headers = array();
$subject = "RFC2822 Testing 2";
$message = "My RFC822 Test Message 2";
$to = "To <wp.mail.testing+to@gmail.com>";
$headers[] = "BCC: {$bcc}";
wp_mail( '', $subject, $message, $headers );
echo "Test emails sent!\n"
?>