<?php
/**
 * Gutenberg Coding Standards.
 *
 * @package gutenberg/gutenberg-coding-standards
 * @link    https://github.com/WordPress/gutenberg
 * @license https://opensource.org/licenses/MIT MIT
 */

namespace GutenbergCS\Gutenberg\Sniffs\CodeAnalysis;

use PHP_CodeSniffer\Files\File;
use PHP_CodeSniffer\Sniffs\Sniff;

/**
 *
 * This sniff checks function names to ensure they adhere to specified prefixes
 * determined by the parent directory name. It enforces that function names start
 * with one of the allowed prefixes defined in the sniffer configuration.
 *
 * @link https://github.com/WordPress/gutenberg/blob/trunk/packages/block-library/README.md#naming-convention-for-php-functions
 *
 * @package gutenberg/gutenberg-coding-standards
 *
 * @since   1.0.0
 */
final class RestrictedFunctionCallSniff implements Sniff {

	/**
	 * Contains prefixes for functions that are not allowed to be called.
	 *
	 * @var array
	 */
	public $restricted_functions = array();

	/**
	 * Registers the tokens that this sniff wants to listen for.
	 *
	 * @return array
	 */
	public function register() {
		$this->onRegisterEvent();

		return array( T_STRING );
	}

	/**
	 * Processes function and class tokens.
	 *
	 * @param File $phpcsFile The file being scanned.
	 * @param int  $stackPtr  The position of the current token
	 *                        in the stack passed in $tokens.
	 *
	 * @return void
	 */
	public function process( File $phpcsFile, $stackPtr ) {
		$this->processFunctionCall( $phpcsFile, $stackPtr );
	}

	private function processFunctionCall( File $phpcs_file, $stack_pointer ) {
		if ( empty( $this->restricted_functions ) ) {
			// Nothing to process.
			return;
		}

		$tokens = $phpcs_file->getTokens();
		$next_token = $phpcs_file->findNext(T_WHITESPACE, ($stack_pointer + 1), null, true, null, true);
		if ( false === $next_token || ( $tokens[ $next_token ]['code'] !== T_OPEN_PARENTHESIS ) ) {
			// Not a function call.
			return;
		}

		$function_name = $tokens[$stack_pointer]['content'];

		foreach ( $this->restricted_functions as $disallowed_function_call ) {
			$regexp = sprintf( '/^%s$/', $disallowed_function_call );
			if ( 1 !== preg_match( $regexp, $function_name ) ) {
				// The function has a valid name; bypassing further checks.
				return;
			}
		}

		$error_message = 'It\'s not allowed to call the "' . $function_name . '()" function as its name matches the forbidden pattern: "' . $regexp . '".';
		$phpcs_file->addError( $error_message, $stack_pointer, 'CalledFunctionInvalid' );
	}

	/**
	 * The purpose of this method is to run callbacks
	 * after the class properties have been set.
	 */
	private function onRegisterEvent() {
		$this->restricted_functions = self::sanitize( $this->restricted_functions );
	}

	/**
	 * Sanitize an array of values by trimming each element and removing empty elements.
	 *
	 * @param array $values The values being sanitized.
	 *
	 * @return array
	 */
	private static function sanitize( $values ) {
		$values = array_map( 'trim', $values );

		return array_filter( $values );
	}
}
