<?php
/**
 * Plugin Name: Gutenberg
 * Plugin URI: https://github.com/WordPress/gutenberg
 * Description: Printing since 1440. This is the development plugin for the new block editor in core. <strong>Meant for development, do not run on real sites.</strong>
 * Version: 0.2.0
 * Author: Gutenberg Team
 *
 * @package gutenberg
 */

### BEGIN AUTO-GENERATED DEFINES
define( 'GUTENBERG_DEVELOPMENT_MODE', true );
### END AUTO-GENERATED DEFINES

require_once dirname( __FILE__ ) . '/lib/init-checks.php';
if ( gutenberg_can_init() ) {
	// Load API functions, register scripts and actions, etc.
	require_once dirname( __FILE__ ) . '/lib/blocks.php';
	require_once dirname( __FILE__ ) . '/lib/client-assets.php';
	require_once dirname( __FILE__ ) . '/lib/i18n.php';
	require_once dirname( __FILE__ ) . '/lib/register.php';

	// Register server-side code for individual blocks.
	require_once dirname( __FILE__ ) . '/lib/blocks/latest-posts.php';
}
