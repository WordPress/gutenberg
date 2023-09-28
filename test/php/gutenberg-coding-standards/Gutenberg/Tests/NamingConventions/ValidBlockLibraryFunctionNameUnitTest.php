<?php
/**
 * Unit test class for Gutenberg Coding Standard.
 *
 * @package gutenberg-coding-standards/gbc
 * @link    https://github.com/WordPress/gutenberg
 * @license https://opensource.org/licenses/MIT MIT
 */

namespace GutenbergCS\Gutenberg\Tests\NamingConventions;

use GutenbergCS\Gutenberg\Sniffs\NamingConventions\ValidBlockLibraryFunctionNameSniff;
use PHP_CodeSniffer\Config;
use PHP_CodeSniffer\Tests\Standards\AbstractSniffUnitTest;
use PHP_CodeSniffer\Ruleset;

/**
 * Unit test class for the ValidBlockLibraryFunctionNameSniff sniff.
 */
final class ValidBlockLibraryFunctionNameUnitTest extends AbstractSniffUnitTest {

	/**
	 * Holds the original Ruleset instance.
	 *
	 * @var Ruleset
	 */
	private static $original_ruleset;

	/**
	 * Returns the lines where errors should occur.
	 *
	 * @return array <int line number> => <int number of errors>
	 */
	public function getErrorList() {
		return array(
			8  => 1,
			17 => 1,
			26 => 1,
			35 => 1,
		);
	}

	/**
	 * Returns the lines where warnings should occur.
	 *
	 * @return array <int line number> => <int number of warnings>
	 */
	public function getWarningList() {
		return array();
	}

	/**
	 *
	 * This method resets the 'Gutenberg' ruleset in the $GLOBALS['PHP_CODESNIFFER_RULESETS']
	 * to its original state.
	 */
	public static function tearDownAfterClass() {
		parent::tearDownAfterClass();

		$GLOBALS['PHP_CODESNIFFER_RULESETS']['Gutenberg'] = self::$original_ruleset;
		self::$original_ruleset                           = null;
	}


	/**
	 * Prepares the environment before executing tests. Specifically, sets prefixes for the
	 * ValidBlockLibraryFunctionName sniff.This is needed since AbstractSniffUnitTest class
	 * doesn't apply sniff properties from the Gutenberg/ruleset.xml file.
	 *
	 * @param string $filename The name of the file being tested.
	 * @param Config $config   The config data for the run.
	 *
	 * @return void
	 */
	public function setCliValues( $filename, $config ) {
		parent::setCliValues( $filename, $config );

		if ( ! isset( $GLOBALS['PHP_CODESNIFFER_RULESETS']['Gutenberg'] )
			|| ( ! $GLOBALS['PHP_CODESNIFFER_RULESETS']['Gutenberg'] instanceof Ruleset )
		) {
			throw new \RuntimeException( 'Cannot set ruleset parameters required for this test.' );
		}

		// Backup the original Ruleset instance.
		self::$original_ruleset = $GLOBALS['PHP_CODESNIFFER_RULESETS']['Gutenberg'];

		$current_ruleset                                  = clone self::$original_ruleset;
		$GLOBALS['PHP_CODESNIFFER_RULESETS']['Gutenberg'] = $current_ruleset;

		if ( ! isset( $current_ruleset->sniffs[ ValidBlockLibraryFunctionNameSniff::class ] )
			|| ( ! $current_ruleset->sniffs[ ValidBlockLibraryFunctionNameSniff::class ] instanceof ValidBlockLibraryFunctionNameSniff )
		) {
			throw new \RuntimeException( 'Cannot set ruleset parameters required for this test.' );
		}

		$sniff           = $current_ruleset->sniffs[ ValidBlockLibraryFunctionNameSniff::class ];
		$sniff->prefixes = array(
			'block_core_',
			'render_block_core_',
			'register_block_core_',
		);
	}

	/**
	 * Get a list of all test files to check.
	 *
	 * @param string $testFileBase The base path that the unit tests files will have.
	 *
	 * @return string[]
	 */
	protected function getTestFiles( $testFileBase ) {
		return array(
			__DIR__ . '/../fixtures/block-library/src/my-block/index.inc',
		);
	}
}
