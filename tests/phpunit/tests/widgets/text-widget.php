<?php
/**
 * Unit tests covering WP_Widget_Text functionality.
 *
 * @package    WordPress
 * @subpackage widgets
 */

/**
 * Test wp-includes/widgets/class-wp-widget-text.php
 *
 * @group widgets
 */
class Test_WP_Widget_Text extends WP_UnitTestCase {
	/**
	 * Args passed to the widget_text filter.
	 *
	 * @var array
	 */
	protected $widget_text_args;

	/**
	 * Args passed to the widget_text_content filter.
	 *
	 * @var array
	 */
	protected $widget_text_content_args;

	/**
	 * Clean up global scope.
	 *
	 * @global WP_Scripts $wp_scripts
	 * @global WP_Styles  $wp_style
	 */
	function clean_up_global_scope() {
		global $wp_scripts, $wp_styles;
		parent::clean_up_global_scope();
		$wp_scripts = null;
		$wp_styles = null;
	}

	/**
	 * Test constructor method.
	 *
	 * @covers WP_Widget_Text::__construct
	 */
	function test_construct() {
		$widget = new WP_Widget_Text();
		$this->assertEquals( 'text', $widget->id_base );
		$this->assertEquals( 'widget_text', $widget->widget_options['classname'] );
		$this->assertTrue( $widget->widget_options['customize_selective_refresh'] );
		$this->assertEquals( 400, $widget->control_options['width'] );
		$this->assertEquals( 350, $widget->control_options['height'] );
	}

	/**
	 * Test enqueue_admin_scripts method.
	 *
	 * @covers WP_Widget_Text::_register
	 */
	function test__register() {
		set_current_screen( 'widgets.php' );
		$widget = new WP_Widget_Text();
		$widget->_register();

		$this->assertEquals( 10, has_action( 'admin_print_scripts-widgets.php', array( $widget, 'enqueue_admin_scripts' ) ) );
		$this->assertEquals( 10, has_action( 'admin_footer-widgets.php', array( 'WP_Widget_Text', 'render_control_template_scripts' ) ) );
		$this->assertContains( 'wp.textWidgets.idBases.push( "text" );', wp_scripts()->registered['text-widgets']->extra['after'] );
	}

	/**
	 * Test widget method.
	 *
	 * @covers WP_Widget_Text::widget
	 */
	function test_widget() {
		$widget = new WP_Widget_Text();
		$text = "Lorem ipsum dolor sit amet, consectetur adipiscing elit.\n Praesent ut turpis consequat lorem volutpat bibendum vitae vitae ante.";

		$args = array(
			'before_title'  => '<h2>',
			'after_title'   => "</h2>\n",
			'before_widget' => '<section>',
			'after_widget'  => "</section>\n",
		);

		add_filter( 'widget_text_content', array( $this, 'filter_widget_text_content' ), 5, 3 );
		add_filter( 'widget_text', array( $this, 'filter_widget_text' ), 5, 3 );

		// Test with filter=false, implicit legacy mode.
		$this->widget_text_content_args = null;
		ob_start();
		$instance = array(
			'title'  => 'Foo',
			'text'   => $text,
			'filter' => false,
		);
		$widget->widget( $args, $instance );
		$output = ob_get_clean();
		$this->assertNotContains( '<p>', $output );
		$this->assertNotContains( '<br />', $output );
		$this->assertEmpty( $this->widget_text_content_args );
		$this->assertNotEmpty( $this->widget_text_args );
		$this->assertContains( '[filter:widget_text]', $output );
		$this->assertNotContains( '[filter:widget_text_content]', $output );

		// Test with filter=true, implicit legacy mode.
		$this->widget_text_content_args = null;
		$instance = array(
			'title'  => 'Foo',
			'text'   => $text,
			'filter' => true,
		);
		ob_start();
		$widget->widget( $args, $instance );
		$output = ob_get_clean();
		$this->assertContains( '<p>', $output );
		$this->assertContains( '<br />', $output );
		$this->assertNotEmpty( $this->widget_text_args );
		$this->assertEquals( $instance['text'], $this->widget_text_args[0] );
		$this->assertEquals( $instance, $this->widget_text_args[1] );
		$this->assertEquals( $widget, $this->widget_text_args[2] );
		$this->assertEmpty( $this->widget_text_content_args );
		$this->assertContains( '[filter:widget_text]', $output );
		$this->assertNotContains( '[filter:widget_text_content]', $output );

		// Test with filter=content, the upgraded widget, in 4.8.0 only.
		$this->widget_text_content_args = null;
		$instance = array(
			'title'  => 'Foo',
			'text'   => $text,
			'filter' => 'content',
		);
		$expected_instance = array_merge( $instance, array(
			'filter' => true,
			'visual' => true,
		) );
		ob_start();
		$widget->widget( $args, $instance );
		$output = ob_get_clean();
		$this->assertContains( '<p>', $output );
		$this->assertContains( '<br />', $output );
		$this->assertCount( 3, $this->widget_text_args );
		$this->assertEquals( $expected_instance['text'], $this->widget_text_args[0] );
		$this->assertEquals( $expected_instance, $this->widget_text_args[1] );
		$this->assertEquals( $widget, $this->widget_text_args[2] );
		$this->assertCount( 3, $this->widget_text_content_args );
		$this->assertEquals( $expected_instance['text'] . '[filter:widget_text]', $this->widget_text_content_args[0] );
		$this->assertEquals( $expected_instance, $this->widget_text_content_args[1] );
		$this->assertEquals( $widget, $this->widget_text_content_args[2] );
		$this->assertContains( wpautop( $expected_instance['text'] . '[filter:widget_text][filter:widget_text_content]' ), $output );

		// Test with filter=true&visual=true, the upgraded widget, in 4.8.1 and above.
		$this->widget_text_content_args = null;
		$instance = array(
			'title'  => 'Foo',
			'text'   => $text,
			'filter' => true,
			'visual' => true,
		);
		$expected_instance = $instance;
		ob_start();
		$widget->widget( $args, $instance );
		$output = ob_get_clean();
		$this->assertContains( '<p>', $output );
		$this->assertContains( '<br />', $output );
		$this->assertCount( 3, $this->widget_text_args );
		$this->assertEquals( $expected_instance['text'], $this->widget_text_args[0] );
		$this->assertEquals( $expected_instance, $this->widget_text_args[1] );
		$this->assertEquals( $widget, $this->widget_text_args[2] );
		$this->assertCount( 3, $this->widget_text_content_args );
		$this->assertEquals( $expected_instance['text'] . '[filter:widget_text]', $this->widget_text_content_args[0] );
		$this->assertEquals( $expected_instance, $this->widget_text_content_args[1] );
		$this->assertEquals( $widget, $this->widget_text_content_args[2] );
		$this->assertContains( wpautop( $expected_instance['text'] . '[filter:widget_text][filter:widget_text_content]' ), $output );

		// Test with filter=true&visual=true, the upgraded widget, in 4.8.1 and above.
		$this->widget_text_content_args = null;
		$instance = array(
			'title'  => 'Foo',
			'text'   => $text,
			'filter' => true,
			'visual' => false,
		);
		$expected_instance = $instance;
		ob_start();
		$widget->widget( $args, $instance );
		$output = ob_get_clean();
		$this->assertContains( '<p>', $output );
		$this->assertContains( '<br />', $output );
		$this->assertCount( 3, $this->widget_text_args );
		$this->assertEquals( $expected_instance['text'], $this->widget_text_args[0] );
		$this->assertEquals( $expected_instance, $this->widget_text_args[1] );
		$this->assertEquals( $widget, $this->widget_text_args[2] );
		$this->assertNull( $this->widget_text_content_args );
		$this->assertContains( wpautop( $expected_instance['text'] . '[filter:widget_text]' ), $output );

		// Test with filter=false&visual=false, the upgraded widget, in 4.8.1 and above.
		$this->widget_text_content_args = null;
		$instance = array(
			'title'  => 'Foo',
			'text'   => $text,
			'filter' => false,
			'visual' => false,
		);
		$expected_instance = $instance;
		ob_start();
		$widget->widget( $args, $instance );
		$output = ob_get_clean();
		$this->assertNotContains( '<p>', $output );
		$this->assertNotContains( '<br />', $output );
		$this->assertCount( 3, $this->widget_text_args );
		$this->assertEquals( $expected_instance['text'], $this->widget_text_args[0] );
		$this->assertEquals( $expected_instance, $this->widget_text_args[1] );
		$this->assertEquals( $widget, $this->widget_text_args[2] );
		$this->assertNull( $this->widget_text_content_args );
		$this->assertContains( $expected_instance['text'] . '[filter:widget_text]', $output );
	}

	/**
	 * Example shortcode content to test for wpautop corruption.
	 *
	 * @var string
	 */
	protected $example_shortcode_content = "<p class='sortcodep'>One\nTwo\n\nThree\n\nThis is testing the <code>[example note='This will not get processed since it is part of shortcode output itself.']</code> shortcode.</p>\n<script>\ndocument.write('Test1');\n\ndocument.write('Test2');\n</script>";

	/**
	 * The captured global post during shortcode rendering.
	 *
	 * @var WP_Post|null
	 */
	protected $post_during_shortcode = null;

	/**
	 * Number of times the shortcode was rendered.
	 *
	 * @var int
	 */
	protected $shortcode_render_count = 0;

	/**
	 * Do example shortcode.
	 *
	 * @return string Shortcode content.
	 */
	function do_example_shortcode() {
		$this->post_during_shortcode = get_post();
		$this->shortcode_render_count++;
		return $this->example_shortcode_content;
	}

	/**
	 * Test widget method with shortcodes.
	 *
	 * @covers WP_Widget_Text::widget
	 */
	function test_widget_shortcodes() {
		global $post;
		$post_id = $this->factory()->post->create();
		$post = get_post( $post_id );

		$args = array(
			'before_title'  => '<h2>',
			'after_title'   => "</h2>\n",
			'before_widget' => '<section>',
			'after_widget'  => "</section>\n",
		);
		$widget = new WP_Widget_Text();
		add_shortcode( 'example', array( $this, 'do_example_shortcode' ) );

		$base_instance = array(
			'title' => 'Example',
			'text' => "This is an example:\n\n[example]\n\nHello.",
			'filter' => false,
		);

		// Legacy Text Widget without wpautop.
		$instance = array_merge( $base_instance, array(
			'filter' => false,
		) );
		$this->shortcode_render_count = 0;
		ob_start();
		$widget->widget( $args, $instance );
		$output = ob_get_clean();
		$this->assertEquals( 1, $this->shortcode_render_count );
		$this->assertNotContains( '[example]', $output, 'Expected shortcode to be processed in legacy widget with plugin adding filter' );
		$this->assertContains( $this->example_shortcode_content, $output, 'Shortcode was applied without wpautop corrupting it.' );
		$this->assertNotContains( '<p>' . $this->example_shortcode_content . '</p>', $output, 'Expected shortcode_unautop() to have run.' );
		$this->assertNull( $this->post_during_shortcode );

		// Legacy Text Widget with wpautop.
		$instance = array_merge( $base_instance, array(
			'filter' => true,
			'visual' => false,
		) );
		$this->shortcode_render_count = 0;
		ob_start();
		$widget->widget( $args, $instance );
		$output = ob_get_clean();
		$this->assertEquals( 1, $this->shortcode_render_count );
		$this->assertNotContains( '[example]', $output, 'Expected shortcode to be processed in legacy widget with plugin adding filter' );
		$this->assertContains( $this->example_shortcode_content, $output, 'Shortcode was applied without wpautop corrupting it.' );
		$this->assertNotContains( '<p>' . $this->example_shortcode_content . '</p>', $output, 'Expected shortcode_unautop() to have run.' );
		$this->assertNull( $this->post_during_shortcode );

		// Legacy text widget with plugin adding shortcode support as well.
		add_filter( 'widget_text', 'do_shortcode' );
		$this->shortcode_render_count = 0;
		ob_start();
		$widget->widget( $args, $instance );
		$output = ob_get_clean();
		$this->assertEquals( 1, $this->shortcode_render_count );
		$this->assertNotContains( '[example]', $output, 'Expected shortcode to be processed in legacy widget with plugin adding filter' );
		$this->assertContains( wpautop( $this->example_shortcode_content ), $output, 'Shortcode was applied *with* wpautop() applying to shortcode output since plugin used legacy filter.' );
		$this->assertNull( $this->post_during_shortcode );
		remove_filter( 'widget_text', 'do_shortcode' );

		$instance = array_merge( $base_instance, array(
			'filter' => true,
			'visual' => true,
		) );

		// Visual Text Widget with only core-added widget_text_content filter for do_shortcode.
		$this->assertFalse( has_filter( 'widget_text', 'do_shortcode' ) );
		$this->assertEquals( 11, has_filter( 'widget_text_content', 'do_shortcode' ), 'Expected core to have set do_shortcode as widget_text_content filter.' );
		$this->shortcode_render_count = 0;
		ob_start();
		$widget->widget( $args, $instance );
		$output = ob_get_clean();
		$this->assertEquals( 1, $this->shortcode_render_count );
		$this->assertContains( $this->example_shortcode_content, $output, 'Shortcode was applied without wpautop corrupting it.' );
		$this->assertNotContains( '<p>' . $this->example_shortcode_content . '</p>', $output, 'Expected shortcode_unautop() to have run.' );
		$this->assertFalse( has_filter( 'widget_text', 'do_shortcode' ), 'The widget_text filter still lacks do_shortcode handler.' );
		$this->assertEquals( 11, has_filter( 'widget_text_content', 'do_shortcode' ), 'The widget_text_content filter still has do_shortcode handler.' );
		$this->assertNull( $this->post_during_shortcode );

		// Visual Text Widget with both filters applied added, one from core and another via plugin.
		add_filter( 'widget_text', 'do_shortcode' );
		$this->shortcode_render_count = 0;
		ob_start();
		$widget->widget( $args, $instance );
		$output = ob_get_clean();
		$this->assertEquals( 1, $this->shortcode_render_count );
		$this->assertContains( $this->example_shortcode_content, $output, 'Shortcode was applied without wpautop corrupting it.' );
		$this->assertNotContains( '<p>' . $this->example_shortcode_content . '</p>', $output, 'Expected shortcode_unautop() to have run.' );
		$this->assertEquals( 10, has_filter( 'widget_text', 'do_shortcode' ), 'Expected do_shortcode to be restored to widget_text.' );
		$this->assertNull( $this->post_during_shortcode );
		$this->assertNull( $this->post_during_shortcode );
		remove_filter( 'widget_text', 'do_shortcode' );

		// Visual Text Widget with shortcode handling disabled via plugin removing filter.
		remove_filter( 'widget_text_content', 'do_shortcode', 11 );
		remove_filter( 'widget_text', 'do_shortcode' );
		$this->shortcode_render_count = 0;
		ob_start();
		$widget->widget( $args, $instance );
		$output = ob_get_clean();
		$this->assertEquals( 0, $this->shortcode_render_count );
		$this->assertContains( '[example]', $output );
		$this->assertNotContains( $this->example_shortcode_content, $output );
		$this->assertFalse( has_filter( 'widget_text', 'do_shortcode' ) );
		$this->assertFalse( has_filter( 'widget_text_content', 'do_shortcode' ) );
	}

	/**
	 * Filters the content of the Text widget.
	 *
	 * @param string         $widget_text The widget content.
	 * @param array          $instance    Array of settings for the current widget.
	 * @param WP_Widget_Text $widget      Current Text widget instance.
	 * @return string Widget text.
	 */
	function filter_widget_text( $widget_text, $instance, $widget ) {
		$this->widget_text_args = func_get_args();

		$widget_text .= '[filter:widget_text]';
		return $widget_text;
	}

	/**
	 * Filters the content of the Text widget to apply changes expected from the visual (TinyMCE) editor.
	 *
	 * @param string         $widget_text The widget content.
	 * @param array          $instance    Array of settings for the current widget.
	 * @param WP_Widget_Text $widget      Current Text widget instance.
	 * @return string Widget content.
	 */
	function filter_widget_text_content( $widget_text, $instance, $widget ) {
		$this->widget_text_content_args = func_get_args();

		$widget_text .= '[filter:widget_text_content]';
		return $widget_text;
	}

	/**
	 * Test is_legacy_instance method.
	 *
	 * @covers WP_Widget_Text::is_legacy_instance
	 */
	function test_is_legacy_instance() {
		$widget = new WP_Widget_Text();
		$base_instance = array(
			'title' => 'Title',
			'text' => "Hello\n\nWorld",
		);

		$instance = array_merge( $base_instance, array(
			'visual' => false,
		) );
		$this->assertTrue( $widget->is_legacy_instance( $instance ), 'Legacy when visual=false prop is present.' );

		$instance = array_merge( $base_instance, array(
			'visual' => true,
		) );
		$this->assertFalse( $widget->is_legacy_instance( $instance ), 'Not legacy when visual=true prop is present.' );

		$instance = array_merge( $base_instance, array(
			'filter' => 'content',
		) );
		$this->assertFalse( $widget->is_legacy_instance( $instance ), 'Not legacy when filter is explicitly content (in WP 4.8.0 only).' );

		$instance = array_merge( $base_instance, array(
			'text' => '',
			'filter' => true,
		) );
		$this->assertFalse( $widget->is_legacy_instance( $instance ), 'Not legacy when text is empty.' );

		$instance = array_merge( $base_instance, array(
			'text' => "\nOne line",
			'filter' => false,
		) );
		$this->assertFalse( $widget->is_legacy_instance( $instance ), 'Not legacy when there is leading whitespace.' );

		$instance = array_merge( $base_instance, array(
			'text' => "\nOne line\n\n",
			'filter' => false,
		) );
		$this->assertFalse( $widget->is_legacy_instance( $instance ), 'Not legacy when there is trailing whitespace.' );

		$instance = array_merge( $base_instance, array(
			'text' => "One\nTwo",
			'filter' => false,
		) );
		$this->assertTrue( $widget->is_legacy_instance( $instance ), 'Legacy when not-wpautop and there are line breaks.' );

		$instance = array_merge( $base_instance, array(
			'text' => "One\n\nTwo",
			'filter' => false,
		) );
		$this->assertTrue( $widget->is_legacy_instance( $instance ), 'Legacy when not-wpautop and there are paragraph breaks.' );

		$instance = array_merge( $base_instance, array(
			'text' => "One\nTwo",
			'filter' => true,
		) );
		$this->assertFalse( $widget->is_legacy_instance( $instance ), 'Not automatically legacy when wpautop and there are line breaks.' );

		$instance = array_merge( $base_instance, array(
			'text' => "One\n\nTwo",
			'filter' => true,
		) );
		$this->assertFalse( $widget->is_legacy_instance( $instance ), 'Not automatically legacy when wpautop and there are paragraph breaks.' );

		$instance = array_merge( $base_instance, array(
			'text' => 'Test<!-- comment -->',
			'filter' => true,
		) );
		$this->assertTrue( $widget->is_legacy_instance( $instance ), 'Legacy when HTML comment is present.' );

		// Check text examples that will not migrate to TinyMCE.
		$legacy_text_examples = array(
			'<span class="hello"></span>',
			'<blockquote>Quote <footer>Citation</footer></blockquote>',
			'<span></span>',
			"<ul>\n<li><a href=\"#\" class=\"location\"></a>List Item 1</li>\n<li><a href=\"#\" class=\"location\"></a>List Item 2</li>\n</ul>",
			'<a href="#" class="map"></a>',
			"<script>\n\\Line one\n\n\\Line two</script>",
			"<style>body {\ncolor:red;\n}</style>",
			'<span class="fa fa-cc-discover fa-2x" aria-hidden="true"></span>',
			"<p>\nStay updated with our latest news and specials. We never sell your information and you can unsubscribe at any time.\n</p>\n\n<div class=\"custom-form-class\">\n\t<form action=\"#\" method=\"post\" name=\"mc-embedded-subscribe-form\">\n\n\t\t<label class=\"screen-reader-text\" for=\"mce-EMAIL-b\">Email </label>\n\t\t<input id=\"mce-EMAIL-b\" class=\"required email\" name=\"EMAIL\" required=\"\" type=\"email\" value=\"\" placeholder=\"Email Address*\" />\n\n\t\t<input class=\"button\" name=\"subscribe\" type=\"submit\" value=\"Go!\" />\n\n\t</form>\n</div>",
			'<span class="sectiondown"><a href="#front-page-3"><i class="fa fa-chevron-circle-down"></i></a></span>',
		);
		foreach ( $legacy_text_examples as $legacy_text_example ) {
			$instance = array_merge( $base_instance, array(
				'text' => $legacy_text_example,
				'filter' => true,
			) );
			$this->assertTrue( $widget->is_legacy_instance( $instance ), 'Legacy when wpautop and there is HTML that is not liable to be mutated.' );

			$instance = array_merge( $base_instance, array(
				'text' => $legacy_text_example,
				'filter' => false,
			) );
			$this->assertTrue( $widget->is_legacy_instance( $instance ), 'Legacy when not-wpautop and there is HTML that is not liable to be mutated.' );
		}

		// Check text examples that will migrate to TinyMCE, where elements and attributes are not in whitelist.
		$migratable_text_examples = array(
			'Check out <a href="http://example.com">Example</a>',
			'<img src="http://example.com/img.jpg" alt="Img">',
			'<strong><em>Hello</em></strong>',
			'<b><i><u><s>Hello</s></u></i></b>',
			"<ul>\n<li>One</li>\n<li>One</li>\n<li>One</li>\n</ul>",
			"<ol>\n<li>One</li>\n<li>One</li>\n<li>One</li>\n</ol>",
			"Text\n<hr>\nAddendum",
			"Look at this code:\n\n<code>echo 'Hello World!';</code>",
		);
		foreach ( $migratable_text_examples as $migratable_text_example ) {
			$instance = array_merge( $base_instance, array(
				'text' => $migratable_text_example,
				'filter' => true,
			) );
			$this->assertFalse( $widget->is_legacy_instance( $instance ), 'Legacy when wpautop and there is HTML that is not liable to be mutated.' );
		}
	}

	/**
	 * Test update method.
	 *
	 * @covers WP_Widget_Text::form
	 */
	function test_form() {
		add_filter( 'user_can_richedit', '__return_true' );
		$widget = new WP_Widget_Text();
		$widget->_set( 2 );
		$instance = array(
			'title' => 'Title',
			'text' => 'Text',
			'filter' => false,
			'visual' => false,
		);
		$this->assertTrue( $widget->is_legacy_instance( $instance ) );
		ob_start();
		$widget->form( $instance );
		$form = ob_get_clean();
		$this->assertContains( 'class="visual" type="hidden" value=""', $form );
		$this->assertNotContains( 'class="visual sync-input" type="hidden" value="on"', $form );

		$instance = array(
			'title' => 'Title',
			'text' => 'Text',
			'filter' => 'content',
		);
		$this->assertFalse( $widget->is_legacy_instance( $instance ) );
		ob_start();
		$widget->form( $instance );
		$form = ob_get_clean();
		$this->assertContains( 'class="visual sync-input" type="hidden" value="on"', $form );
		$this->assertNotContains( 'class="visual sync-input" type="hidden" value=""', $form );

		$instance = array(
			'title' => 'Title',
			'text' => 'Text',
			'filter' => true,
		);
		$this->assertFalse( $widget->is_legacy_instance( $instance ) );
		ob_start();
		$widget->form( $instance );
		$form = ob_get_clean();
		$this->assertContains( 'class="visual sync-input" type="hidden" value="on"', $form );
		$this->assertNotContains( 'class="visual sync-input" type="hidden" value=""', $form );

		$instance = array(
			'title' => 'Title',
			'text' => 'This is some HTML Code: <code>&lt;strong&gt;BOLD!&lt;/strong&gt;</code>',
			'filter' => true,
			'visual' => true,
		);
		$this->assertFalse( $widget->is_legacy_instance( $instance ) );
		ob_start();
		$widget->form( $instance );
		$form = ob_get_clean();
		$this->assertContains( 'class="visual sync-input" type="hidden" value="on"', $form );
		$this->assertContains( '&lt;code&gt;&amp;lt;strong&amp;gt;BOLD!', $form );
		$this->assertNotContains( 'class="visual sync-input" type="hidden" value=""', $form );

		remove_filter( 'user_can_richedit', '__return_true' );
		add_filter( 'user_can_richedit', '__return_false' );
		$instance = array(
			'title' => 'Title',
			'text' => 'Evil:</textarea><script>alert("XSS")</script>',
			'filter' => true,
			'visual' => true,
		);
		$this->assertFalse( $widget->is_legacy_instance( $instance ) );
		ob_start();
		$widget->form( $instance );
		$form = ob_get_clean();
		$this->assertNotContains( 'Evil:</textarea>', $form );
		$this->assertContains( 'Evil:&lt;/textarea>', $form );
	}

	/**
	 * Test update method.
	 *
	 * @covers WP_Widget_Text::update
	 */
	function test_update() {
		$widget = new WP_Widget_Text();
		$instance = array(
			'title' => "The\nTitle",
			'text'  => "The\n\nText",
			'filter' => true,
			'visual' => true,
		);

		wp_set_current_user( $this->factory()->user->create( array(
			'role' => 'administrator',
		) ) );

		$expected = array(
			'title'  => sanitize_text_field( $instance['title'] ),
			'text'   => $instance['text'],
			'filter' => true,
			'visual' => true,
		);
		$result = $widget->update( $instance, array() );
		$this->assertEquals( $expected, $result );
		$this->assertTrue( ! empty( $expected['filter'] ), 'Expected filter prop to be truthy, to handle case where 4.8 is downgraded to 4.7.' );

		add_filter( 'map_meta_cap', array( $this, 'grant_unfiltered_html_cap' ), 10, 2 );
		$this->assertTrue( current_user_can( 'unfiltered_html' ) );
		$instance['text'] = '<script>alert( "Howdy!" );</script>';
		$expected['text'] = $instance['text'];
		$result = $widget->update( $instance, array() );
		$this->assertEquals( $expected, $result, 'KSES should apply as expected.' );
		remove_filter( 'map_meta_cap', array( $this, 'grant_unfiltered_html_cap' ) );

		add_filter( 'map_meta_cap', array( $this, 'revoke_unfiltered_html_cap' ), 10, 2 );
		$this->assertFalse( current_user_can( 'unfiltered_html' ) );
		$instance['text'] = '<script>alert( "Howdy!" );</script>';
		$expected['text'] = wp_kses_post( $instance['text'] );
		$result = $widget->update( $instance, array() );
		$this->assertEquals( $expected, $result, 'KSES should not apply since user can unfiltered_html.' );
		remove_filter( 'map_meta_cap', array( $this, 'revoke_unfiltered_html_cap' ), 10 );
	}

	/**
	 * Test update for legacy widgets.
	 *
	 * @covers WP_Widget_Text::update
	 */
	function test_update_legacy() {
		$widget = new WP_Widget_Text();

		// --
		$instance = array(
			'title' => 'Legacy',
			'text' => 'Text',
			'filter' => false,
		);
		$result = $widget->update( $instance, array() );
		$this->assertEquals( $instance, $result, 'Updating a widget without visual prop and explicit filter=false leaves visual prop absent' );

		// --
		$instance = array(
			'title' => 'Legacy',
			'text' => 'Text',
			'filter' => true,
		);
		$result = $widget->update( $instance, array() );
		$this->assertEquals( $instance, $result, 'Updating a widget without visual prop and explicit filter=true leaves legacy prop absent.' );

		// --
		$instance = array(
			'title' => 'Legacy',
			'text' => 'Text',
			'visual' => true,
		);
		$old_instance = array_merge( $instance, array(
			'filter' => false,
		) );
		$expected = array_merge( $instance, array(
			'filter' => true,
		) );
		$result = $widget->update( $instance, $old_instance );
		$this->assertEquals( $expected, $result, 'Updating a pre-existing widget with visual mode forces filter to be true.' );

		// --
		$instance = array(
			'title' => 'Legacy',
			'text' => 'Text',
			'filter' => true,
		);
		$old_instance = array_merge( $instance, array(
			'visual' => true,
		) );
		$result = $widget->update( $instance, $old_instance );
		$expected = array_merge( $instance, array(
			'visual' => true,
		) );
		$this->assertEquals( $expected, $result, 'Updating a pre-existing visual widget retains visual mode when updated.' );

		// --
		$instance = array(
			'title' => 'Legacy',
			'text' => 'Text',
		);
		$old_instance = array_merge( $instance, array(
			'visual' => true,
		) );
		$result = $widget->update( $instance, $old_instance );
		$expected = array_merge( $instance, array(
			'visual' => true,
			'filter' => true,
		) );
		$this->assertEquals( $expected, $result, 'Updating a pre-existing visual widget retains visual=true and supplies missing filter=true.' );

		// --
		$instance = array(
			'title' => 'Legacy',
			'text' => 'Text',
			'visual' => true,
		);
		$expected = array_merge( $instance, array(
			'filter' => true,
		) );
		$result = $widget->update( $instance, array() );
		$this->assertEquals( $expected, $result, 'Updating a widget with explicit visual=true and absent filter prop causes filter to be set to true.' );

		// --
		$instance = array(
			'title' => 'Legacy',
			'text' => 'Text',
			'visual' => false,
		);
		$result = $widget->update( $instance, array() );
		$expected = array_merge( $instance, array(
			'filter' => false,
		) );
		$this->assertEquals( $expected, $result, 'Updating a widget in legacy mode results in filter=false as if checkbox not checked.' );

		// --
		$instance = array(
			'title' => 'Title',
			'text' => 'Text',
			'filter' => false,
		);
		$old_instance = array_merge( $instance, array(
			'visual' => false,
			'filter' => true,
		) );
		$result = $widget->update( $instance, $old_instance );
		$expected = array_merge( $instance, array(
			'visual' => false,
			'filter' => false,
		) );
		$this->assertEquals( $expected, $result, 'Updating a widget that previously had legacy form results in filter allowed to be false.' );

		// --
		$instance = array(
			'title' => 'Title',
			'text' => 'Text',
			'filter' => 'content',
		);
		$result = $widget->update( $instance, array() );
		$expected = array_merge( $instance, array(
			'filter' => true,
			'visual' => true,
		) );
		$this->assertEquals( $expected, $result, 'Updating a widget that had \'content\' as its filter value persists non-legacy mode. This only existed in WP 4.8.0.' );

		// --
		$instance = array(
			'title' => 'Title',
			'text' => 'Text',
		);
		$old_instance = array_merge( $instance, array(
			'filter' => 'content',
		) );
		$result = $widget->update( $instance, $old_instance );
		$expected = array_merge( $instance, array(
			'visual' => true,
			'filter' => true,
		) );
		$this->assertEquals( $expected, $result, 'Updating a pre-existing widget with the filter=content prop in WP 4.8.0 upgrades to filter=true&visual=true.' );

		// --
		$instance = array(
			'title' => 'Title',
			'text' => 'Text',
			'filter' => 'content',
		);
		$result = $widget->update( $instance, array() );
		$expected = array_merge( $instance, array(
			'filter' => true,
			'visual' => true,
		) );
		$this->assertEquals( $expected, $result, 'Updating a widget with filter=content (from WP 4.8.0) upgrades to filter=true&visual=true.' );
	}

	/**
	 * Grant unfiltered_html cap via map_meta_cap.
	 *
	 * @param array  $caps    Returns the user's actual capabilities.
	 * @param string $cap     Capability name.
	 * @return array Caps.
	 */
	function grant_unfiltered_html_cap( $caps, $cap ) {
		if ( 'unfiltered_html' === $cap ) {
			$caps = array_diff( $caps, array( 'do_not_allow' ) );
			$caps[] = 'unfiltered_html';
		}
		return $caps;
	}

	/**
	 * Revoke unfiltered_html cap via map_meta_cap.
	 *
	 * @param array  $caps    Returns the user's actual capabilities.
	 * @param string $cap     Capability name.
	 * @return array Caps.
	 */
	function revoke_unfiltered_html_cap( $caps, $cap ) {
		if ( 'unfiltered_html' === $cap ) {
			$caps = array_diff( $caps, array( 'unfiltered_html' ) );
			$caps[] = 'do_not_allow';
		}
		return $caps;
	}

	/**
	 * Test enqueue_admin_scripts method.
	 *
	 * @covers WP_Widget_Text::enqueue_admin_scripts
	 */
	function test_enqueue_admin_scripts() {
		set_current_screen( 'widgets.php' );
		$widget = new WP_Widget_Text();
		$widget->enqueue_admin_scripts();

		$this->assertTrue( wp_script_is( 'text-widgets' ) );
	}

	/**
	 * Test render_control_template_scripts method.
	 *
	 * @covers WP_Widget_Text::render_control_template_scripts
	 */
	function test_render_control_template_scripts() {
		ob_start();
		WP_Widget_Text::render_control_template_scripts();
		$output = ob_get_clean();

		$this->assertContains( '<script type="text/html" id="tmpl-widget-text-control-fields">', $output );
	}
}
