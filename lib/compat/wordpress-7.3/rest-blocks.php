<?php
/**
 * Adds parsed block data to post REST API responses.
 *
 * @package gutenberg
 */

/**
 * Converts parsed blocks to the shape returned in `content.blocks`.
 *
 * Keys match the public properties of `WP_Block`. Whitespace-only freeform
 * blocks between top-level blocks are dropped.
 *
 * @param array<mixed> $parsed_blocks Blocks as returned by `parse_blocks()`.
 * @return list<array<string, mixed>> Block data.
 */
function gutenberg_prepare_blocks_for_rest( array $parsed_blocks ): array {
	$blocks = array();

	foreach ( $parsed_blocks as $parsed_block ) {
		if ( ! is_array( $parsed_block ) ) {
			continue;
		}

		$name       = isset( $parsed_block['blockName'] ) && is_string( $parsed_block['blockName'] ) ? $parsed_block['blockName'] : null;
		$inner_html = isset( $parsed_block['innerHTML'] ) && is_string( $parsed_block['innerHTML'] ) ? $parsed_block['innerHTML'] : '';

		if ( null === $name && '' === trim( $inner_html ) ) {
			continue;
		}

		$blocks[] = array(
			'name'          => $name,
			'attributes'    => (object) ( isset( $parsed_block['attrs'] ) && is_array( $parsed_block['attrs'] ) ? $parsed_block['attrs'] : array() ),
			'inner_blocks'  => gutenberg_prepare_blocks_for_rest( isset( $parsed_block['innerBlocks'] ) && is_array( $parsed_block['innerBlocks'] ) ? $parsed_block['innerBlocks'] : array() ),
			'inner_html'    => $inner_html,
			'inner_content' => isset( $parsed_block['innerContent'] ) && is_array( $parsed_block['innerContent'] ) ? $parsed_block['innerContent'] : array(),
		);
	}

	return $blocks;
}

/**
 * Adds `content.blocks` to a post REST API response.
 *
 * Blocks hold the raw stored markup, so like `content.raw` they need the
 * `edit` context and permission to edit the post. They are also opt-in:
 * the request must name `content.blocks` in `_fields`.
 *
 * @param WP_REST_Response|mixed $response The response object.
 * @param WP_Post|mixed          $post     Post object.
 * @param WP_REST_Request|mixed  $request  Request object.
 * @return WP_REST_Response|mixed The response object.
 */
function gutenberg_add_blocks_to_post_rest_response( $response, $post, $request ) {
	if ( ! $response instanceof WP_REST_Response || ! $post instanceof WP_Post || ! $request instanceof WP_REST_Request ) {
		return $response;
	}

	$fields = $request['_fields'];
	if (
		'edit' !== $request['context'] ||
		! ( is_string( $fields ) || is_array( $fields ) ) ||
		! in_array( 'content.blocks', wp_parse_list( $fields ), true ) ||
		! current_user_can( 'edit_post', $post->ID )
	) {
		return $response;
	}

	$data = $response->get_data();
	if ( ! is_array( $data ) || ! isset( $data['content'] ) || ! is_array( $data['content'] ) || isset( $data['content']['blocks'] ) ) {
		return $response;
	}

	$data['content']['blocks'] = gutenberg_prepare_blocks_for_rest( parse_blocks( $post->post_content ) );
	$response->set_data( $data );

	return $response;
}

/**
 * Adds `content.blocks` to a post type's REST API item schema.
 *
 * @param array<string, mixed> $schema Item schema.
 * @return array<string, mixed> Item schema.
 */
function gutenberg_add_blocks_to_post_rest_schema( array $schema ): array {
	$properties = $schema['properties'] ?? null;
	if (
		! is_array( $properties ) ||
		! isset( $properties['content'] ) ||
		! is_array( $properties['content'] ) ||
		! isset( $properties['content']['properties'] ) ||
		! is_array( $properties['content']['properties'] )
	) {
		return $schema;
	}

	$properties['content']['properties']['blocks'] = array(
		'description' => __( 'Blocks parsed from the content. Only returned when requested with _fields.', 'gutenberg' ),
		'type'        => 'array',
		'context'     => array( 'edit' ),
		'readonly'    => true,
		'items'       => array(
			'type'       => 'object',
			'properties' => array(
				'name'          => array(
					'description' => __( 'Block name, or null for freeform content.', 'gutenberg' ),
					'type'        => array( 'string', 'null' ),
				),
				'attributes'    => array(
					'description' => __( 'Attributes stored in the block delimiter.', 'gutenberg' ),
					'type'        => 'object',
				),
				'inner_blocks'  => array(
					'description' => __( 'Nested blocks, in the same shape.', 'gutenberg' ),
					'type'        => 'array',
					'items'       => array( 'type' => 'object' ),
				),
				'inner_html'    => array(
					'description' => __( 'Block HTML without its inner blocks.', 'gutenberg' ),
					'type'        => 'string',
				),
				'inner_content' => array(
					'description' => __( 'HTML chunks, with null where each inner block goes.', 'gutenberg' ),
					'type'        => 'array',
					'items'       => array( 'type' => array( 'string', 'null' ) ),
				),
			),
		),
	);

	$schema['properties'] = $properties;

	return $schema;
}

/**
 * Registers `content.blocks` for a REST-enabled post type.
 *
 * Post types without a `content` field are skipped when the response is built.
 *
 * @param string       $post_type        Post type slug.
 * @param WP_Post_Type $post_type_object Post type object.
 */
function gutenberg_register_post_rest_blocks( $post_type, $post_type_object ): void {
	if ( ! is_string( $post_type ) || ! $post_type_object instanceof WP_Post_Type || ! $post_type_object->show_in_rest ) {
		return;
	}

	add_filter( "rest_prepare_{$post_type}", 'gutenberg_add_blocks_to_post_rest_response', 10, 3 );
	add_filter( "rest_{$post_type}_item_schema", 'gutenberg_add_blocks_to_post_rest_schema' );
}
add_action( 'registered_post_type', 'gutenberg_register_post_rest_blocks', 10, 2 );
