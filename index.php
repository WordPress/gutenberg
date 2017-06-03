<?php
/**
 * Transitory file for facilitating migration from old plugin file to the new.
 *
 * @package gutenberg
 */

_deprecated_file( __FILE__, '0.1.0' );
deactivate_plugins( array( 'gutenberg/index.php' ) );
activate_plugins( array( 'gutenberg/gutenberg.php' ) );
