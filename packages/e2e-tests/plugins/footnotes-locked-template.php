<?php
/**
 * Plugin Name: Gutenberg Test Footnotes Locked Template
 * Plugin URI: https://github.com/WordPress/gutenberg
 * Author: Gutenberg Team
 *
 * @package gutenberg-test-footnotes-locked-template
 */

/**
 * Registers two post types with a locked template, one without and one with
 * a Footnotes block. Both support custom fields and revisions, which the
 * footnotes post meta needs.
 */
function gutenberg_test_footnotes_locked_template() {
	$supports = array( 'title', 'editor', 'custom-fields', 'revisions' );

	register_post_type(
		'locked-paragraph',
		array(
			'public'        => true,
			'label'         => 'Locked Paragraph',
			'show_in_rest'  => true,
			'supports'      => $supports,
			'template'      => array(
				array( 'core/paragraph' ),
			),
			'template_lock' => 'all',
		)
	);

	register_post_type(
		'locked-footnotes',
		array(
			'public'        => true,
			'label'         => 'Locked Footnotes',
			'show_in_rest'  => true,
			'supports'      => $supports,
			'template'      => array(
				array( 'core/paragraph' ),
				array( 'core/footnotes' ),
			),
			'template_lock' => 'all',
		)
	);
}
add_action( 'init', 'gutenberg_test_footnotes_locked_template' );
