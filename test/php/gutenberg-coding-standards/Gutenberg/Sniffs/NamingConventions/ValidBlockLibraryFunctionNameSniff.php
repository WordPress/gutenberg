<?php
/**
 * Gutenberg Coding Standards.
 *
 * @package gutenberg/gutenberg-coding-standards
 * @link    https://github.com/WordPress/gutenberg
 * @license https://opensource.org/licenses/MIT MIT
 */

namespace GutenbergCS\Gutenberg\Sniffs\NamingConventions;

use PHP_CodeSniffer\Files\File;
use PHP_CodeSniffer\Sniffs\Sniff;

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
final class ValidBlockLibraryFunctionNameSniff implements Sniff {
	/**
	 * Target prefixes.
	 *
	 * @var array
	 */
	public $prefixes = array();

	/**
	 * Registers the tokens that this sniff wants to listen for.
	 *
	 * @since 3.0.0
	 *
	 * @return array
	 */
	public function register() {
		$this->onRegisterEvent();

		return array( T_FUNCTION );
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

		if ( 'T_FUNCTION' !== $token['type'] ) {
			return;
		}

		$this->processFunctionToken( $phpcsFile, $stackPtr );
	}

	/**
	 * Functions should be wrapped with !function_exists() to avoid fatal errors.
	 * E.g.:
	 * if ( ! function_exists( 'wp_get_navigation' ) ) {
	 *     function wp_get_navigation( $slug ) { ... }
	 * }
	 *
	 * @param File $phpcsFile    The file being scanned.
	 * @param int  $stackPointer The position of the current token
	 *                           in the stack passed in $tokens.
	 *
	 * @return void
	 */
	private function processFunctionToken( File $phpcsFile, $stackPointer ) {
		$tokens        = $phpcsFile->getTokens();
		$functionToken = $phpcsFile->findNext( T_STRING, $stackPointer );

		$wrappingTokensToCheck = array(
			T_CLASS,
			T_INTERFACE,
			T_TRAIT,
		);

		foreach ( $wrappingTokensToCheck as $wrappingTokenToCheck ) {
			if ( false !== $phpcsFile->getCondition( $functionToken, $wrappingTokenToCheck, false ) ) {
				// This sniff only processes functions, not class methods.
				return;
			}
		}

		$functionName          = $tokens[ $functionToken ]['content'];
		$parent_directory_name = basename( dirname( $phpcsFile->getFilename() ) );

		$allowed_function_names = array();
		foreach ( $this->prefixes as $prefix ) {
			$prefix                   = rtrim( $prefix, '_' );
			$allowed_function_names[] = $prefix . '_' . str_replace( '-', '_', $parent_directory_name );
		}

		$is_function_name_valid = false;
		foreach ( $allowed_function_names as $allowed_function_name ) {
			$is_function_name_valid |= 0 === strpos( $functionName, $allowed_function_name );
		}

		if ( $is_function_name_valid ) {
			return;
		}

		$errorMessage = 'Only the following PHP function names are allowed in this index.php file: "' . implode( '", "', $allowed_function_names ) . '"';
		$phpcsFile->addError( $errorMessage, $functionToken, 'FunctionNameInvalid' );
	}

	/**
	 * The purpose of this method is to sanitize the input data
	 * after the properties have been set.
	 */
	private function onRegisterEvent() {
		$this->prefixes = self::sanitize( $this->prefixes );
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
