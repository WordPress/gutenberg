<?php
/**
 * Test rendering interactions for block supports class injection.
 *
 * @package gutenberg
 */
class WP_Block_Supports_Rendering_Test extends WP_UnitTestCase {
/**
 * @var string
 */
const TEST_BLOCK_NAME = 'test/example';

public function tear_down() {
unregister_block_type( self::TEST_BLOCK_NAME );
parent::tear_down();
}

/**
 * Ensure that HTML appended to the block content is preserved.
 */
public function test_render_block_includes_appended_html() {
register_block_type(
self::TEST_BLOCK_NAME,
array(
'render_callback' => static function ( $attributes, $content ) {
return $content . '<div>Appended</div>';
},
)
);

$result = do_blocks( '<!-- wp:test/example --><p>Hello from the block content!</p><!-- /wp:test/example -->' );

$this->assertSame( '<p class="wp-block-test-example">Hello from the block content!</p><div>Appended</div>', $result );
}

/**
 * Ensure that HTML prepended to the block content is preserved.
 */
public function test_render_block_includes_prepended_html() {
register_block_type(
self::TEST_BLOCK_NAME,
array(
'render_callback' => static function ( $attributes, $content ) {
return '<div>Prepended</div>' . $content;
},
)
);

$result = do_blocks( '<!-- wp:test/example --><p>Hello from the block content!</p><!-- /wp:test/example -->' );

$this->assertSame( '<div>Prepended</div><p class="wp-block-test-example">Hello from the block content!</p>', $result );
}

/**
 * Ensure that HTML surrounding the block content is preserved.
 */
public function test_render_block_includes_surrounding_html() {
register_block_type(
self::TEST_BLOCK_NAME,
array(
'render_callback' => static function ( $attributes, $content ) {
return '<div>Prepended</div>' . $content . '<div>Appended</div>';
},
)
);

$result = do_blocks( '<!-- wp:test/example --><p>Hello from the block content!</p><!-- /wp:test/example -->' );

$this->assertSame( '<div>Prepended</div><p class="wp-block-test-example">Hello from the block content!</p><div>Appended</div>', $result );
}
}
