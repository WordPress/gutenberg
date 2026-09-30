<?php
/**
 * A collection for novels without fields, dropping a field registered
 * before it, and one that is not registered.
 *
 * @package gutenberg
 */

return array(
	'origin'     => 'fixture',
	'kind'       => 'postType',
	'name'       => 'gutenberg_novel',
	'unregister' => array( 'authorship', 'unknown' ),
);
