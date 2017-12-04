<?php
/**
 * Annotation Tests
 *
 * @package gutenberg
 */

require_once dirname( __FILE__ ) . '/includes/class-annotation-test-objects.php';
require_once dirname( __FILE__ ) . '/includes/class-annotation-test-utils.php';

/**
 * Tests annotation class.
 */
class Annotation_Test extends WP_UnitTestCase {
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
	 * Test an annotation.
	 */
	public function test_annotation() {
		$user       = $this->objects->create_user( 'editor' );
		$post       = $this->objects->create_post( $user->ID );
		$annotation = $this->objects->create_annotation( array(
			'in_post_id' => $post->ID,
			'by_user_id' => $user->ID,
		) );

		$this->assertInstanceOf( 'WP_Annotation', $annotation, 'instanceof' );
		$this->assertInstanceOf( 'WP_Annotation_Selector', $annotation->get_selector(), 'get_selector' );
		$this->assertSame( true, $annotation->exists(), 'exists' );

		$this->assertSame( 'gutenberg', $annotation->get_meta( '_via' ), 'get_meta_via' );
		$this->assertSame( true, $annotation->update_meta( '_via', 'foo' ), 'update_meta_via::foo' );
		$this->assertSame( 'foo', $annotation->get_meta( '_via' ), 'get_meta_via::foo' );

		$this->assertSame( true, isset( $annotation->comment_ID ), '__isset' );
		$this->assertSame( array(), $annotation->get_children(), '__call' );
		$this->assertArrayHasKey( 'comment_ID', $annotation->to_array(), 'to_array' );
	}

	/**
	 * Test getting an annotation.
	 */
	public function test_get_annotation() {
		$user       = $this->objects->create_user( 'editor' );
		$post       = $this->objects->create_post( $user->ID );
		$annotation = $this->objects->create_annotation( array(
			'in_post_id' => $post->ID,
			'by_user_id' => $user->ID,
		) );

		$this->assertInstanceOf( 'WP_Annotation', $annotation, 'instanceof' );
		$this->assertInstanceOf( 'WP_Annotation', get_annotation( $annotation ), 'get' );
		$this->assertInstanceOf( 'WP_Annotation', get_annotation( $annotation->comment_ID ), 'object' );

		$this->assertArrayHasKey( 'comment_ID', get_annotation( $annotation->comment_ID, ARRAY_A ), 'array_a' );
		$this->assertArrayHasKey( 0, get_annotation( $annotation->comment_ID, ARRAY_N ), 'array_n' );
	}
}
