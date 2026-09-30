<?php
/**
 * The `wp_template` collection: the fields templates have instead of the
 * defaults.
 *
 * Templates support authors, yet their author is the theme, plugin, site,
 * or user that provides them rather than their post author. So they
 * exclude the default author field of the `post_supports` collection and
 * get the author field of this collection instead, with its script module.
 *
 * @package WordPress
 */

return array(
	'origin'           => 'core',
	'kind'             => 'postType',
	'name'             => 'wp_template',
	'module'           => '@wordpress/core-fields/wp_template',
	'exclude_supports' => array( 'author' ),
);
