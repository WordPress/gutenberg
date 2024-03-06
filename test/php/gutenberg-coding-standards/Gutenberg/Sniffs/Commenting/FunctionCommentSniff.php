<?php

namespace GutenbergCS\Gutenberg\Sniffs\Commenting;

use PHP_CodeSniffer\Files\File;
use PHP_CodeSniffer\Sniffs\Sniff;
use PHP_CodeSniffer\Util\Tokens;

class FunctionCommentSniff implements Sniff {
	/**
	 * Returns an array of tokens this test wants to listen for.
	 *
	 * @return array<int|string>
	 */
	public function register() {
		return [ T_FUNCTION ];
	}

	/**
	 * Processes the tokens that this sniff is interested in.
	 *
	 * @param File $phpcsFile The file being scanned.
	 * @param int $stackPtr The position of the current token in the stack passed in $tokens.
	 */
	public function process( File $phpcsFile, $stackPtr ) {
		// Get the tokens of the file.
		$tokens = $phpcsFile->getTokens();

		$function_token = $phpcsFile->findNext( T_STRING, $stackPtr );

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

		// Get the docblock for the current function.
		$doc_block_end_token = $phpcsFile->findPrevious( T_DOC_COMMENT_CLOSE_TAG, $stackPtr, null, false, null, true );
		if ( $doc_block_end_token === false ) {
			$phpcsFile->addError( '@since tag is missing for this function', $stackPtr, 'MissingSince' );
			return;
		}

		// Get the docblock for the current function.
		$doc_block_start_token = $phpcsFile->findPrevious( T_DOC_COMMENT_OPEN_TAG, $doc_block_end_token, null, false, null, true );
		if ( $doc_block_start_token === false ) {
			$phpcsFile->addError( '@since tag is missing for this function', $stackPtr, 'MissingSince' );
			return;
		}

		$since_tag = $phpcsFile->findNext( T_DOC_COMMENT_TAG, $doc_block_start_token, $doc_block_end_token, false, '@since', true );
		if ( $since_tag === false ) {
			$phpcsFile->addError( '@since tag is missing for this function', $stackPtr, 'MissingSince' );
			return;
		}
	}
}
