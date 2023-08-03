<?php
/**
 * Gutenberg Coding Standards.
 *
 * @package gutenberg/gutenberg-coding-standards
 * @link    https://github.com/WordPress/gutenberg
 * @license https://opensource.org/licenses/MIT MIT
 */

namespace GutenbergCS\Gutenberg\Sniffs\CodeAnalysis;

use PHP_CodeSniffer\Util\Tokens;
use PHPCSUtils\BackCompat\Helper;
use PHPCSUtils\Tokens\Collections;
use PHPCSUtils\Utils\Conditions;
use PHPCSUtils\Utils\Context;
use PHPCSUtils\Utils\FunctionDeclarations;
use PHPCSUtils\Utils\Lists;
use PHPCSUtils\Utils\MessageHelper;
use PHPCSUtils\Utils\ObjectDeclarations;
use PHPCSUtils\Utils\Namespaces;
use PHPCSUtils\Utils\Parentheses;
use PHPCSUtils\Utils\PassedParameters;
use PHPCSUtils\Utils\Scopes;
use PHPCSUtils\Utils\TextStrings;
use PHPCSUtils\Utils\Variables;
use WordPressCS\WordPress\AbstractFunctionParameterSniff;
use WordPressCS\WordPress\Helpers\DeprecationHelper;
use WordPressCS\WordPress\Helpers\IsUnitTestTrait;
use WordPressCS\WordPress\Helpers\RulesetPropertyHelper;
use WordPressCS\WordPress\Helpers\VariableHelper;
use WordPressCS\WordPress\Helpers\WPGlobalVariablesHelper;
use WordPressCS\WordPress\Helpers\WPHookHelper;

/**
 * Verify that everything defined in the global namespace is prefixed with a theme/plugin specific prefix.
 *
 * @package WPCS\WordPressCodingStandards
 *
 * @since   0.12.0
 * @since   0.13.0 Class name changed: this class is now namespaced.
 * @since   1.2.0  Now also checks whether namespaces are prefixed.
 * @since   2.2.0  - Now also checks variables assigned via the list() construct.
 *                 - Now also ignores global functions which are marked as @deprecated.
 *
 * @uses    \WordPressCS\WordPress\Helpers\IsUnitTestTrait::$custom_test_classes
 */
final class PrefixAllGlobalsSniff extends AbstractFunctionParameterSniff {

	use IsUnitTestTrait;

	/**
	 * Error message template.
	 *
	 * @var string
	 */
	const ERROR_MSG = '%s by a theme/plugin should start with the theme/plugin prefix. Found: "%s".';

	/**
	 * Minimal number of characters the prefix needs in order to be valid.
	 *
	 * @since 2.2.0
	 *
	 * @link https://github.com/WordPress/WordPress-Coding-Standards/issues/1733 Issue 1733.
	 *
	 * @var int
	 */
	const MIN_PREFIX_LENGTH = 3;

	/**
	 * Target prefixes.
	 *
	 * @since 0.12.0
	 *
	 * @var string[]|string
	 */
	public $prefixes = '';

	/**
	 * Prefix blocklist.
	 *
	 * @since 0.12.0
	 * @since 3.0.0  Renamed from `$prefix_blacklist` to `$prefix_blocklist`.
	 *
	 * @var string[]
	 */
	protected $prefix_blocklist = array(
		'wordpress' => true,
		'wp'        => true,
		'_'         => true,
		'php'       => true, // See #1728, the 'php' prefix is reserved by PHP itself.
	);

	/**
	 * Target prefixes after validation.
	 *
	 * All prefixes are lowercased for case-insensitive compare.
	 *
	 * @since 0.12.0
	 *
	 * @var string[]
	 */
	private $validated_prefixes = array();

	/**
	 * Target namespace prefixes after validation with regex indicator.
	 *
	 * All prefixes are lowercased for case-insensitive compare.
	 * If the prefix doesn't already contain a namespace separator, but does contain
	 * non-word characters, these will have been replaced with regex syntax to allow
	 * for namespace separators and the `is_regex` indicator will have been set to `true`.
	 *
	 * @since 1.2.0
	 *
	 * @var array
	 */
	private $validated_namespace_prefixes = array();

	/**
	 * Cache of previously set prefixes.
	 *
	 * Prevents having to do the same prefix validation over and over again.
	 *
	 * @since 0.12.0
	 *
	 * @var string[]
	 */
	private $previous_prefixes = array();

	/**
	 * A list of core hooks that are allowed to be called by plugins and themes.
	 *
	 * @since 0.14.0
	 * @since 3.0.0 Renamed from `$whitelisted_core_hooks` to `$allowed_core_hooks`.
	 *
	 * @var array
	 */
	protected $allowed_core_hooks = array(
		'widget_title'   => true,
		'add_meta_boxes' => true,
	);

	/**
	 * A list of core constants that are allowed to be defined by plugins and themes.
	 *
	 * @since 1.0.0
	 * @since 3.0.0 Renamed from `$whitelisted_core_constants` to `$allowed_core_constants`.
	 *
	 * Source: {@link https://core.trac.wordpress.org/browser/trunk/src/wp-includes/default-constants.php#L0}
	 * The constants are listed in the order they are found in the source file
	 * to make life easier for future updates.
	 * Only overrulable constants are listed, i.e. those defined within core within
	 * a `if ( ! defined() ) {}` wrapper.
	 *
	 * @var array
	 */
	protected $allowed_core_constants = array(
		'WP_MEMORY_LIMIT'      => true,
		'WP_MAX_MEMORY_LIMIT'  => true,
		'WP_CONTENT_DIR'       => true,
		'WP_DEBUG'             => true,
		'WP_DEBUG_DISPLAY'     => true,
		'WP_DEBUG_LOG'         => true,
		'WP_CACHE'             => true,
		'SCRIPT_DEBUG'         => true,
		'MEDIA_TRASH'          => true,
		'SHORTINIT'            => true,
		'WP_CONTENT_URL'       => true,
		'WP_PLUGIN_DIR'        => true,
		'WP_PLUGIN_URL'        => true,
		'PLUGINDIR'            => true,
		'WPMU_PLUGIN_DIR'      => true,
		'WPMU_PLUGIN_URL'      => true,
		'MUPLUGINDIR'          => true,
		'COOKIEHASH'           => true,
		'USER_COOKIE'          => true,
		'PASS_COOKIE'          => true,
		'AUTH_COOKIE'          => true,
		'SECURE_AUTH_COOKIE'   => true,
		'LOGGED_IN_COOKIE'     => true,
		'TEST_COOKIE'          => true,
		'COOKIEPATH'           => true,
		'SITECOOKIEPATH'       => true,
		'ADMIN_COOKIE_PATH'    => true,
		'PLUGINS_COOKIE_PATH'  => true,
		'COOKIE_DOMAIN'        => true,
		'RECOVERY_MODE_COOKIE' => true,
		'FORCE_SSL_ADMIN'      => true,
		'FORCE_SSL_LOGIN'      => true,
		'AUTOSAVE_INTERVAL'    => true,
		'EMPTY_TRASH_DAYS'     => true,
		'WP_POST_REVISIONS'    => true,
		'WP_CRON_LOCK_TIMEOUT' => true,
		'WP_DEFAULT_THEME'     => true,
	);

	/**
	 * List of all PHP native functions.
	 *
	 * Using this list rather than a call to `function_exists()` prevents
	 * false negatives from user-defined functions when those would be
	 * autoloaded via a Composer autoload files directives.
	 *
	 * @var array
	 */
	private $built_in_functions;


	/**
	 * Returns an array of tokens this test wants to listen for.
	 *
	 * @since 0.12.0
	 *
	 * @return array
	 */
	public function register() {
		// Get a list of all PHP native functions.
		$all_functions            = get_defined_functions();
		$this->built_in_functions = array_flip( $all_functions['internal'] );

		// Set the sniff targets.
		$targets  = array(
			\T_NAMESPACE => \T_NAMESPACE,
			\T_FUNCTION  => \T_FUNCTION,
			\T_CONST     => \T_CONST,
			\T_VARIABLE  => \T_VARIABLE,
			\T_DOLLAR    => \T_DOLLAR, // Variable variables.
			\T_FN_ARROW  => \T_FN_ARROW, // T_FN_ARROW is only used for skipping over (for now).
		);
		$targets += Tokens::$ooScopeTokens; // T_ANON_CLASS is only used for skipping over test classes.
		$targets += Collections::listOpenTokensBC();

		// Add function call target for hook names and constants defined using define().
		$parent = parent::register();
		if ( ! empty( $parent ) ) {
			$targets[] = \T_STRING;
		}

		return $targets;
	}

	/**
	 * Groups of functions to restrict.
	 *
	 * @since 0.12.0
	 *
	 * @return array
	 */
	public function getGroups() {
		// Only retrieve functions which are not used for deprecated hooks.
		$this->target_functions           = WPHookHelper::get_functions( false );
		$this->target_functions['define'] = true;

		return parent::getGroups();
	}

	/**
	 * Processes this test, when one of its tokens is encountered.
	 *
	 * @since 0.12.0
	 *
	 * @param int $stackPtr The position of the current token in the stack.
	 *
	 * @return int|void Integer stack pointer to skip forward or void to continue
	 *                  normal file processing.
	 */
	public function process_token( $stackPtr ) {

		// Allow overruling the prefixes set in a ruleset via the command line.
		$cl_prefixes = Helper::getConfigData( 'prefixes' );
		if ( ! empty( $cl_prefixes ) ) {
			$cl_prefixes = trim( $cl_prefixes );
			if ( '' !== $cl_prefixes ) {
				$this->prefixes = array_filter( array_map( 'trim', explode( ',', $cl_prefixes ) ) );
			}
		}

		$this->prefixes = RulesetPropertyHelper::merge_custom_array( $this->prefixes, array(), false );
		if ( empty( $this->prefixes ) ) {
			// No prefixes passed, nothing to do.
			return;
		}

		$this->validate_prefixes();
		if ( empty( $this->validated_prefixes ) ) {
			// No _valid_ prefixes passed, nothing to do.
			return;
		}

		// Ignore test classes.
		if ( isset( Tokens::$ooScopeTokens[ $this->tokens[ $stackPtr ]['code'] ] )
		     && true === $this->is_test_class( $this->phpcsFile, $stackPtr )
		) {
			if ( $this->tokens[ $stackPtr ]['scope_condition'] === $stackPtr && isset( $this->tokens[ $stackPtr ]['scope_closer'] ) ) {
				// Skip forward to end of test class.
				return $this->tokens[ $stackPtr ]['scope_closer'];
			}
			return;
		}

		if ( \T_ANON_CLASS === $this->tokens[ $stackPtr ]['code'] ) {
			// Token was only registered to allow skipping over test classes.
			return;
		}

		/*
		 * Ignore the contents of arrow functions which do not declare closures.
		 *
		 * - Parameters declared by arrow functions do not need to be prefixed (handled elsewhere).
		 * - New variables declared within an arrow function are local to the arrow function, so can be ignored.
		 * - A `global` statement is not allowed within an arrow function.
		 *
		 * Note: this does mean some convoluted code may get ignored (false negatives), but this is currently
		 * not reliably solvable as PHPCS does not add arrow functions to the 'conditions' array.
		 */
		if ( \T_FN_ARROW === $this->tokens[ $stackPtr ]['code']
		     && isset( $this->tokens[ $stackPtr ]['scope_closer'] )
		) {
			$has_closure = $this->phpcsFile->findNext( \T_CLOSURE, ( $stackPtr + 1 ), $this->tokens[ $stackPtr ]['scope_closer'] );
			if ( false !== $has_closure ) {
				// Skip to the start of the closure.
				return $has_closure;
			}

			// Skip the arrow function completely.
			return $this->tokens[ $stackPtr ]['scope_closer'];
		}

		if ( \T_STRING === $this->tokens[ $stackPtr ]['code'] ) {
			// Disallow excluding function groups for this sniff.
			$this->exclude = array();

			return parent::process_token( $stackPtr );

		} elseif ( \T_DOLLAR === $this->tokens[ $stackPtr ]['code'] ) {

			return $this->process_variable_variable( $stackPtr );

		} elseif ( \T_VARIABLE === $this->tokens[ $stackPtr ]['code'] ) {

			return $this->process_variable_assignment( $stackPtr );

		} elseif ( isset( Collections::listOpenTokensBC()[ $this->tokens[ $stackPtr ]['code'] ] ) ) {
			return $this->process_list_assignment( $stackPtr );

		} elseif ( \T_NAMESPACE === $this->tokens[ $stackPtr ]['code'] ) {
			$namespace_name = Namespaces::getDeclaredName( $this->phpcsFile, $stackPtr );

			if ( false === $namespace_name || '' === $namespace_name || '\\' === $namespace_name ) {
				return;
			}

			foreach ( $this->validated_namespace_prefixes as $key => $prefix_info ) {
				if ( false === $prefix_info['is_regex'] ) {
					if ( stripos( $namespace_name, $prefix_info['prefix'] ) === 0 ) {
						$this->phpcsFile->recordMetric( $stackPtr, 'Prefix all globals: allowed prefixes', $key );
						return;
					}
				} else {
					// Ok, so this prefix should be used as a regex.
					$regex = '`^' . $prefix_info['prefix'] . '`i';
					if ( preg_match( $regex, $namespace_name ) > 0 ) {
						$this->phpcsFile->recordMetric( $stackPtr, 'Prefix all globals: allowed prefixes', $key );
						return;
					}
				}
			}

			// Still here ? In that case, we have a non-prefixed namespace name.
			$recorded = $this->phpcsFile->addError(
				self::ERROR_MSG,
				$stackPtr,
				'NonPrefixedNamespaceFound',
				array(
					'Namespaces declared',
					$namespace_name,
				)
			);

			if ( true === $recorded ) {
				$this->record_potential_prefix_metric( $stackPtr, $namespace_name );
			}

			return;

		} else {

			// Namespaced methods, classes and constants do not need to be prefixed.
			$namespace = Namespaces::determineNamespace( $this->phpcsFile, $stackPtr );
			if ( '' !== $namespace && '\\' !== $namespace ) {
				return;
			}

			$item_name  = '';
			$error_text = 'Unknown syntax used';
			$error_code = 'NonPrefixedSyntaxFound';

			switch ( $this->tokens[ $stackPtr ]['code'] ) {
				case \T_FUNCTION:
					// Methods in a class do not need to be prefixed.
					if ( Scopes::isOOMethod( $this->phpcsFile, $stackPtr ) === true ) {
						return;
					}

					if ( DeprecationHelper::is_function_deprecated( $this->phpcsFile, $stackPtr ) === true ) {
						/*
						 * Deprecated functions don't have to comply with the naming conventions,
						 * otherwise functions deprecated in favour of a function with a compliant
						 * name would still trigger an error.
						 */
						return;
					}

					$item_name = FunctionDeclarations::getName( $this->phpcsFile, $stackPtr );
					if ( isset( $this->built_in_functions[ $item_name ] ) ) {
						// Backfill for PHP native function.
						return;
					}

					$error_text = 'Functions declared in the global namespace';
					$error_code = 'NonPrefixedFunctionFound';
					break;

				case \T_CLASS:
				case \T_INTERFACE:
				case \T_TRAIT:
				case \T_ENUM:
					$item_name  = ObjectDeclarations::getName( $this->phpcsFile, $stackPtr );
					$error_text = 'Classes declared';
					$error_code = 'NonPrefixedClassFound';

					switch ( $this->tokens[ $stackPtr ]['code'] ) {
						case \T_CLASS:
							if ( class_exists( '\\' . $item_name, false ) ) {
								// Backfill for PHP native class.
								return;
							}
							break;

						case \T_INTERFACE:
							if ( interface_exists( '\\' . $item_name, false ) ) {
								// Backfill for PHP native interface.
								return;
							}

							$error_text = 'Interfaces declared';
							$error_code = 'NonPrefixedInterfaceFound';
							break;

						case \T_TRAIT:
							// phpcs:ignore PHPCompatibility.FunctionUse.NewFunctions.trait_existsFound
							if ( function_exists( '\trait_exists' ) && trait_exists( '\\' . $item_name, false ) ) {
								// Backfill for PHP native trait.
								return;
							}

							$error_text = 'Traits declared';
							$error_code = 'NonPrefixedTraitFound';
							break;

						case \T_ENUM:
							// phpcs:ignore PHPCompatibility.FunctionUse.NewFunctions.enum_existsFound
							if ( function_exists( '\enum_exists' ) && enum_exists( '\\' . $item_name, false ) ) {
								// Backfill for PHP native enum.
								return;
							}

							$error_text = 'Enums declared';
							$error_code = 'NonPrefixedEnumFound';
							break;
					}

					break;

				case \T_CONST:
					// Constants in an OO construct do not need to be prefixed.
					if ( true === Scopes::isOOConstant( $this->phpcsFile, $stackPtr ) ) {
						return;
					}

					$constant_name_ptr = $this->phpcsFile->findNext( Tokens::$emptyTokens, ( $stackPtr + 1 ), null, true, null, true );
					if ( false === $constant_name_ptr ) {
						// Live coding.
						return;
					}

					$item_name = $this->tokens[ $constant_name_ptr ]['content'];
					if ( \defined( '\\' . $item_name ) ) {
						// Backfill for PHP native constant.
						return;
					}

					if ( isset( $this->allowed_core_constants[ $item_name ] ) ) {
						// Defining a WP Core constant intended for overruling.
						return;
					}

					$error_text = 'Global constants defined';
					$error_code = 'NonPrefixedConstantFound';
					break;

				default:
					// Left empty on purpose.
					break;

			}

			if ( empty( $item_name ) || $this->is_prefixed( $stackPtr, $item_name ) === true ) {
				return;
			}

			$recorded = $this->phpcsFile->addError(
				self::ERROR_MSG,
				$stackPtr,
				$error_code,
				array(
					$error_text,
					$item_name,
				)
			);

			if ( true === $recorded ) {
				$this->record_potential_prefix_metric( $stackPtr, $item_name );
			}
		}
	}

	/**
	 * Handle variable variables defined in the global namespace.
	 *
	 * @since 0.12.0
	 *
	 * @param int $stackPtr The position of the current token in the stack.
	 *
	 * @return int|void Integer stack pointer to skip forward or void to continue
	 *                  normal file processing.
	 */
	protected function process_variable_variable( $stackPtr ) {
		static $indicators = array(
			\T_OPEN_CURLY_BRACKET => true,
			\T_VARIABLE           => true,
		);

		// Is this a variable variable ?
		// Not concerned with nested ones as those will be recognized on their own token.
		$next_non_empty = $this->phpcsFile->findNext( Tokens::$emptyTokens, ( $stackPtr + 1 ), null, true, null, true );
		if ( false === $next_non_empty || ! isset( $indicators[ $this->tokens[ $next_non_empty ]['code'] ] ) ) {
			return;
		}

		if ( \T_OPEN_CURLY_BRACKET === $this->tokens[ $next_non_empty ]['code']
		     && isset( $this->tokens[ $next_non_empty ]['bracket_closer'] )
		) {
			// Skip over the variable part.
			$next_non_empty = $this->tokens[ $next_non_empty ]['bracket_closer'];
		}

		$maybe_assignment = $this->phpcsFile->findNext( Tokens::$emptyTokens, ( $next_non_empty + 1 ), null, true, null, true );

		while ( false !== $maybe_assignment
		        && \T_OPEN_SQUARE_BRACKET === $this->tokens[ $maybe_assignment ]['code']
		        && isset( $this->tokens[ $maybe_assignment ]['bracket_closer'] )
		) {
			$maybe_assignment = $this->phpcsFile->findNext(
				Tokens::$emptyTokens,
				( $this->tokens[ $maybe_assignment ]['bracket_closer'] + 1 ),
				null,
				true,
				null,
				true
			);
		}

		if ( false === $maybe_assignment ) {
			return;
		}

		if ( ! isset( Tokens::$assignmentTokens[ $this->tokens[ $maybe_assignment ]['code'] ] ) ) {
			// Not an assignment.
			return;
		}

		$error = self::ERROR_MSG;

		/*
		 * Local variable variables in a function do not need to be prefixed.
		 * But a variable variable could evaluate to the name of an imported global
		 * variable.
		 * Not concerned with imported variable variables (global.. ) as that has been
		 * forbidden since PHP 7.0. Presuming cross-version code and if not, that
		 * is for the PHPCompatibility standard to detect.
		 */
		$functionPtr = Conditions::getLastCondition( $this->phpcsFile, $stackPtr, Collections::functionDeclarationTokens() );
		if ( false !== $functionPtr ) {
			$has_global = $this->phpcsFile->findPrevious( \T_GLOBAL, ( $stackPtr - 1 ), $this->tokens[ $functionPtr ]['scope_opener'] );
			if ( false === $has_global ) {
				// No variable import happening.
				return;
			}

			$error = 'Variable variable which could potentially override an imported global variable detected. ' . $error;
		}

		$variable_name = $this->phpcsFile->getTokensAsString( $stackPtr, ( ( $next_non_empty - $stackPtr ) + 1 ) );

		// Still here ? In that case, the variable name should be prefixed.
		$recorded = $this->phpcsFile->addWarning(
			$error,
			$stackPtr,
			'NonPrefixedVariableFound',
			array(
				'Global variables defined',
				$variable_name,
			)
		);

		if ( true === $recorded ) {
			$this->record_potential_prefix_metric( $stackPtr, $variable_name );
		}

		// Skip over the variable part of the variable.
		return ( $next_non_empty + 1 );
	}

	/**
	 * Check that defined global variables are prefixed.
	 *
	 * @since 0.12.0
	 * @since 2.2.0  Added $in_list parameter.
	 *
	 * @param int  $stackPtr The position of the current token in the stack.
	 * @param bool $in_list  Whether or not this is a variable in a list assignment.
	 *                       Defaults to false.
	 *
	 * @return int|void Integer stack pointer to skip forward or void to continue
	 *                  normal file processing.
	 */
	protected function process_variable_assignment( $stackPtr, $in_list = false ) {
		/*
		 * We're only concerned with variables which are being defined.
		 * `is_assigment()` will not recognize property assignments, which is good in this case.
		 * However it will also not recognize $b in `foreach( $a as $b )` as an assignment, so
		 * we need a separate check for that.
		 */
		if ( false === $in_list
		     && false === VariableHelper::is_assignment( $this->phpcsFile, $stackPtr )
		     && Context::inForeachCondition( $this->phpcsFile, $stackPtr ) !== 'afterAs'
		) {
			return;
		}

		$is_error      = true;
		$variable_name = substr( $this->tokens[ $stackPtr ]['content'], 1 ); // Strip the dollar sign.

		// Bow out early if we know for certain no prefix is needed.
		if ( 'GLOBALS' !== $variable_name
		     && $this->variable_prefixed_or_allowed( $stackPtr, $variable_name ) === true
		) {
			return;
		}

		if ( 'GLOBALS' === $variable_name ) {
			$array_open = $this->phpcsFile->findNext( Tokens::$emptyTokens, ( $stackPtr + 1 ), null, true, null, true );
			if ( false === $array_open || \T_OPEN_SQUARE_BRACKET !== $this->tokens[ $array_open ]['code'] ) {
				// Live coding or something very silly.
				return;
			}

			$array_key = $this->phpcsFile->findNext( Tokens::$emptyTokens, ( $array_open + 1 ), null, true, null, true );
			if ( false === $array_key ) {
				// No key found, nothing to do.
				return;
			}

			$stackPtr      = $array_key;
			$variable_name = TextStrings::stripQuotes( $this->tokens[ $array_key ]['content'] );

			// Check whether a prefix is needed.
			if ( isset( Tokens::$stringTokens[ $this->tokens[ $array_key ]['code'] ] )
			     && $this->variable_prefixed_or_allowed( $stackPtr, $variable_name ) === true
			) {
				return;
			}

			if ( \T_DOUBLE_QUOTED_STRING === $this->tokens[ $array_key ]['code'] ) {
				// If the array key is a double quoted string, try again with only
				// the part before the first variable (if any).
				$exploded = explode( '$', $variable_name );
				$first    = rtrim( $exploded[0], '{' );
				if ( '' !== $first ) {
					if ( $this->variable_prefixed_or_allowed( $array_key, $first ) === true ) {
						return;
					}
				} else {
					// If the first part was dynamic, throw a warning.
					$is_error = false;
				}
			} elseif ( ! isset( Tokens::$stringTokens[ $this->tokens[ $array_key ]['code'] ] ) ) {
				// Dynamic array key, throw a warning.
				$is_error = false;
			}
		} else {
			// Function parameters do not need to be prefixed.
			if ( false === $in_list ) {
				$functionPtr = Parentheses::getLastOwner( $this->phpcsFile, $stackPtr, Collections::functionDeclarationTokens() );
				if ( false !== $functionPtr ) {
					return;
				}
				unset( $functionPtr );
			}

			// Properties in a class do not need to be prefixed.
			if ( false === $in_list && true === Scopes::isOOProperty( $this->phpcsFile, $stackPtr ) ) {
				return;
			}

			// Local variables in a function do not need to be prefixed unless they are being imported.
			$functionPtr = Conditions::getLastCondition( $this->phpcsFile, $stackPtr, Collections::functionDeclarationTokens() );
			if ( false !== $functionPtr ) {
				$has_global = $this->phpcsFile->findPrevious( \T_GLOBAL, ( $stackPtr - 1 ), $this->tokens[ $functionPtr ]['scope_opener'] );
				if ( false === $has_global
				     || Conditions::getLastCondition( $this->phpcsFile, $has_global, Collections::functionDeclarationTokens() ) !== $functionPtr
				) {
					// No variable import happening in the current scope.
					return;
				}

				// Ok, this may be an imported global variable.
				$end_of_statement = $this->phpcsFile->findNext( array( \T_SEMICOLON, \T_CLOSE_TAG ), ( $has_global + 1 ) );
				if ( false === $end_of_statement ) {
					// No semi-colon - live coding.
					return;
				}

				for ( $ptr = ( $has_global + 1 ); $ptr <= $end_of_statement; $ptr++ ) {
					// Move the stack pointer to the next variable.
					$ptr = $this->phpcsFile->findNext( \T_VARIABLE, $ptr, $end_of_statement, false, null, true );

					if ( false === $ptr ) {
						// Reached the end of the global statement without finding the variable,
						// so this must be a local variable.
						return;
					}

					if ( substr( $this->tokens[ $ptr ]['content'], 1 ) === $variable_name ) {
						break;
					}
				}

				unset( $has_global, $end_of_statement, $ptr, $imported );
			}
		}

		// Still here ? In that case, the variable name should be prefixed.
		$recorded = MessageHelper::addMessage(
			$this->phpcsFile,
			self::ERROR_MSG,
			$stackPtr,
			$is_error,
			'NonPrefixedVariableFound',
			array(
				'Global variables defined',
				'$' . $variable_name,
			)
		);

		if ( true === $recorded ) {
			$this->record_potential_prefix_metric( $stackPtr, $variable_name );
		}
	}

	/**
	 * Check that global variables declared via a list construct are prefixed.
	 *
	 * @internal No need to take special measures for nested lists. Nested or not,
	 * each list part can only contain one variable being written to.
	 *
	 * @since 2.2.0
	 *
	 * @param int $stackPtr The position of the current token in the stack.
	 *
	 * @return int|void Integer stack pointer to skip forward or void to continue
	 *                  normal file processing.
	 */
	protected function process_list_assignment( $stackPtr ) {
		$list_open_close = Lists::getOpenClose( $this->phpcsFile, $stackPtr );
		if ( false === $list_open_close ) {
			// Short array, not short list.
			return;
		}

		$var_pointers = $this->get_list_variables( $stackPtr, $list_open_close );
		foreach ( $var_pointers as $ptr ) {
			$this->process_variable_assignment( $ptr, true );
		}

		// No need to re-examine these variables.
		return $list_open_close['closer'];
	}

	/**
	 * Process the parameters of a matched function.
	 *
	 * @since 0.12.0
	 *
	 * @param int    $stackPtr        The position of the current token in the stack.
	 * @param string $group_name      The name of the group which was matched.
	 * @param string $matched_content The token content (function name) which was matched.
	 * @param array  $parameters      Array with information about the parameters.
	 *
	 * @return void
	 */
	public function process_parameters( $stackPtr, $group_name, $matched_content, $parameters ) {
		if ( 'define' === $matched_content ) {
			$target_param = PassedParameters::getParameterFromStack( $parameters, 1, 'constant_name' );

		} else {
			$target_param = WPHookHelper::get_hook_name_param( $matched_content, $parameters );
		}

		if ( false === $target_param ) {
			return;
		}

		$is_error      = true;
		$clean_content = TextStrings::stripQuotes( $target_param['clean'] );

		if ( ( 'define' !== $matched_content
		       && isset( $this->allowed_core_hooks[ $clean_content ] ) )
		     || ( 'define' === $matched_content
		          && isset( $this->allowed_core_constants[ $clean_content ] ) )
		) {
			return;
		}

		if ( $this->is_prefixed( $target_param['start'], $clean_content ) === true ) {
			return;
		} else {
			// This may be a dynamic hook/constant name.
			$first_non_empty = $this->phpcsFile->findNext(
				Tokens::$emptyTokens,
				$target_param['start'],
				( $target_param['end'] + 1 ),
				true
			);

			if ( false === $first_non_empty ) {
				return;
			}

			$first_non_empty_content = TextStrings::stripQuotes( $this->tokens[ $first_non_empty ]['content'] );

			// Try again with just the first token if it's a text string.
			if ( isset( Tokens::$stringTokens[ $this->tokens[ $first_non_empty ]['code'] ] )
			     && $this->is_prefixed( $target_param['start'], $first_non_empty_content ) === true
			) {
				return;
			}

			if ( \T_DOUBLE_QUOTED_STRING === $this->tokens[ $first_non_empty ]['code'] ) {
				// If the first part of the parameter is a double quoted string, try again with only
				// the part before the first variable (if any).
				$exploded = explode( '$', $first_non_empty_content );
				$first    = rtrim( $exploded[0], '{' );
				if ( '' !== $first ) {
					if ( $this->is_prefixed( $target_param['start'], $first ) === true ) {
						return;
					}
				} else {
					// Start of hook/constant name is dynamic, throw a warning.
					$is_error = false;
				}
			} elseif ( ! isset( Tokens::$stringTokens[ $this->tokens[ $first_non_empty ]['code'] ] ) ) {
				// Dynamic hook/constant name, throw a warning.
				$is_error = false;
			}
		}

		if ( 'define' === $matched_content ) {
			if ( \defined( '\\' . $clean_content ) ) {
				// Backfill for PHP native constant.
				return;
			}

			if ( strpos( $clean_content, '\\' ) !== false ) {
				// Namespaced or unreachable constant.
				return;
			}

			$data       = array( 'Global constants defined' );
			$error_code = 'NonPrefixedConstantFound';
			if ( false === $is_error ) {
				$error_code = 'VariableConstantNameFound';
			}
		} else {
			$data       = array( 'Hook names invoked' );
			$error_code = 'NonPrefixedHooknameFound';
			if ( false === $is_error ) {
				$error_code = 'DynamicHooknameFound';
			}
		}

		$data[] = $clean_content;

		$recorded = MessageHelper::addMessage( $this->phpcsFile, self::ERROR_MSG, $first_non_empty, $is_error, $error_code, $data );

		if ( true === $recorded ) {
			$this->record_potential_prefix_metric( $stackPtr, $clean_content );
		}
	}

	/**
	 * Check if a function/class/constant/variable name is prefixed with one of the expected prefixes.
	 *
	 * @since 0.12.0
	 * @since 0.14.0 Allows for other non-word characters as well as underscores to better support hook names.
	 * @since 1.0.0  Does not require a word seperator anymore after a prefix.
	 *               This allows for improved code style independent checking,
	 *               i.e. allows for camelCase naming and the likes.
	 * @since 1.0.1  - Added $stackPtr parameter.
	 *               - The function now also records metrics about the prefixes encountered.
	 *
	 * @param int    $stackPtr The position of the token to record the metric against.
	 * @param string $name     Name to check for a prefix.
	 *
	 * @return bool True when the name is one of the prefixes or starts with an allowed prefix.
	 *              False otherwise.
	 */
	private function is_prefixed( $stackPtr, $name ) {
		foreach ( $this->validated_prefixes as $prefix ) {
			if ( stripos( $name, $prefix ) === 0 ) {
				$this->phpcsFile->recordMetric( $stackPtr, 'Prefix all globals: allowed prefixes', $prefix );
				return true;
			}
		}

		return false;
	}

	/**
	 * Check if a variable name might need a prefix.
	 *
	 * Prefix is not needed for:
	 * - superglobals,
	 * - WP native globals,
	 * - variables which are already prefixed.
	 *
	 * @since 0.12.0
	 * @since 1.0.1  Added $stackPtr parameter.
	 * @since 3.0.0  Renamed from `variable_prefixed_or_whitelisted()` to `variable_prefixed_or_allowed()`.
	 *
	 * @param int    $stackPtr The position of the token to record the metric against.
	 * @param string $name     Variable name without the dollar sign.
	 *
	 * @return bool True if the variable name is allowed or already prefixed.
	 *              False otherwise.
	 */
	private function variable_prefixed_or_allowed( $stackPtr, $name ) {
		// Ignore superglobals and WP global variables.
		if ( Variables::isSuperglobalName( $name ) || WPGlobalVariablesHelper::is_wp_global( $name ) ) {
			return true;
		}

		return $this->is_prefixed( $stackPtr, $name );
	}

	/**
	 * Validate an array of prefixes as passed through a custom property or via the command line.
	 *
	 * Checks that the prefix:
	 * - is not one of the blocked ones.
	 * - complies with the PHP rules for valid function, class, variable, constant names.
	 *
	 * @since 0.12.0
	 */
	private function validate_prefixes() {
		if ( $this->previous_prefixes === $this->prefixes ) {
			return;
		}

		// Set the cache *before* validation so as to not break the above compare.
		$this->previous_prefixes = $this->prefixes;

		// Validate the passed prefix(es).
		$prefixes    = array();
		$ns_prefixes = array();
		foreach ( $this->prefixes as $key => $prefix ) {
			$prefixLC = strtolower( $prefix );

			if ( isset( $this->prefix_blocklist[ $prefixLC ] ) ) {
				$this->phpcsFile->addError(
					'The "%s" prefix is not allowed.',
					0,
					'ForbiddenPrefixPassed',
					array( $prefix )
				);
				continue;
			}

			$prefix_length = strlen( $prefix );
			if ( function_exists( 'iconv_strlen' ) ) {
				$prefix_length = iconv_strlen( $prefix, Helper::getEncoding( $this->phpcsFile ) );
			}

			if ( $prefix_length < self::MIN_PREFIX_LENGTH ) {
				$this->phpcsFile->addError(
					'The "%s" prefix is too short. Short prefixes are not unique enough and may cause name collisions with other code.',
					0,
					'ShortPrefixPassed',
					array( $prefix )
				);
				continue;
			}

			/*
			 * Validate the prefix against characters allowed for function, class, constant names etc.
			 * Note: this does not use the PHPCSUtils `NamingConventions::isValidIdentifierName()` method
			 * as we want to allow namespace separators in the prefixes.
			 */
			if ( preg_match( '`^[a-zA-Z_\x80-\xff][a-zA-Z0-9_\x80-\xff\\\\]*$`', $prefix ) !== 1 ) {

				$this->phpcsFile->addWarning(
					'The "%s" prefix is not a valid namespace/function/class/variable/constant prefix in PHP.',
					0,
					'InvalidPrefixPassed',
					array( $prefix )
				);
			}

			// Lowercase the prefix to allow for direct compare.
			$prefixes[ $key ] = $prefixLC;

			/*
			 * Replace non-word characters in the prefix with a regex snippet, but only if the
			 * string doesn't already contain namespace separators.
			 */
			$is_regex = false;
			if ( strpos( $prefix, '\\' ) === false && preg_match( '`[_\W]`', $prefix ) > 0 ) {
				$prefix   = preg_replace( '`([_\W])`', '[\\\\\\\\$1]', $prefixLC );
				$is_regex = true;
			}

			$ns_prefixes[ $prefixLC ] = array(
				'prefix'   => $prefix,
				'is_regex' => $is_regex,
			);
		}

		// Set the validated prefixes caches.
		$this->validated_prefixes           = $prefixes;
		$this->validated_namespace_prefixes = $ns_prefixes;
	}

	/**
	 * Record the "potential prefix" metric.
	 *
	 * @since 1.0.1
	 *
	 * @param int    $stackPtr       The position of the token to record the metric against.
	 * @param string $construct_name Name of the global construct to try and distill a potential prefix from.
	 *
	 * @return void
	 */
	private function record_potential_prefix_metric( $stackPtr, $construct_name ) {
		if ( preg_match( '`^([A-Z]*[a-z0-9]*+)`', ltrim( $construct_name, '\$_' ), $matches ) > 0
		     && isset( $matches[1] ) && '' !== $matches[1]
		) {
			$this->phpcsFile->recordMetric( $stackPtr, 'Prefix all globals: potential prefixes - start of non-prefixed construct', strtolower( $matches[1] ) );
		}
	}
}
