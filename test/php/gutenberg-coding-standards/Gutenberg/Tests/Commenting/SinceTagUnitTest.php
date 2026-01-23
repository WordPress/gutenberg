<?php
/**
 * Unit test class for Gutenberg Coding Standard.
 *
 * @package gutenberg-coding-standards/gbc
 * @link    https://github.com/WordPress/gutenberg/tree/trunk/test/php/gutenberg-coding-standards
 */

namespace GutenbergCS\Gutenberg\Tests\Commenting;

use GutenbergCS\Gutenberg\Sniffs\Commenting\SinceTagSniff;
use GutenbergCS\Gutenberg\Tests\AbstractSniffUnitTest;
use PHP_CodeSniffer\Sniffs\Sniff;

/**
 * Unit test class for the SinceTagSniff sniff.
 */
final class SinceTagUnitTest extends AbstractSniffUnitTest {

	/**
	 * Returns the lines where errors should occur.
	 *
	 * @return array <int line number> => <int number of errors>
	 */
	public function getErrorList() {
		return array(
			2   => 1,
			3   => 1,
			4   => 1,
			5   => 1,
			6   => 1,
			9   => 1,
			15  => 1,
			26  => 1,
			33  => 1,
			35  => 1,
			36  => 1,
			42  => 1,
			49  => 1,
			62  => 1,
			67  => 1,
			69  => 1,
			70  => 1,
			79  => 1,
			82  => 1,
			88  => 1,
			97  => 1,
			99  => 1,
			105 => 1,
			107 => 1,
			108 => 1,
			112 => 1,
			113 => 1,
			114 => 1,
			115 => 1,
			116 => 1,
			119 => 1,
			125 => 1,
			136 => 1,
			142 => 1,
			145 => 1,
			152 => 1,
			165 => 1,
			174 => 1,
			178 => 1,
			180 => 1,
			181 => 1,
			188 => 1,
			195 => 1,
			208 => 1,
			213 => 1,
			215 => 1,
			216 => 1,
			221 => 1,
			223 => 1,
			229 => 1,
			238 => 1,
			240 => 1,
			246 => 1,
			248 => 1,
			249 => 1,
			253 => 1,
			254 => 1,
			255 => 1,
			256 => 1,
			257 => 1,
			260 => 1,
			266 => 1,
			277 => 1,
			283 => 1,
			286 => 1,
			293 => 1,
			306 => 1,
			315 => 1,
			319 => 1,
			321 => 1,
			322 => 1,
			329 => 1,
			336 => 1,
			349 => 1,
			354 => 1,
			356 => 1,
			357 => 1,
			362 => 1,
			365 => 1,
			371 => 1,
			380 => 1,
			382 => 1,
			388 => 1,
			390 => 1,
			391 => 1,
			395 => 1,
			396 => 1,
			397 => 1,
			398 => 1,
			399 => 1,
			402 => 1,
			408 => 1,
			419 => 1,
			426 => 1,
			433 => 1,
			446 => 1,
			455 => 1,
			459 => 1,
			461 => 1,
			462 => 1,
			469 => 1,
			476 => 1,
			489 => 1,
			492 => 1,
			493 => 1,
			496 => 1,
			502 => 1,
			513 => 1,
			517 => 1,
			519 => 1,
			520 => 1,
			526 => 1,
			533 => 1,
			546 => 1,
			549 => 1,
			550 => 1,
			551 => 1,
			552 => 1,
			555 => 1,
			561 => 1,
			572 => 1,
			579 => 1,
			581 => 1,
			582 => 1,
			587 => 1,
			592 => 1,
			597 => 1,
			602 => 1,
			607 => 1,
			612 => 1,
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
		return SinceTagSniff::class;
	}

	/**
	 * Sets the parameters for the sniff.
	 *
	 * @throws RuntimeException If unable to set the ruleset parameters required for the test.
	 *
	 * @param Sniff $sniff The sniff being tested.
	 */
	public function set_sniff_parameters( Sniff $sniff ) {
		$sniff->minimumVisibility = 'protected';
	}
}
