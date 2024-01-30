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
		$this->assertEquals( $content, $p );

		$content = '<div><div>Missing closing div</div>';
		$p       = new WP_Interactivity_API_Directives_Processor( $content );
		$p->next_tag();
		$result = $p->set_content_between_balanced_tags( $new_content );
		$this->assertFalse( $result );
		$this->assertEquals( $content, $p );

		$content = '<div>Missing closing div</span>';
		$p       = new WP_Interactivity_API_Directives_Processor( $content );
		$p->next_tag();
		$result = $p->set_content_between_balanced_tags( $new_content );
		$this->assertFalse( $result );
		$this->assertEquals( $content, $p );

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

	/**
	 * Tests the `append_content_after_closing_tag_on_balanced_or_void_tags`
	 * method with a simple text.
	 *
	 * @covers ::append_content_after_closing_tag_on_balanced_or_void_tags
	 */
	public function test_append_content_after_closing_tag_on_balanced_or_void_tags_simple_text() {
		$content_1 = '<div>Text</div>';
		$content_2 = 'New text';
		$p         = new WP_Interactivity_API_Directives_Processor( $content_1 );
		$p->next_tag();
		$result = $p->append_content_after_closing_tag_on_balanced_or_void_tags( $content_2 );
		$this->assertTrue( $result );
		$this->assertEquals( $content_1 . $content_2, $p );
		$this->assertNull( $p->get_tag() ); // There are no more tags.
	}

	/**
	 * Tests the `append_content_after_closing_tag_on_balanced_or_void_tags`
	 * method with simple tags.
	 *
	 * @covers ::append_content_after_closing_tag_on_balanced_or_void_tags
	 */
	public function test_append_content_after_closing_tag_on_balanced_or_void_tags_simple_tags() {
		$content_1 = '<div>Text</div>';
		$content_2 = '<div class="content-2">New text</div>';
		$content_3 = '<div class="content-3">More new text</div>';
		$p         = new WP_Interactivity_API_Directives_Processor( $content_1 );
		$p->next_tag();
		$result = $p->append_content_after_closing_tag_on_balanced_or_void_tags( $content_2 );
		$this->assertTrue( $result );
		$this->assertEquals( $content_1 . $content_2, $p );
		// The processor in now positioned in the opening tag of the appended tag.
		$this->assertEquals( 'content-2', $p->get_attribute( 'class' ) );
		$result = $p->append_content_after_closing_tag_on_balanced_or_void_tags( $content_3 );
		$this->assertTrue( $result );
		$this->assertEquals( $content_1 . $content_2 . $content_3, $p );
		$this->assertEquals( 'content-3', $p->get_attribute( 'class' ) );
	}

	/**
	 * Tests the `append_content_after_closing_tag_on_balanced_or_void_tags`
	 * method in the middle of two tags.
	 *
	 * @covers ::append_content_after_closing_tag_on_balanced_or_void_tags
	 */
	public function test_append_content_after_closing_tag_on_balanced_or_void_tags_in_the_middle_of_tags() {
		$content_1 = '<div>Text</div>';
		$content_2 = 'New text';
		$content_3 = '<div class="content-3">More new text</div>';
		$content_4 = '<div class="content-4">Even more new text</div>';

		$p = new WP_Interactivity_API_Directives_Processor( $content_1 . $content_3 );
		$p->next_tag();
		$result = $p->append_content_after_closing_tag_on_balanced_or_void_tags( $content_2 );
		$this->assertTrue( $result );
		$this->assertEquals( $content_1 . $content_2 . $content_3, $p );
		// When appending text without tags, it jumps to the next tag in the content.
		$this->assertEquals( 'content-3', $p->get_attribute( 'class' ) );

		$p = new WP_Interactivity_API_Directives_Processor( $content_1 . $content_3 );
		$p->next_tag();
		$result = $p->append_content_after_closing_tag_on_balanced_or_void_tags( $content_4 );
		$this->assertTrue( $result );
		$this->assertEquals( $content_1 . $content_4 . $content_3, $p );
		$this->assertEquals( 'content-4', $p->get_attribute( 'class' ) );
	}

	/**
	 * Tests the `append_content_after_closing_tag_on_balanced_or_void_tags`
	 * method doesn't modify the content when called on a closing tag.
	 *
	 * @covers ::append_content_after_closing_tag_on_balanced_or_void_tags
	 */
	public function test_append_content_after_closing_tag_on_balanced_or_void_tags_on_closing_tag() {
		$content = '<div>Text</div>';
		$p       = new WP_Interactivity_API_Directives_Processor( $content );
		$p->next_tag( array( 'tag_closers' => 'visit' ) );
		$p->next_tag( array( 'tag_closers' => 'visit' ) );
		$result = $p->append_content_after_closing_tag_on_balanced_or_void_tags( 'New text' );
		$this->assertFalse( $result );
		$this->assertEquals( $content, $p );
	}

	/**
	 * Tests the `append_content_after_closing_tag_on_balanced_or_void_tags`
	 * method on multiple calls to the same tag.
	 *
	 * @covers ::append_content_after_closing_tag_on_balanced_or_void_tags
	 */
	public function test_append_content_after_closing_tag_on_balanced_or_void_tags_multiple_calls_in_same_tag() {
		$content_1 = '<div class="content-1">Text</div>';
		$content_2 = '<div class="content-2">New text</div>';
		$content_3 = '<div class="content-3">More new text</div>';
		$p         = new WP_Interactivity_API_Directives_Processor( $content_1 );
		$p->next_tag();
		$p->set_bookmark( 'first div' );
		$result = $p->append_content_after_closing_tag_on_balanced_or_void_tags( $content_2 );
		$this->assertTrue( $result );
		$this->assertEquals( $content_1 . $content_2, $p );
		$this->assertEquals( 'content-2', $p->get_attribute( 'class' ) );
		$p->seek( 'first div' ); // Rewind to the first div.
		$this->assertEquals( 'content-1', $p->get_attribute( 'class' ) );
		$result = $p->append_content_after_closing_tag_on_balanced_or_void_tags( $content_3 );
		$this->assertEquals( $content_1 . $content_3 . $content_2, $p );
		$this->assertEquals( 'content-3', $p->get_attribute( 'class' ) );
	}

	/**
	 * Tests the `append_content_after_closing_tag_on_balanced_or_void_tags`
	 * method on combinations with set_attribute calls.
	 *
	 * @covers ::append_content_after_closing_tag_on_balanced_or_void_tags
	 */
	public function test_append_content_after_closing_tag_on_balanced_or_void_tags_with_set_attribute() {
		$content_1 = '<div>Text</div>';
		$content_2 = '<div>New text</div>';

		$p = new WP_Interactivity_API_Directives_Processor( $content_1 );
		$p->next_tag();
		$p->set_attribute( 'class', 'test' );
		$result = $p->append_content_after_closing_tag_on_balanced_or_void_tags( $content_2 );
		$this->assertTrue( $result );
		$this->assertEquals( '<div class="test">Text</div>' . $content_2, $p );

		$p = new WP_Interactivity_API_Directives_Processor( $content_1 );
		$p->next_tag();
		$result = $p->append_content_after_closing_tag_on_balanced_or_void_tags( $content_2 );
		$this->assertTrue( $result );
		$p->set_attribute( 'class', 'test' );
		$this->assertEquals( $content_1 . '<div class="test">New text</div>', $p );
	}

	/**
	 * Tests the `append_content_after_closing_tag_on_balanced_or_void_tags`
	 * method where the existing content includes tags.
	 *
	 * @covers ::append_content_after_closing_tag_on_balanced_or_void_tags
	 */
	public function test_append_content_after_closing_tag_on_balanced_or_void_tags_with_existing_tags() {
		$content_1 = '<div><span>Text</span></div>';
		$content_2 = '<div class="content-2-div"><span class="content-2-span">New text</span></div>';
		$content_3 = '<div><span>More new text</span></div>';
		$p         = new WP_Interactivity_API_Directives_Processor( $content_1 );
		$p->next_tag();
		$result = $p->append_content_after_closing_tag_on_balanced_or_void_tags( $content_2 );
		$this->assertTrue( $result );
		$this->assertEquals( $content_1 . $content_2, $p );
		$this->assertEquals( 'content-2-div', $p->get_attribute( 'class' ) );
		$p->next_tag();
		$this->assertEquals( 'content-2-span', $p->get_attribute( 'class' ) );
		$result = $p->append_content_after_closing_tag_on_balanced_or_void_tags( $content_3 );
		$this->assertTrue( $result );
		$this->assertEquals( $content_1 . '<div class="content-2-div"><span class="content-2-span">New text</span>' . $content_3 . '</div>', $p );
	}

	/**
	 * Tests the `append_content_after_closing_tag_on_balanced_or_void_tags`
	 * method fails with an empty string.
	 *
	 * @covers ::append_content_after_closing_tag_on_balanced_or_void_tags
	 */
	public function test_append_content_after_closing_tag_on_balanced_or_void_tags_empty() {
		$content = '<div class="content">Text</div>';
		$p       = new WP_Interactivity_API_Directives_Processor( $content );
		$p->next_tag();
		$result = $p->append_content_after_closing_tag_on_balanced_or_void_tags( '' );
		$this->assertFalse( $result );
		$this->assertEquals( $content, $p );
		$this->assertEquals( 'content', $p->get_attribute( 'class' ) ); // It didn't move.

		$content = '<div class="content"><div>Text</div></div>';
		$p       = new WP_Interactivity_API_Directives_Processor( $content );
		$p->next_tag();
		$result = $p->append_content_after_closing_tag_on_balanced_or_void_tags( '' );
		$this->assertFalse( $result );
		$this->assertEquals( $content, $p );
		$this->assertEquals( 'content', $p->get_attribute( 'class' ) ); // It didn't move.
	}

	/**
	 * Tests the `append_content_after_closing_tag_on_balanced_or_void_tags`
	 * method on self-closing tags.
	 *
	 * @covers ::append_content_after_closing_tag_on_balanced_or_void_tags
	 */
	public function test_append_content_after_closing_tag_on_balanced_or_void_tags_self_closing_tag() {
		$content_1 = '<img src="example.jpg">';
		$content_2 = '<div class="content-2">Text</div>';
		$p         = new WP_Interactivity_API_Directives_Processor( $content_1 );
		$p->next_tag();
		$result = $p->append_content_after_closing_tag_on_balanced_or_void_tags( $content_2 );
		$this->assertTrue( $result );
		$this->assertEquals( $content_1 . $content_2, $p );
		$this->assertEquals( 'content-2', $p->get_attribute( 'class' ) ); // It didn't move.

		$content_1 = '<img src="example.jpg" />';
		$p         = new WP_Interactivity_API_Directives_Processor( $content_1 );
		$p->next_tag();
		$result = $p->append_content_after_closing_tag_on_balanced_or_void_tags( $content_2 );
		$this->assertTrue( $result );
		$this->assertEquals( $content_1 . $content_2, $p );
		$this->assertEquals( 'content-2', $p->get_attribute( 'class' ) ); // It didn't move.
	}

	/**
	 * Tests the `append_content_after_closing_tag_on_balanced_or_void_tags`
	 * method on a non-existent tag.
	 *
	 * @covers ::append_content_after_closing_tag_on_balanced_or_void_tags
	 */
	public function test_append_content_after_closing_tag_on_balanced_or_void_tags_non_existent_tag() {
		$content_1 = 'Just a string with no tags.';
		$content_2 = '<div>New text</div>';
		$p         = new WP_Interactivity_API_Directives_Processor( $content_1 );
		$p->next_tag();
		$result = $p->append_content_after_closing_tag_on_balanced_or_void_tags( $content_2 );
		$this->assertFalse( $result );
		$this->assertEquals( $content_1, $p );
	}

	/**
	 * Tests the `append_content_after_closing_tag_on_balanced_or_void_tags`
	 * method with unbalanced tags.
	 *
	 * @covers ::append_content_after_closing_tag_on_balanced_or_void_tags
	 */
	public function test_append_content_after_closing_tag_on_balanced_or_void_tags_with_unbalanced_tags() {
		$new_content = 'New text';

		$content = '<div>Missing closing div';
		$p       = new WP_Interactivity_API_Directives_Processor( $content );
		$p->next_tag();
		$result = $p->append_content_after_closing_tag_on_balanced_or_void_tags( $new_content );
		$this->assertFalse( $result );
		$this->assertEquals( $content, $p );

		$content = '<div><div>Missing closing div</div>';
		$p       = new WP_Interactivity_API_Directives_Processor( $content );
		$p->next_tag();
		$result = $p->append_content_after_closing_tag_on_balanced_or_void_tags( $new_content );
		$this->assertFalse( $result );
		$this->assertEquals( $content, $p );

		$content = '<div>Missing closing div</span>';
		$p       = new WP_Interactivity_API_Directives_Processor( $content );
		$p->next_tag();
		$result = $p->append_content_after_closing_tag_on_balanced_or_void_tags( $new_content );
		$this->assertFalse( $result );
		$this->assertEquals( $content, $p );

		// It supports unbalanced tags inside the content, as long as it finds a
		// balanced closing tag.
		$content = '<div>Missing opening span</span></div>';
		$p       = new WP_Interactivity_API_Directives_Processor( $content );
		$p->next_tag();
		$result = $p->append_content_after_closing_tag_on_balanced_or_void_tags( $new_content );
		$this->assertTrue( $result );
		$this->assertEquals( $content . $new_content, $p );
	}

	/**
	 * Tests that the `next_balanced_tag_closer_tag` method finds a closing tag
	 * for a standard tag.
	 *
	 * @covers ::next_balanced_tag_closer_tag
	 */
	public function test_next_balanced_tag_closer_tag_standard_tags() {
			$content = '<div>Text</div>';
			$p       = new WP_Interactivity_API_Directives_Processor( $content );
			$p->next_tag();
			$this->assertTrue( $p->next_balanced_tag_closer_tag() );
			$this->assertEquals( 'DIV', $p->get_tag() );
			$this->assertTrue( $p->is_tag_closer() );
	}

	/**
	 * Tests that the `next_balanced_tag_closer_tag` method returns false for a
	 * self-closing tag.
	 *
	 * @covers ::next_balanced_tag_closer_tag
	 */
	public function test_next_balanced_tag_closer_tag_void_tag() {
			$content = '<img src="image.jpg" />';
			$p       = new WP_Interactivity_API_Directives_Processor( $content );
			$p->next_tag();
			$this->assertFalse( $p->next_balanced_tag_closer_tag() );

			$content = '<img src="image.jpg" /><div>Text</div>';
			$p       = new WP_Interactivity_API_Directives_Processor( $content );
			$p->next_tag();
			$this->assertFalse( $p->next_balanced_tag_closer_tag() );
	}

	/**
	 * Tests that the `next_balanced_tag_closer_tag` method correctly handles
	 * nested tags.
	 *
	 * @covers ::next_balanced_tag_closer_tag
	 */
	public function test_next_balanced_tag_closer_tag_nested_tags() {
			$content = '<div><span>Nested content</span></div>';
			$p       = new WP_Interactivity_API_Directives_Processor( $content );
			$p->next_tag();
			$this->assertTrue( $p->next_balanced_tag_closer_tag() );
			$this->assertEquals( 'DIV', $p->get_tag() );
			$this->assertTrue( $p->is_tag_closer() );

			$content = '<div><div>Nested content</div></div>';
			$p       = new WP_Interactivity_API_Directives_Processor( $content );
			$p->next_tag();
			$this->assertTrue( $p->next_balanced_tag_closer_tag() );
			$this->assertEquals( 'DIV', $p->get_tag() );
			$this->assertTrue( $p->is_tag_closer() );
			$this->assertFalse( $p->next_tag() ); // No more content.
	}

	/**
	 * Tests that the `next_balanced_tag_closer_tag` method returns false when no
	 * matching closing tag is found.
	 *
	 * @covers ::next_balanced_tag_closer_tag
	 */
	public function test_next_balanced_tag_closer_tag_no_matching_closing_tag() {
			$content = '<div>No closing tag here';
			$p       = new WP_Interactivity_API_Directives_Processor( $content );
			$p->next_tag();

			$content = '<div><div>No closing tag here</div>';
			$p       = new WP_Interactivity_API_Directives_Processor( $content );
			$p->next_tag();
			$this->assertFalse( $p->next_balanced_tag_closer_tag() );
		$this->assertFalse( $p->next_balanced_tag_closer_tag() );
	}

	/**
	 * Test that the `next_balanced_tag_closer_tag` method returns false when
	 * returned on a closing tag.
	 *
	 * @covers ::next_balanced_tag_closer_tag
	 */
	public function test_next_balanced_tag_closer_tag_on_closing_tag() {
			$content = '<div>Closing tag after this</div>';
			$p       = new WP_Interactivity_API_Directives_Processor( $content );
			// Visit opening tag first and then closing tag.
			$p->next_tag();
			$p->next_tag( array( 'tag_closers' => 'visit' ) );
			$this->assertFalse( $p->next_balanced_tag_closer_tag() );
	}
}
