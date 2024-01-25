<?php
/**
 * Unit tests covering WP_Interactivity_API_Directives_Processor functionality.
 *
 * @package WordPress
 * @subpackage Interactivity API
 *
 * @group interactivity-api
 *
 * @coversDefaultClass WP_Interactivity_API_Directives_Processor
 */
class Tests_WP_Interactivity_API_Directives_Processor extends WP_UnitTestCase {
	/**
	 * Tests the `get_content_between_balanced_tags` method on standard tags.
	 *
	 * @covers ::get_content_between_balanced_tags
	 */
	public function test_get_content_between_balanced_tags_standard_tags() {
		$content = '<div>Text</div>';
		$p       = new WP_Interactivity_API_Directives_Processor( $content );
		$p->next_tag();
		$this->assertEquals( 'Text', $p->get_content_between_balanced_tags() );

		$content = '<div>Text</div><div>More text</div>';
		$p       = new WP_Interactivity_API_Directives_Processor( $content );
		$p->next_tag();
		$this->assertEquals( 'Text', $p->get_content_between_balanced_tags() );
		$p->next_tag();
		$this->assertEquals( 'More text', $p->get_content_between_balanced_tags() );
	}

	/**
	 * Tests the `get_content_between_balanced_tags` method on an empty tag.
	 *
	 * @covers ::get_content_between_balanced_tags
	 */
	public function test_get_content_between_balanced_tags_empty_tag() {
		$content = '<div></div>';
		$p       = new WP_Interactivity_API_Directives_Processor( $content );
		$p->next_tag();
		$this->assertEquals( '', $p->get_content_between_balanced_tags() );
	}

	/**
	 * Tests the `get_content_between_balanced_tags` method with a self-closing
	 * tag.
	 *
	 * @covers ::get_content_between_balanced_tags
	 */
	public function test_get_content_between_balanced_tags_self_closing_tag() {
		$content = '<img src="example.jpg">';
		$p       = new WP_Interactivity_API_Directives_Processor( $content );
		$p->next_tag();
		$this->assertNull( $p->get_content_between_balanced_tags() );
	}

	/**
	 * Tests the `get_content_between_balanced_tags` method with nested tags.
	 *
	 * @covers ::get_content_between_balanced_tags
	 */
	public function test_get_content_between_balanced_tags_nested_tags() {
		$content = '<div><span>Content</span><strong>More Content</strong></div>';
		$p       = new WP_Interactivity_API_Directives_Processor( $content );
		$p->next_tag();
		$this->assertEquals( '<span>Content</span><strong>More Content</strong>', $p->get_content_between_balanced_tags() );

		$content = '<div><div>Content</div><img src="example.jpg"></div>';
		$p       = new WP_Interactivity_API_Directives_Processor( $content );
		$p->next_tag();
		$this->assertEquals( '<div>Content</div><img src="example.jpg">', $p->get_content_between_balanced_tags() );
	}

	/**
	 * Tests the `get_content_between_balanced_tags` method when no tags are
	 * present.
	 *
	 * @covers ::get_content_between_balanced_tags
	 */
	public function test_get_content_between_balanced_tags_no_tags() {
		$content = 'Just a string with no tags.';
		$p       = new WP_Interactivity_API_Directives_Processor( $content );
		$p->next_tag();
		$this->assertNull( $p->get_content_between_balanced_tags() );
	}

	/**
	 * Tests the `get_content_between_balanced_tags` method with unbalanced tags.
	 *
	 * @covers ::get_content_between_balanced_tags
	 */
	public function test_get_content_between_balanced_tags_with_unbalanced_tags() {
		$content = '<div>Missing closing div';
		$p       = new WP_Interactivity_API_Directives_Processor( $content );
		$p->next_tag();
		$this->assertNull( $p->get_content_between_balanced_tags() );

		$content = '<div><div>Missing closing div</div>';
		$p       = new WP_Interactivity_API_Directives_Processor( $content );
		$p->next_tag();
		$this->assertNull( $p->get_content_between_balanced_tags() );

		$content = '<div>Missing closing div</span>';
		$p       = new WP_Interactivity_API_Directives_Processor( $content );
		$p->next_tag();
		$this->assertNull( $p->get_content_between_balanced_tags() );

		// It supports unbalanced tags inside the content.
		$content = '<div>Missing opening span</span></div>';
		$p       = new WP_Interactivity_API_Directives_Processor( $content );
		$p->next_tag();
		$this->assertEquals( 'Missing opening span</span>', $p->get_content_between_balanced_tags() );
	}

	/**
	 * Tests the `get_content_between_balanced_tags` method when called on a
	 * closing tag.
	 *
	 * @covers ::get_content_between_balanced_tags
	 */
	public function test_get_content_between_balanced_tags_on_closing_tag() {
		$content = '<div>Text</div>';
		$p       = new WP_Interactivity_API_Directives_Processor( $content );
		$p->next_tag( array( 'tag_closers' => 'visit' ) );
		$p->next_tag( array( 'tag_closers' => 'visit' ) );
		$this->assertNull( $p->get_content_between_balanced_tags() );
	}

	/**
	 * Tests the `set_content_between_balanced_tags` method on standard tags.
	 *
	 * @covers ::set_content_between_balanced_tags
	 */
	public function test_set_content_between_balanced_tags_standard_tags() {
		$content = '<div>Text</div>';
		$p       = new WP_Interactivity_API_Directives_Processor( $content );
		$p->next_tag();
		$result = $p->set_content_between_balanced_tags( 'New text' );
		$this->assertTrue( $result );
		$this->assertEquals( '<div>New text</div>', $p );

		$content = '<div>Text</div><div>More text</div>';
		$p       = new WP_Interactivity_API_Directives_Processor( $content );
		$p->next_tag();
		$result = $p->set_content_between_balanced_tags( 'New text' );
		$this->assertTrue( $result );
		$this->assertEquals( '<div>New text</div><div>More text</div>', $p );
		$p->next_tag();
		$result = $p->set_content_between_balanced_tags( 'More new text' );
		$this->assertTrue( $result );
		$this->assertEquals( '<div>New text</div><div>More new text</div>', $p );
	}

	/**
	 * Tests the `set_content_between_balanced_tags` method when called on a
	 * closing tag.
	 *
	 * @covers ::set_content_between_balanced_tags
	 */
	public function test_set_content_between_balanced_tags_on_closing_tag() {
		$content = '<div>Text</div>';
		$p       = new WP_Interactivity_API_Directives_Processor( $content );
		$p->next_tag( array( 'tag_closers' => 'visit' ) );
		$p->next_tag( array( 'tag_closers' => 'visit' ) );
		$result = $p->set_content_between_balanced_tags( 'New text' );
		$this->assertFalse( $result );
		$this->assertEquals( '<div>Text</div>', $p );
	}

	/**
	 * Tests the `set_content_between_balanced_tags` method on multiple calls to
	 * the same tag.
	 *
	 * @covers ::set_content_between_balanced_tags
	 */
	public function test_set_content_between_balanced_tags_multiple_calls_in_same_tag() {
		$content = '<div>Text</div>';
		$p       = new WP_Interactivity_API_Directives_Processor( $content );
		$p->next_tag();
		$result = $p->set_content_between_balanced_tags( 'New text' );
		$this->assertTrue( $result );
		$this->assertEquals( '<div>New text</div>', $p );
		$result = $p->set_content_between_balanced_tags( 'More text' );
		$this->assertTrue( $result );
		$this->assertEquals( '<div>More text</div>', $p );
	}

	/**
	 * Tests the `set_content_between_balanced_tags` method on combinations with
	 * set_attribute calls.
	 *
	 * @covers ::set_content_between_balanced_tags
	 */
	public function test_set_content_between_balanced_tags_with_set_attribute() {
		$content = '<div>Text</div>';
		$p       = new WP_Interactivity_API_Directives_Processor( $content );
		$p->next_tag();
		$p->set_attribute( 'class', 'test' );
		$result = $p->set_content_between_balanced_tags( 'New text' );
		$this->assertTrue( $result );
		$this->assertEquals( '<div class="test">New text</div>', $p );

		$content = '<div>Text</div>';
		$p       = new WP_Interactivity_API_Directives_Processor( $content );
		$p->next_tag();
		$result = $p->set_content_between_balanced_tags( 'New text' );
		$this->assertTrue( $result );
		$p->set_attribute( 'class', 'test' );
		$this->assertEquals( '<div class="test">New text</div>', $p );
	}

	/**
	 * Tests the `set_content_between_balanced_tags` method where the existing
	 * content includes tags.
	 *
	 * @covers ::set_content_between_balanced_tags
	 */
	public function test_set_content_between_balanced_tags_with_existing_tags() {
		$content = '<div><span>Text</span></div>';
		$p       = new WP_Interactivity_API_Directives_Processor( $content );
		$p->next_tag();
		$result = $p->set_content_between_balanced_tags( 'New text' );
		$this->assertTrue( $result );
		$this->assertEquals( '<div>New text</div>', $p );
	}

	/**
	 * Tests the `set_content_between_balanced_tags` method where the new content
	 * includes tags.
	 *
	 * @covers ::set_content_between_balanced_tags
	 */
	public function test_set_content_between_balanced_tags_with_new_tags() {
		$content     = '<div>Text</div>';
		$new_content = '<span>New text</span><a href="#">Link</a>';
		$p           = new WP_Interactivity_API_Directives_Processor( $content );
		$p->next_tag();
		$p->set_content_between_balanced_tags( $new_content );
		$this->assertEquals( '<div>&lt;span&gt;New text&lt;/span&gt;&lt;a href=&quot;#&quot;&gt;Link&lt;/a&gt;</div>', $p );
	}

	/**
	 * Tests the `set_content_between_balanced_tags` method with an empty string.
	 *
	 * @covers ::set_content_between_balanced_tags
	 */
	public function test_set_content_between_balanced_tags_empty() {
		$content = '<div>Text</div>';
		$p       = new WP_Interactivity_API_Directives_Processor( $content );
		$p->next_tag();
		$result = $p->set_content_between_balanced_tags( '' );
		$this->assertTrue( $result );
		$this->assertEquals( '<div></div>', $p );

		$content = '<div><div>Text</div></div>';
		$p       = new WP_Interactivity_API_Directives_Processor( $content );
		$p->next_tag();
		$result = $p->set_content_between_balanced_tags( '' );
		$this->assertTrue( $result );
		$this->assertEquals( '<div></div>', $p );
	}

	/**
	 * Tests the `set_content_between_balanced_tags` method on self-closing tags.
	 *
	 * @covers ::set_content_between_balanced_tags
	 */
	public function test_set_content_between_balanced_tags_self_closing_tag() {
		$content = '<img src="example.jpg">';
		$p       = new WP_Interactivity_API_Directives_Processor( $content );
		$p->next_tag();
		$result = $p->set_content_between_balanced_tags( 'New text' );
		$this->assertFalse( $result );
		$this->assertEquals( $content, $p );
	}

	/**
	 * Tests the `set_content_between_balanced_tags` method on a non-existent tag.
	 *
	 * @covers ::set_content_between_balanced_tags
	 */
	public function test_set_content_between_balanced_tags_non_existent_tag() {
		$content = 'Just a string with no tags.';
		$p       = new WP_Interactivity_API_Directives_Processor( $content );
		$p->next_tag();
		$result = $p->set_content_between_balanced_tags( 'New text' );
		$this->assertFalse( $result );
		$this->assertEquals( $content, $p );
	}

	/**
	 * Tests the `set_content_between_balanced_tags` method with unbalanced tags.
	 *
	 * @covers ::set_content_between_balanced_tags
	 */
	public function test_set_content_between_balanced_tags_with_unbalanced_tags() {
		$new_content = 'New text';

		$content = '<div>Missing closing div';
		$p       = new WP_Interactivity_API_Directives_Processor( $content );
		$p->next_tag();
		$result = $p->set_content_between_balanced_tags( $new_content );
		$this->assertFalse( $result );
		$this->assertEquals( '<div>Missing closing div', $p );

		$content = '<div><div>Missing closing div</div>';
		$p       = new WP_Interactivity_API_Directives_Processor( $content );
		$p->next_tag();
		$result = $p->set_content_between_balanced_tags( $new_content );
		$this->assertFalse( $result );
		$this->assertEquals( '<div><div>Missing closing div</div>', $p );

		$content = '<div>Missing closing div</span>';
		$p       = new WP_Interactivity_API_Directives_Processor( $content );
		$p->next_tag();
		$result = $p->set_content_between_balanced_tags( $new_content );
		$this->assertFalse( $result );
		$this->assertEquals( '<div>Missing closing div</span>', $p );

		// It supports unbalanced tags inside the content.
		$content = '<div>Missing opening span</span></div>';
		$p       = new WP_Interactivity_API_Directives_Processor( $content );
		$p->next_tag();
		$result = $p->set_content_between_balanced_tags( $new_content );
		$this->assertTrue( $result );
		$this->assertEquals( '<div>New text</div>', $p );
	}

	/**
	 * Tests the is_void method.
	 *
	 * @covers ::is_void
	 */
	public function test_is_void_element() {
		$void_elements = array( 'area', 'base', 'br', 'col', 'embed', 'hr', 'img', 'input', 'link', 'meta', 'source', 'track', 'wbr' );
		foreach ( $void_elements as $tag_name ) {
			$content = "<{$tag_name} id={$tag_name}>";
			$p       = new WP_Interactivity_API_Directives_Processor( $content );
			$p->next_tag();
			$this->assertTrue( $p->is_void() );
		}

		$non_void_elements = array( 'div', 'span', 'p', 'script', 'style' );
		foreach ( $non_void_elements as $tag_name ) {
			$content = "<{$tag_name} id={$tag_name}>Some content</{$tag_name}>";
			$p       = new WP_Interactivity_API_Directives_Processor( $content );
			$p->next_tag();
			$this->assertFalse( $p->is_void() );
		}

		// Test an upercase tag.
		$content = '<IMG src="example.jpg">';
		$p       = new WP_Interactivity_API_Directives_Processor( $content );
		$p->next_tag();
		$this->assertTrue( $p->is_void() );

		// Test an empty string.
		$content = '';
		$p       = new WP_Interactivity_API_Directives_Processor( $content );
		$p->next_tag();
		$this->assertFalse( $p->is_void() );

		// Test on text nodes.
		$content = 'This is just some text';
		$p       = new WP_Interactivity_API_Directives_Processor( $content );
		$p->next_tag();
		$this->assertFalse( $p->is_void() );
	}
}
