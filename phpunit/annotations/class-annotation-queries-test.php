<?php
/**
 * Annotation Query Tests
 *
 * @package gutenberg
 */

require_once dirname( __FILE__ ) . '/includes/class-annotation-test-objects.php';
require_once dirname( __FILE__ ) . '/includes/class-annotation-test-utils.php';

/**
 * Tests annotation queries.
 */
class Annotation_Queries_Test extends WP_UnitTestCase {
	/**
	 * Magic first-access properties.
	 *
	 * @param  string $property Property name.
	 * @return mixed            Property value.
	 */
	public function __get( $property ) {
		if ( 'objects' === $property ) {
			$this->objects = new Annotation_Test_Objects( $this );
			return $this->objects;
		} elseif ( 'utils' === $property ) {
			$this->utils = new Annotation_Test_Utils( $this );
			return $this->utils;
		}
		return parent::__get( $property );
	}

	/**
	 * Check that we have necessary hooks.
	 */
	public function test_has_hooks() {
		$this->assertNotEmpty( has_filter( 'comments_clauses', 'WP_Annotation_Utils::on_comments_clauses' ) );
	}

	/**
	 * Test getting annotations.
	 */
	public function test_get_annotations() {
		$users       = $this->objects->create_users();
		$posts       = $this->objects->create_posts( $users, array( 'publish' ) );
		$annotations = $this->objects->create_annotations( array(
			'in_posts'      => $posts,
			'by_users'      => $users,
			'with_statuses' => array( '1' ),
		) );

		$query          = new WP_Comment_Query();
		$annotation_ids = $query->query( array(
			'fields'       => 'ids',
			'type'         => get_annotation_types(),
			'cache_domain' => 'annotations',
			'status'       => 'any',
			'number'       => 0,
		) );
		$this->assertSame( 16, count( $annotation_ids ) );
	}

	/**
	 * Test getting non-annotation comments.
	 */
	public function test_get_non_annotation_comments() {
		$users       = $this->objects->create_users();
		$posts       = $this->objects->create_posts( $users, array( 'publish', 'trash' ) );
		$annotations = $this->objects->create_annotations( array(
			'in_posts'      => $posts,
			'by_users'      => $users,
			'with_statuses' => array( '0', '1', 'archive', 'spam', 'trash' ),
		) );

		$query       = new WP_Comment_Query();
		$comment_ids = $query->query( array(
			'fields' => 'ids',
			'status' => 'any',
			'number' => 0,
		) );
		$this->assertEmpty( $comment_ids, 'no type' );

		$query       = new WP_Comment_Query();
		$comment_ids = $query->query( array(
			'fields' => 'ids',
			'type'   => 'all',
			'status' => 'any',
			'number' => 0,
		) );
		$this->assertEmpty( $comment_ids, 'all types' );
	}

	/**
	 * Test that permanently deleting a post erases its annotations.
	 */
	public function test_delete_post_annotations() {
		$user = $this->objects->create_user( 'editor' );
		$post = $this->objects->create_post( $user->ID );

		$this->objects->create_annotation( $post->ID, $user->ID, 0, '0' );
		$this->objects->create_annotation( $post->ID, $user->ID, 0, '1' );

		wp_delete_post( $post->ID, true );

		$query          = new WP_Comment_Query();
		$annotation_ids = $query->query( array(
			'fields'       => 'ids',
			'post_id'      => $post->ID,
			'cache_domain' => 'annotations',
			'type'         => get_annotation_types(),
			'status'       => 'any',
			'number'       => 0,
		) );

		$this->assertEmpty( $annotation_ids );
	}
}
