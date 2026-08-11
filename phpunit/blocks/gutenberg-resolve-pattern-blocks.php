<?php
/**
 * Tests for the gutenberg_resolve_pattern_blocks function.
 *
 * @package WordPress
 * @subpackage Blocks
 */

/**
 * Test the gutenberg_resolve_pattern_blocks function.
 *
 * @group blocks
 * @covers ::gutenberg_resolve_pattern_blocks
 */
class Gutenberg_Resolve_Pattern_Blocks_Test extends WP_UnitTestCase {

	public function set_up() {
		parent::set_up();

		register_block_pattern(
			'core/single-root',
			array(
				'title'       => 'Single Root Pattern',
				'content'     => '<!-- wp:paragraph -->Single root content<!-- /wp:paragraph -->',
				'description' => 'A single root pattern.',
				'categories'  => array( 'text' ),
			)
		);
		register_block_pattern(
			'core/single-root-with-forbidden-chars-in-attrs',
			array(
				'title'       => 'Single Root Pattern<script>alert("XSS")</script>',
				'content'     => '<!-- wp:paragraph -->Single root content<!-- /wp:paragraph -->',
				'description' => 'A single root pattern.<script>alert("XSS")</script><img src=x onerror=alert(1)>',
				'categories'  => array(
					'text<script>alert("XSS")</script>',
					'bad\'); DROP TABLE wp_posts;--',
					'<img src=x onerror=alert(1)>',
					"evil\x00null\nbyte",
					'category with <strong>html</strong> tags',
				),
			)
		);
		register_block_pattern(
			'core/with-attrs',
			array(
				'title'       => 'Pattern With Attrs',
				'content'     => '<!-- wp:paragraph {"className":"custom-class"} -->Content<!-- /wp:paragraph -->',
				'description' => 'A pattern with existing attributes.',
			)
		);
		register_block_pattern(
			'core/nested-single',
			array(
				'title'       => 'Nested Pattern',
				'content'     => '<!-- wp:group --><!-- wp:paragraph -->Nested content<!-- /wp:paragraph --><!-- wp:pattern {"slug":"core/single-root"} /--><!-- /wp:group -->',
				'description' => 'A nested single root pattern.',
				'categories'  => array( 'featured' ),
			)
		);
		register_block_pattern(
			'core/existing-metadata',
			array(
				'title'   => 'Existing Metadata Pattern',
				'content' => '<!-- wp:paragraph {"metadata":{"patternName":"core/existing-metadata-should-not-overwrite","description":"A existing metadata pattern.","categories":["cake"]}} -->Existing metadata content<!-- /wp:paragraph -->',
			)
		);
		register_block_pattern(
			'core/with-custom-metadata',
			array(
				'title'       => 'Pattern With Custom Metadata',
				'content'     => '<!-- wp:paragraph {"metadata":{"customKey":"customValue","anotherKey":123,"booleanKey":true}} -->Content with custom metadata<!-- /wp:paragraph -->',
				'description' => 'A pattern with custom metadata keys.',
				'categories'  => array( 'test' ),
			)
		);
	}

	public function tear_down() {
		unregister_block_pattern( 'core/single-root' );
		unregister_block_pattern( 'core/single-root-with-forbidden-chars-in-attrs' );
		unregister_block_pattern( 'core/with-attrs' );
		unregister_block_pattern( 'core/nested-single' );
		unregister_block_pattern( 'core/existing-metadata' );
		unregister_block_pattern( 'core/with-custom-metadata' );
		parent::tear_down();
	}


	/**
	 * @dataProvider data_should_resolve_pattern_blocks_as_expected
	 *
	 * @param string $blocks   A string representing blocks that need resolving.
	 * @param string $expected Expected result.
	 */
	public function test_should_resolve_pattern_blocks_as_expected( $blocks, $expected ) {
		$actual = gutenberg_resolve_pattern_blocks( parse_blocks( $blocks ) );
		$this->assertSame( $expected, serialize_blocks( $actual ) );
	}

	/**
	 * Data provider.
	 *
	 * @return array
	 */
	public function data_should_resolve_pattern_blocks_as_expected() {
		return array(
			// Resolves the single-root pattern and adds metadata.
			'single-root pattern'           => array(
				'<!-- wp:pattern {"slug":"core/single-root"} /-->',
				'<!-- wp:paragraph {"metadata":{"patternName":"core/single-root","name":"Single Root Pattern","description":"A single root pattern.","categories":["text"]}} -->Single root content<!-- /wp:paragraph -->',
			),
			// Existing attributes are preserved when adding metadata.
			'existing attributes preserved' => array(
				'<!-- wp:pattern {"slug":"core/with-attrs"} /-->',
				'<!-- wp:paragraph {"className":"custom-class","metadata":{"patternName":"core/with-attrs","name":"Pattern With Attrs","description":"A pattern with existing attributes."}} -->Content<!-- /wp:paragraph -->',
			),
			// Resolves the nested single-root pattern and adds metadata.
			'nested single-root pattern'    => array(
				'<!-- wp:pattern {"slug":"core/nested-single"} /-->',
				'<!-- wp:group {"metadata":{"patternName":"core/nested-single","name":"Nested Pattern","description":"A nested single root pattern.","categories":["featured"]}} --><!-- wp:paragraph -->Nested content<!-- /wp:paragraph --><!-- wp:paragraph {"metadata":{"patternName":"core/single-root","name":"Single Root Pattern","description":"A single root pattern.","categories":["text"]}} -->Single root content<!-- /wp:paragraph --><!-- /wp:group -->',
			),
			// Sanitizes fields.
			'sanitized pattern attrs'       => array(
				'<!-- wp:pattern {"slug":"core/single-root-with-forbidden-chars-in-attrs"} /-->',
				'<!-- wp:paragraph {"metadata":{"patternName":"core/single-root-with-forbidden-chars-in-attrs","name":"Single Root Pattern","description":"A single root pattern.","categories":["text","bad\'); DROP TABLE wp_posts;\u002d\u002d","","evil\u0000null byte","category with html tags"]}} -->Single root content<!-- /wp:paragraph -->',
			),
			// Metadata is merged with existing metadata and existing metadata is preserved.
			'existing metadata preserved'   => array(
				'<!-- wp:pattern {"slug":"core/existing-metadata"} /-->',
				'<!-- wp:paragraph {"metadata":{"patternName":"core/existing-metadata","description":"A existing metadata pattern.","categories":["cake"],"name":"Existing Metadata Pattern"}} -->Existing metadata content<!-- /wp:paragraph -->',
			),
			// Custom metadata keys are preserved when resolving patterns.
			'custom metadata preserved'     => array(
				'<!-- wp:pattern {"slug":"core/with-custom-metadata"} /-->',
				'<!-- wp:paragraph {"metadata":{"customKey":"customValue","anotherKey":123,"booleanKey":true,"patternName":"core/with-custom-metadata","name":"Pattern With Custom Metadata","description":"A pattern with custom metadata keys.","categories":["test"]}} -->Content with custom metadata<!-- /wp:paragraph -->',
			),
		);
	}
}
