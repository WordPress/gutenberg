<?php
/**
 * Gutenberg Coding Standards.
 *
 * @package gutenberg/gutenberg-coding-standards
 * @link    https://github.com/WordPress/gutenberg/tree/trunk/test/php/gutenberg-coding-standards
 */

namespace GutenbergCS\Gutenberg\Sniffs\Commenting;

use PHP_CodeSniffer\Files\File;
use PHP_CodeSniffer\Sniffs\Sniff;
use PHP_CodeSniffer\Util\Tokens;
use PHPCSUtils\Tokens\Collections;
use PHPCSUtils\Utils\FunctionDeclarations;
use PHPCSUtils\Utils\GetTokensAsString;
use PHPCSUtils\Utils\ObjectDeclarations;
use PHPCSUtils\Utils\Scopes;
use PHPCSUtils\Utils\Variables;

/**
 * This sniff verifies the presence of valid `@since` tags in the docblocks of various PHP structures
 * and WordPress hooks. Supported structures include classes, interfaces, traits, enums, functions, methods and properties.
 * Files located within the __experimental blocks of the block-library folder are excluded from checks.
 */
class SinceTagSniff implements Sniff {

	/**
	 * Disable the check for functions with a lower visibility than the value given.
	 *
	 * Allowed values are public, protected, and private.
	 *
	 * @var string
	 */
	public $minimumVisibility = 'private';

	/**
	 * A map of tokens representing an object-oriented programming structure to their human-readable names.
	 * This map helps in identifying different OO structures such as classes, interfaces, traits, and enums.
	 *
	 * @var array
	 */
	protected static $oo_tokens = array(
		T_CLASS     => array(
			'name' => 'class',
		),
		T_INTERFACE => array(
			'name' => 'interface',
		),
		T_TRAIT     => array(
			'name' => 'trait',
		),
		T_ENUM      => array(
			'name' => 'enum',
		),
	);

	/**
	 * This property is used to store results returned
	 * by the static::is_experimental_block() method.
	 *
	 * @var array
	 */
	protected static $cache = array();

	/**
	 * Returns an array of tokens this test wants to listen for.
	 *
	 * @return array<int|string>
	 */
	public function register() {
		return array_merge(
			array(
				T_FUNCTION,
				T_VARIABLE,
				T_STRING,
			),
			array_keys( static::$oo_tokens )
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

		if ( isset( static::$oo_tokens[ $token['code'] ] ) ) {
			$this->process_oo_token( $phpcsFile, $stackPtr );
			return;
		}

		if ( 'T_STRING' === $token['type'] && static::is_function_call( $phpcsFile, $stackPtr ) ) {
			$this->process_hook( $phpcsFile, $stackPtr );
			return;
		}

		if ( 'T_VARIABLE' === $token['type'] && Scopes::isOOProperty( $phpcsFile, $stackPtr ) ) {
			$this->process_property_token( $phpcsFile, $stackPtr );
		}
	}

	/**
	 * Processes a token representing a function call that invokes a WordPress hook,
	 * checking for a missing `@since` tag in its docblock.
	 *
	 * @param File $phpcs_file    The file being scanned.
	 * @param int  $stack_pointer The position of the hook token in the stack.
	 */
	protected function process_hook( File $phpcs_file, $stack_pointer ) {
		$tokens = $phpcs_file->getTokens();

		// The content of the current token.
		$hook_function = $tokens[ $stack_pointer ]['content'];

		$hook_invocation_functions = array(
			'do_action',
			'do_action_ref_array',
			'do_action_deprecated',
			'apply_filters',
			'apply_filters_ref_array',
			'apply_filters_deprecated',
		);

		// Check if the current token content is one of the filter functions.
		if ( ! in_array( $hook_function, $hook_invocation_functions, true ) ) {
			// Not a hook.
			return;
		}

		$error_message_data = array( $hook_function );

		$violation_codes = static::get_violation_codes( 'Hook' );

		$docblock = static::find_docblock( $phpcs_file, $stack_pointer );

		$version_tags = static::parse_since_tags( $phpcs_file, $docblock );
		if ( empty( $version_tags ) ) {
			if ( false !== $docblock ) {
				$docblock_content = GetTokensAsString::compact( $phpcs_file, $docblock['start_token'], $docblock['end_token'], false );
				if ( false !== stripos( $docblock_content, 'This filter is documented in ' ) ) {
					$hook_documented_elsewhere = true;
				}
			}

			if ( empty( $hook_documented_elsewhere ) ) {
				$phpcs_file->addError(
					'Missing @since tag for the "%s()" hook function.',
					$stack_pointer,
					$violation_codes['missing_since_tag'],
					$error_message_data
				);
			}

			return;
		}

		foreach ( $version_tags as $since_tag_token => $version_value_token ) {
			if ( null === $version_value_token ) {
				$phpcs_file->addError(
					'Missing @since tag version value for the "%s()" hook function.',
					$since_tag_token,
					$violation_codes['missing_version_value'],
					$error_message_data
				);
				continue;
			}

			$version_value = $tokens[ $version_value_token ]['content'];

			if ( static::validate_version( $version_value ) ) {
				continue;
			}

			$phpcs_file->addError(
				'Invalid @since version value for the "%s()" hook function: "%s". Version value must be greater than or equal to 0.0.1.',
				$version_value_token,
				$violation_codes['invalid_version_value'],
				array_merge( $error_message_data, array( $version_value ) )
			);
		}
	}

	/**
	 * Processes a token representing an object-oriented programming structure
	 * like a class, interface, trait, or enum to check for a missing `@since` tag in its docblock.
	 *
	 * @param File $phpcs_file    The file being scanned.
	 * @param int  $stack_pointer The position of the OO token in the stack.
	 */
	protected function process_oo_token( File $phpcs_file, $stack_pointer ) {
		$tokens     = $phpcs_file->getTokens();
		$token_type = static::$oo_tokens[ $tokens[ $stack_pointer ]['code'] ]['name'];

		$token_name         = ObjectDeclarations::getName( $phpcs_file, $stack_pointer );
		$error_message_data = array(
			$token_name,
			$token_type,
		);

		$violation_codes = static::get_violation_codes( ucfirst( $token_type ) );

		$docblock = static::find_docblock( $phpcs_file, $stack_pointer );

		$version_tags = static::parse_since_tags( $phpcs_file, $docblock );
		if ( empty( $version_tags ) ) {
			$phpcs_file->addError(
				'Missing @since tag for the "%s" %s.',
				$stack_pointer,
				$violation_codes['missing_since_tag'],
				$error_message_data
			);
			return;
		}

		foreach ( $version_tags as $since_tag_token => $version_value_token ) {
			if ( null === $version_value_token ) {
				$phpcs_file->addError(
					'Missing @since tag version value for the "%s" %s.',
					$since_tag_token,
					$violation_codes['missing_version_value'],
					$error_message_data
				);
				continue;
			}

			$version_value = $tokens[ $version_value_token ]['content'];

			if ( static::validate_version( $version_value ) ) {
				continue;
			}

			$phpcs_file->addError(
				'Invalid @since version value for the "%s" %s: "%s". Version value must be greater than or equal to 0.0.1.',
				$version_value_token,
				$violation_codes['invalid_version_value'],
				array_merge( $error_message_data, array( $version_value ) )
			);
		}
	}

	/**
	 * Processes a token representing an object-oriented property to check for a missing @since tag in its docblock.
	 *
	 * @param File $phpcs_file    The file being scanned.
	 * @param int  $stack_pointer The position of the object-oriented property token in the stack.
	 */
	protected function process_property_token( File $phpcs_file, $stack_pointer ) {
		$tokens = $phpcs_file->getTokens();

		$property_name = $tokens[ $stack_pointer ]['content'];
		$oo_token      = Scopes::validDirectScope( $phpcs_file, $stack_pointer, Collections::ooPropertyScopes() );
		$class_name    = ObjectDeclarations::getName( $phpcs_file, $oo_token );

		$visibility = Variables::getMemberProperties( $phpcs_file, $stack_pointer )['scope'];
		if ( $this->check_below_minimum_visibility( $visibility ) ) {
			return;
		}

		$violation_codes = static::get_violation_codes( 'Property' );

		$error_message_data = array(
			$class_name,
			$property_name,
		);

		$docblock = static::find_docblock( $phpcs_file, $stack_pointer );

		$version_tags = static::parse_since_tags( $phpcs_file, $docblock );
		if ( empty( $version_tags ) ) {
			$phpcs_file->addError(
				'Missing @since tag for the "%s::%s" property.',
				$stack_pointer,
				$violation_codes['missing_since_tag'],
				$error_message_data
			);
			return;
		}

		foreach ( $version_tags as $since_tag_token => $version_value_token ) {
			if ( null === $version_value_token ) {
				$phpcs_file->addError(
					'Missing @since tag version value for the "%s::%s" property.',
					$since_tag_token,
					$violation_codes['missing_version_value'],
					$error_message_data
				);
				continue;
			}

			$version_value = $tokens[ $version_value_token ]['content'];

			if ( static::validate_version( $version_value ) ) {
				continue;
			}

			$phpcs_file->addError(
				'Invalid @since version value for the "%s::%s" property: "%s". Version value must be greater than or equal to 0.0.1.',
				$version_value_token,
				$violation_codes['invalid_version_value'],
				array_merge( $error_message_data, array( $version_value ) )
			);
		}
	}

	/**
	 * Processes a T_FUNCTION token to check for a missing @since tag in its docblock.
	 *
	 * @param File $phpcs_file    The file being scanned.
	 * @param int  $stack_pointer The position of the T_FUNCTION token in the stack.
	 */
	protected function process_function_token( File $phpcs_file, $stack_pointer ) {
		$tokens = $phpcs_file->getTokens();

		$oo_token      = Scopes::validDirectScope( $phpcs_file, $stack_pointer, Tokens::$ooScopeTokens );
		$function_name = ObjectDeclarations::getName( $phpcs_file, $stack_pointer );

		$token_type = 'function';
		if ( Scopes::isOOMethod( $phpcs_file, $stack_pointer ) ) {
			$visibility = FunctionDeclarations::getProperties( $phpcs_file, $stack_pointer )['scope'];
			if ( $this->check_below_minimum_visibility( $visibility ) ) {
				return;
			}

			$function_name = ObjectDeclarations::getName( $phpcs_file, $oo_token ) . '::' . $function_name;
			$token_type    = 'method';
		}

		$violation_codes = static::get_violation_codes( ucfirst( $token_type ) );

		$error_message_data = array(
			$function_name,
			$token_type,
		);

		$docblock = static::find_docblock( $phpcs_file, $stack_pointer );

		$version_tags = static::parse_since_tags( $phpcs_file, $docblock );
		if ( empty( $version_tags ) ) {
			$phpcs_file->addError(
				'Missing @since tag for the "%s()" %s.',
				$stack_pointer,
				$violation_codes['missing_since_tag'],
				$error_message_data
			);
			return;
		}

		foreach ( $version_tags as $since_tag_token => $version_value_token ) {
			if ( null === $version_value_token ) {
				$phpcs_file->addError(
					'Missing @since tag version value for the "%s()" %s.',
					$since_tag_token,
					$violation_codes['missing_version_value'],
					$error_message_data
				);
				continue;
			}

			$version_value = $tokens[ $version_value_token ]['content'];

			if ( static::validate_version( $version_value ) ) {
				continue;
			}

			$phpcs_file->addError(
				'Invalid @since version value for the "%s()" %s: "%s". Version value must be greater than or equal to 0.0.1.',
				$version_value_token,
				$violation_codes['invalid_version_value'],
				array_merge( $error_message_data, array( $version_value ) )
			);
		}
	}

	/**
	 * Validates the version value.
	 *
	 * @param string $version The version value being checked.
	 * @return bool True if the version value is valid.
	 */
	protected static function validate_version( $version ) {
		$matches = array();
		if ( 1 === preg_match( '/^MU \((?<version>.+)\)/', $version, $matches ) ) {
			$version = $matches['version'];
		}

		return version_compare( $version, '0.0.1', '>=' );
	}


	/**
	 * Returns violation codes for a specific token type.
	 *
	 * @param string $token_type The type of token (e.g., Function, Property) to retrieve violation codes for.
	 * @return array An array containing violation codes for missing since tag, missing version value, and invalid version value.
	 */
	protected static function get_violation_codes( $token_type ) {
		return array(
			'missing_since_tag'     => 'Missing' . $token_type . 'SinceTag',
			'missing_version_value' => 'Missing' . $token_type . 'VersionValue',
			'invalid_version_value' => 'Invalid' . $token_type . 'VersionValue',
		);
	}

	/**
	 * Checks if the provided visibility level is below the set minimum visibility level.
	 *
	 * @param string $visibility The visibility level to check.
	 * @return bool Returns true if the provided visibility level is below the minimum visibility level, false otherwise.
	 */
	protected function check_below_minimum_visibility( $visibility ) {
		if ( 'public' === $this->minimumVisibility && in_array( $visibility, array( 'protected', 'private' ), true ) ) {
			return true;
		}

		if ( 'protected' === $this->minimumVisibility && 'private' === $visibility ) {
			return true;
		}

		return false;
	}

	/**
	 * Finds the first token on the previous line relative to the stack pointer passed to the method.
	 *
	 * @param File $phpcs_file    The file being scanned.
	 * @param int  $stack_pointer The position to find the previous line token from.
	 * @return int|false The last token on the previous line, or false if not found.
	 */
	protected static function find_previous_line_token( File $phpcs_file, $stack_pointer ) {
		$tokens       = $phpcs_file->getTokens();
		$current_line = $tokens[ $stack_pointer ]['line'];

		for ( $token = $stack_pointer; $token >= 0; $token-- ) {
			if ( $tokens[ $token ]['line'] < $current_line ) {
				return $token;
			}
		}

		return false;
	}

	/**
	 * Finds the docblock preceding a specified position (stack pointer) in a given PHP file.
	 *
	 * @param File $phpcs_file    The file being scanned.
	 * @param int  $stack_pointer The position (stack pointer) in the token stack from which to start searching backwards.
	 * @return array|false An associative array containing the start and end tokens of the docblock, or false if not found.
	 */
	protected static function find_docblock( File $phpcs_file, $stack_pointer ) {
		// It can be assumed that the DocBlock should end on the previous line, not the current one.
		$previous_line_end_token = static::find_previous_line_token( $phpcs_file, $stack_pointer );
		if ( false === $previous_line_end_token ) {
			return false;
		}

		$docblock_end_token = $phpcs_file->findPrevious( array( T_WHITESPACE ), $previous_line_end_token, null, true );

		$tokens = $phpcs_file->getTokens();
		if ( false === $docblock_end_token || T_DOC_COMMENT_CLOSE_TAG !== $tokens[ $docblock_end_token ]['code'] ) {
			// Only "/**" style comments are supported.
			return false;
		}

		return array(
			'start_token' => $tokens[ $docblock_end_token ]['comment_opener'],
			'end_token'   => $docblock_end_token,
		);
	}

	/**
	 * Determines if a T_STRING token represents a function call.
	 *
	 * @param File $phpcs_file    The file being scanned.
	 * @param int  $stack_pointer The position of the T_STRING token in question.
	 * @return bool True if the token represents a function call, false otherwise.
	 */
	protected static function is_function_call( File $phpcs_file, $stack_pointer ) {
		$tokens = $phpcs_file->getTokens();

		// Find the previous non-empty token.
		$previous = $phpcs_file->findPrevious( Tokens::$emptyTokens, ( $stack_pointer - 1 ), null, true );

		$previous_tokens_to_ignore = array(
			T_NEW,             // Creating an object.
			T_OBJECT_OPERATOR, // Calling an object.
			T_FUNCTION,        // Function declaration.
		);

		if ( in_array( $tokens[ $previous ]['code'], $previous_tokens_to_ignore, true ) ) {
			// This is an object or function declaration.
			return false;
		}

		// Find the next non-empty token.
		$open_bracket = $phpcs_file->findNext( Tokens::$emptyTokens, ( $stack_pointer + 1 ), null, true );

		return ( false !== $open_bracket ) && ( T_OPEN_PARENTHESIS === $tokens[ $open_bracket ]['code'] );
	}

	/**
	 * Searches for @since values within a docblock.
	 *
	 * @param File        $phpcs_file The file being scanned.
	 * @param array|false $docblock   An associative array containing the start and end tokens of the docblock, or false if not exists.
	 * @return array Returns an array of "@since" tokens and their corresponding value tokens.
	 */
	protected static function parse_since_tags( File $phpcs_file, $docblock ) {
		$version_tags = array();

		if ( false === $docblock ) {
			return $version_tags;
		}

		$tokens = $phpcs_file->getTokens();

		for ( $i = $docblock['start_token'] + 1; $i < $docblock['end_token']; $i++ ) {
			if ( ! ( T_DOC_COMMENT_TAG === $tokens[ $i ]['code'] && '@since' === $tokens[ $i ]['content'] ) ) {
				continue;
			}

			$version_token = $phpcs_file->findNext( T_DOC_COMMENT_WHITESPACE, $i + 1, $docblock['end_token'], true, null, true );
			if ( ( false === $version_token ) || ( T_DOC_COMMENT_STRING !== $tokens[ $version_token ]['code'] ) ) {
				$version_tags[ $i ] = null;
				continue;
			}

			$version_tags[ $i ] = $version_token;
		}

		return $version_tags;
	}

	/**
	 * Checks if the current block is experimental.
	 *
	 * @param File $phpcs_file The file being scanned.
	 * @return bool Returns true if the current block is experimental.
	 */
	protected static function is_experimental_block( File $phpcs_file ) {
		$block_json_filepath = dirname( $phpcs_file->getFilename() ) . DIRECTORY_SEPARATOR . 'block.json';

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
