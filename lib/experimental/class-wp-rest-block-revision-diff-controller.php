<?php
/**
 * REST API: WP_REST_Block_Revision_Diff_Controller class
 *
 * Provides a REST endpoint for computing block-level diffs between revisions.
 *
 * @package gutenberg
 */

if ( ! defined( 'ABSPATH' ) ) {
	die( 'Silence is golden.' );
}

/**
 * Controller for block-aware revision diff endpoint.
 *
 * @since 6.9.0
 */
class WP_REST_Block_Revision_Diff_Controller extends WP_REST_Controller {

	/**
	 * Constructor.
	 */
	public function __construct() {
		$this->namespace = 'gutenberg/v1';
		$this->rest_base = 'posts/(?P<parent_id>[\d]+)/revisions/diff';
	}

	/**
	 * Registers the routes for the controller.
	 */
	public function register_routes() {
		register_rest_route(
			$this->namespace,
			'/' . $this->rest_base,
			array(
				array(
					'methods'             => WP_REST_Server::READABLE,
					'callback'            => array( $this, 'get_diff' ),
					'permission_callback' => array( $this, 'get_diff_permissions_check' ),
					'args'                => array(
						'parent_id' => array(
							'description' => __( 'The ID of the post.', 'gutenberg' ),
							'type'        => 'integer',
							'required'    => true,
						),
						'from'      => array(
							'description' => __( 'Source revision ID.', 'gutenberg' ),
							'type'        => 'integer',
							'required'    => true,
						),
						'to'        => array(
							'description' => __( 'Target revision ID.', 'gutenberg' ),
							'type'        => 'integer',
							'required'    => true,
						),
					),
				),
				'schema' => array( $this, 'get_public_item_schema' ),
			)
		);
	}

	/**
	 * Checks if a given request has access to read the diff.
	 *
	 * @param WP_REST_Request $request Full details about the request.
	 * @return true|WP_Error True if the request has access, WP_Error otherwise.
	 */
	public function get_diff_permissions_check( $request ) {
		$parent_id = $request['parent_id'];
		$post      = get_post( $parent_id );

		if ( ! $post ) {
			return new WP_Error(
				'rest_post_invalid_id',
				__( 'Invalid post ID.', 'gutenberg' ),
				array( 'status' => 404 )
			);
		}

		if ( ! current_user_can( 'edit_post', $parent_id ) ) {
			return new WP_Error(
				'rest_cannot_read',
				__( 'Sorry, you are not allowed to view revisions of this post.', 'gutenberg' ),
				array( 'status' => rest_authorization_required_code() )
			);
		}

		return true;
	}

	/**
	 * Retrieves the block-level diff between two revisions.
	 *
	 * @param WP_REST_Request $request Full details about the request.
	 * @return WP_REST_Response|WP_Error Response object on success, or WP_Error on failure.
	 */
	public function get_diff( $request ) {
		$parent_id    = $request['parent_id'];
		$from_id      = $request['from'];
		$to_id        = $request['to'];

		// Validate revisions belong to the parent post.
		$from_revision = $this->get_revision( $from_id, $parent_id );
		if ( is_wp_error( $from_revision ) ) {
			return $from_revision;
		}

		$to_revision = $this->get_revision( $to_id, $parent_id );
		if ( is_wp_error( $to_revision ) ) {
			return $to_revision;
		}

		// Parse blocks from both revisions.
		$from_blocks = parse_blocks( $from_revision->post_content );
		$to_blocks   = parse_blocks( $to_revision->post_content );

		// Compute the diff.
		$diff_items = $this->compute_block_diff( $from_blocks, $to_blocks );

		// Count changes.
		$summary = $this->compute_summary( $diff_items );

		// Get author information.
		$from_author = get_userdata( $from_revision->post_author );
		$to_author   = get_userdata( $to_revision->post_author );

		$response = array(
			'oldRevisionId' => $from_id,
			'newRevisionId' => $to_id,
			'oldDate'       => $from_revision->post_date,
			'newDate'       => $to_revision->post_date,
			'oldAuthor'     => $from_author ? $from_author->display_name : __( 'Unknown', 'gutenberg' ),
			'newAuthor'     => $to_author ? $to_author->display_name : __( 'Unknown', 'gutenberg' ),
			'summary'       => $summary,
			'blocks'        => $diff_items,
		);

		return rest_ensure_response( $response );
	}

	/**
	 * Gets a revision and validates it belongs to the parent post.
	 *
	 * @param int $revision_id The revision ID.
	 * @param int $parent_id   The parent post ID.
	 * @return WP_Post|WP_Error The revision post or error.
	 */
	private function get_revision( $revision_id, $parent_id ) {
		$revision = get_post( $revision_id );

		if ( ! $revision ) {
			return new WP_Error(
				'rest_revision_invalid_id',
				__( 'Invalid revision ID.', 'gutenberg' ),
				array( 'status' => 404 )
			);
		}

		if ( 'revision' !== $revision->post_type ) {
			return new WP_Error(
				'rest_revision_invalid_type',
				__( 'The specified ID is not a revision.', 'gutenberg' ),
				array( 'status' => 400 )
			);
		}

		if ( (int) $revision->post_parent !== (int) $parent_id ) {
			return new WP_Error(
				'rest_revision_parent_mismatch',
				__( 'The revision does not belong to the specified post.', 'gutenberg' ),
				array( 'status' => 400 )
			);
		}

		return $revision;
	}

	/**
	 * Computes the block-level diff between two arrays of parsed blocks.
	 *
	 * @param array $old_blocks Blocks from older revision.
	 * @param array $new_blocks Blocks from newer revision.
	 * @return array Array of diff items.
	 */
	private function compute_block_diff( $old_blocks, $new_blocks ) {
		$diff = array();

		// Filter out empty blocks (whitespace-only).
		$old_blocks = $this->filter_empty_blocks( $old_blocks );
		$new_blocks = $this->filter_empty_blocks( $new_blocks );

		// Index blocks by signature for comparison.
		$old_index = $this->index_blocks( $old_blocks );
		$new_index = $this->index_blocks( $new_blocks );

		$processed_new = array();

		// Process old blocks - find removed and modified.
		foreach ( $old_index as $i => $old_block ) {
			$signature = $this->get_block_signature( $old_block );
			$found     = false;

			foreach ( $new_index as $j => $new_block ) {
				if ( isset( $processed_new[ $j ] ) ) {
					continue;
				}

				$new_signature = $this->get_block_signature( $new_block );

				// Same block type at similar position.
				if ( $old_block['blockName'] === $new_block['blockName'] ) {
					$processed_new[ $j ] = true;
					$found               = true;

					// Check if content/attributes changed.
					$attribute_changes = $this->compare_attributes(
						$old_block['attrs'] ?? array(),
						$new_block['attrs'] ?? array()
					);

					$content_changed = $this->normalize_content( $old_block['innerHTML'] ?? '' ) !==
									   $this->normalize_content( $new_block['innerHTML'] ?? '' );

					if ( $content_changed || ! empty( $attribute_changes ) ) {
						$diff[] = array(
							'id'               => 'diff-' . wp_generate_uuid4(),
							'type'             => 'modified',
							'blockName'        => $old_block['blockName'],
							'oldBlock'         => $this->prepare_block_for_response( $old_block ),
							'newBlock'         => $this->prepare_block_for_response( $new_block ),
							'attributeChanges' => $attribute_changes,
							'innerBlocksDiff'  => $this->compute_block_diff(
								$old_block['innerBlocks'] ?? array(),
								$new_block['innerBlocks'] ?? array()
							),
						);
					} else {
						$diff[] = array(
							'id'              => 'diff-' . wp_generate_uuid4(),
							'type'            => 'unchanged',
							'blockName'       => $old_block['blockName'],
							'oldBlock'        => $this->prepare_block_for_response( $old_block ),
							'newBlock'        => $this->prepare_block_for_response( $new_block ),
							'innerBlocksDiff' => $this->compute_block_diff(
								$old_block['innerBlocks'] ?? array(),
								$new_block['innerBlocks'] ?? array()
							),
						);
					}
					break;
				}
			}

			if ( ! $found ) {
				$diff[] = array(
					'id'        => 'diff-' . wp_generate_uuid4(),
					'type'      => 'removed',
					'blockName' => $old_block['blockName'],
					'oldBlock'  => $this->prepare_block_for_response( $old_block ),
				);
			}
		}

		// Find added blocks (in new but not processed).
		foreach ( $new_index as $j => $new_block ) {
			if ( ! isset( $processed_new[ $j ] ) ) {
				$diff[] = array(
					'id'        => 'diff-' . wp_generate_uuid4(),
					'type'      => 'added',
					'blockName' => $new_block['blockName'],
					'newBlock'  => $this->prepare_block_for_response( $new_block ),
				);
			}
		}

		return $diff;
	}

	/**
	 * Filters out empty/whitespace-only blocks.
	 *
	 * @param array $blocks Array of blocks.
	 * @return array Filtered blocks.
	 */
	private function filter_empty_blocks( $blocks ) {
		return array_values(
			array_filter(
				$blocks,
				function ( $block ) {
					// Keep blocks that have a name (not just whitespace).
					return ! empty( $block['blockName'] );
				}
			)
		);
	}

	/**
	 * Creates an indexed array of blocks.
	 *
	 * @param array $blocks Array of blocks.
	 * @return array Indexed blocks.
	 */
	private function index_blocks( $blocks ) {
		$indexed = array();
		foreach ( $blocks as $i => $block ) {
			$indexed[ $i ] = $block;
		}
		return $indexed;
	}

	/**
	 * Generates a signature for a block for comparison purposes.
	 *
	 * @param array $block The block to generate signature for.
	 * @return string The block signature.
	 */
	private function get_block_signature( $block ) {
		return $block['blockName'] . ':' . md5( wp_json_encode( $block['attrs'] ?? array() ) . ( $block['innerHTML'] ?? '' ) );
	}

	/**
	 * Normalizes block content for comparison.
	 *
	 * @param string $content The content to normalize.
	 * @return string Normalized content.
	 */
	private function normalize_content( $content ) {
		// Remove extra whitespace and normalize line endings.
		$content = preg_replace( '/\s+/', ' ', $content );
		return trim( $content );
	}

	/**
	 * Compares two attribute arrays and returns the differences.
	 *
	 * @param array $old_attrs Old attributes.
	 * @param array $new_attrs New attributes.
	 * @return array Array of attribute changes.
	 */
	private function compare_attributes( $old_attrs, $new_attrs ) {
		$changes = array();

		$all_keys = array_unique( array_merge( array_keys( $old_attrs ), array_keys( $new_attrs ) ) );

		foreach ( $all_keys as $key ) {
			$old_value = $old_attrs[ $key ] ?? null;
			$new_value = $new_attrs[ $key ] ?? null;

			if ( $old_value !== $new_value ) {
				$changes[] = array(
					'attribute' => $key,
					'oldValue'  => $old_value,
					'newValue'  => $new_value,
				);
			}
		}

		return $changes;
	}

	/**
	 * Prepares a block for the REST response.
	 *
	 * @param array $block The block to prepare.
	 * @return array Prepared block data.
	 */
	private function prepare_block_for_response( $block ) {
		return array(
			'blockName'   => $block['blockName'],
			'attrs'       => $block['attrs'] ?? array(),
			'innerHTML'   => $block['innerHTML'] ?? '',
			'innerBlocks' => array_map(
				array( $this, 'prepare_block_for_response' ),
				$block['innerBlocks'] ?? array()
			),
		);
	}

	/**
	 * Computes summary counts from diff items.
	 *
	 * @param array $diff_items Array of diff items.
	 * @return array Summary counts.
	 */
	private function compute_summary( $diff_items ) {
		$summary = array(
			'added'     => 0,
			'removed'   => 0,
			'modified'  => 0,
			'unchanged' => 0,
		);

		foreach ( $diff_items as $item ) {
			if ( isset( $summary[ $item['type'] ] ) ) {
				++$summary[ $item['type'] ];
			}

			// Count nested changes.
			if ( ! empty( $item['innerBlocksDiff'] ) ) {
				$nested = $this->compute_summary( $item['innerBlocksDiff'] );
				$summary['added']     += $nested['added'];
				$summary['removed']   += $nested['removed'];
				$summary['modified']  += $nested['modified'];
				$summary['unchanged'] += $nested['unchanged'];
			}
		}

		return $summary;
	}

	/**
	 * Retrieves the item's schema, conforming to JSON Schema.
	 *
	 * @return array Item schema data.
	 */
	public function get_item_schema() {
		return array(
			'$schema'    => 'http://json-schema.org/draft-04/schema#',
			'title'      => 'revision-diff',
			'type'       => 'object',
			'properties' => array(
				'oldRevisionId' => array(
					'description' => __( 'The ID of the source revision.', 'gutenberg' ),
					'type'        => 'integer',
				),
				'newRevisionId' => array(
					'description' => __( 'The ID of the target revision.', 'gutenberg' ),
					'type'        => 'integer',
				),
				'oldDate'       => array(
					'description' => __( 'The date of the source revision.', 'gutenberg' ),
					'type'        => 'string',
				),
				'newDate'       => array(
					'description' => __( 'The date of the target revision.', 'gutenberg' ),
					'type'        => 'string',
				),
				'oldAuthor'     => array(
					'description' => __( 'The author of the source revision.', 'gutenberg' ),
					'type'        => 'string',
				),
				'newAuthor'     => array(
					'description' => __( 'The author of the target revision.', 'gutenberg' ),
					'type'        => 'string',
				),
				'summary'       => array(
					'description' => __( 'Summary of changes.', 'gutenberg' ),
					'type'        => 'object',
					'properties'  => array(
						'added'     => array( 'type' => 'integer' ),
						'removed'   => array( 'type' => 'integer' ),
						'modified'  => array( 'type' => 'integer' ),
						'unchanged' => array( 'type' => 'integer' ),
					),
				),
				'blocks'        => array(
					'description' => __( 'Array of block diff items.', 'gutenberg' ),
					'type'        => 'array',
				),
			),
		);
	}
}

