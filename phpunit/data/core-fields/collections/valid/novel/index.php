<?php
/**
 * A collection for novels, excluding the fields of the `author` support and the `notes` argument of the `editor` support. It has no fields.
 *
 * @package gutenberg
 */

return array(
	'origin'           => 'fixture',
	'kind'             => 'postType',
	'name'             => 'gutenberg_novel',
	'exclude_supports' => array( 'author', array( 'editor', 'notes' ) ),
);
