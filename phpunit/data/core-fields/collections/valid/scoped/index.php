<?php
/**
 * A collection whose files reuse the variables of the loader as locals.
 *
 * @package gutenberg
 */

$directory = __DIR__ . '/scoped';
$slug      = basename( $directory );

return array(
	'origin' => 'fixture',
	'kind'   => 'postType',
	'name'   => 'gutenberg_' . $slug,
);
