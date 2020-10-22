<?php
/**
 * Template types definitions.
 *
 * @package gutenberg
 */

function gutenberg_get_template_types_definitions() {
	return array(
		'index'          => array(
			'title'         => 'Default (Index)',
			'description'   => 'Main template, applied when no other template is found',
		),
		'home'           => array(
			'title'         => 'Home',
			'description'   => 'Template for the latest blog posts',
		),
		'front-page'     => array(
			'title'         => 'Front Page',
			'description'   => 'Front page template, whether it displays the blog posts index or a static page',
		),
		'archive'        => array(
			'title'         => 'Default Archive',
			'description'   => 'Applied to archives like your posts page, categories, or tags',
		),
		'singular'       => array(
			'title'         => 'Default Singular',
			'description'   => 'Displays any content on a single page',
		),
		'single'         => array(
			'title'         => 'Default Single',
			'description'   => 'Applied to individual content like a blog post',
		),
		'page'           => array(
			'title'         => 'Default Page',
			'description'   => 'Applied to individual pages',
		),
		'404'            => array(
			'title'         => '404',
			'description'   => 'Applied when content cannot be found',
		),
		'search'         => array(
			'title'         => 'Search Results',
			'description'   => 'Applied to search results',
		),
		'author'         => array(
			'title'         => 'Default Author Archive',
			'description'   => 'Displays a list of posts by a single author',
		),
		'category'       => array(
			'title'         => 'Default Post Category Archive',
			'description'   => 'Displays a list of posts in a category',
		),
		'taxonomy'       => array(
			'title'         => 'Default Taxonomy Archive',
			'description'   => 'Displays a list of posts in a taxonomy',
		),
		'date'           => array(
			'title'         => 'Default Date Archive',
			'description'   => 'Displays a list of posts in a date range',
		),
		'tag'            => array(
			'title'         => 'Default Tag Archive',
			'description'   => 'Displays a list of posts with a tag',
		),
		'attachment'     => array(
			'title'         => 'Media',
			'description'   => 'Displays media content',
		),
		'embed'          => array(
			'title'         => 'Embed',
			'description'   => '[Currently unsupported]',
		),
		'privacy-policy' => array(
			'title'         => 'Privacy Policy',
			'description'   => '',
		),
	);
}

function gutenberg_get_default_template_types( $settings ) {
	$settings['defaultTemplateTypes'] = gutenberg_get_template_types_definitions();
	return $settings;
}
add_filter( 'block_editor_settings', 'gutenberg_get_default_template_types' );
