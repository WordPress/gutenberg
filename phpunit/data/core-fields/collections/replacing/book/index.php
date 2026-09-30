<?php
/**
 * A collection for books replacing a field registered before it.
 *
 * @package gutenberg
 */

return array(
	'origin'     => 'fixture',
	'kind'       => 'postType',
	'name'       => 'gutenberg_book',
	'module'     => 'fixture/book',
	'unregister' => array( 'authorship' ),
);
