<?php
/**
 * Plugin Name: Gutenberg Test Custom CPTS
 * Plugin URI: https://github.com/WordPress/gutenberg
 * Author: Gutenberg Team
 *
 * @package gutenberg-test-custom-cpts
 */

add_action(
	'init',
	function() {
		register_post_type(
			'public_q_not_public',
			array(
				'label'              => 'PublicQNotPublic',
				'show_in_rest'       => true,
				'public'             => false,
				'publicly_queryable' => true,
				'supports'           => [ 'title', 'editor', 'revisions' ],
				'show_ui'            => true,
				'show_in_menu'       => true,
			)
		);
	}
);

add_action(
	'init',
	function() {
		register_post_type(
			'not_public_q_public',
			array(
				'label'              => 'NotPublicQPublic',
				'show_in_rest'       => true,
				'public'             => true,
				'publicly_queryable' => false,
				'supports'           => [ 'title', 'editor', 'revisions' ],
				'show_ui'            => true,
				'show_in_menu'       => true,
			)
		);
	}
);

add_action(
	'init',
	function() {
		register_post_type(
			'public_q_public',
			array(
				'label'              => 'PublicQueryPublic',
				'show_in_rest'       => true,
				'public'             => true,
				'publicly_queryable' => true,
				'supports'           => [ 'title', 'editor', 'revisions' ],
				'show_ui'            => true,
				'show_in_menu'       => true,
			)
		);
	}
);
