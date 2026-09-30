<?php
/**
 * A collection with an invalid `exclude_supports`.
 *
 * @package gutenberg
 */

return array(
	'origin'           => 'fixture',
	'kind'             => 'postType',
	'name'             => 'gutenberg_book',
	'exclude_supports' => array( array( 'editor' ) ),
);
