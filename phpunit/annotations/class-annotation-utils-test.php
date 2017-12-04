<?php
/**
 * WP_Annotation_Utils Tests
 *
 * @package gutenberg
 */

require_once dirname( __FILE__ ) . '/includes/class-annotation-test-objects.php';
require_once dirname( __FILE__ ) . '/includes/class-annotation-test-utils.php';

/**
 * Tests annotation utilities.
 */
class Annotation_Utils_Test extends WP_UnitTestCase {
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
	 * Tests comment status.
	 */
	public function test_comment_status() {
		$user       = $this->objects->create_user( 'editor' );
		$post       = $this->objects->create_post( $user->ID );
		$annotation = $this->objects->create_annotation( array(
			'in_post_id' => $post->ID,
			'by_user_id' => $user->ID,
		) );

		$this->assertEmpty( WP_Annotation_Utils::get_comment_status( null ), 'get:nonexistent' );
		$this->assertEmpty( WP_Annotation_Utils::get_comment_status( 999999 ), 'get:unknown' );
		$this->assertNotEmpty( WP_Annotation_Utils::get_comment_status( $annotation->comment ), 'get:status' );

		$this->assertFalse( WP_Annotation_Utils::set_comment_status( null, 'archive' ), 'set:nonexistent' );
		$this->assertFalse( WP_Annotation_Utils::set_comment_status( 999999, 'archive' ), 'set:unknown' );
		$this->assertTrue( WP_Annotation_Utils::set_comment_status( $annotation->comment, 'archive' ), 'set:archive' );
		$this->assertTrue( WP_Annotation_Utils::set_comment_status( $annotation->comment, 'approve' ), 'set:approve' );

		$this->assertTrue( wp_spam_comment( $annotation->comment ), 'wp_spam_comment' );
		$this->assertEmpty( WP_Annotation_Utils::unspam_comment( null ), 'unspam:nonexistent' );
		$this->assertEmpty( WP_Annotation_Utils::unspam_comment( 999999 ), 'unspam:unknown' );
		$this->assertNotEmpty( WP_Annotation_Utils::unspam_comment( $annotation->comment ), 'unspam' );

		$this->assertTrue( wp_trash_comment( $annotation->comment ), 'wp_trash_comment' );
		$this->assertEmpty( WP_Annotation_Utils::untrash_comment( null ), 'untrash:nonexistent' );
		$this->assertEmpty( WP_Annotation_Utils::untrash_comment( 999999 ), 'untrash:unknown' );
		$this->assertNotEmpty( WP_Annotation_Utils::untrash_comment( $annotation->comment ), 'untrash' );
	}

	/**
	 * Tests client validation.
	 */
	public function test_is_valid_client() {
		$this->assertFalse( WP_Annotation_Utils::is_valid_client( array( 'foo' ) ), 'array(foo)' );
		$this->assertFalse( WP_Annotation_Utils::is_valid_client( '^foo' ), '^foo' );
		$this->assertTrue( WP_Annotation_Utils::is_valid_client( 'foo' ), 'foo' );
	}

	/**
	 * Tests selector validation.
	 */
	public function test_is_valid_selector() {
		$this->assertFalse( WP_Annotation_Utils::is_valid_selector( 'foo' ), 'foo' );
		$this->assertFalse( WP_Annotation_Utils::is_valid_selector( array( 'foo' ) ), 'array(foo)' );
		$this->assertFalse( WP_Annotation_Utils::is_valid_selector( array( 'type' => 'foo' ) ), '1 key' );

		$this->assertFalse(
			WP_Annotation_Utils::is_valid_selector(
				array(
					'type'  => 'foo',
					'value' => 'foo',
				)
			),
			'CssSelector'
		);

		$this->assertTrue(
			WP_Annotation_Utils::is_valid_selector(
				array(
					'type'  => 'CssSelector',
					'value' => '#foo > .bar',
				)
			),
			'CssSelector'
		);
	}

	/**
	 * Tests content empty checks.
	 */
	public function test_is_content_empty() {
		$this->assertTrue( WP_Annotation_Utils::is_content_empty( null ), 'null' );
		$this->assertTrue( WP_Annotation_Utils::is_content_empty( '' ), 'empty string' );
		$this->assertFalse( WP_Annotation_Utils::is_content_empty( 'foo' ), 'foo' );
	}
}
