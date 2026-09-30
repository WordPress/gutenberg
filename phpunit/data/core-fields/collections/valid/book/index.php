<?php
/**
 * A collection for books, excluding the fields of the `editor` support: not those of its `notes` argument.
 *
 * @package gutenberg
 */

return array(
	'origin'           => 'fixture',
	'kind'             => 'postType',
	'name'             => 'gutenberg_book',
	'module'           => 'fixture/book',
	'exclude_supports' => array( 'editor' ),
);
