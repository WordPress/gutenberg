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
 * This sniff enforces usage restrictions on specific classes and functions within the Gutenberg project.
 * While it permits the declaration of these classes/functions, their actual usage in code is restricted based on defined regular expressions.
 *
 * @package gutenberg/gutenberg-coding-standards
 *
 * @since   1.0.0
 */
final class RestrictedFunctionsAndClassesSniff implements Sniff {

	/**
	 * Holds regular expressions for classes whose use is restricted, though their definition is allowed.
	 * Useful for enforcing security or architectural constraints.
	 *
	 * @var array Array of regex patterns for restricted classes.
	 */
	public $restricted_classes = array();

	/**
	 * Holds regular expressions identifying functions that are restricted from being called.
	 * Useful for enforcing security or architectural constraints.
	 *
	 * @var array Array of regex patterns for restricted functions.
	 */
	public $restricted_functions = array();

	/**
	 * Registers the tokens that this sniff wants to listen for.
	 *
	 * @return array
	 */
	public function register() {
		$this->on_register_event();

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
		$this->process_string_token( $phpcsFile, $stackPtr );
	}

	private function process_string_token( File $phpcs_file, $stack_pointer ) {
		if ( empty( $this->restricted_functions ) && empty( $this->restricted_classes ) ) {
			// Nothing to process.
			return;
		}

		$tokens = $phpcs_file->getTokens();

		$next_token = $phpcs_file->findPrevious( T_WHITESPACE, ( $stack_pointer + 1 ), null, true, null, true );
		if ( false !== $next_token && ( $tokens[ $next_token ]['code'] === T_DOUBLE_COLON ) ) {
			// Static class method or a class constant.
			$this->check_class_usage( $phpcs_file, $stack_pointer );

			return;
		}

		$previous_token = $phpcs_file->findPrevious( T_WHITESPACE, $stack_pointer - 1, null, true, null, true );
		if ( false !== $previous_token && ( $tokens[ $previous_token ]['code'] === T_NEW ) ) {
			// Static method or a constant usage.
			$this->check_class_usage( $phpcs_file, $stack_pointer );

			return;
		}

		if ( false !== $next_token && ( $tokens[ $next_token ]['code'] === T_OPEN_PARENTHESIS ) ) {
			$this->check_function_usage( $phpcs_file, $stack_pointer );
		}
	}

	private function check_class_usage( File $phpcs_file, $stack_pointer ) {
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

	private function check_function_usage( File $phpcs_file, $stack_pointer ) {
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
	private function on_register_event() {
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
