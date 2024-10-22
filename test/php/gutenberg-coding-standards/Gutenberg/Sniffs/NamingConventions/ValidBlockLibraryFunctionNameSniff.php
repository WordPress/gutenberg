<?php
/**
 * Gutenberg Coding Standards.
 *
 * @package gutenberg/gutenberg-coding-standards
 * @link    https://github.com/WordPress/gutenberg/tree/trunk/test/php/gutenberg-coding-standards
 */

namespace GutenbergCS\Gutenberg\Sniffs\NamingConventions;

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
final class ValidBlockLibraryFunctionNameSniff implements Sniff {
	/**
	 * Target prefixes.
	 *
	 * @var array
	 */
	public $prefixes = array();

	/**
	 * These functions are considered permissible and will be ignored by the sniffer.
	 *
	 * @var array
	 */
	public $allowed_functions = array();

	/**
	 * Registers the tokens that this sniff wants to listen for.
	 *
	 * @return array
	 */
	public function register() {
		$this->onRegisterEvent();

		return array( T_FUNCTION );
	}

	/**
	 * Processes function tokens.
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
	 * This method analyzes the function token and its name within the provided file.
	 * It checks if the function name adheres to allowed prefixes based on the parent directory name.
	 * If the function name is not valid, an error message is added to the code sniffer report.
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

		$tokens         = $phpcsFile->getTokens();
		$function_token = $phpcsFile->findNext( T_STRING, $stackPointer );

		$wrapping_tokens_to_check = array(
			T_CLASS,
			T_INTERFACE,
			T_TRAIT,
		);

		foreach ( $wrapping_tokens_to_check as $wrapping_token_to_check ) {
			if ( false !== $phpcsFile->getCondition( $function_token, $wrapping_token_to_check, false ) ) {
				// This sniff only processes functions, not class methods.
				return;
			}
		}

		$function_name = $tokens[ $function_token ]['content'];

		if ( in_array( $function_name, $this->allowed_functions, true ) ) {
			// The function name is included in the list of allowed functions; bypassing further checks.
			return;
		}

		$parent_directory_name = basename( dirname( $phpcsFile->getFilename() ) );

		$allowed_function_prefixes = array();
		foreach ( $this->prefixes as $prefix ) {
			$prefix                      = rtrim( $prefix, '_' );
			$allowed_function_prefix     = $prefix . '_' . self::sanitize_directory_name( $parent_directory_name );
			$allowed_function_prefixes[] = $allowed_function_prefix;
			// Validate the name's correctness and ensure it does not end with an underscore.
			$regexp = sprintf( '/^%s(|_.+)$/', preg_quote( $allowed_function_prefix, '/' ) );

			if ( 1 === preg_match( $regexp, $function_name ) ) {
				// The function has a valid prefix; bypassing further checks.
				return;
			}
		}

		$error_message = "The function name '{$function_name}()' is invalid."
		. ' In this file, PHP function names must either match one of the allowed prefixes exactly or begin with one of them, followed by an underscore.'
		. " The allowed prefixes are: '" . implode( "', '", $allowed_function_prefixes ) . "'.";
		$phpcsFile->addError( $error_message, $function_token, 'FunctionNameInvalid' );
	}

	/**
	 * The purpose of this method is to run callbacks
	 * after the class properties have been set.
	 */
	private function onRegisterEvent() {
		$this->prefixes          = self::sanitize( $this->prefixes );
		$this->allowed_functions = self::sanitize( $this->allowed_functions );
	}

	/**
	 * Sanitize a directory name by converting it to lowercase and replacing non-letter
	 * and non-digit characters with underscores.
	 *
	 * @param string $directory_name Directory name.
	 *
	 * @return string
	 */
	private static function sanitize_directory_name( $directory_name ) {
		// Convert to lowercase.
		$directory_name = strtolower( $directory_name );

		// Replace non-letter and non-digit characters with underscores.
		return preg_replace( '/[^a-z0-9]/', '_', $directory_name );
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
