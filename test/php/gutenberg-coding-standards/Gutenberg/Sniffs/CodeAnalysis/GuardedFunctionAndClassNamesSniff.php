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
		$this->onRegisterEvent();

		return array( T_FUNCTION, T_CLASS );
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

		if ( 'T_FUNCTION' === $token['type'] ) {
			$this->processFunctionToken( $phpcsFile, $stackPtr );
			return;
		}

		if ( 'T_CLASS' === $token['type'] ) {
			$this->processClassToken( $phpcsFile, $stackPtr );
		}
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

		$name = $tokens[ $functionToken ]['content'];
		foreach ( $this->functionsWhiteList as $functionRegExp ) {
			if ( preg_match( $functionRegExp, $name ) ) {
				// Ignore whitelisted function names.
				return;
			}
		}

		$errorMessage = sprintf( 'The "%s()" function should be guarded against redeclaration.', $name );

		$wrappingIfToken = $phpcsFile->getCondition( $functionToken, T_IF, false );
		if ( false === $wrappingIfToken ) {
			$phpcsFile->addError( $errorMessage, $functionToken, 'FunctionNotGuardedAgainstRedeclaration' );

			return;
		}

		$content = $phpcsFile->getTokensAsString( $wrappingIfToken, $functionToken - $wrappingIfToken );

		$regexp = sprintf( '/if\s*\(\s*!\s*function_exists\s*\(\s*(\'|")%s(\'|")/', preg_quote( $name, '/' ) );
		$result = preg_match( $regexp, $content );
		if ( 1 !== $result ) {
			$phpcsFile->addError( $errorMessage, $functionToken, 'FunctionNotGuardedAgainstRedeclaration' );
		}
	}

	/**
	 * Classes should be wrapped with !function_exists() to avoid fatal errors.
	 * E.g.:
	 * if ( ! class_exists( 'WP_Navigation' ) ) {
	 *    class WP_Navigation { ... }
	 * }
	 *
	 * @param File $phpcsFile    The file being scanned.
	 * @param int  $stackPointer The position of the current token
	 *                           in the stack passed in $tokens.
	 *
	 * @return void
	 */
	private function processClassToken( File $phpcsFile, $stackPointer ) {
		$tokens     = $phpcsFile->getTokens();
		$classToken = $phpcsFile->findNext( T_STRING, $stackPointer );
		$className  = $tokens[ $classToken ]['content'];

		foreach ( $this->classesWhiteList as $classnameRegExp ) {
			if ( preg_match( $classnameRegExp, $className ) ) {
				// Ignore whitelisted class names.
				return;
			}
		}

		$errorMessage = sprintf( 'The "%s" class should be guarded against redeclaration.', $className );

		$wrappingIfToken = $phpcsFile->getCondition( $classToken, T_IF, false );
		if ( false !== $wrappingIfToken ) {
			$endOfWrappingIfToken = $phpcsFile->findEndOfStatement( $wrappingIfToken );
			$content              = $phpcsFile->getTokensAsString( $wrappingIfToken, $endOfWrappingIfToken - $wrappingIfToken );
			$regexp               = sprintf( '/if\s*\(\s*!\s*class_exists\s*\(\s*(\'|")%s(\'|")/', preg_quote( $className, '/' ) );
			$result               = preg_match( $regexp, $content );
			if ( 1 === $result ) {
				return;
			}
		}

		$previousIfToken = $phpcsFile->findPrevious( T_IF, $classToken );
		if ( false === $previousIfToken ) {
			$phpcsFile->addError( $errorMessage, $classToken, 'ClassNotGuardedAgainstRedeclaration' );

			return;
		}

		$endOfPreviousIfToken = $phpcsFile->findEndOfStatement( $previousIfToken );
		$content              = $phpcsFile->getTokensAsString( $previousIfToken, $endOfPreviousIfToken - $previousIfToken );
		$regexp               = sprintf( '/if\s*\(\s*class_exists\s*\(\s*(\'|")%s(\'|")/', preg_quote( $className, '/' ) );
		$result               = preg_match( $regexp, $content );

		if ( 1 === $result ) {
			$notProperlyGuardedErrorMessage = sprintf(
				'The class "%s" is not properly guarded against redeclaration. Please ensure the entire class body is wrapped within an "if ( ! class_exists( \'%s\' ) ) {" statement.',
				$className,
				$className
			);

			$phpcsFile->addError( $notProperlyGuardedErrorMessage, $classToken, 'ClassNotProperlyGuardedAgainstRedeclaration' );
			return;
		}

		$phpcsFile->addError( $errorMessage, $classToken, 'ClassNotGuardedAgainstRedeclaration' );
	}

	/**
	 * The purpose of this method is to sanitize the input data
	 * after the properties have been set.
	 */
	private function onRegisterEvent() {
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
