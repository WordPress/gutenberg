<?php
/**
 * WordPress 6.9 Abilities API integration.
 *
 * Registers content guidelines abilities for AI orchestration and external discovery.
 *
 * @package ContentGuidelines
 * @since 0.2.0
 */

namespace Gutenberg\ContentGuidelines;

defined( 'ABSPATH' ) || exit;

/**
 * Abilities API integration for Content Guidelines.
 *
 * Exposes content guidelines functionality through the WordPress 6.9 Abilities API,
 * enabling AI assistants and external services to discover and execute
 * guidelines-related actions in a standardized way.
 */
// phpcs:ignore Gutenberg.CodeAnalysis.GuardedFunctionAndClassNames.ClassNotGuardedAgainstRedeclaration -- Namespaced class won't conflict with Core.
class Abilities {

	/**
	 * Ability category slug.
	 */
	const CATEGORY = 'content-guidelines';

	/**
	 * Ability namespace.
	 */
	const NAMESPACE = 'content-guidelines';

	/**
	 * Initialize abilities registration.
	 */
	public static function init() {
		// Only register if the Abilities API is available (WordPress 6.9+).
		if ( ! function_exists( 'wp_register_ability' ) ) {
			return;
		}

		add_action( 'wp_abilities_api_categories_init', array( __CLASS__, 'register_category' ) );
		add_action( 'wp_abilities_api_init', array( __CLASS__, 'register_abilities' ) );
	}

	/**
	 * Register the content guidelines ability category.
	 */
	public static function register_category() {
		if ( ! function_exists( 'wp_register_ability_category' ) ) {
			return;
		}

		wp_register_ability_category(
			self::CATEGORY,
			array(
				'label'       => __( 'Content Guidelines', 'gutenberg' ),
				'description' => __( 'Manage site-level editorial guidelines for voice, tone, vocabulary, and copy rules that AI features can consume.', 'gutenberg' ),
				'icon'        => 'edit',
			)
		);
	}

	/**
	 * Register all content guidelines abilities.
	 */
	public static function register_abilities() {
		// Core guidelines abilities.
		self::register_get_guidelines_ability();
		self::register_get_packet_ability();
		self::register_update_draft_ability();
		self::register_publish_draft_ability();
		self::register_discard_draft_ability();

		// Block-specific abilities.
		self::register_list_blocks_ability();
		self::register_get_block_guidelines_ability();
		self::register_update_block_guidelines_ability();

		// Revision abilities.
		self::register_get_revisions_ability();
		self::register_restore_revision_ability();

		// Import/Export abilities.
		self::register_export_guidelines_ability();
		self::register_import_guidelines_ability();

		// Testing abilities.
		self::register_run_test_ability();
		self::register_check_lint_ability();
	}

	/**
	 * Register the get-guidelines ability.
	 */
	private static function register_get_guidelines_ability() {
		wp_register_ability(
			self::NAMESPACE . '/get-guidelines',
			array(
				'label'               => __( 'Get Content Guidelines', 'gutenberg' ),
				'description'         => __( 'Retrieve the site content guidelines including brand context, voice and tone, copy rules, vocabulary, and image style preferences.', 'gutenberg' ),
				'category'            => self::CATEGORY,
				'input_schema'        => array(
					'type'       => 'object',
					'properties' => array(
						'use' => array(
							'type'        => 'string',
							'description' => __( 'Which version to retrieve: "active" for published guidelines or "draft" for unpublished changes.', 'gutenberg' ),
							'enum'        => array( 'active', 'draft' ),
							'default'     => 'active',
						),
					),
				),
				'output_schema'       => array(
					'type'       => 'object',
					'properties' => array(
						'active'         => array(
							'type'        => 'object',
							'description' => __( 'The currently active (published) guidelines.', 'gutenberg' ),
						),
						'draft'          => array(
							'type'        => array( 'object', 'null' ),
							'description' => __( 'The draft guidelines if any unpublished changes exist.', 'gutenberg' ),
						),
						'has_draft'      => array(
							'type'        => 'boolean',
							'description' => __( 'Whether there are unpublished draft changes.', 'gutenberg' ),
						),
						'post_id'        => array(
							'type'        => array( 'integer', 'null' ),
							'description' => __( 'The post ID of the guidelines entity.', 'gutenberg' ),
						),
						'updated_at'     => array(
							'type'        => array( 'string', 'null' ),
							'description' => __( 'ISO 8601 timestamp of the last update.', 'gutenberg' ),
						),
						'revision_count' => array(
							'type'        => 'integer',
							'description' => __( 'Number of saved revisions.', 'gutenberg' ),
						),
					),
				),
				'execute_callback'    => array( __CLASS__, 'execute_get_guidelines' ),
				'permission_callback' => array( __CLASS__, 'can_view_guidelines' ),
				'meta'                => array(
					'show_in_rest' => true,
				),
			)
		);
	}

	/**
	 * Register the get-packet ability.
	 */
	private static function register_get_packet_ability() {
		wp_register_ability(
			self::NAMESPACE . '/get-context-packet',
			array(
				'label'               => __( 'Get Context Packet', 'gutenberg' ),
				'description'         => __( 'Get a task-specific context packet formatted for LLM consumption. The packet contains relevant guidelines sections based on the task type.', 'gutenberg' ),
				'category'            => self::CATEGORY,
				'input_schema'        => array(
					'type'       => 'object',
					'properties' => array(
						'task'      => array(
							'type'        => 'string',
							'description' => __( 'The type of task to get guidelines for.', 'gutenberg' ),
							'enum'        => array( 'writing', 'headline', 'cta', 'image', 'coach' ),
							'default'     => 'writing',
						),
						'post_id'   => array(
							'type'        => 'integer',
							'description' => __( 'Optional post ID for context-specific overrides.', 'gutenberg' ),
						),
						'use'       => array(
							'type'        => 'string',
							'description' => __( 'Which guidelines version to use.', 'gutenberg' ),
							'enum'        => array( 'active', 'draft' ),
							'default'     => 'active',
						),
						'max_chars' => array(
							'type'        => 'integer',
							'description' => __( 'Maximum characters for the packet text.', 'gutenberg' ),
							'default'     => 2000,
							'minimum'     => 100,
							'maximum'     => 10000,
						),
					),
				),
				'output_schema'       => array(
					'type'       => 'object',
					'properties' => array(
						'packet_text'       => array(
							'type'        => 'string',
							'description' => __( 'Formatted text optimized for LLM system prompts.', 'gutenberg' ),
						),
						'packet_structured' => array(
							'type'        => 'object',
							'description' => __( 'Structured subset of guidelines relevant to the task.', 'gutenberg' ),
						),
						'guidelines_id'     => array(
							'type'        => array( 'integer', 'null' ),
							'description' => __( 'Post ID of the guidelines entity.', 'gutenberg' ),
						),
						'revision_id'       => array(
							'type'        => array( 'integer', 'null' ),
							'description' => __( 'Current revision ID.', 'gutenberg' ),
						),
						'updated_at'        => array(
							'type'        => array( 'string', 'null' ),
							'description' => __( 'ISO 8601 timestamp of last update.', 'gutenberg' ),
						),
					),
				),
				'execute_callback'    => array( __CLASS__, 'execute_get_packet' ),
				'permission_callback' => array( __CLASS__, 'can_view_guidelines' ),
				'meta'                => array(
					'show_in_rest' => true,
				),
			)
		);
	}

	/**
	 * Register the update-draft ability.
	 */
	private static function register_update_draft_ability() {
		wp_register_ability(
			self::NAMESPACE . '/update-draft',
			array(
				'label'               => __( 'Update Draft Guidelines', 'gutenberg' ),
				'description'         => __( 'Save changes to draft guidelines without publishing. Use this to incrementally update guidelines before publishing.', 'gutenberg' ),
				'category'            => self::CATEGORY,
				'input_schema'        => array(
					'type'       => 'object',
					'required'   => array( 'guidelines' ),
					'properties' => array(
						'guidelines' => array(
							'type'        => 'object',
							'description' => __( 'The guidelines object to save as draft.', 'gutenberg' ),
							'properties'  => array(
								'brand_context' => array(
									'type'        => 'object',
									'description' => __( 'Brand identity and audience context.', 'gutenberg' ),
									'properties'  => array(
										'site_description' => array( 'type' => 'string' ),
										'audience'         => array( 'type' => 'string' ),
										'primary_goal'     => array(
											'type' => 'string',
											'enum' => array( 'subscribe', 'sell', 'inform', 'community', 'other' ),
										),
									),
								),
								'voice_tone'    => array(
									'type'        => 'object',
									'description' => __( 'Voice and tone preferences.', 'gutenberg' ),
									'properties'  => array(
										'tone_traits' => array(
											'type'  => 'array',
											'items' => array( 'type' => 'string' ),
										),
										'pov'         => array(
											'type' => 'string',
											'enum' => array( 'we_you', 'i_you', 'third_person' ),
										),
										'readability' => array(
											'type' => 'string',
											'enum' => array( 'simple', 'general', 'expert' ),
										),
									),
								),
								'copy_rules'    => array(
									'type'        => 'object',
									'description' => __( 'Writing dos and donts.', 'gutenberg' ),
									'properties'  => array(
										'dos'        => array(
											'type'  => 'array',
											'items' => array( 'type' => 'string' ),
										),
										'donts'      => array(
											'type'  => 'array',
											'items' => array( 'type' => 'string' ),
										),
										'formatting' => array(
											'type'  => 'array',
											'items' => array( 'type' => 'string' ),
										),
									),
								),
								'vocabulary'    => array(
									'type'        => 'object',
									'description' => __( 'Preferred and avoided terms.', 'gutenberg' ),
									'properties'  => array(
										'prefer' => array(
											'type'  => 'array',
											'items' => array(
												'type' => 'object',
												'properties' => array(
													'term' => array( 'type' => 'string' ),
													'note' => array( 'type' => 'string' ),
												),
											),
										),
										'avoid'  => array(
											'type'  => 'array',
											'items' => array(
												'type' => 'object',
												'properties' => array(
													'term' => array( 'type' => 'string' ),
													'note' => array( 'type' => 'string' ),
												),
											),
										),
									),
								),
								'image_style'   => array(
									'type'        => 'object',
									'description' => __( 'Image style preferences and reference images.', 'gutenberg' ),
									'properties'  => array(
										'dos'              => array(
											'type'  => 'array',
											'items' => array( 'type' => 'string' ),
										),
										'donts'            => array(
											'type'  => 'array',
											'items' => array( 'type' => 'string' ),
										),
										'text_policy'      => array(
											'type' => 'string',
											'enum' => array( 'never', 'only_if_requested', 'ok' ),
										),
										'reference_images' => array(
											'type'        => 'array',
											'description' => __( 'Reference images from media library.', 'gutenberg' ),
											'items'       => array(
												'type' => 'object',
												'properties' => array(
													'id'  => array( 'type' => 'integer' ),
													'url' => array( 'type' => 'string' ),
													'alt' => array( 'type' => 'string' ),
													'notes' => array( 'type' => 'string' ),
												),
											),
										),
									),
								),
								'heuristics'    => array(
									'type'        => 'object',
									'description' => __( 'Target metrics for content structure and readability.', 'gutenberg' ),
									'properties'  => array(
										'words_per_sentence' => array(
											'type'        => 'integer',
											'description' => __( 'Target average words per sentence.', 'gutenberg' ),
										),
										'sentences_per_paragraph' => array(
											'type'        => 'integer',
											'description' => __( 'Target sentences per paragraph.', 'gutenberg' ),
										),
										'paragraphs_per_section' => array(
											'type'        => 'integer',
											'description' => __( 'Target paragraphs per section.', 'gutenberg' ),
										),
										'reading_level' => array(
											'type'        => 'string',
											'description' => __( 'Target reading level.', 'gutenberg' ),
											'enum'        => array( '5th_grade', '8th_grade', 'high_school', 'college', 'custom' ),
										),
										'custom_reading_level' => array(
											'type'        => 'string',
											'description' => __( 'Custom reading level description when reading_level is "custom".', 'gutenberg' ),
										),
										'max_syllables_per_word' => array(
											'type'        => 'integer',
											'description' => __( 'Maximum average syllables per word.', 'gutenberg' ),
										),
									),
								),
								'references'    => array(
									'type'        => 'array',
									'description' => __( 'External content references to emulate.', 'gutenberg' ),
									'items'       => array(
										'type'       => 'object',
										'properties' => array(
											'title' => array(
												'type' => 'string',
												'description' => __( 'Reference title or name.', 'gutenberg' ),
											),
											'url'   => array(
												'type' => 'string',
												'description' => __( 'URL to the reference.', 'gutenberg' ),
											),
											'type'  => array(
												'type' => 'string',
												'description' => __( 'Type of reference.', 'gutenberg' ),
												'enum' => array( 'website', 'article', 'book', 'document', 'competitor', 'other' ),
											),
											'notes' => array(
												'type' => 'string',
												'description' => __( 'Notes about what to emulate.', 'gutenberg' ),
											),
										),
									),
								),
								'blocks'        => array(
									'type'                 => 'object',
									'description'          => __( 'Per-block guidelines keyed by block name.', 'gutenberg' ),
									'additionalProperties' => array(
										'type'       => 'object',
										'properties' => array(
											'copy_rules' => array(
												'type' => 'object',
												'properties' => array(
													'dos' => array(
														'type'  => 'array',
														'items' => array( 'type' => 'string' ),
													),
													'donts' => array(
														'type'  => 'array',
														'items' => array( 'type' => 'string' ),
													),
												),
											),
											'notes'      => array( 'type' => 'string' ),
										),
									),
								),
								'notes'         => array(
									'type'        => 'string',
									'description' => __( 'General notes and additional context.', 'gutenberg' ),
								),
							),
						),
					),
				),
				'output_schema'       => array(
					'type'       => 'object',
					'properties' => array(
						'success' => array(
							'type'        => 'boolean',
							'description' => __( 'Whether the draft was saved successfully.', 'gutenberg' ),
						),
						'message' => array(
							'type'        => 'string',
							'description' => __( 'Status message.', 'gutenberg' ),
						),
					),
				),
				'execute_callback'    => array( __CLASS__, 'execute_update_draft' ),
				'permission_callback' => array( __CLASS__, 'can_edit_guidelines' ),
				'meta'                => array(
					'show_in_rest' => true,
				),
			)
		);
	}

	/**
	 * Register the publish-draft ability.
	 */
	private static function register_publish_draft_ability() {
		wp_register_ability(
			self::NAMESPACE . '/publish-draft',
			array(
				'label'               => __( 'Publish Draft Guidelines', 'gutenberg' ),
				'description'         => __( 'Publish the current draft guidelines, making them the active guidelines for the site.', 'gutenberg' ),
				'category'            => self::CATEGORY,
				'input_schema'        => array(
					'type'       => 'object',
					'properties' => array(),
				),
				'output_schema'       => array(
					'type'       => 'object',
					'properties' => array(
						'success' => array(
							'type'        => 'boolean',
							'description' => __( 'Whether the publish was successful.', 'gutenberg' ),
						),
						'post_id' => array(
							'type'        => 'integer',
							'description' => __( 'The post ID of the published guidelines.', 'gutenberg' ),
						),
						'message' => array(
							'type'        => 'string',
							'description' => __( 'Status message.', 'gutenberg' ),
						),
					),
				),
				'execute_callback'    => array( __CLASS__, 'execute_publish_draft' ),
				'permission_callback' => array( __CLASS__, 'can_edit_guidelines' ),
				'meta'                => array(
					'show_in_rest' => true,
				),
			)
		);
	}

	/**
	 * Register the discard-draft ability.
	 */
	private static function register_discard_draft_ability() {
		wp_register_ability(
			self::NAMESPACE . '/discard-draft',
			array(
				'label'               => __( 'Discard Draft Guidelines', 'gutenberg' ),
				'description'         => __( 'Discard all unpublished draft changes and revert to the active guidelines.', 'gutenberg' ),
				'category'            => self::CATEGORY,
				'input_schema'        => array(
					'type'       => 'object',
					'properties' => array(),
				),
				'output_schema'       => array(
					'type'       => 'object',
					'properties' => array(
						'success' => array(
							'type'        => 'boolean',
							'description' => __( 'Whether the discard was successful.', 'gutenberg' ),
						),
						'message' => array(
							'type'        => 'string',
							'description' => __( 'Status message.', 'gutenberg' ),
						),
					),
				),
				'execute_callback'    => array( __CLASS__, 'execute_discard_draft' ),
				'permission_callback' => array( __CLASS__, 'can_edit_guidelines' ),
				'meta'                => array(
					'show_in_rest' => true,
				),
			)
		);
	}

	/**
	 * Register the list-blocks ability.
	 */
	private static function register_list_blocks_ability() {
		wp_register_ability(
			self::NAMESPACE . '/list-blocks',
			array(
				'label'               => __( 'List Blocks', 'gutenberg' ),
				'description'         => __( 'List all available block types and their guidelines configuration status.', 'gutenberg' ),
				'category'            => self::CATEGORY,
				'input_schema'        => array(
					'type'       => 'object',
					'properties' => array(
						'configured_only' => array(
							'type'        => 'boolean',
							'description' => __( 'Only return blocks that have guidelines configured.', 'gutenberg' ),
							'default'     => false,
						),
						'search'          => array(
							'type'        => 'string',
							'description' => __( 'Search blocks by name or title.', 'gutenberg' ),
						),
					),
				),
				'output_schema'       => array(
					'type'       => 'object',
					'properties' => array(
						'blocks' => array(
							'type'        => 'array',
							'description' => __( 'Array of block types.', 'gutenberg' ),
							'items'       => array(
								'type'       => 'object',
								'properties' => array(
									'name'           => array( 'type' => 'string' ),
									'title'          => array( 'type' => 'string' ),
									'description'    => array( 'type' => 'string' ),
									'category'       => array( 'type' => 'string' ),
									'has_guidelines' => array( 'type' => 'boolean' ),
								),
							),
						),
						'total'  => array(
							'type'        => 'integer',
							'description' => __( 'Total number of blocks returned.', 'gutenberg' ),
						),
					),
				),
				'execute_callback'    => array( __CLASS__, 'execute_list_blocks' ),
				'permission_callback' => array( __CLASS__, 'can_view_guidelines' ),
				'meta'                => array(
					'show_in_rest' => true,
				),
			)
		);
	}

	/**
	 * Register the get-block-guidelines ability.
	 */
	private static function register_get_block_guidelines_ability() {
		wp_register_ability(
			self::NAMESPACE . '/get-block-guidelines',
			array(
				'label'               => __( 'Get Block Guidelines', 'gutenberg' ),
				'description'         => __( 'Get guidelines for a specific block type.', 'gutenberg' ),
				'category'            => self::CATEGORY,
				'input_schema'        => array(
					'type'       => 'object',
					'required'   => array( 'block_name' ),
					'properties' => array(
						'block_name' => array(
							'type'        => 'string',
							'description' => __( 'The block name (e.g., "core/paragraph").', 'gutenberg' ),
						),
						'use'        => array(
							'type'        => 'string',
							'description' => __( 'Which version to retrieve.', 'gutenberg' ),
							'enum'        => array( 'active', 'draft' ),
							'default'     => 'active',
						),
					),
				),
				'output_schema'       => array(
					'type'       => 'object',
					'properties' => array(
						'block_name'  => array(
							'type'        => 'string',
							'description' => __( 'The block name.', 'gutenberg' ),
						),
						'block_title' => array(
							'type'        => 'string',
							'description' => __( 'The block display title.', 'gutenberg' ),
						),
						'guidelines'  => array(
							'type'        => 'object',
							'description' => __( 'The block guidelines.', 'gutenberg' ),
							'properties'  => array(
								'copy_rules' => array(
									'type'       => 'object',
									'properties' => array(
										'dos'   => array(
											'type'  => 'array',
											'items' => array( 'type' => 'string' ),
										),
										'donts' => array(
											'type'  => 'array',
											'items' => array( 'type' => 'string' ),
										),
									),
								),
								'notes'      => array( 'type' => 'string' ),
							),
						),
						'has_content' => array(
							'type'        => 'boolean',
							'description' => __( 'Whether the block has any guidelines configured.', 'gutenberg' ),
						),
					),
				),
				'execute_callback'    => array( __CLASS__, 'execute_get_block_guidelines' ),
				'permission_callback' => array( __CLASS__, 'can_view_guidelines' ),
				'meta'                => array(
					'show_in_rest' => true,
				),
			)
		);
	}

	/**
	 * Register the update-block-guidelines ability.
	 */
	private static function register_update_block_guidelines_ability() {
		wp_register_ability(
			self::NAMESPACE . '/update-block-guidelines',
			array(
				'label'               => __( 'Update Block Guidelines', 'gutenberg' ),
				'description'         => __( 'Update guidelines for a specific block type. Changes are saved to draft.', 'gutenberg' ),
				'category'            => self::CATEGORY,
				'input_schema'        => array(
					'type'       => 'object',
					'required'   => array( 'block_name', 'guidelines' ),
					'properties' => array(
						'block_name' => array(
							'type'        => 'string',
							'description' => __( 'The block name (e.g., "core/paragraph").', 'gutenberg' ),
						),
						'guidelines' => array(
							'type'        => 'object',
							'description' => __( 'The block guidelines to save.', 'gutenberg' ),
							'properties'  => array(
								'copy_rules' => array(
									'type'       => 'object',
									'properties' => array(
										'dos'   => array(
											'type'  => 'array',
											'items' => array( 'type' => 'string' ),
										),
										'donts' => array(
											'type'  => 'array',
											'items' => array( 'type' => 'string' ),
										),
									),
								),
								'notes'      => array( 'type' => 'string' ),
							),
						),
					),
				),
				'output_schema'       => array(
					'type'       => 'object',
					'properties' => array(
						'success' => array(
							'type'        => 'boolean',
							'description' => __( 'Whether the update was successful.', 'gutenberg' ),
						),
						'message' => array(
							'type'        => 'string',
							'description' => __( 'Status message.', 'gutenberg' ),
						),
					),
				),
				'execute_callback'    => array( __CLASS__, 'execute_update_block_guidelines' ),
				'permission_callback' => array( __CLASS__, 'can_edit_guidelines' ),
				'meta'                => array(
					'show_in_rest' => true,
				),
			)
		);
	}

	/**
	 * Register the get-revisions ability.
	 */
	private static function register_get_revisions_ability() {
		wp_register_ability(
			self::NAMESPACE . '/get-revisions',
			array(
				'label'               => __( 'Get Revisions', 'gutenberg' ),
				'description'         => __( 'Get the revision history for guidelines.', 'gutenberg' ),
				'category'            => self::CATEGORY,
				'input_schema'        => array(
					'type'       => 'object',
					'properties' => array(
						'limit' => array(
							'type'        => 'integer',
							'description' => __( 'Maximum number of revisions to return.', 'gutenberg' ),
							'default'     => 20,
							'minimum'     => 1,
							'maximum'     => 100,
						),
					),
				),
				'output_schema'       => array(
					'type'       => 'object',
					'properties' => array(
						'revisions' => array(
							'type'        => 'array',
							'description' => __( 'Array of revisions.', 'gutenberg' ),
							'items'       => array(
								'type'       => 'object',
								'properties' => array(
									'id'          => array( 'type' => 'integer' ),
									'date'        => array( 'type' => 'string' ),
									'date_gmt'    => array( 'type' => 'string' ),
									'author'      => array( 'type' => 'integer' ),
									'author_name' => array( 'type' => 'string' ),
								),
							),
						),
						'total'     => array(
							'type'        => 'integer',
							'description' => __( 'Total number of revisions.', 'gutenberg' ),
						),
					),
				),
				'execute_callback'    => array( __CLASS__, 'execute_get_revisions' ),
				'permission_callback' => array( __CLASS__, 'can_view_guidelines' ),
				'meta'                => array(
					'show_in_rest' => true,
				),
			)
		);
	}

	/**
	 * Register the restore-revision ability.
	 */
	private static function register_restore_revision_ability() {
		wp_register_ability(
			self::NAMESPACE . '/restore-revision',
			array(
				'label'               => __( 'Restore Revision', 'gutenberg' ),
				'description'         => __( 'Restore guidelines to a previous revision. The revision becomes the new draft.', 'gutenberg' ),
				'category'            => self::CATEGORY,
				'input_schema'        => array(
					'type'       => 'object',
					'required'   => array( 'revision_id' ),
					'properties' => array(
						'revision_id' => array(
							'type'        => 'integer',
							'description' => __( 'The revision ID to restore.', 'gutenberg' ),
						),
					),
				),
				'output_schema'       => array(
					'type'       => 'object',
					'properties' => array(
						'success'    => array(
							'type'        => 'boolean',
							'description' => __( 'Whether the restore was successful.', 'gutenberg' ),
						),
						'message'    => array(
							'type'        => 'string',
							'description' => __( 'Status message.', 'gutenberg' ),
						),
						'guidelines' => array(
							'type'        => 'object',
							'description' => __( 'The restored guidelines (now in draft).', 'gutenberg' ),
						),
					),
				),
				'execute_callback'    => array( __CLASS__, 'execute_restore_revision' ),
				'permission_callback' => array( __CLASS__, 'can_edit_guidelines' ),
				'meta'                => array(
					'show_in_rest' => true,
				),
			)
		);
	}

	/**
	 * Register the export-guidelines ability.
	 */
	private static function register_export_guidelines_ability() {
		wp_register_ability(
			self::NAMESPACE . '/export-guidelines',
			array(
				'label'               => __( 'Export Guidelines', 'gutenberg' ),
				'description'         => __( 'Export guidelines as a portable JSON object.', 'gutenberg' ),
				'category'            => self::CATEGORY,
				'input_schema'        => array(
					'type'       => 'object',
					'properties' => array(
						'use'          => array(
							'type'        => 'string',
							'description' => __( 'Which version to export.', 'gutenberg' ),
							'enum'        => array( 'active', 'draft' ),
							'default'     => 'active',
						),
						'include_meta' => array(
							'type'        => 'boolean',
							'description' => __( 'Include metadata like export date and version.', 'gutenberg' ),
							'default'     => true,
						),
					),
				),
				'output_schema'       => array(
					'type'       => 'object',
					'properties' => array(
						'export' => array(
							'type'        => 'object',
							'description' => __( 'The exported guidelines object.', 'gutenberg' ),
							'properties'  => array(
								'version'     => array( 'type' => 'string' ),
								'exported_at' => array( 'type' => 'string' ),
								'site_url'    => array( 'type' => 'string' ),
								'guidelines'  => array( 'type' => 'object' ),
							),
						),
					),
				),
				'execute_callback'    => array( __CLASS__, 'execute_export_guidelines' ),
				'permission_callback' => array( __CLASS__, 'can_view_guidelines' ),
				'meta'                => array(
					'show_in_rest' => true,
				),
			)
		);
	}

	/**
	 * Register the import-guidelines ability.
	 */
	private static function register_import_guidelines_ability() {
		wp_register_ability(
			self::NAMESPACE . '/import-guidelines',
			array(
				'label'               => __( 'Import Guidelines', 'gutenberg' ),
				'description'         => __( 'Import guidelines from a JSON export. Imported guidelines become the new draft.', 'gutenberg' ),
				'category'            => self::CATEGORY,
				'input_schema'        => array(
					'type'       => 'object',
					'required'   => array( 'import' ),
					'properties' => array(
						'import' => array(
							'type'        => 'object',
							'description' => __( 'The guidelines export object to import.', 'gutenberg' ),
							'properties'  => array(
								'guidelines' => array(
									'type'        => 'object',
									'description' => __( 'The guidelines data.', 'gutenberg' ),
								),
							),
						),
						'merge'  => array(
							'type'        => 'boolean',
							'description' => __( 'Merge with existing guidelines instead of replacing.', 'gutenberg' ),
							'default'     => false,
						),
					),
				),
				'output_schema'       => array(
					'type'       => 'object',
					'properties' => array(
						'success' => array(
							'type'        => 'boolean',
							'description' => __( 'Whether the import was successful.', 'gutenberg' ),
						),
						'message' => array(
							'type'        => 'string',
							'description' => __( 'Status message.', 'gutenberg' ),
						),
					),
				),
				'execute_callback'    => array( __CLASS__, 'execute_import_guidelines' ),
				'permission_callback' => array( __CLASS__, 'can_edit_guidelines' ),
				'meta'                => array(
					'show_in_rest' => true,
				),
			)
		);
	}

	/**
	 * Register the run-test ability.
	 */
	private static function register_run_test_ability() {
		wp_register_ability(
			self::NAMESPACE . '/run-test',
			array(
				'label'               => __( 'Run Playground Test', 'gutenberg' ),
				'description'         => __( 'Test how guidelines affect AI-generated content by running a task against a fixture post. Returns lint results, context packet, and optionally AI-generated output if a provider is available.', 'gutenberg' ),
				'category'            => self::CATEGORY,
				'input_schema'        => array(
					'type'       => 'object',
					'required'   => array( 'fixture_post_id' ),
					'properties' => array(
						'task'               => array(
							'type'        => 'string',
							'description' => __( 'The type of test to run.', 'gutenberg' ),
							'enum'        => array( 'rewrite_intro', 'generate_headlines', 'write_cta' ),
							'default'     => 'rewrite_intro',
						),
						'fixture_post_id'    => array(
							'type'        => 'integer',
							'description' => __( 'The post ID to use as test fixture content.', 'gutenberg' ),
						),
						'use'                => array(
							'type'        => 'string',
							'description' => __( 'Which guidelines version to test with.', 'gutenberg' ),
							'enum'        => array( 'active', 'draft' ),
							'default'     => 'draft',
						),
						'compare'            => array(
							'type'        => 'boolean',
							'description' => __( 'Whether to also run the test with active guidelines for comparison.', 'gutenberg' ),
							'default'     => false,
						),
						'extra_instructions' => array(
							'type'        => 'string',
							'description' => __( 'Additional instructions to pass to the AI provider.', 'gutenberg' ),
						),
					),
				),
				'output_schema'       => array(
					'type'       => 'object',
					'properties' => array(
						'lint_results'   => array(
							'type'        => 'object',
							'description' => __( 'Results from vocabulary and copy rule lint checks.', 'gutenberg' ),
						),
						'context_packet' => array(
							'type'        => 'object',
							'description' => __( 'The context packet that would be sent to AI.', 'gutenberg' ),
						),
						'fixture'        => array(
							'type'        => 'object',
							'description' => __( 'Information about the fixture post used.', 'gutenberg' ),
						),
						'ai_result'      => array(
							'type'        => 'object',
							'description' => __( 'AI-generated result if a provider is available.', 'gutenberg' ),
						),
						'ai_available'   => array(
							'type'        => 'boolean',
							'description' => __( 'Whether AI generation was available.', 'gutenberg' ),
						),
						'compare'        => array(
							'type'        => 'object',
							'description' => __( 'Comparison results using active guidelines.', 'gutenberg' ),
						),
					),
				),
				'execute_callback'    => array( __CLASS__, 'execute_run_test' ),
				'permission_callback' => array( __CLASS__, 'can_edit_guidelines' ),
				'meta'                => array(
					'show_in_rest' => true,
				),
			)
		);
	}

	/**
	 * Register the check-lint ability.
	 */
	private static function register_check_lint_ability() {
		wp_register_ability(
			self::NAMESPACE . '/check-lint',
			array(
				'label'               => __( 'Check Content Lint', 'gutenberg' ),
				'description'         => __( 'Run vocabulary and copy rule lint checks against provided content without running AI generation.', 'gutenberg' ),
				'category'            => self::CATEGORY,
				'input_schema'        => array(
					'type'       => 'object',
					'required'   => array( 'content' ),
					'properties' => array(
						'content' => array(
							'type'        => 'string',
							'description' => __( 'The content to check against guidelines.', 'gutenberg' ),
						),
						'use'     => array(
							'type'        => 'string',
							'description' => __( 'Which guidelines version to check against.', 'gutenberg' ),
							'enum'        => array( 'active', 'draft' ),
							'default'     => 'active',
						),
					),
				),
				'output_schema'       => array(
					'type'       => 'object',
					'properties' => array(
						'issues'      => array(
							'type'        => 'array',
							'description' => __( 'Array of lint issues found.', 'gutenberg' ),
							'items'       => array(
								'type'       => 'object',
								'properties' => array(
									'type'       => array( 'type' => 'string' ),
									'term'       => array( 'type' => 'string' ),
									'message'    => array( 'type' => 'string' ),
									'suggestion' => array( 'type' => 'string' ),
								),
							),
						),
						'issue_count' => array(
							'type'        => 'integer',
							'description' => __( 'Total number of issues found.', 'gutenberg' ),
						),
						'passed'      => array(
							'type'        => 'boolean',
							'description' => __( 'Whether the content passed all lint checks.', 'gutenberg' ),
						),
					),
				),
				'execute_callback'    => array( __CLASS__, 'execute_check_lint' ),
				'permission_callback' => array( __CLASS__, 'can_view_guidelines' ),
				'meta'                => array(
					'show_in_rest' => true,
				),
			)
		);
	}

	// -------------------------------------------------------------------------
	// Permission callbacks
	// -------------------------------------------------------------------------

	/**
	 * Check if user can view guidelines.
	 *
	 * @return bool True if can view.
	 */
	public static function can_view_guidelines() {
		return current_user_can( 'edit_theme_options' );
	}

	/**
	 * Check if user can edit guidelines.
	 *
	 * @return bool True if can edit.
	 */
	public static function can_edit_guidelines() {
		return current_user_can( 'edit_theme_options' );
	}

	// -------------------------------------------------------------------------
	// Execute callbacks
	// -------------------------------------------------------------------------

	/**
	 * Execute get-guidelines ability.
	 *
	 * @param array $input The input parameters.
	 * @return array|WP_Error The guidelines data.
	 */
	public static function execute_get_guidelines( $input ) {
		$post   = Post_Type::get_guidelines_post();
		$active = Post_Type::get_active_guidelines();
		$draft  = Post_Type::get_draft_guidelines();

		return array(
			'active'         => $active ? $active : Post_Type::get_default_guidelines(),
			'draft'          => $draft,
			'has_draft'      => ! empty( $draft ),
			'post_id'        => $post ? $post->ID : null,
			'updated_at'     => $post ? $post->post_modified_gmt : null,
			'revision_count' => $post ? count( wp_get_post_revisions( $post->ID, array( 'check_enabled' => false ) ) ) : 0,
		);
	}

	/**
	 * Execute get-context-packet ability.
	 *
	 * @param array $input The input parameters.
	 * @return array The context packet.
	 */
	public static function execute_get_packet( $input ) {
		return Context_Packet_Builder::get_packet(
			array(
				'task'      => isset( $input['task'] ) ? $input['task'] : 'writing',
				'post_id'   => isset( $input['post_id'] ) ? $input['post_id'] : null,
				'use'       => isset( $input['use'] ) ? $input['use'] : 'active',
				'max_chars' => isset( $input['max_chars'] ) ? $input['max_chars'] : 2000,
			)
		);
	}

	/**
	 * Execute update-draft ability.
	 *
	 * @param array $input The input parameters.
	 * @return array|WP_Error Result.
	 */
	public static function execute_update_draft( $input ) {
		if ( ! isset( $input['guidelines'] ) ) {
			return new \WP_Error(
				'missing_guidelines',
				__( 'Guidelines data is required.', 'gutenberg' )
			);
		}

		$sanitized = Post_Type::sanitize_guidelines( $input['guidelines'] );
		$result    = Post_Type::save_draft( $sanitized );

		if ( is_wp_error( $result ) ) {
			return $result;
		}

		return array(
			'success' => true,
			'message' => __( 'Draft saved.', 'gutenberg' ),
		);
	}

	/**
	 * Execute publish-draft ability.
	 *
	 * @param array $input The input parameters.
	 * @return array|WP_Error Result.
	 */
	public static function execute_publish_draft( $input ) {
		$result = Post_Type::publish_draft();

		if ( is_wp_error( $result ) ) {
			return $result;
		}

		return array(
			'success' => true,
			'post_id' => $result,
			'message' => __( 'Guidelines published.', 'gutenberg' ),
		);
	}

	/**
	 * Execute discard-draft ability.
	 *
	 * @param array $input The input parameters.
	 * @return array Result.
	 */
	public static function execute_discard_draft( $input ) {
		Post_Type::discard_draft();

		return array(
			'success' => true,
			'message' => __( 'Draft discarded.', 'gutenberg' ),
		);
	}

	/**
	 * Execute run-test ability.
	 *
	 * @param array $input The input parameters.
	 * @return array|WP_Error Result.
	 */
	public static function execute_run_test( $input ) {
		if ( ! isset( $input['fixture_post_id'] ) ) {
			return new \WP_Error(
				'missing_fixture',
				__( 'Fixture post ID is required.', 'gutenberg' )
			);
		}

		$fixture_post = get_post( $input['fixture_post_id'] );

		if ( ! $fixture_post ) {
			return new \WP_Error(
				'invalid_fixture',
				__( 'Invalid fixture post.', 'gutenberg' )
			);
		}

		$task               = isset( $input['task'] ) ? $input['task'] : 'rewrite_intro';
		$use                = isset( $input['use'] ) ? $input['use'] : 'draft';
		$compare            = isset( $input['compare'] ) ? $input['compare'] : false;
		$extra_instructions = isset( $input['extra_instructions'] ) ? $input['extra_instructions'] : '';

		// Get guidelines.
		$guidelines = 'draft' === $use
			? Post_Type::get_draft_guidelines()
			: Post_Type::get_active_guidelines();

		if ( ! $guidelines ) {
			$guidelines = Post_Type::get_default_guidelines();
		}

		// Extract fixture content.
		$fixture_content = self::extract_fixture_content( $fixture_post, $task );

		// Run lint checks.
		$lint_results = Lint_Checker::check( $fixture_content, $guidelines );

		// Build context packet.
		$context_packet = Context_Packet_Builder::get_packet(
			array(
				'task'    => self::map_task_type( $task ),
				'post_id' => $input['fixture_post_id'],
				'use'     => $use,
			)
		);

		$result = array(
			'lint_results'   => $lint_results,
			'context_packet' => $context_packet,
			'fixture'        => array(
				'title'   => $fixture_post->post_title,
				'excerpt' => wp_trim_words( $fixture_content, 100 ),
			),
		);

		// Try AI provider.
		$ai_request = array(
			'task'               => $task,
			'fixture_content'    => $fixture_content,
			'guidelines'         => $guidelines,
			'context_packet'     => $context_packet,
			'extra_instructions' => $extra_instructions,
		);

		$ai_result = apply_filters( 'wp_content_guidelines_run_playground_test', null, $ai_request );

		if ( null !== $ai_result ) {
			$result['ai_result'] = $ai_result;
		} else {
			$result['ai_available'] = false;
		}

		// Comparison mode.
		if ( $compare && 'draft' === $use ) {
			$active_guidelines = Post_Type::get_active_guidelines();

			if ( $active_guidelines ) {
				$active_lint   = Lint_Checker::check( $fixture_content, $active_guidelines );
				$active_packet = Context_Packet_Builder::get_packet(
					array(
						'task'    => self::map_task_type( $task ),
						'post_id' => $input['fixture_post_id'],
						'use'     => 'active',
					)
				);

				$result['compare'] = array(
					'lint_results'   => $active_lint,
					'context_packet' => $active_packet,
				);
			}
		}

		return $result;
	}

	/**
	 * Execute check-lint ability.
	 *
	 * @param array $input The input parameters.
	 * @return array|WP_Error Result.
	 */
	public static function execute_check_lint( $input ) {
		if ( ! isset( $input['content'] ) || empty( $input['content'] ) ) {
			return new \WP_Error(
				'missing_content',
				__( 'Content is required.', 'gutenberg' )
			);
		}

		$use        = isset( $input['use'] ) ? $input['use'] : 'active';
		$guidelines = 'draft' === $use
			? Post_Type::get_draft_guidelines()
			: Post_Type::get_active_guidelines();

		if ( ! $guidelines ) {
			$guidelines = Post_Type::get_default_guidelines();
		}

		$lint_results = Lint_Checker::check( $input['content'], $guidelines );

		return array(
			'issues'      => isset( $lint_results['issues'] ) ? $lint_results['issues'] : array(),
			'issue_count' => isset( $lint_results['issue_count'] ) ? $lint_results['issue_count'] : 0,
			'passed'      => empty( $lint_results['issues'] ),
		);
	}

	/**
	 * Execute list-blocks ability.
	 *
	 * @param array $input The input parameters.
	 * @return array The blocks list.
	 */
	public static function execute_list_blocks( $input ) {
		$configured_only = isset( $input['configured_only'] ) ? $input['configured_only'] : false;
		$search          = isset( $input['search'] ) ? $input['search'] : '';

		// Get block types from registry.
		$block_types = \WP_Block_Type_Registry::get_instance()->get_all_registered();

		// Get current block guidelines.
		$guidelines       = Post_Type::get_active_guidelines();
		$block_guidelines = isset( $guidelines['blocks'] ) ? $guidelines['blocks'] : array();

		$blocks = array();

		foreach ( $block_types as $name => $block_type ) {
			// Skip legacy widgets.
			if ( strpos( $name, 'core/legacy-' ) === 0 ) {
				continue;
			}

			$has_guidelines = isset( $block_guidelines[ $name ] ) && self::block_has_content( $block_guidelines[ $name ] );

			// Filter by configured_only.
			if ( $configured_only && ! $has_guidelines ) {
				continue;
			}

			// Filter by search.
			if ( $search ) {
				$search_lower = strtolower( $search );
				$title        = isset( $block_type->title ) ? strtolower( $block_type->title ) : '';
				$name_lower   = strtolower( $name );

				if ( strpos( $title, $search_lower ) === false && strpos( $name_lower, $search_lower ) === false ) {
					continue;
				}
			}

			$blocks[] = array(
				'name'           => $name,
				'title'          => isset( $block_type->title ) ? $block_type->title : $name,
				'description'    => isset( $block_type->description ) ? $block_type->description : '',
				'category'       => isset( $block_type->category ) ? $block_type->category : '',
				'has_guidelines' => $has_guidelines,
			);
		}

		// Sort alphabetically by title.
		usort(
			$blocks,
			function ( $a, $b ) {
				return strcasecmp( $a['title'], $b['title'] );
			}
		);

		return array(
			'blocks' => $blocks,
			'total'  => count( $blocks ),
		);
	}

	/**
	 * Execute get-block-guidelines ability.
	 *
	 * @param array $input The input parameters.
	 * @return array|WP_Error The block guidelines.
	 */
	public static function execute_get_block_guidelines( $input ) {
		if ( ! isset( $input['block_name'] ) ) {
			return new \WP_Error(
				'missing_block_name',
				__( 'Block name is required.', 'gutenberg' )
			);
		}

		$block_name = $input['block_name'];
		$use        = isset( $input['use'] ) ? $input['use'] : 'active';

		// Get block type info.
		$block_type = \WP_Block_Type_Registry::get_instance()->get_registered( $block_name );

		// Get guidelines.
		$guidelines = 'draft' === $use
			? Post_Type::get_draft_guidelines()
			: Post_Type::get_active_guidelines();

		if ( ! $guidelines ) {
			$guidelines = Post_Type::get_default_guidelines();
		}

		$block_guidelines = isset( $guidelines['blocks'][ $block_name ] )
			? $guidelines['blocks'][ $block_name ]
			: array();

		return array(
			'block_name'  => $block_name,
			'block_title' => $block_type ? $block_type->title : $block_name,
			'guidelines'  => $block_guidelines,
			'has_content' => self::block_has_content( $block_guidelines ),
		);
	}

	/**
	 * Execute update-block-guidelines ability.
	 *
	 * @param array $input The input parameters.
	 * @return array|WP_Error Result.
	 */
	public static function execute_update_block_guidelines( $input ) {
		if ( ! isset( $input['block_name'] ) || ! isset( $input['guidelines'] ) ) {
			return new \WP_Error(
				'missing_params',
				__( 'Block name and guidelines are required.', 'gutenberg' )
			);
		}

		$block_name       = $input['block_name'];
		$block_guidelines = $input['guidelines'];

		// Get current draft or create from active.
		$draft = Post_Type::get_draft_guidelines();

		if ( ! $draft ) {
			$draft = Post_Type::get_active_guidelines();
		}

		if ( ! $draft ) {
			$draft = Post_Type::get_default_guidelines();
		}

		// Ensure blocks array exists.
		if ( ! isset( $draft['blocks'] ) ) {
			$draft['blocks'] = array();
		}

		// Update this block's guidelines.
		$draft['blocks'][ $block_name ] = $block_guidelines;

		// Save draft.
		$result = Post_Type::save_draft( $draft );

		if ( is_wp_error( $result ) ) {
			return $result;
		}

		return array(
			'success' => true,
			'message' => sprintf(
				/* translators: %s: block name */
				__( 'Guidelines for %s updated.', 'gutenberg' ),
				$block_name
			),
		);
	}

	/**
	 * Execute get-revisions ability.
	 *
	 * @param array $input The input parameters.
	 * @return array The revisions.
	 */
	public static function execute_get_revisions( $input ) {
		$limit = isset( $input['limit'] ) ? min( (int) $input['limit'], 100 ) : 20;
		$post  = Post_Type::get_guidelines_post();

		if ( ! $post ) {
			return array(
				'revisions' => array(),
				'total'     => 0,
			);
		}

		$revisions = wp_get_post_revisions(
			$post->ID,
			array(
				'check_enabled' => false,
				'numberposts'   => $limit,
			)
		);

		$result = array();

		foreach ( $revisions as $revision ) {
			$author      = get_user_by( 'id', $revision->post_author );
			$author_name = $author ? $author->display_name : __( 'Unknown', 'gutenberg' );

			$result[] = array(
				'id'          => $revision->ID,
				'date'        => $revision->post_date,
				'date_gmt'    => $revision->post_modified_gmt,
				'author'      => (int) $revision->post_author,
				'author_name' => $author_name,
			);
		}

		return array(
			'revisions' => $result,
			'total'     => count( $result ),
		);
	}

	/**
	 * Execute restore-revision ability.
	 *
	 * @param array $input The input parameters.
	 * @return array|WP_Error Result.
	 */
	public static function execute_restore_revision( $input ) {
		if ( ! isset( $input['revision_id'] ) ) {
			return new \WP_Error(
				'missing_revision_id',
				__( 'Revision ID is required.', 'gutenberg' )
			);
		}

		$revision_id = (int) $input['revision_id'];
		$revision    = wp_get_post_revision( $revision_id );

		if ( ! $revision ) {
			return new \WP_Error(
				'invalid_revision',
				__( 'Invalid revision ID.', 'gutenberg' )
			);
		}

		// Get the guidelines from the revision.
		$revision_content = $revision->post_content;
		$guidelines       = json_decode( $revision_content, true );

		if ( json_last_error() !== JSON_ERROR_NONE || ! is_array( $guidelines ) ) {
			return new \WP_Error(
				'invalid_revision_content',
				__( 'Revision content is not valid guidelines data.', 'gutenberg' )
			);
		}

		// Save as draft.
		$result = Post_Type::save_draft( $guidelines );

		if ( is_wp_error( $result ) ) {
			return $result;
		}

		return array(
			'success'    => true,
			'message'    => __( 'Revision restored as draft.', 'gutenberg' ),
			'guidelines' => $guidelines,
		);
	}

	/**
	 * Execute export-guidelines ability.
	 *
	 * @param array $input The input parameters.
	 * @return array The export data.
	 */
	public static function execute_export_guidelines( $input ) {
		$use          = isset( $input['use'] ) ? $input['use'] : 'active';
		$include_meta = isset( $input['include_meta'] ) ? $input['include_meta'] : true;

		$guidelines = 'draft' === $use
			? Post_Type::get_draft_guidelines()
			: Post_Type::get_active_guidelines();

		if ( ! $guidelines ) {
			$guidelines = Post_Type::get_default_guidelines();
		}

		$export = array(
			'guidelines' => $guidelines,
		);

		if ( $include_meta ) {
			$export['version']     = '1.0';
			$export['exported_at'] = gmdate( 'c' );
			$export['site_url']    = get_site_url();
		}

		return array(
			'export' => $export,
		);
	}

	/**
	 * Execute import-guidelines ability.
	 *
	 * @param array $input The input parameters.
	 * @return array|WP_Error Result.
	 */
	public static function execute_import_guidelines( $input ) {
		if ( ! isset( $input['import'] ) ) {
			return new \WP_Error(
				'missing_import',
				__( 'Import data is required.', 'gutenberg' )
			);
		}

		$import = $input['import'];
		$merge  = isset( $input['merge'] ) ? $input['merge'] : false;

		// Extract guidelines from import.
		$guidelines = isset( $import['guidelines'] ) ? $import['guidelines'] : $import;

		if ( ! is_array( $guidelines ) ) {
			return new \WP_Error(
				'invalid_import',
				__( 'Invalid import data format.', 'gutenberg' )
			);
		}

		// Merge with existing if requested.
		if ( $merge ) {
			$existing = Post_Type::get_draft_guidelines();

			if ( ! $existing ) {
				$existing = Post_Type::get_active_guidelines();
			}

			if ( ! $existing ) {
				$existing = Post_Type::get_default_guidelines();
			}

			$guidelines = self::merge_guidelines( $existing, $guidelines );
		}

		// Sanitize and save.
		$sanitized = Post_Type::sanitize_guidelines( $guidelines );
		$result    = Post_Type::save_draft( $sanitized );

		if ( is_wp_error( $result ) ) {
			return $result;
		}

		return array(
			'success' => true,
			'message' => $merge
				? __( 'Guidelines merged and saved as draft.', 'gutenberg' )
				: __( 'Guidelines imported and saved as draft.', 'gutenberg' ),
		);
	}

	// -------------------------------------------------------------------------
	// Helper methods
	// -------------------------------------------------------------------------

	/**
	 * Check if block guidelines have any content.
	 *
	 * @param array $guidelines The block guidelines.
	 * @return bool True if has content.
	 */
	private static function block_has_content( $guidelines ) {
		if ( empty( $guidelines ) ) {
			return false;
		}

		// Check copy rules.
		if ( isset( $guidelines['copy_rules'] ) ) {
			if ( ! empty( $guidelines['copy_rules']['dos'] ) || ! empty( $guidelines['copy_rules']['donts'] ) ) {
				return true;
			}
		}

		// Check notes.
		if ( ! empty( $guidelines['notes'] ) ) {
			return true;
		}

		return false;
	}

	/**
	 * Merge two guidelines objects.
	 *
	 * @param array $existing The existing guidelines.
	 * @param array $new      The new guidelines to merge.
	 * @return array The merged guidelines.
	 */
	private static function merge_guidelines( $existing, $new ) {
		$merged = $existing;

		foreach ( $new as $key => $value ) {
			if ( is_array( $value ) && isset( $merged[ $key ] ) && is_array( $merged[ $key ] ) ) {
				// For arrays with numeric keys (like dos/donts), append.
				if ( isset( $value[0] ) ) {
					$merged[ $key ] = array_merge( $merged[ $key ], $value );
				} else {
					// For associative arrays, recursively merge.
					$merged[ $key ] = self::merge_guidelines( $merged[ $key ], $value );
				}
			} else {
				$merged[ $key ] = $value;
			}
		}

		return $merged;
	}

	/**
	 * Extract content from fixture post for a specific task.
	 *
	 * @param \WP_Post $post The post object.
	 * @param string   $task The task type.
	 * @return string The extracted content.
	 */
	private static function extract_fixture_content( $post, $task ) {
		$content = $post->post_content;
		$content = wp_strip_all_tags( do_blocks( $content ) );

		switch ( $task ) {
			case 'rewrite_intro':
				return mb_substr( $content, 0, 500 );

			case 'generate_headlines':
				return $post->post_title . "\n\n" . wp_trim_words( $content, 150 );

			case 'write_cta':
				return wp_trim_words( $content, 300 );

			default:
				return wp_trim_words( $content, 200 );
		}
	}

	/**
	 * Map playground task to context packet task type.
	 *
	 * @param string $task The playground task.
	 * @return string The context packet task.
	 */
	private static function map_task_type( $task ) {
		$map = array(
			'rewrite_intro'      => 'writing',
			'generate_headlines' => 'headline',
			'write_cta'          => 'cta',
		);

		return isset( $map[ $task ] ) ? $map[ $task ] : 'writing';
	}
}
