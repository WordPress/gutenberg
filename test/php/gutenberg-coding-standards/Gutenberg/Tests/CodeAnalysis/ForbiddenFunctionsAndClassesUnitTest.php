<?php
/**
 * Unit test class for Gutenberg Coding Standard.
 *
 * @package gutenberg-coding-standards/gbc
 * @link    https://github.com/WordPress/gutenberg/tree/trunk/test/php/gutenberg-coding-standards
 */

namespace GutenbergCS\Gutenberg\Tests\CodeAnalysis;

use GutenbergCS\Gutenberg\Sniffs\CodeAnalysis\ForbiddenFunctionsAndClassesSniff;
use GutenbergCS\Gutenberg\Tests\AbstractSniffUnitTest;
use PHP_CodeSniffer\Sniffs\Sniff;

/**
 * Unit test class for the ForbiddenFunctionsAndClassesSniff sniff.
 */
final class ForbiddenFunctionsAndClassesUnitTest extends AbstractSniffUnitTest {

	/**
	 * Returns the lines where errors should occur.
	 *
	 * @return array <int line number> => <int number of errors>
	 */
	public function getErrorList() {
		return array(
			3  => 1,
			5  => 1,
			7  => 1,
			9  => 1,
			11 => 1,

			16 => 1,
			18 => 1,
			20 => 1,
			22 => 1,
			24 => 1,

			33 => 1,
			35 => 1,
			37 => 1,
			39 => 1,
			41 => 1,

			46 => 1,
			47 => 1,
			65 => 1,
			66 => 1,

			70 => 1,
			71 => 1,
			89 => 1,
			90 => 1,
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
	 * Returns the fully qualified class name (FQCN) of the sniff.
	 *
	 * @return string The fully qualified class name of the sniff.
	 */
	protected function get_sniff_fqcn() {
		return ForbiddenFunctionsAndClassesSniff::class;
	}

	/**
	 * Sets the parameters for the sniff.
	 *
	 * @throws RuntimeException If unable to set the ruleset parameters required for the test.
	 *
	 * @param Sniff $sniff The sniff being tested.
	 */
	public function set_sniff_parameters( Sniff $sniff ) {
		$sniff->forbidden_functions = array(
			'[Gg]utenberg.*',
		);

		$sniff->forbidden_classes = array(
			'[Gg]utenberg.*',
		);
	}
}
