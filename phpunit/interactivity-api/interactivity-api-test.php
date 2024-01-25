<?php
/**
 * Unit tests covering the functionality of the public functions of the
 * Interactivity API.
 *
 * @package WordPress
 * @subpackage Interactivity API
 *
 * @group interactivity-api
 */
class Tests_Interactivity_API_Functions extends WP_UnitTestCase {
	/**
	 * Set up.
	 */
	public function set_up() {
		parent::set_up();

		register_block_type(
			'test/interactive-block',
			array(
				'render_callback' => function ( $attributes, $content ) {
					return '
						<div
							data-wp-interactive=\'{ "namespace": "myPlugin" }\'
							data-wp-context=\'{ "block": ' . $attributes['block'] . ' }\'
						>
							<input
								class="interactive/block-' . $attributes['block'] . '"
								data-wp-bind--value="context.block"
							>' .
							$content .
						'</div>';
				},
				'supports'        => array(
					'interactivity' => true,
				),
			)
		);

		register_block_type(
			'test/non-interactive-block',
			array(
				'render_callback' => function ( $attributes, $content ) {
					$directive = isset( $attributes['hasDirective'] ) ? ' data-wp-bind--value="context.block"' : '';
					return '
						<div>
							<input class="non-interactive/block-' . $attributes['block'] . '"' . $directive . '>' .
							$content .
						'</div>';
				},
			)
		);
	}

	public function tear_down() {
		unregister_block_type( 'test/interactive-block' );
		unregister_block_type( 'test/non-interactive-block' );
		parent::tear_down();
	}

	public function test_processs_directives_of_single_interactive_block() {
		$post_content    = '<!-- wp:test/interactive-block { "block": 1 } /-->';
		$rendered_blocks = do_blocks( $post_content );
		$p               = new WP_HTML_Tag_Processor( $rendered_blocks );
		$p->next_tag( array( 'class_name' => 'interactive/block-1' ) );
		$this->assertEquals( '1', $p->get_attribute( 'value' ) );
	}

	public function test_processs_directives_of_multiple_interactive_blocks_in_paralell() {
		$post_content    = '
			<!-- wp:test/interactive-block { "block": 1 } /-->
			<!-- wp:test/interactive-block { "block": 2 } /-->
			<!-- wp:test/non-interactive-block { "block": 3, "hasDirective": true } /-->
		';
		$rendered_blocks = do_blocks( $post_content );
		$p               = new WP_HTML_Tag_Processor( $rendered_blocks );
		$p->next_tag( array( 'class_name' => 'interactive/block-1' ) );
		$this->assertEquals( '1', $p->get_attribute( 'value' ) );
		$p->next_tag( array( 'class_name' => 'interactive/block-2' ) );
		$this->assertEquals( '2', $p->get_attribute( 'value' ) );
		$p->next_tag( array( 'class_name' => 'non-interactive/block-3' ) );
		$this->assertNull( $p->get_attribute( 'value' ) );
	}

	public function test_processs_directives_of_interactive_block_inside_non_interactive_block() {
		$post_content    = '
			<!-- wp:test/non-interactive-block { "block": 1 } -->
				<!-- wp:test/interactive-block { "block": 2 } /-->
			<!-- /wp:test/non-interactive-block -->
		';
		$rendered_blocks = do_blocks( $post_content );
		$p               = new WP_HTML_Tag_Processor( $rendered_blocks );
		$p->next_tag( array( 'class_name' => 'interactive/block-2' ) );
		$this->assertEquals( '2', $p->get_attribute( 'value' ) );
	}

	public function test_processs_directives_of_multple_interactive_blocks_inside_non_interactive_block() {
		$post_content    = '
			<!-- wp:test/non-interactive-block { "block": 1 } -->
				<!-- wp:test/interactive-block { "block": 2 } /-->
				<!-- wp:test/interactive-block { "block": 3 } /-->
			<!-- /wp:test/non-interactive-block -->
		';
		$rendered_blocks = do_blocks( $post_content );
		$p               = new WP_HTML_Tag_Processor( $rendered_blocks );
		$p->next_tag( array( 'class_name' => 'interactive/block-2' ) );
		$this->assertEquals( '2', $p->get_attribute( 'value' ) );
		$p->next_tag( array( 'class_name' => 'interactive/block-3' ) );
		$this->assertEquals( '3', $p->get_attribute( 'value' ) );
	}

	public function test_processs_directives_of_interactive_block_inside_multple_non_interactive_block() {
		$post_content    = '
			<!-- wp:test/non-interactive-block { "block": 1 } -->
				<!-- wp:test/interactive-block { "block": 2 } /-->
			<!-- /wp:test/non-interactive-block -->
			<!-- wp:test/non-interactive-block { "block": 3 } -->
				<!-- wp:test/interactive-block { "block": 4 } /-->
			<!-- /wp:test/non-interactive-block -->
		';
		$rendered_blocks = do_blocks( $post_content );
		$p               = new WP_HTML_Tag_Processor( $rendered_blocks );
		$p->next_tag( array( 'class_name' => 'interactive/block-2' ) );
		$this->assertEquals( '2', $p->get_attribute( 'value' ) );
		$p->next_tag( array( 'class_name' => 'interactive/block-4' ) );
		$this->assertEquals( '4', $p->get_attribute( 'value' ) );
	}

	public function test_processs_directives_of_interactive_block_containing_non_interactive_block_without_directives() {
		$post_content    = '
			<!-- wp:test/interactive-block { "block": 1 } -->
				<!-- wp:test/non-interactive-block { "block": 2 } /-->
			<!-- /wp:test/interactive-block -->
		';
		$rendered_blocks = do_blocks( $post_content );
		$p               = new WP_HTML_Tag_Processor( $rendered_blocks );
		$p->next_tag( array( 'class_name' => 'interactive/block-1' ) );
		$this->assertEquals( '1', $p->get_attribute( 'value' ) );
		$p->next_tag( array( 'class_name' => 'non-interactive/block-2' ) );
		$this->assertNull( $p->get_attribute( 'value' ) );
	}

	public function test_processs_directives_of_interactive_block_containing_non_interactive_block_with_directives() {
		$post_content    = '
			<!-- wp:test/interactive-block { "block": 1 } -->
				<!-- wp:test/non-interactive-block { "block": 2, "hasDirective": true } /-->
			<!-- /wp:test/interactive-block -->
		';
		$rendered_blocks = do_blocks( $post_content );
		$p               = new WP_HTML_Tag_Processor( $rendered_blocks );
		$p->next_tag( array( 'class_name' => 'interactive/block-1' ) );
		$this->assertEquals( '1', $p->get_attribute( 'value' ) );
		$p->next_tag( array( 'class_name' => 'non-interactive/block-2' ) );
		$this->assertEquals( '1', $p->get_attribute( 'value' ) );
	}

	public function test_processs_directives_of_interactive_block_containing_nested_interactive_and_non_interactive_blocks() {
		$post_content    = '
			<!-- wp:test/interactive-block { "block": 1 } -->
				<!-- wp:test/interactive-block { "block": 2 } -->
					<!-- wp:test/non-interactive-block { "block": 3, "hasDirective": true } /-->
				<!-- /wp:test/interactive-block -->
				<!-- wp:test/non-interactive-block { "block": 4, "hasDirective": true } /-->
			<!-- /wp:test/interactive-block -->
		';
		$rendered_blocks = do_blocks( $post_content );
		$p               = new WP_HTML_Tag_Processor( $rendered_blocks );
		$p->next_tag( array( 'class_name' => 'interactive/block-1' ) );
		$this->assertEquals( '1', $p->get_attribute( 'value' ) );
		$p->next_tag( array( 'class_name' => 'interactive/block-2' ) );
		$this->assertEquals( '2', $p->get_attribute( 'value' ) );
		$p->next_tag( array( 'class_name' => 'non-interactive/block-3' ) );
		$this->assertEquals( '2', $p->get_attribute( 'value' ) );
		$p->next_tag( array( 'class_name' => 'non-interactive/block-4' ) );
		$this->assertEquals( '1', $p->get_attribute( 'value' ) );
	}

	private $data_wp_test_processor_count = 0;

	public function data_wp_test_processor( $p ) {
		if ( ! $p->is_tag_closer() ) {
			$this->data_wp_test_processor_count = $this->data_wp_test_processor_count + 1;
		}
	}

	public function test_process_directives_only_process_the_root_interactive_blocks() {
		$class                = new ReflectionClass( 'WP_Interactivity_API' );
		$directive_processors = $class->getProperty( 'directive_processors' );
		$directive_processors->setAccessible( true );
		$directive_processors->setValue( null, array( 'data-wp-test' => array( $this, 'data_wp_test_processor' ) ) );
		$html                               = '<div data-wp-test></div>';
		$this->data_wp_test_processor_count = 0;
		wp_interactivity_process_directives( $html );
		$this->assertEquals( 1, $this->data_wp_test_processor_count );

		register_block_type(
			'test/custom-directive-block',
			array(
				'render_callback' => function ( $attributes, $content ) {
					return '<div class="test" data-wp-test>' . $content . '</div>';
				},
				'supports'        => array(
					'interactivity' => true,
				),
			)
		);
		$post_content                       = '
			<!-- wp:test/custom-directive-block -->
				<!-- wp:test/custom-directive-block /-->
			<!-- /wp:test/custom-directive-block -->
		';
		$this->data_wp_test_processor_count = 0;
		do_blocks( $post_content );
		$this->assertEquals( 2, $this->data_wp_test_processor_count );
		unregister_block_type( 'test/custom-directive-block' );
	}
}
