<?php
/**
 * Provider hooks for AI integration.
 *
 * @package ContentGuidelines
 */

namespace Gutenberg\ContentGuidelines;

defined( 'ABSPATH' ) || exit;

/**
 * Manages provider hooks for AI features.
 */
// phpcs:ignore Gutenberg.CodeAnalysis.GuardedFunctionAndClassNames.ClassNotGuardedAgainstRedeclaration -- Namespaced class won't conflict with Core.
class Hooks {

	/**
	 * Initialize hooks.
	 */
	public static function init() {
		// Register hook documentation for providers.
		add_action( 'init', array( __CLASS__, 'register_provider_hooks' ) );
	}

	/**
	 * Register provider hooks.
	 *
	 * This method documents the available hooks for AI providers.
	 * Providers should hook into these to supply AI functionality.
	 */
	public static function register_provider_hooks() {
		/**
		 * Filter: wp_content_guidelines_run_playground_test
		 *
		 * Allows AI providers to handle playground test tasks.
		 *
		 * @param array|null $result      The AI result. Return null if not handling.
		 * @param array      $request {
		 *     The request data.
		 *
		 *     @type string $task               The task: 'rewrite_intro', 'generate_headlines', 'write_cta'.
		 *     @type string $fixture_content    The content to work with.
		 *     @type array  $guidelines         The guidelines data.
		 *     @type array  $context_packet     The formatted context packet.
		 *     @type string $extra_instructions Optional extra instructions from user.
		 * }
		 * @return array|null {
		 *     The result if handled.
		 *
		 *     @type string $output       The generated output.
		 *     @type array  $alternatives Optional alternative outputs.
		 *     @type array  $metadata     Optional provider metadata (model, tokens, etc).
		 * }
		 */

		/**
		 * Filter: wp_content_guidelines_generate_draft
		 *
		 * Allows AI providers to generate guidelines from site content.
		 *
		 * @param array|null $draft       The generated draft. Return null if not handling.
		 * @param array      $site_context {
		 *     The site context data.
		 *
		 *     @type string $site_title   The site title.
		 *     @type string $tagline      The site tagline.
		 *     @type array  $source_posts Array of source post content.
		 * }
		 * @param array      $args {
		 *     Additional arguments.
		 *
		 *     @type string $goal        The primary goal.
		 *     @type string $constraints User-specified constraints.
		 * }
		 * @return array|null The generated guidelines draft in schema format.
		 */

		/**
		 * Filter: wp_content_guidelines_has_ai_provider
		 *
		 * Check if an AI provider is available.
		 *
		 * @param bool $has_provider Whether a provider is available.
		 * @return bool True if a provider can handle AI tasks.
		 */
		add_filter( 'wp_content_guidelines_has_ai_provider', '__return_false' );
	}

	/**
	 * Check if an AI provider is available.
	 *
	 * @return bool True if a provider is registered.
	 */
	public static function has_ai_provider() {
		/**
		 * Filter to check if an AI provider is available.
		 *
		 * @param bool $has_provider Default false.
		 */
		return apply_filters( 'wp_content_guidelines_has_ai_provider', false );
	}

	/**
	 * Generate guidelines draft using AI.
	 *
	 * @param array $site_context Site context data.
	 * @param array $args         Additional arguments.
	 * @return array|null Generated draft or null.
	 */
	public static function generate_guidelines_draft( $site_context, $args = array() ) {
		/**
		 * Filter to generate guidelines using AI.
		 *
		 * @param array|null $draft        The draft to generate.
		 * @param array      $site_context Site context.
		 * @param array      $args         Arguments.
		 */
		return apply_filters( 'wp_content_guidelines_generate_draft', null, $site_context, $args );
	}

	/**
	 * Run a playground test using AI.
	 *
	 * @param array $request The test request.
	 * @return array|null AI result or null.
	 */
	public static function run_playground_test( $request ) {
		/**
		 * Filter to run playground tests using AI.
		 *
		 * @param array|null $result  The result.
		 * @param array      $request The request.
		 */
		return apply_filters( 'wp_content_guidelines_run_playground_test', null, $request );
	}
}
