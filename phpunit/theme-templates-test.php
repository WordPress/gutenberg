<?php

/**
 * Test the block-templates theme feature.
 *
 * @package Gutenberg
 */

class Theme_Templates_Test extends WP_UnitTestCase {

       function setUp() {
               parent::setUp();
               $this->theme_root = realpath( __DIR__ . '/data/themedir1' );

               $this->orig_theme_dir = $GLOBALS['wp_theme_directories'];

               // /themes is necessary as theme.php functions assume /themes is the root if there is only one root.
               $GLOBALS['wp_theme_directories'] = array( WP_CONTENT_DIR . '/themes', $this->theme_root );

               add_filter( 'theme_root', array( $this, 'filter_set_theme_root' ) );
               add_filter( 'stylesheet_root', array( $this, 'filter_set_theme_root' ) );
               add_filter( 'template_root', array( $this, 'filter_set_theme_root' ) );
               $this->queries = array();
               // Clear caches.
               wp_clean_themes_cache();
               unset( $GLOBALS['wp_themes'] );
       }

       function tearDown() {
               $GLOBALS['wp_theme_directories'] = $this->orig_theme_dir;
               wp_clean_themes_cache();
               unset( $GLOBALS['wp_themes'] );
               parent::tearDown();
       }

       function filter_set_theme_root() {
               return $this->theme_root;
       }

       /**
        * Tests whether the default non-block theme properly returns
        * false when checking if the current theme supports the block-teplates
        * feature.
        */
       function test_gutenberg_enable_block_templates_default_theme() {
               // The `default` theme is not a block theme.
               $this->assertSame( false, current_theme_supports( 'block-templates' ) );

       }

       /**
        * Tests whether switching to block theme would make the `current_theme_supports`
        * function properly return true when checking for `block-templates` feature,
        * which is being dynamicly added by the Gutenberg plguin to any block theme.
        */
       function test_gutenberg_enable_block_templates_swith_theme() {
               switch_theme( 'block-theme' );

               $this->assertSame( true, current_theme_supports( 'block-templates' ) );
       }

       /**
        * tests whether block theme's page templates are available upon switch_theme
        * function call, in case the newly loaded theme is a block theme.
        */
       function test_page_templates_after_theme_switch() {
               switch_theme( 'block-theme' );

               $block_theme = wp_get_theme();

               $this->assertSame( array( 'page-home' => 'Homepage template' ), $block_theme->get_page_templates() );
       }
}
