<?php

namespace GutenbergCS\Gutenberg\Sniffs\Commenting;

use PHP_CodeSniffer\Files\File;
use PHP_CodeSniffer\Sniffs\Sniff;

/**
 * This sniff ensures that PHP functions have docblocks defined
 * and that the `@since` tag is present in the docblock.
 */
class FunctionCommentSniff implements Sniff {
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
		// Get the tokens of the file.
		$tokens = $phpcsFile->getTokens();

		$function_token = $phpcsFile->findNext( T_STRING, $stackPtr );
		$function_name  = $tokens[ $function_token ]['content'];

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

 		$missing_since_tag_error_message = sprintf( '@since tag is missing for the `%s()` function.', $function_name );

		// Get the docblock for the current function.
		$doc_block_end_token = $phpcsFile->findPrevious( T_DOC_COMMENT_CLOSE_TAG, $stackPtr, null, false, null, true );
		if ( false === $doc_block_end_token ) {
			$phpcsFile->addError( $missing_since_tag_error_message, $function_token, 'MissingSinceTag' );
			return;
		}

		// Get the docblock for the current function.
		$doc_block_start_token = $phpcsFile->findPrevious( T_DOC_COMMENT_OPEN_TAG, $doc_block_end_token, null, false, null, true );
		if ( false === $doc_block_start_token ) {
			$phpcsFile->addError( $missing_since_tag_error_message, $function_token, 'MissingSinceTag' );
			return;
		}

		$since_tag = $phpcsFile->findNext( T_DOC_COMMENT_TAG, $doc_block_start_token, $doc_block_end_token, false, '@since', true );
		if ( false === $since_tag ) {
			$phpcsFile->addError( $missing_since_tag_error_message, $function_token, 'MissingSinceTag' );
			return;
		}

		$version_token = $phpcsFile->findNext( T_DOC_COMMENT_WHITESPACE, $since_tag + 1, null, true, null, true );
		if ( ( false === $version_token ) || ( T_DOC_COMMENT_STRING !== $tokens[ $version_token ]['code'] ) ) {
			$phpcsFile->addError( $missing_since_tag_error_message, $function_token, 'MissingSinceTag' );
			return;
		}

		$version_value = $tokens[ $version_token ]['content'];

		if ( version_compare( $version_value, '0.0.1', '>=' ) ) {
			return;
		}

		$phpcsFile->addError(
			'Invalid @since version value for the `%s()` function: `%s`. Version value must be greater than or equal to 0.0.1.',
			$version_token,
			'InvalidSinceVersionValue',
			array(
				$function_name,
				$version_value
			)
		);
	}
}
