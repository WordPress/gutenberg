<?php
/**
 * Transitory file for facilitating migration from old plugin file to the new.
 *
 * @package gutenberg
 */

_deprecated_file( __FILE__, '0.1.0' );

require_once ABSPATH . 'wp-admin/includes/plugin.php';
deactivate_plugins( array( 'gutenberg/index.php' ) );
activate_plugins( array( 'gutenberg/gutenberg.php' ) );

require_once dirname( __FILE__ ) . '/gutenberg.php';
