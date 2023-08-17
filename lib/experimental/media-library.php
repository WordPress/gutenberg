<?php

function gutenberg_register_attachment_tag_taxonomy() {
	register_taxonomy(
		'attachment_tag',
		'attachment',
		array(
			'hierarchical'          => false,
			'query_var'             => 'tag',
			'rewrite'               => false, // TODO: what is this?
			'public'                => true,
			'show_ui'               => true,
			'show_admin_column'     => true,
			'_builtin'              => true,
			'capabilities'          => array( // TODO: is this right?
				'manage_terms' => 'upload_files',
				'edit_terms'   => 'upload_files',
				'delete_terms' => 'upload_files',
				'assign_terms' => 'upload_files',
			),
			'show_in_rest'          => true,
			'rest_base'             => 'attachment_tags',
			'rest_controller_class' => 'WP_REST_Terms_Controller',
		)
	);
}

add_action( 'init', 'gutenberg_register_attachment_tag_taxonomy' );
