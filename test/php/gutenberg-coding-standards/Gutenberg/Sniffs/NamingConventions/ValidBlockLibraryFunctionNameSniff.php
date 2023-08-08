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
	 *
	 * @param File $phpcsFile    The file being scanned.
	 * @param int  $stackPointer The position of the current token
	 *                           in the stack passed in $tokens.
	 *
	 * @return void
	 */
	private function processFunctionToken( File $phpcsFile, $stackPointer ) {

		if ( empty( $this->prefixes ) ) {
			// Nothing to process.
			return;
		}

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

		$allowed_function_prefixes = array();
		foreach ( $this->prefixes as $prefix ) {
			$prefix                      = rtrim( $prefix, '_' );
			$allowed_function_prefixes[] = $prefix . '_' . str_replace( '-', '_', $parent_directory_name );
		}

		$is_function_name_valid = false;
		foreach ( $allowed_function_prefixes as $allowed_function_name ) {
			$is_function_name_valid |= 0 === strpos( $functionName, $allowed_function_name );
		}

		if ( $is_function_name_valid ) {
			return;
		}

		$errorMessage = "The function name \"{$functionName}\" is invalid because function names in this file should start with one of the following prefixes: \""
		                . implode( '", "', $allowed_function_prefixes ) . '"';
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
