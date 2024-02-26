<?php
/**
 * Gutenberg Coding Standard.
 *
 * Bootstrap file for running the tests.
 *
 * - Load the PHPCS PHPUnit bootstrap file providing cross-version PHPUnit support.
 *   {@link https://github.com/squizlabs/PHP_CodeSniffer/pull/1384}
 * - Load the Composer autoload file.
 * - Automatically limit the testing to the WordPressCS tests.
 *
 * @package gutenberg/gutenberg-coding-standards
 * @link    https://github.com/WordPress/gutenberg
 * @license https://opensource.org/licenses/MIT MIT
 */

if ( ! defined( 'PHP_CODESNIFFER_IN_TESTS' ) ) {
	define( 'PHP_CODESNIFFER_IN_TESTS', true );
}

$ds = DIRECTORY_SEPARATOR;

/*
 * Load the necessary PHPCS files.
 */
// Get the PHPCS dir from an environment variable.
$phpcsDir          = getenv( 'PHPCS_DIR' );
$composerPHPCSPath = dirname( __DIR__ ) . $ds . 'vendor' . $ds . 'squizlabs' . $ds . 'php_codesniffer';

if ( false === $phpcsDir && is_dir( $composerPHPCSPath ) ) {
	// PHPCS installed via Composer.
	$phpcsDir = $composerPHPCSPath;
} elseif ( false !== $phpcsDir ) {
	/*
	 * PHPCS in a custom directory.
	 * For this to work, the `PHPCS_DIR` needs to be set in a custom `phpunit.xml` file.
	 */
	$phpcsDir = realpath( $phpcsDir );
}

// Try and load the PHPCS autoloader.
if ( false !== $phpcsDir
	&& file_exists( $phpcsDir . $ds . 'autoload.php' )
	&& file_exists( $phpcsDir . $ds . 'tests' . $ds . 'bootstrap.php' )
) {
	require_once $phpcsDir . $ds . 'autoload.php';
	require_once $phpcsDir . $ds . 'tests' . $ds . 'bootstrap.php'; // PHPUnit 6.x+ support.
} else {
	echo 'Uh oh... can\'t find PHPCS.

If you use Composer, please run `composer install`.
Otherwise, make sure you set a `PHPCS_DIR` environment variable in your phpunit.xml file
pointing to the PHPCS directory and that PHPCSUtils is included in the `installed_paths`
for that PHPCS install.
';

	die( 1 );
}


/*
 * Set the PHPCS_IGNORE_TEST environment variable to ignore tests from other standards.
 */
$gbcsStandards = array(
	'Gutenberg' => true,
);

$allStandards   = PHP_CodeSniffer\Util\Standards::getInstalledStandards();
$allStandards[] = 'Generic';

$standardsToIgnore = array();
foreach ( $allStandards as $standard ) {
	if ( isset( $gbcsStandards[ $standard ] ) === true ) {
		continue;
	}

	$standardsToIgnore[] = $standard;
}

$standardsToIgnoreString = implode( ',', $standardsToIgnore );

// phpcs:ignore WordPress.PHP.DiscouragedPHPFunctions.runtime_configuration_putenv -- This is not production, but test code.
putenv( "PHPCS_IGNORE_TESTS={$standardsToIgnoreString}" );

// Clean up.
unset( $ds, $phpcsDir, $composerPHPCSPath, $allStandards, $standardsToIgnore, $standard, $standardsToIgnoreString );
