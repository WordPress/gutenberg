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
final class RestrictedFunctionsAndClassesSniff implements Sniff {

	/**
	 * Contains prefixes for classes that are not allowed to be called.
	 *
	 * @var array
	 */
	public $restricted_classes = array();

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
	 * @param int $stackPtr The position of the current token
	 *                        in the stack passed in $tokens.
	 *
	 * @return void
	 */
	public function process( File $phpcsFile, $stackPtr ) {
		$this->processStringToken( $phpcsFile, $stackPtr );
	}

	private function processStringToken( File $phpcs_file, $stack_pointer ) {
		if ( empty( $this->restricted_functions ) && empty( $this->restricted_classes ) ) {
			// Nothing to process.
			return;
		}

		$tokens = $phpcs_file->getTokens();

		$next_token = $phpcs_file->findPrevious( T_WHITESPACE, ( $stack_pointer + 1 ), null, true, null, true );
		if ( false !== $next_token && ( $tokens[ $next_token ]['code'] === T_DOUBLE_COLON ) ) {
			// Static class method or a class constant.
			$this->processClassUsage( $phpcs_file, $stack_pointer );

			return;
		}

		$previous_token = $phpcs_file->findPrevious( T_WHITESPACE, $stack_pointer - 1, null, true, null, true );
		if ( false !== $previous_token && ( $tokens[ $previous_token ]['code'] === T_NEW ) ) {
			// Static method or a constant usage.
			$this->processClassUsage( $phpcs_file, $stack_pointer );

			return;
		}

		if ( false !== $next_token && ( $tokens[ $next_token ]['code'] === T_OPEN_PARENTHESIS ) ) {
			$this->processFunctionCall( $phpcs_file, $stack_pointer );
		}
	}

	private function processClassUsage( File $phpcs_file, $stack_pointer ) {
		$tokens     = $phpcs_file->getTokens();
		$class_name = $tokens[ $stack_pointer ]['content'];

		foreach ( $this->restricted_classes as $restricted_class ) {
			$regexp = sprintf( '/^%s$/', $restricted_class );
			if ( 1 !== preg_match( $regexp, $class_name ) ) {
				// The class has a valid name; bypassing further checks.
				return;
			}
		}

		$error_message = 'It\'s not allowed to use the "' . $class_name . '" class as its name matches the forbidden pattern: "' . $regexp . '".';
		$phpcs_file->addError( $error_message, $stack_pointer, 'UsedClassInvalid' );
	}

	private function processFunctionCall( File $phpcs_file, $stack_pointer ) {
		$tokens        = $phpcs_file->getTokens();
		$function_name = $tokens[ $stack_pointer ]['content'];

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
		$this->restricted_classes   = self::sanitize( $this->restricted_classes );
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
