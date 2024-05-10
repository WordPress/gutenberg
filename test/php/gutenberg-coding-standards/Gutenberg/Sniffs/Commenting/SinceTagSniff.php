<?php
/**
 * Gutenberg Coding Standards.
 *
 * @package gutenberg/gutenberg-coding-standards
 * @link    https://github.com/WordPress/gutenberg
 * @license https://opensource.org/licenses/MIT MIT
 */

namespace GutenbergCS\Gutenberg\Sniffs\Commenting;

use PHP_CodeSniffer\Files\File;
use PHP_CodeSniffer\Sniffs\Sniff;
use PHP_CodeSniffer\Util\Tokens;

/**
 * This sniff ensures that PHP functions have a valid `@since` tag in the docblock.
 * The sniff skips checking files in __experimental block-library blocks.
 */
class FunctionCommentSinceTagSniff implements Sniff {

	/**
	 * This property is used to store results returned
	 * by the static::is_experimental_block() method.
	 *
	 * @var array
	 */
	private static $cache = array();

	/**
	 * Returns an array of tokens this test wants to listen for.
	 *
	 * @return array<int|string>
	 */
	public function register() {
		return array( T_FUNCTION );
	}

	/**
	 * Processes the tokens that this sniff is interested in.
	 *
	 * @param File $phpcsFile The file being scanned.
	 * @param int  $stackPtr  The position of the current token in the stack passed in $tokens.
	 */
	public function process( File $phpcsFile, $stackPtr ) {
		if ( static::is_experimental_block( $phpcsFile ) ) {
			// The "@since" tag is not required for experimental blocks since they are not yet included in WordPress Core.
			return;
		}

		$tokens        = $phpcsFile->getTokens();
		$function_name = $phpcsFile->getDeclarationName( $stackPtr );

		$wrapping_tokens_to_check = array(
			T_CLASS,
			T_INTERFACE,
			T_TRAIT,
		);

		foreach ( $wrapping_tokens_to_check as $wrapping_token_to_check ) {
			if ( false !== $phpcsFile->getCondition( $stackPtr, $wrapping_token_to_check, false ) ) {
				// This sniff only processes functions, not class methods.
				return;
			}
		}

		$missing_since_tag_error_message = sprintf( '@since tag is missing for the "%s()" function.', $function_name );

		// All these tokens could be present before the docblock.
		$tokens_before_the_docblock = array(
			T_PUBLIC,
			T_PROTECTED,
			T_PRIVATE,
			T_STATIC,
			T_FINAL,
			T_ABSTRACT,
			T_WHITESPACE,
		);

		$doc_block_end_token = $phpcsFile->findPrevious( $tokens_before_the_docblock, ( $stackPtr - 1 ), null, true, null, true );
		if ( ( false === $doc_block_end_token ) || ( T_DOC_COMMENT_CLOSE_TAG !== $tokens[ $doc_block_end_token ]['code'] ) ) {
			$phpcsFile->addError( $missing_since_tag_error_message, $stackPtr, 'MissingSinceTag' );
			return;
		}

		// The sniff intentionally doesn't check if the docblock has a valid open tag.
		// Its only job is to make sure that the @since tag is present and has a valid version value.
		$doc_block_start_token = $phpcsFile->findPrevious( Tokens::$commentTokens, ( $doc_block_end_token - 1 ), null, true, null, true );
		if ( false === $doc_block_start_token ) {
			$phpcsFile->addError( $missing_since_tag_error_message, $stackPtr, 'MissingSinceTag' );
			return;
		}

		// This is the first non-docblock token, so the next token should be used.
		++$doc_block_start_token;

		$since_tag_token = $phpcsFile->findNext( T_DOC_COMMENT_TAG, $doc_block_start_token, $doc_block_end_token, false, '@since', true );
		if ( false === $since_tag_token ) {
			$phpcsFile->addError( $missing_since_tag_error_message, $stackPtr, 'MissingSinceTag' );
			return;
		}

		$version_token = $phpcsFile->findNext( T_DOC_COMMENT_WHITESPACE, $since_tag_token + 1, null, true, null, true );
		if ( ( false === $version_token ) || ( T_DOC_COMMENT_STRING !== $tokens[ $version_token ]['code'] ) ) {
			$phpcsFile->addError( $missing_since_tag_error_message, $since_tag_token, 'MissingSinceTag' );
			return;
		}

		$version_value = $tokens[ $version_token ]['content'];

		if ( version_compare( $version_value, '0.0.1', '>=' ) ) {
			// Validate the version value.
			return;
		}

		$phpcsFile->addError(
			'Invalid @since version value for the "%s()" function: "%s". Version value must be greater than or equal to 0.0.1.',
			$version_token,
			'InvalidSinceTagVersionValue',
			array(
				$function_name,
				$version_value,
			)
		);
	}

	/**
	 * Checks if the current block is experimental.
	 *
	 * @param File $phpcsFile The file being scanned.
	 * @return bool Returns true if the current block is experimental.
	 */
	private static function is_experimental_block( File $phpcsFile ) {
		$block_json_filepath = dirname( $phpcsFile->getFilename() ) . DIRECTORY_SEPARATOR . 'block.json';

		if ( isset( static::$cache[ $block_json_filepath ] ) ) {
			return static::$cache[ $block_json_filepath ];
		}

		if ( ! is_file( $block_json_filepath ) || ! is_readable( $block_json_filepath ) ) {
			static::$cache[ $block_json_filepath ] = false;
			return static::$cache[ $block_json_filepath ];
		}

		// phpcs:ignore WordPress.WP.AlternativeFunctions.file_get_contents_file_get_contents -- this Composer package doesn't depend on WordPress.
		$block_metadata = file_get_contents( $block_json_filepath );
		if ( false === $block_metadata ) {
			static::$cache[ $block_json_filepath ] = false;
			return static::$cache[ $block_json_filepath ];
		}

		$block_metadata = json_decode( $block_metadata, true );
		if ( ! is_array( $block_metadata ) ) {
			static::$cache[ $block_json_filepath ] = false;
			return static::$cache[ $block_json_filepath ];
		}

		$experimental_flag                     = '__experimental';
		static::$cache[ $block_json_filepath ] = array_key_exists( $experimental_flag, $block_metadata ) && ( false !== $block_metadata[ $experimental_flag ] );
		return static::$cache[ $block_json_filepath ];
	}
}
