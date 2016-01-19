<?php

class WP_UnitTest_Factory_For_Term extends WP_UnitTest_Factory_For_Thing {

	private $taxonomy;
	const DEFAULT_TAXONOMY = 'post_tag';

	function __construct( $factory = null, $taxonomy = null ) {
		parent::__construct( $factory );
		$this->taxonomy = $taxonomy ? $taxonomy : self::DEFAULT_TAXONOMY;
		$this->default_generation_definitions = array(
			'name' => new WP_UnitTest_Generator_Sequence( 'Term %s' ),
			'taxonomy' => $this->taxonomy,
			'description' => new WP_UnitTest_Generator_Sequence( 'Term description %s' ),
		);
	}

	function create_object( $args ) {
		$args = array_merge( array( 'taxonomy' => $this->taxonomy ), $args );
		$term_id_pair = wp_insert_term( $args['name'], $args['taxonomy'], $args );
		if ( is_wp_error( $term_id_pair ) )
			return $term_id_pair;
		return $term_id_pair['term_id'];
	}

	function update_object( $term, $fields ) {
		$fields = array_merge( array( 'taxonomy' => $this->taxonomy ), $fields );
		if ( is_object( $term ) )
			$taxonomy = $term->taxonomy;
		$term_id_pair = wp_update_term( $term, $taxonomy, $fields );
		return $term_id_pair['term_id'];
	}

	function add_post_terms( $post_id, $terms, $taxonomy, $append = true ) {
		return wp_set_post_terms( $post_id, $terms, $taxonomy, $append );
	}

	function create_and_get( $args = array(), $generation_definitions = null ) {
		$term_id = $this->create( $args, $generation_definitions );
		$taxonomy = isset( $args['taxonomy'] ) ? $args['taxonomy'] : $this->taxonomy;
		return get_term( $term_id, $taxonomy );
	}

	function get_object_by_id( $term_id ) {
		return get_term( $term_id, $this->taxonomy );
	}
}
