<?php
/**
 * Load API functions, register scripts and actions, etc.
 *
 * @package gutenberg
 */

if ( ! defined( 'ABSPATH' ) ) {
	die( 'Silence is golden.' );
}

require dirname( __FILE__ ) . '/meta-box-partial-page.php';
require dirname( __FILE__ ) . '/class-wp-block-type.php';
require dirname( __FILE__ ) . '/class-wp-block-type-registry.php';
require dirname( __FILE__ ) . '/class-wp-rest-reusable-blocks-controller.php';
require dirname( __FILE__ ) . '/blocks.php';
require dirname( __FILE__ ) . '/client-assets.php';
require dirname( __FILE__ ) . '/compat.php';
require dirname( __FILE__ ) . '/plugin-compat.php';
require dirname( __FILE__ ) . '/i18n.php';
require dirname( __FILE__ ) . '/parser.php';
require dirname( __FILE__ ) . '/register.php';

// Register server-side code for individual blocks.
foreach ( glob( dirname( __FILE__ ) . '/../blocks/library/*/index.php' ) as $block_logic ) {
	require $block_logic;
}
