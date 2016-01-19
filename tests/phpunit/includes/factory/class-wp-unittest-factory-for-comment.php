<?php

class WP_UnitTest_Factory_For_Comment extends WP_UnitTest_Factory_For_Thing {

	function __construct( $factory = null ) {
		parent::__construct( $factory );
		$this->default_generation_definitions = array(
			'comment_author' => new WP_UnitTest_Generator_Sequence( 'Commenter %s' ),
			'comment_author_url' => new WP_UnitTest_Generator_Sequence( 'http://example.com/%s/' ),
			'comment_approved' => 1,
			'comment_content' => 'This is a comment'
		);
	}

	function create_object( $args ) {
		return wp_insert_comment( $this->addslashes_deep( $args ) );
	}

	function update_object( $comment_id, $fields ) {
		$fields['comment_ID'] = $comment_id;
		return wp_update_comment( $this->addslashes_deep( $fields ) );
	}

	function create_post_comments( $post_id, $count = 1, $args = array(), $generation_definitions = null ) {
		$args['comment_post_ID'] = $post_id;
		return $this->create_many( $count, $args, $generation_definitions );
	}

	function get_object_by_id( $comment_id ) {
		return get_comment( $comment_id );
	}
}
