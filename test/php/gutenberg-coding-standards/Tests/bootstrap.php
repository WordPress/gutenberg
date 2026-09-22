<?php
/**
 * Gutenberg Coding Standards (GBCS) Bootstrap File.
 *
 * Initializes the environment for running GBCS tests.
 *
 * @package gutenberg/gutenberg-coding-standards
 * @link    https://github.com/WordPress/gutenberg/tree/trunk/test/php/gutenberg-coding-standards
 */

if ( ! defined( 'PHP_CODESNIFFER_IN_TESTS' ) ) {
	define( 'PHP_CODESNIFFER_IN_TESTS', true );
}

$dir_separator = DIRECTORY_SEPARATOR;

// Define the path to the PHPCS directory.
$phpcs_path            = dirname( __DIR__ ) . $dir_separator . 'vendor' . $dir_separator . 'squizlabs' . $dir_separator . 'php_codesniffer';
$autoload_script_path  = $phpcs_path . $dir_separator . 'autoload.php';
$bootstrap_script_path = $phpcs_path . $dir_separator . 'tests' . $dir_separator . 'bootstrap.php';

// Attempt to load the PHPCS autoloader.
if ( ! file_exists( $autoload_script_path ) || ! file_exists( $bootstrap_script_path ) ) {
	echo 'PHP_CodeSniffer not found. Please run "composer install".' . PHP_EOL;
	exit( 1 );
}

require_once $autoload_script_path;
require_once $bootstrap_script_path; // Support for PHPUnit 6.x+.

/**
 * Configure the environment to ignore tests from other coding standards.
 */
$available_standards = PHP_CodeSniffer\Util\Standards::getInstalledStandards();
$ignored_standards   = array( 'Generic' );

foreach ( $available_standards as $available_standard ) {
	if ( 'Gutenberg' === $available_standard ) {
		continue;
	}

	$ignored_standards[] = $available_standard;
}

$ignore_standards_string = implode( ',', $ignored_standards );

// phpcs:ignore WordPress.PHP.DiscouragedPHPFunctions.runtime_configuration_putenv -- This is non-production code.
putenv( "PHPCS_IGNORE_TESTS={$ignore_standards_string}" );

// Cleanup.
unset( $dir_separator, $phpcs_path, $available_standards, $ignored_standards, $available_standard, $ignore_standards_string );
