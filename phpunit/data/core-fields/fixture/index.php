<?php
/**
 * A field collection for the tests of the collection loader: it registers
 * its fields for the `gutenberg_fixture` post type.
 *
 * @package gutenberg
 */

return static function ( $registry, $fields, $module ) {
	$registry->register( 'core', 'postType', 'gutenberg_fixture', $fields, $module );
};
