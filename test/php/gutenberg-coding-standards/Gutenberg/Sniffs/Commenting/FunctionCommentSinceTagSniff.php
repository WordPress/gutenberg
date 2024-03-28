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
use PHPCSUtils\Utils\FunctionDeclarations;
use PHPCSUtils\Utils\ObjectDeclarations;
use PHPCSUtils\Utils\Scopes;


/**
 * This sniff ensures that PHP functions have a valid `@since` tag in the docblock.
 * The sniff skips checking files in __experimental block-library blocks.
 */
class FunctionCommentSinceTagSniff implements Sniff {

	/**
	 * Disable the check for functions with a lower visibility than the value given.
	 *
	 * Allowed values are public, protected, and private.
	 *
	 * @var string
	 */
	public $minimumVisibility = 'private';

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
		return array(
			T_FUNCTION,
			T_VARIABLE,
			T_CLASS
		);
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

		$tokens = $phpcsFile->getTokens();
		$token  = $tokens[ $stackPtr ];

		if ( 'T_FUNCTION' === $token['type'] ) {
			$this->process_function_token( $phpcsFile, $stackPtr );
			return;
		}

		if ( 'T_CLASS' === $token['type'] ) {
			$this->process_class_token( $phpcsFile, $stackPtr );
			return;
		}

		if ( Scopes::isOOProperty( $phpcsFile, $stackPtr ) ) {
			$this->process_class_property_token( $phpcsFile, $stackPtr );
		}
	}

	public function process_class_token( File $phpcsFile, $stackPtr ) {
		$tokens = $phpcsFile->getTokens();
		// All these tokens could be present before the docblock.
		$tokens_before_the_docblock = array(
			T_FINAL,
			T_ABSTRACT,
			T_WHITESPACE,
			T_ATTRIBUTE,
			T_ATTRIBUTE_END,
			T_STRING,
			T_NS_SEPARATOR
		);

		$tokens_before_the_docblock = array_merge($tokens_before_the_docblock, Tokens::$assignmentTokens);

		$class_name = $phpcsFile->getDeclarationName( $stackPtr );
		$missing_since_tag_error_message = sprintf(
			'@since tag is missing for the "%s" class.',
			$class_name,
		);

		$doc_block_end_token = $phpcsFile->findPrevious( $tokens_before_the_docblock, ( $stackPtr - 1 ), null, true, null, true );
		if ( ( false === $doc_block_end_token ) || ( T_DOC_COMMENT_CLOSE_TAG !== $tokens[ $doc_block_end_token ]['code'] ) ) {
			$phpcsFile->addError( $missing_since_tag_error_message, $stackPtr, 'MissingClassSinceTag' );
			return;
		}

		// The sniff intentionally doesn't check if the docblock has a valid open tag.
		// Its only job is to make sure that the @since tag is present and has a valid version value.
		$doc_block_start_token = $phpcsFile->findPrevious( Tokens::$commentTokens, ( $doc_block_end_token - 1 ), null, true, null, true );
		if ( false === $doc_block_start_token ) {
			$phpcsFile->addError( $missing_since_tag_error_message, $stackPtr, 'MissingClassSinceTag' );
			return;
		}

		// This is the first non-docblock token, so the next token should be used.
		++ $doc_block_start_token;

		$since_tag_token = $phpcsFile->findNext( T_DOC_COMMENT_TAG, $doc_block_start_token, $doc_block_end_token, false, '@since', true );
		if ( false === $since_tag_token ) {
			$phpcsFile->addError( $missing_since_tag_error_message, $stackPtr, 'MissingClassSinceTag' );
			return;
		}

		$version_token = $phpcsFile->findNext( T_DOC_COMMENT_WHITESPACE, $since_tag_token + 1, null, true, null, true );
		if ( ( false === $version_token ) || ( T_DOC_COMMENT_STRING !== $tokens[ $version_token ]['code'] ) ) {
			$phpcsFile->addError( $missing_since_tag_error_message, $since_tag_token, 'MissingClassSinceTag' );
			return;
		}

		$version_value = $tokens[ $version_token ]['content'];

		if ( version_compare( $version_value, '0.0.1', '>=' ) ) {
			// Validate the version value.
			return;
		}

		$phpcsFile->addError(
			'Invalid @since version value for the "%s()" class: "%s". Version value must be greater than or equal to 0.0.1.',
			$version_token,
			'InvalidClassSinceTagVersionValue',
			array(
				$class_name,
				$version_value,
			)
		);
	}

	public function process_class_property_token( File $phpcsFile, $stackPtr ) {

		$tokens = $phpcsFile->getTokens();
		// All these tokens could be present before the docblock.
		$tokens_before_the_docblock = array(
			T_FINAL,
			T_ABSTRACT,
			T_WHITESPACE,
			T_ATTRIBUTE,
			T_ATTRIBUTE_END,
			T_STRING,
			T_NS_SEPARATOR
		);

		$tokens_before_the_docblock = array_merge($tokens_before_the_docblock, Tokens::$assignmentTokens);

		$property_name = $tokens[ $stackPtr ]['content'];
		$class_token   = $phpcsFile->getCondition( $stackPtr, T_CLASS, false );
		$class_name    = $phpcsFile->getDeclarationName( $class_token );
		$missing_since_tag_error_message = sprintf(
			'@since tag is missing for the "%s::%s" property.',
			$class_name,
			$property_name
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
		++ $doc_block_start_token;

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
			'Invalid @since version value for the "%s::%s" property: "%s". Version value must be greater than or equal to 0.0.1.',
			$version_token,
			'InvalidSinceTagVersionValue',
			array(
				$class_name,
				$property_name,
				$version_value,
			)
		);
	}

	protected function process_function_token( File $phpcsFile, $stackPtr ) {
		$tokens = $phpcsFile->getTokens();

		$oo_token      = Scopes::validDirectScope( $phpcsFile, $stackPtr, Tokens::$ooScopeTokens );
		$is_oo_method  = Scopes::isOOMethod( $phpcsFile, $stackPtr );
		$function_name = ObjectDeclarations::getName( $phpcsFile, $stackPtr );

		$violation_code = 'missingSinceTag';

		if ( $is_oo_method ) {
			$scope_modifier = FunctionDeclarations::getProperties( $phpcsFile, $stackPtr )['scope'];
			if ( ( $scope_modifier === 'protected'
			       && $this->minimumVisibility === 'public' )
			     || ( $scope_modifier === 'private'
			          && ( $this->minimumVisibility === 'public' || $this->minimumVisibility === 'protected' ) )
			) {
				return;
			}

			$function_name = ObjectDeclarations::getName( $phpcsFile, $oo_token ) . '::' . $function_name;
		}

		$missing_since_tag_error_message = sprintf(
			'@since tag is missing for the "%s()" %s.',
			$function_name,
			$is_oo_method ? 'method' : 'function'
		);

		$docblock = static::find_docblock($phpcsFile, $stackPtr);
		if (false === $docblock) {
			$phpcsFile->addError( $missing_since_tag_error_message, $stackPtr, $violation_code );
			return;
		}

		list( $doc_block_start_token, $doc_block_end_token ) = $docblock;

		$version_token = static::find_version_tag_token( $phpcsFile, $doc_block_start_token, $doc_block_end_token );
		if ( false === $version_token ) {
			$phpcsFile->addError( $missing_since_tag_error_message, $doc_block_start_token, $violation_code );
			return;
		}

		$version_value = $tokens[ $version_token ]['content'];

		if ( version_compare( $version_value, '0.0.1', '>=' ) ) {
			// Validate the version value.
			return;
		}

		$phpcsFile->addError(
			'Invalid @since version value for the "%s()" %s: "%s". Version value must be greater than or equal to 0.0.1.',
			$version_token,
			$violation_code,
			array(
				$function_name,
				$is_oo_method ? 'method' : 'function',
				$version_value,
			)
		);
	}

	/**
	 * Finds the docblock preceding a specified position (stack pointer) in a given PHP file.
	 * Implementation has been copied from FunctionCommentSniff::process().
	 *
	 * @param File $phpcsFile The file being scanned.
	 * @param int $stackPtr   The position (stack pointer) in the token stack from which to start searching backwards.
	 * @return array|false An array with the starting and ending token positions of the found docblock, or false if no docblock is found.
	 */
	private static function find_docblock( File $phpcsFile, $stackPtr ) {
		$tokens                 = $phpcsFile->getTokens();
		$ignore                 = Tokens::$methodPrefixes;
		$ignore[ T_WHITESPACE ] = T_WHITESPACE;

		for ( $comment_end = ( $stackPtr - 1 ); $comment_end >= 0; $comment_end -- ) {
			if ( isset( $ignore[ $tokens[ $comment_end ]['code'] ] ) === true ) {
				continue;
			}

			if ( $tokens[ $comment_end ]['code'] === T_ATTRIBUTE_END
			     && isset( $tokens[ $comment_end ]['attribute_opener'] ) === true
			) {
				$comment_end = $tokens[ $comment_end ]['attribute_opener'];
				continue;
			}

			break;
		}

		if ( $tokens[ $comment_end ]['code'] === T_COMMENT ) {
			// Inline comments might just be closing comments for
			// control structures or functions instead of function comments
			// using the wrong comment type. If there is other code on the line,
			// assume they relate to that code.
			$prev = $phpcsFile->findPrevious( $ignore, ( $comment_end - 1 ), null, true );
			if ( $prev !== false && $tokens[ $prev ]['line'] === $tokens[ $comment_end ]['line'] ) {
				$comment_end = $prev;
			}
		}

		if ( T_DOC_COMMENT_CLOSE_TAG !== $tokens[ $comment_end ]['code'] ) {
			return false;
		}

		return array(
			$tokens[ $comment_end ]['comment_opener'],
			$comment_end
		);
	}

	/**
	 * Searches for a version tag within a docblock.
	 *
	 * @param File $phpcsFile         The file being scanned.
	 * @param int $docBlockStartToken The token index where the docblock starts.
	 * @param int $docBlockEndToken   The token index where the docblock ends.
	 * @return false|int The token index of the version tag within the docblock if found, false otherwise.
	 */
	private static function find_version_tag_token( File $phpcsFile, $doc_block_start_token, $doc_block_end_token ) {
		$tokens          = $phpcsFile->getTokens();
		$since_tag_token = $phpcsFile->findNext( T_DOC_COMMENT_TAG, $doc_block_start_token, $doc_block_end_token, false, '@since', true );
		if ( false === $since_tag_token ) {
			return false;
		}

		$version_token = $phpcsFile->findNext( T_DOC_COMMENT_WHITESPACE, $since_tag_token + 1, null, true, null, true );
		if ( ( false === $version_token ) || ( T_DOC_COMMENT_STRING !== $tokens[ $version_token ]['code'] ) ) {
			return false;
		}

		return $version_token;
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
