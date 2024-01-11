<?php
/**
 * Unit test class for Gutenberg Coding Standard.
 *
 * @package gutenberg-coding-standards/gbc
 * @link    https://github.com/WordPress/gutenberg
 * @license https://opensource.org/licenses/MIT MIT
 */

namespace GutenbergCS\Gutenberg\Tests\CodeAnalysis;

use GutenbergCS\Gutenberg\Sniffs\CodeAnalysis\RestrictedFunctionsAndClassesSniff;
use PHP_CodeSniffer\Config;
use PHP_CodeSniffer\Tests\Standards\AbstractSniffUnitTest;
use PHP_CodeSniffer\Ruleset;

/**
 * Unit test class for the GuardedFunctionAndClassNames sniff.
 */
final class RestrictedFunctionsAndClassesUnitTest extends AbstractSniffUnitTest {

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
			3 => 1,
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

		if ( ! isset( $current_ruleset->sniffs[ RestrictedFunctionsAndClassesSniff::class ] )
		     || ( ! $current_ruleset->sniffs[ RestrictedFunctionsAndClassesSniff::class ] instanceof RestrictedFunctionsAndClassesSniff )
		) {
			throw new \RuntimeException( 'Cannot set ruleset parameters required for this test.' );
		}

		$sniff           = $current_ruleset->sniffs[ RestrictedFunctionsAndClassesSniff::class ];
		$sniff->restricted_functions = array(
			'(G|g)utenberg.*',
		);

		$sniff->restricted_classes = array(
			'(G|g)utenberg.*',
		);
	}
}
