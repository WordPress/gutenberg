<?php
/**
 * Functions related to editor blocks for the Gutenberg editor plugin.
 *
 * @package gutenberg
 */

if ( ! defined( 'ABSPATH' ) ) {
	die( 'Silence is golden.' );
}

/**
 * Registers a block type.
 *
 * @since 0.1.0
 * @since 0.6.0 Now also accepts a WP_Block_Type instance as first parameter.
 *
 * @param string|WP_Block_Type $name Block type name including namespace, or alternatively a
 *                                   complete WP_Block_Type instance. In case a WP_Block_Type
 *                                   is provided, the $args parameter will be ignored.
 * @param array                $args {
 *     Optional. Array of block type arguments. Any arguments may be defined, however the
 *     ones described below are supported by default. Default empty array.
 *
 *     @type callable $render_callback Callback used to render blocks of this block type.
 * }
 * @return WP_Block_Type|false The registered block type on success, or false on failure.
 */
function register_block_type( $name, $args = array() ) {
	return WP_Block_Type_Registry::get_instance()->register( $name, $args );
}

/**
 * Unregisters a block type.
 *
 * @since 0.1.0
 * @since 0.6.0 Now also accepts a WP_Block_Type instance as first parameter.
 *
 * @param string|WP_Block_Type $name Block type name including namespace, or alternatively a
 *                                   complete WP_Block_Type instance.
 * @return WP_Block_Type|false The unregistered block type on success, or false on failure.
 */
function unregister_block_type( $name ) {
	return WP_Block_Type_Registry::get_instance()->unregister( $name );
}

/**
 * Parses blocks out of a content string.
 *
 * @since 0.5.0
 *
 * @param  string $content Post content.
 * @return array  Array of parsed block objects.
 */
function gutenberg_parse_blocks( $content ) {
	$parser = new Gutenberg_PEG_Parser;
	return $parser->parse( _gutenberg_utf8_split( $content ) );
}

/**
 * Parses dynamic blocks out of `post_content` and re-renders them.
 *
 * @since 0.1.0
 *
 * @param  string $content Post content.
 * @return string          Updated post content.
 */
function do_blocks( $content ) {
	$registry = WP_Block_Type_Registry::get_instance();

	$blocks = gutenberg_parse_blocks( $content );

	$content_after_blocks = '';

	foreach ( $blocks as $block ) {
		$block_name = isset( $block['blockName'] ) ? $block['blockName'] : null;
		$attributes = is_array( $block['attrs'] ) ? $block['attrs'] : array();
		$raw_content = isset( $block['rawContent'] ) ? $block['rawContent'] : null;

		if ( $block_name ) {
			$block_type = $registry->get_registered( $block_name );
			if ( null !== $block_type ) {
				$content_after_blocks .= $block_type->render( $attributes, $raw_content );
				continue;
			}
		}

		if ( $raw_content ) {
			$content_after_blocks .= $raw_content;
		}
	}

	return $content_after_blocks;
}
add_filter( 'the_content', 'do_blocks', 9 ); // BEFORE do_shortcode() and wpautop().


/**
 * Extract the blocks from post content for the REST API post response.
 *
 * @since 1.1.0
 *
 * @param string The post content.
 *
 * @return array Array of block data.
 */
function get_block_data_for_api_from_post_content( $content ) {
	$registry = WP_Block_Type_Registry::get_instance();
	$blocks   = gutenberg_parse_blocks( $content );
	$data     = array();
	$data_pre = array();

	// Loop thru the blocks, adding rendered content when available.
	foreach ( $blocks as $block ) {
		$block_name  = isset( $block['blockName'] ) ? $block['blockName'] : null;
		$attributes  = is_array( $block['attrs'] ) ? $block['attrs'] : array();
		$raw_content = isset( $block['rawContent'] ) ? $block['rawContent'] : null;
		if ( null !== $block_name ) {
			$block_type = $registry->get_registered( $block_name );
			if ( null !== $block_type ) {
				$block['renderedContent'] = $block_type->render( $attributes, $raw_content );
			}
			$data_pre[] = $block;
		}
	}

	// Remap the block fields for the response.
	foreach ( $data_pre as $block ) {
		$data[] = array(
			'type'       => $block['blockName'],
			'attributes' => $block['attrs'],
			'content'    => $block['rawContent'],
			'rendered'   => isset( $block['renderedContent'] ) ? $block['renderedContent'] : null,
		);
	}

	return $data;
}

/**
 * Attach a post's block data callback to the REST API response.
 *
 * @since 1.1.0
 *
 * @param string | array $post_type Post type, or array of post types.
 */
function attach_block_response_callback( $post_type ) {
	if ( empty( $post_type ) ) {
		$post_type = 'post';
	}
	if ( is_array( $post_type ) ) {
		foreach ( $post_type as $type ) {
			add_filter( 'rest_prepare_' . $type, 'attach_block_data_to_post_response', 10, 2 );
		}
	} else {
		add_filter( 'rest_prepare_' . $post_type, 'attach_block_data_to_post_response', 10, 2 );
	}
}
attach_block_response_callback( 'post' );

/**
 * Attach a post's block data to the REST API response.
 *
 * @since 1.1.0
 *
 * @param string $post_type Post type.
 */
function attach_block_data_to_post_response( $response, $post ) {
	if ( ! $post ) {
		return $response;
	}
	$blocks = get_block_data_for_api_from_post_content( $post->post_content );
	if ( $blocks ) {
		$response->data['content']['blocks'] = $blocks;
	}
	return $response;
}
