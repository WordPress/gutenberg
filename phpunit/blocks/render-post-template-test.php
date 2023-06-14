<?php
/**
 * Tests for the Post Template block rendering.
 *
 * @package WordPress
 * @subpackage Blocks
 * @since 6.0.0
 *
 * @group blocks
 */
class Tests_Blocks_RenderPostTemplateBlock extends WP_UnitTestCase {

	private static $post;
	private static $other_post;

	public function set_up() {
		parent::set_up();

		self::$post = self::factory()->post->create_and_get(
			array(
				'post_type'    => 'post',
				'post_status'  => 'publish',
				'post_name'    => 'metaldog',
				'post_title'   => 'Metal Dog',
				'post_content' => 'Metal Dog content',
				'post_excerpt' => 'Metal Dog',
			)
		);

		self::$other_post = self::factory()->post->create_and_get(
			array(
				'post_type'    => 'post',
				'post_status'  => 'publish',
				'post_name'    => 'ceilingcat',
				'post_title'   => 'Ceiling Cat',
				'post_content' => 'Ceiling Cat content',
				'post_excerpt' => 'Ceiling Cat',
			)
		);
	}

	public function test_rendering_post_template() {
		$parsed_blocks = parse_blocks(
			'<!-- wp:post-template --><!-- wp:post-title /--><!-- wp:post-excerpt /--><!-- /wp:post-template -->'
		);
		$block         = new WP_Block( $parsed_blocks[0] );
		$markup        = $block->render();

		$post_id       = self::$post->ID;
		$other_post_id = self::$other_post->ID;

		$expected = <<<END
<ul class="wp-block-post-template is-layout-flow wp-block-post-template-is-layout-flow">
	<li class="wp-block-post post-$other_post_id post type-post status-publish format-standard hentry category-uncategorized">
		<h2 class="wp-block-post-title">Ceiling Cat</h2>
		<div class="wp-block-post-excerpt">
			<p class="wp-block-post-excerpt__excerpt">Ceiling Cat </p>
		</div>
	</li>
	<li class="wp-block-post post-$post_id post type-post status-publish format-standard hentry category-uncategorized">
		<h2 class="wp-block-post-title">Metal Dog</h2>
		<div class="wp-block-post-excerpt">
			<p class="wp-block-post-excerpt__excerpt">Metal Dog </p>
		</div>
	</li>
</ul>
END;
		$this->assertSame(
			str_replace( array( "\n", "\t" ), '', $expected ),
			str_replace( array( "\n", "\t" ), '', $markup )
		);
	}
}
