<?php
/**
 * AI Assistant for Block Editor
 *
 * Experimental AI-powered assistant for WordPress block editor.
 *
 * @package WordPress
 * @subpackage AI Assistant
 * @since 6.9.0
 */

/**
 * Class WP_AI_Assistant
 *
 * Handles AI assistant functionality including REST API endpoints and OpenAI integration.
 */
if ( ! class_exists( 'WP_AI_Assistant' ) ) {
	class WP_AI_Assistant {

	/**
	 * Initialize the AI Assistant
	 */
	public static function init() {
		add_action( 'rest_api_init', array( __CLASS__, 'register_rest_routes' ) );
		add_action( 'enqueue_block_editor_assets', array( __CLASS__, 'enqueue_editor_assets' ) );
	}

	/**
	 * Enqueue block editor assets
	 */
	public static function enqueue_editor_assets() {
		$asset_file = include ABSPATH . WPINC . '/assets/script-loader-packages.php';

		wp_enqueue_script(
			'wp-ai-assistant',
			includes_url( 'js/dist/ai-assistant.min.js' ),
			$asset_file['dependencies'] ?? array( 'wp-abilities', 'wp-block-editor', 'wp-blocks' ),
			$asset_file['version'] ?? get_bloginfo( 'version' ),
			array( 'in_footer' => true )
		);

		// Pass data to JavaScript
		wp_localize_script(
			'wp-ai-assistant',
			'wpAiAssistant',
			array(
				'apiUrl'   => rest_url( 'ai-assistant/v1/' ),
				'nonce'    => wp_create_nonce( 'wp_rest' ),
				'canEdit'  => current_user_can( 'edit_posts' ),
				'hasApiKey' => ! empty( get_option( 'ai_assistant_api_key' ) ),
			)
		);
	}

	/**
	 * Register REST API endpoints
	 */
	public static function register_rest_routes() {
		register_rest_route(
			'ai-assistant/v1',
			'/chat',
			array(
				'methods'             => 'POST',
				'callback'            => array( __CLASS__, 'handle_chat' ),
				'permission_callback' => array( __CLASS__, 'check_permissions' ),
				'args'                => array(
					'message' => array(
						'required'          => true,
						'type'              => 'string',
						'sanitize_callback' => 'sanitize_textarea_field',
						'validate_callback' => function ( $param ) {
							return ! empty( trim( $param ) );
						},
					),
					'context' => array(
						'required' => false,
						'type'     => 'object',
					),
				),
			)
		);

		register_rest_route(
			'ai-assistant/v1',
			'/config',
			array(
				'methods'             => 'GET',
				'callback'            => array( __CLASS__, 'get_config' ),
				'permission_callback' => array( __CLASS__, 'check_admin_permissions' ),
			)
		);

		register_rest_route(
			'ai-assistant/v1',
			'/config',
			array(
				'methods'             => 'POST',
				'callback'            => array( __CLASS__, 'save_config' ),
				'permission_callback' => array( __CLASS__, 'check_admin_permissions' ),
				'args'                => array(
					'apiKey' => array(
						'required'          => false,
						'type'              => 'string',
						'sanitize_callback' => 'sanitize_text_field',
					),
					'model'  => array(
						'required'          => false,
						'type'              => 'string',
						'sanitize_callback' => 'sanitize_text_field',
					),
				),
			)
		);
	}

	/**
	 * Check permissions for chat endpoint
	 */
	public static function check_permissions() {
		return current_user_can( 'edit_posts' );
	}

	/**
	 * Check permissions for admin endpoints
	 */
	public static function check_admin_permissions() {
		return current_user_can( 'manage_options' );
	}

	/**
	 * Handle chat requests
	 */
	public static function handle_chat( $request ) {
		$params  = $request->get_params();
		$message = $params['message'] ?? '';
		$context = $params['context'] ?? array();

		// Build context message if blocks are provided
		$context_message = '';
		if ( ! empty( $context['blocks'] ) ) {
			$context_message = "\n\nCurrent blocks in the editor:\n";
			foreach ( $context['blocks'] as $block ) {
				if ( ! empty( $block['content'] ) ) {
					$context_message .= sprintf(
						"- Block ID: %s | Type: %s | Content: %s\n",
						esc_html( $block['id'] ),
						esc_html( $block['type'] ),
						esc_html( $block['content'] )
					);
				}
			}
		}

		// Get API key from options
		$api_key = get_option( 'ai_assistant_api_key' );

		if ( empty( $api_key ) ) {
			return new WP_REST_Response(
				array( 'error' => __( 'Please configure your OpenAI API key', 'gutenberg' ) ),
				400
			);
		}

		// Call OpenAI API with function calling
		$response = wp_remote_post(
			'https://api.openai.com/v1/chat/completions',
			array(
				'headers' => array(
					'Authorization' => 'Bearer ' . $api_key,
					'Content-Type'  => 'application/json',
				),
				'body'    => wp_json_encode(
					array(
						'model'       => 'gpt-4o-mini',
						'messages'    => array(
							array(
								'role'    => 'system',
								'content' => 'You are an AI assistant for the WordPress block editor. You have access to functions to manipulate blocks. When users ask to change, edit, or replace text, understand their intent and use the replaceTextInBlocks function. Extract the exact text they want to find and replace.' . $context_message,
							),
							array(
								'role'    => 'user',
								'content' => $message,
							),
						),
						'tools'       => self::get_function_definitions(),
						'tool_choice' => 'auto',
						'temperature' => 0.7,
						'max_tokens'  => 1000,
					)
				),
				'timeout' => 30,
			)
		);

		if ( is_wp_error( $response ) ) {
			return new WP_REST_Response(
				array( 'error' => __( 'Failed to connect to OpenAI', 'gutenberg' ) . ': ' . $response->get_error_message() ),
				500
			);
		}

		$body = wp_remote_retrieve_body( $response );
		$data = json_decode( $body, true );

		if ( empty( $data ) ) {
			return new WP_REST_Response(
				array( 'error' => __( 'Invalid response from OpenAI', 'gutenberg' ) ),
				500
			);
		}

		if ( isset( $data['error'] ) ) {
			return new WP_REST_Response(
				array( 'error' => $data['error']['message'] ?? __( 'Unknown OpenAI error', 'gutenberg' ) ),
				400
			);
		}

		$message = $data['choices'][0]['message'];

		// Check if the AI wants to call functions
		$tool_calls = isset( $message['tool_calls'] ) ? $message['tool_calls'] : null;

		return new WP_REST_Response(
			array(
				'response'   => isset( $message['content'] ) ? $message['content'] : '',
				'tool_calls' => $tool_calls,
				'usage'      => $data['usage'] ?? null,
			),
			200
		);
	}

	/**
	 * Get configuration
	 */
	public static function get_config() {
		return array(
			'hasApiKey' => ! empty( get_option( 'ai_assistant_api_key' ) ),
			'model'     => get_option( 'ai_assistant_model', 'gpt-4o-mini' ),
		);
	}

	/**
	 * Save configuration
	 */
	public static function save_config( $request ) {
		$params = $request->get_params();

		if ( isset( $params['apiKey'] ) ) {
			update_option( 'ai_assistant_api_key', $params['apiKey'] );
		}

		if ( isset( $params['model'] ) ) {
			update_option( 'ai_assistant_model', $params['model'] );
		}

		return array( 'success' => true );
	}

	/**
	 * Get function definitions for OpenAI
	 */
	private static function get_function_definitions() {
		return array(
			array(
				'type'     => 'function',
				'function' => array(
					'name'        => 'getBlocks',
					'description' => 'Get all blocks currently in the editor. Returns an array of blocks with their clientId, name, attributes, and innerBlocks count.',
				),
			),
			array(
				'type'     => 'function',
				'function' => array(
					'name'        => 'findBlocksWithText',
					'description' => 'Find all blocks containing specific text (case-insensitive search)',
					'parameters'  => array(
						'type'       => 'object',
						'properties' => array(
							'searchText' => array(
								'type'        => 'string',
								'description' => 'Text to search for in block content',
							),
						),
						'required'   => array( 'searchText' ),
					),
				),
			),
			array(
				'type'     => 'function',
				'function' => array(
					'name'        => 'replaceTextInBlocks',
					'description' => 'Replace text in all blocks that contain it. Use this when users ask to change, edit, or replace text.',
					'parameters'  => array(
						'type'       => 'object',
						'properties' => array(
							'findText'    => array(
								'type'        => 'string',
								'description' => 'The exact text to find (case-insensitive)',
							),
							'replaceText' => array(
								'type'        => 'string',
								'description' => 'The text to replace it with',
							),
						),
						'required'   => array( 'findText', 'replaceText' ),
					),
				),
			),
			array(
				'type'     => 'function',
				'function' => array(
					'name'        => 'insertBlock',
					'description' => 'Insert a new block into the editor',
					'parameters'  => array(
						'type'       => 'object',
						'properties' => array(
							'blockType' => array(
								'type'        => 'string',
								'description' => 'Type of block (e.g., core/paragraph, core/heading, core/list)',
								'default'     => 'core/paragraph',
							),
							'content'   => array(
								'type'        => 'string',
								'description' => 'Content for the new block',
							),
							'position'  => array(
								'type'        => 'integer',
								'description' => 'Position to insert at (optional)',
							),
						),
						'required'   => array( 'content' ),
					),
				),
			),
			array(
				'type'     => 'function',
				'function' => array(
					'name'        => 'updateBlock',
					'description' => 'Update the content of a specific block by its ID',
					'parameters'  => array(
						'type'       => 'object',
						'properties' => array(
							'clientId'   => array(
								'type'        => 'string',
								'description' => 'The block client ID',
							),
							'newContent' => array(
								'type'        => 'string',
								'description' => 'New content for the block',
							),
						),
						'required'   => array( 'clientId', 'newContent' ),
					),
				),
			),
			array(
				'type'     => 'function',
				'function' => array(
					'name'        => 'deleteBlock',
					'description' => 'Delete a block from the editor by its ID',
					'parameters'  => array(
						'type'       => 'object',
						'properties' => array(
							'clientId' => array(
								'type'        => 'string',
								'description' => 'The block client ID to delete',
							),
						),
						'required'   => array( 'clientId' ),
					),
				),
			),
		);
	}
}
