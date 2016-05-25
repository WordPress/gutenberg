<?php

/**
 * Factory for creating fixtures for the deprecated Links/Bookmarks API.
 *
 * @since 4.6.0
 */
class WP_UnitTest_Factory_For_Bookmark extends WP_UnitTest_Factory_For_Thing {

	public function __construct( $factory = null ) {
		parent::__construct( $factory );
		$this->default_generation_definitions = array(
			'link_name' => new WP_UnitTest_Generator_Sequence( 'Bookmark name %s' ),
			'link_url' => new WP_UnitTest_Generator_Sequence( 'Bookmark URL %s' ),
		);
	}

	public function create_object( $args ) {
		return wp_insert_link( $args );
	}

	public function update_object( $link_id, $fields ) {
		$fields['link_id'] = $link_id;
		return wp_update_link( $fields );
	}

	public function get_object_by_id( $link_id ) {
		return get_bookmark( $link_id );
	}
}
