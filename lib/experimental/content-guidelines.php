<?php
/**
 * Content Guidelines - Site-level editorial guidelines for WordPress.
 *
 * This experimental feature adds a Content Guidelines panel to the Site Editor,
 * allowing site administrators to define voice, tone, copy rules, and vocabulary
 * that AI features can consume.
 *
 * While Global Styles define how your site looks, Content Guidelines define how
 * your site sounds.
 *
 * @package gutenberg
 */

namespace Gutenberg\ContentGuidelines;

defined( 'ABSPATH' ) || exit;

define( 'GUTENBERG_CONTENT_GUIDELINES_DIR', __DIR__ . '/content-guidelines/' );

/**
 * Autoloader for Content Guidelines classes.
 */
spl_autoload_register(
	function ( $class ) {
		$prefix   = 'Gutenberg\\ContentGuidelines\\';
		$base_dir = GUTENBERG_CONTENT_GUIDELINES_DIR;

		$len = strlen( $prefix );
		if ( strncmp( $prefix, $class, $len ) !== 0 ) {
			return;
		}

		$relative_class = substr( $class, $len );
		$file           = $base_dir . 'class-' . strtolower( str_replace( '_', '-', $relative_class ) ) . '.php';

		if ( file_exists( $file ) ) {
			require $file;
		}
	}
);

/**
 * Check whether the Content Guidelines experiment is enabled.
 *
 * @return bool Whether the experiment is enabled.
 */
function is_content_guidelines_enabled() {
	return function_exists( 'gutenberg_is_experiment_enabled' ) &&
		gutenberg_is_experiment_enabled( 'gutenberg-content-guidelines' );
}

/**
 * Initialize Content Guidelines.
 */
function init() {
	// Pass experiment flag to editor settings.
	add_filter( 'block_editor_settings_all', __NAMESPACE__ . '\\add_editor_settings' );

	if ( ! is_content_guidelines_enabled() ) {
		return;
	}

	// Initialize components.
	Post_Type::init();
	REST_Controller::init();
	Hooks::init();

	// Initialize Abilities API if available (WordPress 6.9+).
	if ( function_exists( 'wp_register_ability' ) ) {
		Abilities::init();
	}

}
add_action( 'init', __NAMESPACE__ . '\\init' );

/**
 * Add Content Guidelines settings to the block editor.
 *
 * @param array $settings Editor settings.
 * @return array Modified settings.
 */
function add_editor_settings( $settings ) {
	$settings['contentGuidelinesEnabled'] = is_content_guidelines_enabled();
	return $settings;
}

/**
 * Get the content guidelines for a site.
 *
 * @param string $use Which version to get: 'active' or 'draft'. Default 'active'.
 * @return array|null The guidelines data or null if not set.
 */
function get_content_guidelines( $use = 'active' ) {
	return Context_Packet_Builder::get_guidelines( $use );
}

/**
 * Get the context packet for AI consumption.
 *
 * @param array $args {
 *     Optional. Arguments for building the context packet.
 *
 *     @type string $task       Task type: 'writing', 'headline', 'cta', 'image', 'coach'. Default 'writing'.
 *     @type int    $post_id    Optional. Context post ID for per-post overrides.
 *     @type string $use        Which guidelines version: 'active' or 'draft'. Default 'active'.
 *     @type int    $max_chars  Maximum characters for the packet text. Default 2000.
 *     @type string $locale     Optional. Locale for multilingual sites.
 *     @type string $block_name Optional. Block name for block-specific guidelines.
 * }
 * @return array {
 *     The context packet.
 *
 *     @type string $packet_text       Formatted text for LLM prompts.
 *     @type array  $packet_structured Structured subset of guidelines relevant to task.
 *     @type int    $guidelines_id     Post ID of the guidelines entity.
 *     @type int    $revision_id       Current revision ID.
 *     @type string $updated_at        ISO 8601 timestamp of last update.
 * }
 */
function get_content_guidelines_packet( $args = array() ) {
	return Context_Packet_Builder::get_packet( $args );
}

/**
 * Get content guidelines for a specific post, with block-specific rules.
 *
 * @param int|\WP_Post $post Post ID or post object.
 * @param array        $args Optional arguments (task, use).
 * @return array Context packet with block-aware guidelines.
 */
function get_content_guidelines_for_post( $post, $args = array() ) {
	$post = get_post( $post );
	if ( ! $post ) {
		return array(
			'error'            => 'invalid_post',
			'packet_text'      => '',
			'blocks_in_post'   => array(),
			'block_guidelines' => array(),
		);
	}

	$defaults = array(
		'task' => 'writing',
		'use'  => 'active',
	);
	$args     = wp_parse_args( $args, $defaults );

	// Parse blocks from post content.
	$blocks      = parse_blocks( $post->post_content );
	$block_names = extract_block_names_recursive( $blocks );
	$block_names = array_unique( $block_names );

	// Get guidelines.
	$guidelines = Context_Packet_Builder::get_guidelines( $args['use'] );
	$post_obj   = Post_Type::get_guidelines_post();

	if ( ! $guidelines ) {
		return array(
			'packet_text'       => '',
			'packet_structured' => array(),
			'blocks_in_post'    => $block_names,
			'block_guidelines'  => array(),
			'guidelines_id'     => null,
			'updated_at'        => null,
		);
	}

	// Get base packet.
	$base_packet = Context_Packet_Builder::get_packet(
		array(
			'task' => $args['task'],
			'use'  => $args['use'],
		)
	);

	// Collect block-specific guidelines.
	$block_guidelines = array();
	$all_blocks_data  = isset( $guidelines['blocks'] ) ? $guidelines['blocks'] : array();

	foreach ( $block_names as $block_name ) {
		if ( isset( $all_blocks_data[ $block_name ] ) && ! empty( $all_blocks_data[ $block_name ] ) ) {
			$block_guidelines[ $block_name ] = $all_blocks_data[ $block_name ];
		}
	}

	// Build combined packet text with block rules.
	$packet_text = $base_packet['packet_text'];
	if ( ! empty( $block_guidelines ) ) {
		$packet_text .= "\n### Block-Specific Rules\n";
		foreach ( $block_guidelines as $block_name => $rules ) {
			$packet_text .= "\n**{$block_name}:**\n";
			if ( ! empty( $rules['copy_rules']['dos'] ) ) {
				$packet_text .= "DO:\n";
				foreach ( $rules['copy_rules']['dos'] as $rule ) {
					$packet_text .= "- {$rule}\n";
				}
			}
			if ( ! empty( $rules['copy_rules']['donts'] ) ) {
				$packet_text .= "DON'T:\n";
				foreach ( $rules['copy_rules']['donts'] as $rule ) {
					$packet_text .= "- {$rule}\n";
				}
			}
			if ( ! empty( $rules['notes'] ) ) {
				$packet_text .= "Note: {$rules['notes']}\n";
			}
		}
	}

	return array(
		'packet_text'       => $packet_text,
		'packet_structured' => $base_packet['packet_structured'],
		'blocks_in_post'    => $block_names,
		'block_guidelines'  => $block_guidelines,
		'guidelines_id'     => $post_obj ? $post_obj->ID : null,
		'updated_at'        => $post_obj ? $post_obj->post_modified_gmt : null,
	);
}

/**
 * Recursively extract block names from parsed blocks.
 *
 * @param array $blocks Parsed blocks array.
 * @return array Block names.
 */
function extract_block_names_recursive( $blocks ) {
	$names = array();
	foreach ( $blocks as $block ) {
		if ( ! empty( $block['blockName'] ) ) {
			$names[] = $block['blockName'];
		}
		if ( ! empty( $block['innerBlocks'] ) ) {
			$names = array_merge( $names, extract_block_names_recursive( $block['innerBlocks'] ) );
		}
	}
	return $names;
}

/**
 * Get guidelines for specific block types.
 *
 * @param string|array $block_names Block name(s) to get guidelines for.
 * @param array        $args        Optional arguments (task, use).
 * @return array Block guidelines data.
 */
function get_block_guidelines( $block_names, $args = array() ) {
	$defaults = array(
		'task' => 'writing',
		'use'  => 'active',
	);
	$args     = wp_parse_args( $args, $defaults );

	if ( ! is_array( $block_names ) ) {
		$block_names = array( $block_names );
	}

	$guidelines = Context_Packet_Builder::get_guidelines( $args['use'] );
	$post       = Post_Type::get_guidelines_post();

	if ( ! $guidelines ) {
		return array(
			'site_rules'    => array(),
			'blocks'        => array(),
			'packet_text'   => '',
			'guidelines_id' => null,
		);
	}

	// Get site-level copy rules.
	$site_rules = isset( $guidelines['copy_rules'] ) ? $guidelines['copy_rules'] : array();

	// Get block-specific rules.
	$blocks          = array();
	$all_blocks_data = isset( $guidelines['blocks'] ) ? $guidelines['blocks'] : array();

	foreach ( $block_names as $block_name ) {
		if ( isset( $all_blocks_data[ $block_name ] ) ) {
			$blocks[ $block_name ] = $all_blocks_data[ $block_name ];
		} else {
			$blocks[ $block_name ] = null; // Block exists but has no custom rules.
		}
	}

	// Build combined packet text.
	$packet_lines = array( '## CONTENT GUIDELINES' );

	if ( ! empty( $site_rules['dos'] ) || ! empty( $site_rules['donts'] ) ) {
		$packet_lines[] = '';
		$packet_lines[] = '### Site Rules';
		if ( ! empty( $site_rules['dos'] ) ) {
			$packet_lines[] = 'DO:';
			foreach ( $site_rules['dos'] as $rule ) {
				$packet_lines[] = "- {$rule}";
			}
		}
		if ( ! empty( $site_rules['donts'] ) ) {
			$packet_lines[] = "DON'T:";
			foreach ( $site_rules['donts'] as $rule ) {
				$packet_lines[] = "- {$rule}";
			}
		}
	}

	$has_block_rules = false;
	foreach ( $blocks as $block_name => $rules ) {
		if ( $rules && ( ! empty( $rules['copy_rules'] ) || ! empty( $rules['notes'] ) ) ) {
			if ( ! $has_block_rules ) {
				$packet_lines[]  = '';
				$packet_lines[]  = '### Block-Specific Rules';
				$has_block_rules = true;
			}
			$packet_lines[] = '';
			$packet_lines[] = "**{$block_name}:**";
			if ( ! empty( $rules['copy_rules']['dos'] ) ) {
				$packet_lines[] = 'DO:';
				foreach ( $rules['copy_rules']['dos'] as $rule ) {
					$packet_lines[] = "- {$rule}";
				}
			}
			if ( ! empty( $rules['copy_rules']['donts'] ) ) {
				$packet_lines[] = "DON'T:";
				foreach ( $rules['copy_rules']['donts'] as $rule ) {
					$packet_lines[] = "- {$rule}";
				}
			}
			if ( ! empty( $rules['notes'] ) ) {
				$packet_lines[] = "Note: {$rules['notes']}";
			}
		}
	}

	return array(
		'site_rules'    => $site_rules,
		'blocks'        => $blocks,
		'packet_text'   => implode( "\n", $packet_lines ),
		'guidelines_id' => $post ? $post->ID : null,
	);
}

// Register global helper functions.
if ( ! function_exists( 'wp_get_content_guidelines' ) ) {
	/**
	 * Get site content guidelines.
	 *
	 * @param string $use Which version: 'active' or 'draft'.
	 * @return array|null Guidelines data.
	 */
	function wp_get_content_guidelines( $use = 'active' ) {
		return \Gutenberg\ContentGuidelines\get_content_guidelines( $use );
	}
}

if ( ! function_exists( 'wp_get_content_guidelines_packet' ) ) {
	/**
	 * Get context packet for AI consumption.
	 *
	 * @param array $args Arguments for packet building.
	 * @return array Context packet.
	 */
	function wp_get_content_guidelines_packet( $args = array() ) {
		return \Gutenberg\ContentGuidelines\get_content_guidelines_packet( $args );
	}
}

if ( ! function_exists( 'wp_get_content_guidelines_for_post' ) ) {
	/**
	 * Get content guidelines packet for a specific post, with block-specific rules merged.
	 *
	 * @param int|\WP_Post $post Post ID or post object.
	 * @param array        $args Optional arguments.
	 * @return array Context packet with block-aware guidelines.
	 */
	function wp_get_content_guidelines_for_post( $post, $args = array() ) {
		return \Gutenberg\ContentGuidelines\get_content_guidelines_for_post( $post, $args );
	}
}

if ( ! function_exists( 'wp_get_block_guidelines' ) ) {
	/**
	 * Get guidelines for specific block types.
	 *
	 * @param string|array $block_names Single block name or array of block names.
	 * @param array        $args        Optional arguments.
	 * @return array Block guidelines data.
	 */
	function wp_get_block_guidelines( $block_names, $args = array() ) {
		return \Gutenberg\ContentGuidelines\get_block_guidelines( $block_names, $args );
	}
}
