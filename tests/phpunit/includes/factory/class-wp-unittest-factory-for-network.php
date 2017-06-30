<?php

/**
 * Unit test factory for networks.
 *
 * Note: The below @method notations are defined solely for the benefit of IDEs,
 * as a way to indicate expected return values from the given factory methods.
 *
 * @method int create( $args = array(), $generation_definitions = null )
 * @method WP_Network create_and_get( $args = array(), $generation_definitions = null )
 * @method int[] create_many( $count, $args = array(), $generation_definitions = null )
 */
class WP_UnitTest_Factory_For_Network extends WP_UnitTest_Factory_For_Thing {

	function __construct( $factory = null ) {
		parent::__construct( $factory );
		$this->default_generation_definitions = array(
			'domain' => WP_TESTS_DOMAIN,
			'title' => new WP_UnitTest_Generator_Sequence( 'Network %s' ),
			'path' => new WP_UnitTest_Generator_Sequence( '/testpath%s/' ),
			'network_id' => new WP_UnitTest_Generator_Sequence( '%s', 2 ),
			'subdomain_install' => false,
		);
	}

	function create_object( $args ) {
		require_once ABSPATH . 'wp-admin/includes/upgrade.php';

		if ( ! isset( $args['user'] ) ) {
			$email = WP_TESTS_EMAIL;
		} else {
			$email = get_userdata( $args['user'] )->user_email;
		}

		populate_network( $args['network_id'], $args['domain'], $email, $args['title'], $args['path'], $args['subdomain_install'] );
		return $args['network_id'];
	}

	function update_object( $network_id, $fields ) {}

	function get_object_by_id( $network_id ) {
		return get_network( $network_id );
	}
}
