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
 * While it permits the declaration of these classes/functions, their actual usage in code is forbidden based on defined regular expressions.
 *
 * @package gutenberg/gutenberg-coding-standards
 *
 * @since   1.0.0
 */
final class ForbiddenFunctionsAndClassesSniff implements Sniff {

	/**
	 * Holds regular expressions for classes whose usage is forbidden.
	 * Note that declaring functions with names matching these regular expressions is still permitted.
	 * Useful for enforcing security or architectural constraints.
	 *
	 * @var array Array of regex patterns for forbidden classes.
	 */
	public $forbidden_classes = array();

	/**
	 * Holds regular expressions for classes whose usage is forbidden.
	 * Note that declaring classes with names matching these regular expressions is still permitted.
	 * Useful for enforcing security or architectural constraints.
	 *
	 * @var array Array of regex patterns for forbidden functions.
	 */
	public $forbidden_functions = array();

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
	 * Handles processing tokens.
	 *
	 * @param File $phpcsFile The file being scanned.
	 * @param int  $stackPtr  The position of the current token
	 *                        in the stack passed in $tokens.
	 */
	public function process( File $phpcsFile, $stackPtr ) {
		$this->process_string_token( $phpcsFile, $stackPtr );
	}

	/**
	 * Detects whether a given string token represents a function call or class usage.
	 * It then delegates further processing based on the type of usage detected.
	 *
	 * @param File $phpcsFile The file being scanned.
	 * @param int  $stackPtr  The position of the current token
	 *                        in the stack passed in $tokens.
	 *
	 * @return void
	 */
	private function process_string_token( File $phpcs_file, $stack_pointer ) {
		if ( empty( $this->forbidden_functions ) && empty( $this->forbidden_classes ) ) {
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

	/**
	 * Checks for forbidden class usage.
	 *
	 * @param File $phpcs_file    File being scanned.
	 * @param int  $stack_pointer Position of the text token in the token stack.
	 *
	 * @return void
	 */
	private function check_class_usage( File $phpcs_file, $stack_pointer ) {
		$tokens     = $phpcs_file->getTokens();
		$class_name = $tokens[ $stack_pointer ]['content'];

		foreach ( $this->forbidden_classes as $forbidden_class ) {
			$regexp = sprintf( '/^%s$/', $forbidden_class );
			if ( 1 !== preg_match( $regexp, $class_name ) ) {
				// The class has a valid name; bypassing further checks.
				return;
			}
		}

		$error_message = 'It\'s not allowed to use the "' . $class_name . '" class as its name matches the forbidden pattern: "' . $regexp . '".';
		$phpcs_file->addError( $error_message, $stack_pointer, 'UsedClassInvalid' );
	}

	/**
	 * Checks for forbidden function usage.
	 *
	 * @param File $phpcs_file    File being scanned.
	 * @param int  $stack_pointer Position of the text token in the token stack.
	 *
	 * @return void
	 */
	private function check_function_usage( File $phpcs_file, $stack_pointer ) {
		$tokens        = $phpcs_file->getTokens();
		$function_name = $tokens[ $stack_pointer ]['content'];

		foreach ( $this->forbidden_functions as $disallowed_function_call ) {
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
		$this->forbidden_classes   = self::sanitize( $this->forbidden_classes );
		$this->forbidden_functions = self::sanitize( $this->forbidden_functions );
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
