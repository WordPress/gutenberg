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
use PHP_CodeSniffer\Util\Tokens;

/**
 * The sniff implements the Gutenberg coding standard to verify whether functions and classes
 * are enclosed with function_exists() and !class_exists(). This check ensures that the functions
 * and classes are not already defined, and recommends the use of function_exists() and class_exists()
 * to prevent fatal errors during the integration of the feature to the Core.
 *
 * @link https://github.com/WordPress/gutenberg/blob/trunk/lib/README.md#wrap-functions-and-classes-with--function_exists-and--class_exists
 *
 * @package gutenberg/gutenberg-coding-standards
 *
 * @since   1.0.0
 */
final class GuardedFunctionAndClassNamesSniff implements Sniff {
	/**
	 * A list of functions to ignore.
	 *
	 * @var integer
	 */
	public $functionsWhiteList = array();

	/**
	 * A list of classes to ignore.
	 *
	 * @var integer
	 */
	public $classesWhiteList = array();

	/**
	 * Registers the tokens that this sniff wants to listen for.
	 *
	 * @since 3.0.0
	 *
	 * @return array
	 */
	public function register() {
		$this->on_register_event();

		return array_merge(
			array( T_FUNCTION, T_CLASS ),
			Tokens::$includeTokens
		);
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
		$tokens = $phpcsFile->getTokens();
		$token  = $tokens[ $stackPtr ];

		$ds               = DIRECTORY_SEPARATOR;
		$is_load_php_file = str_ends_with( $phpcsFile->getFilename(), 'gutenberg' . $ds . 'lib' . $ds . 'load.php' );

		if ( in_array( $token['code'], Tokens::$includeTokens, true ) && $is_load_php_file ) {
			$this->process_load_php_file_include_token( $phpcsFile, $stackPtr );
			return;
		}

		if ( 'T_FUNCTION' === $token['type'] ) {
			$this->process_function_token( $phpcsFile, $stackPtr );
			return;
		}

		if ( 'T_CLASS' === $token['type'] ) {
			$this->process_class_token( $phpcsFile, $stackPtr );
		}
	}

	/**
	 * Functions should be wrapped with !function_exists() to avoid fatal errors.
	 * E.g.:
	 * if ( ! function_exists( 'wp_get_navigation' ) ) {
	 *     function wp_get_navigation( $slug ) { ... }
	 * }
	 *
	 * @param File $phpcs_file    The file being scanned.
	 * @param int  $stack_pointer The position of the current token in the stack passed in $tokens.
	 */
	private function process_function_token( File $phpcs_file, $stack_pointer ) {
		$tokens         = $phpcs_file->getTokens();
		$function_token = $phpcs_file->findNext( T_STRING, $stack_pointer );

		$wrapping_tokens_to_check = array(
			T_CLASS,
			T_INTERFACE,
			T_TRAIT,
		);

		foreach ( $wrapping_tokens_to_check as $wrapping_token_to_check ) {
			if ( false !== $phpcs_file->getCondition( $function_token, $wrapping_token_to_check, false ) ) {
				// This sniff only processes functions, not class methods.
				return;
			}
		}

		$name = $tokens[ $function_token ]['content'];
		foreach ( $this->functionsWhiteList as $function_reg_exp ) {
			if ( preg_match( $function_reg_exp, $name ) ) {
				// Ignore whitelisted function names.
				return;
			}
		}

		$error_message = sprintf( 'The "%s()" function should be guarded against redeclaration.', $name );

		$wrapping_if_token = $phpcs_file->getCondition( $function_token, T_IF, false );
		if ( false === $wrapping_if_token ) {
			$phpcs_file->addError( $error_message, $function_token, 'FunctionNotGuardedAgainstRedeclaration' );

			return;
		}

		$content = $phpcs_file->getTokensAsString( $wrapping_if_token, $function_token - $wrapping_if_token );

		$regexp = sprintf( '/if\s*\(\s*!\s*function_exists\s*\(\s*(\'|")%s(\'|")/', preg_quote( $name, '/' ) );
		$result = preg_match( $regexp, $content );
		if ( 1 !== $result ) {
			$phpcs_file->addError( $error_message, $function_token, 'FunctionNotGuardedAgainstRedeclaration' );
		}
	}

	/**
	 * Classes should be wrapped with !function_exists() to avoid fatal errors.
	 * E.g.:
	 * if ( ! class_exists( 'WP_Navigation' ) ) {
	 *    class WP_Navigation { ... }
	 * }
	 *
	 * @param File $phpcs_file    The file being scanned.
	 * @param int  $stack_pointer The position of the current token in the stack passed in $tokens.
	 */
	private function process_class_token( File $phpcs_file, $stack_pointer ) {
		$tokens      = $phpcs_file->getTokens();
		$class_token = $phpcs_file->findNext( T_STRING, $stack_pointer );
		$class_name  = $tokens[ $class_token ]['content'];

		foreach ( $this->classesWhiteList as $class_name_reg_exp ) {
			if ( preg_match( $class_name_reg_exp, $class_name ) ) {
				// Ignore whitelisted class names.
				return;
			}
		}

		$error_message = sprintf( 'The "%s" class should be guarded against redeclaration.', $class_name );

		$wrapping_if_token = $phpcs_file->getCondition( $class_token, T_IF, false );
		if ( false !== $wrapping_if_token ) {
			$end_of_wrapping_if_token = $phpcs_file->findEndOfStatement( $wrapping_if_token );
			$content                  = $phpcs_file->getTokensAsString( $wrapping_if_token, $end_of_wrapping_if_token - $wrapping_if_token );
			$regexp                   = sprintf( '/if\s*\(\s*!\s*class_exists\s*\(\s*(\'|")%s(\'|")/', preg_quote( $class_name, '/' ) );
			$result                   = preg_match( $regexp, $content );
			if ( 1 === $result ) {
				return;
			}
		}

		$previous_if_token = $phpcs_file->findPrevious( T_IF, $class_token );
		if ( false === $previous_if_token ) {
			$phpcs_file->addError( $error_message, $class_token, 'ClassNotGuardedAgainstRedeclaration' );

			return;
		}

		$end_of_previous_if_token = $phpcs_file->findEndOfStatement( $previous_if_token );
		$content                  = $phpcs_file->getTokensAsString( $previous_if_token, $end_of_previous_if_token - $previous_if_token );
		$regexp                   = sprintf( '/if\s*\(\s*class_exists\s*\(\s*(\'|")%s(\'|")/', preg_quote( $class_name, '/' ) );
		$result                   = preg_match( $regexp, $content );

		if ( 1 === $result ) {
			$not_properly_guarded_error_message = sprintf(
				'The class "%s" is not properly guarded against redeclaration. Please ensure the entire class body is wrapped within an "if ( ! class_exists( \'%s\' ) ) {" statement.',
				$class_name,
				$class_name
			);

			$phpcs_file->addError( $not_properly_guarded_error_message, $class_token, 'ClassNotProperlyGuardedAgainstRedeclaration' );
			return;
		}

		$phpcs_file->addError( $error_message, $class_token, 'ClassNotGuardedAgainstRedeclaration' );
	}

	public function process_load_php_file_include_token( File $phpcs_file, $stack_pointer ) {
		$tokens = $phpcs_file->getTokens();
		$token  = $tokens[ $stack_pointer ];
		$a = 5;
	}

	/**
	 * The purpose of this method is to sanitize the input data
	 * after the properties have been set.
	 */
	private function on_register_event() {
		$this->functionsWhiteList = self::sanitize( $this->functionsWhiteList );
		$this->classesWhiteList   = self::sanitize( $this->classesWhiteList );
	}

	/**
	 * Input data needs to be sanitized.
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
