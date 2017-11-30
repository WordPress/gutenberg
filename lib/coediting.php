<?php
/**
 * This is coediting route for set and get of key value of RTC signals.
 *
 * @package gutenberg
 */

if ( ! defined( 'ABSPATH' ) ) {
	die( 'Silence is golden.' );
}

add_action( 'rest_api_init', 'coediting_routes' );

/**
 * Registers coediting REST routes.
 *
 * @since 1.3.0
 */
function coediting_routes() {
	register_rest_route( 'coediting', '/get/(?P<key>\w+.*)', array(
		'methods'  => 'GET',
		'callback' => 'coediting_get',
	) );

	register_rest_route( 'coediting', '/set', array(
		'methods'  => 'POST',
		'callback' => 'coediting_set',
	) );

	register_rest_route( 'coediting', '/remove', array(
		'methods'  => 'POST',
		'callback' => 'coediting_remove',
	) );
}

/**
 * Gets peer data from the request.
 *
 * @since 1.3.0
 *
 * @param string $request_value Value encoded from request.
 *
 * @return array [ type, peer_id, user_id, signal ]
 */
function get_peer_data( $request_value ) {
	$decoded_data = json_decode( base64_decode( $request_value, true ) );

	$type    = isset( $decoded_data->type ) ? $decoded_data->type : '';
	$peer_id = isset( $decoded_data->peer_id ) ? $decoded_data->peer_id : '';
	$signal  = isset( $decoded_data->signal ) ? $decoded_data->signal : '';
	$user_id = isset( $decoded_data->user_id ) ? $decoded_data->user_id : '';

	return array( $type, $peer_id, $user_id, $signal );
}


/**
 * Checks if an array has same peer data already.
 *
 * @since 1.3.0
 *
 * @param array  $kv_key Data fetched from db.
 * @param string $user_id User identifier.
 * @param string $peer_id Peer identifier.
 *
 * @return array    [ boolean, array, array ]
 */
function peer_exist_update( $kv_key, $user_id, $peer_id ) {
	for ( $i = 0; $i < count( $kv_key ); $i ++ ) {
		if ( $kv_key[ $i ]['user_id'] == $user_id ) {
			$kv_key[ $i ]['peer_id'] = $peer_id;
			$kv_key[ $i ]['signal']  = false;

			return array( true, $kv_key[ $i ], $kv_key );
		}
	}

	return array( false, array(), array() );
}

/**
 * Gets the data from the key value store.
 *
 * @since 1.3.0
 *
 * @param object $request_data Request data.
 *
 * @return string   Data fetched from the key value store.
 */
function coediting_get( $request_data ) {
	return get_option( $request_data['key'] );
}

/**
 * Sets the data from route to signal's key value store.
 *
 * @since 1.3.0
 *
 * @param object $request_data Request data.
 *
 * @return string   Data which is pushed to the key value store.
 */
function coediting_set( $request_data ) {
	$body   = $request_data->get_body_params();
	$keys   = array_keys( $body );
	$key    = $keys[0];
	$value  = $body[ $key ];
	$kv_key = get_option( $key );

	list( $type, $peer_id, $user_id, $signal ) = get_peer_data( $value );

	$attributes = $request_data->get_attributes();

	if ( ! $user_id ) {
		$current_user = wp_get_current_user();
		$user_id      = $current_user->ID;
	}

	// Assuming true initiator unset if required.
	$kv_value = array(
		'peer_id'   => $peer_id,
		'type'      => $type,
		'user_id'   => $user_id,
		'initiator' => true,
	);

	// If no option in db, create new one.
	if ( ! $kv_key && 'initial' === $type ) {
		add_option( $key, array( $kv_value ) );

		return $kv_value;
	}

	// If key is not empty, new peer is not initiator.
	if ( $kv_key && 'initial' === $type ) {
		// Duplicate request check.
		$check_peer = peer_exist_update( $kv_key, $user_id, $peer_id );
		if ( $check_peer[0] ) {
			update_option( $key, $check_peer[2] );

			return $check_peer[1];
		}

		// Reset the initiator to false if initiator already exist.
		$kv_value['initiator'] = false;
		$kv_key[]              = $kv_value;
		update_option( $key, $kv_key );

		return $kv_value;
	}

	if ( 'register' === $type ) {
		for ( $i = 0; $i < count( $kv_key ); $i ++ ) {
			if ( $kv_key[ $i ]['peer_id'] == $peer_id ) {
				$kv_key[ $i ]['signal'] = $signal;
				break;
			}
		}
		update_option( $key, $kv_key );

		return get_option( $key );
	}
}

/**
 * Removes the key from the signal's key value store.
 *
 * @since 1.3.0
 *
 * @param object $request_data Request data.
 *
 * @return string   Data which is pushed to the key value store.
 */
function coediting_remove( $request_data ) {
	$body  = $request_data->get_body_params();
	$keys  = array_keys( $body );
	$key   = $keys[0];
	$value = $body[ $key ];

	list( $type, $peer_id, $user_id, $signal ) = get_peer_data( $value );

	// Assuming true initiator unset if required.
	$kv_value = array(
		'peer_id'   => $peer_id,
		'type'      => $type,
		'initiator' => true,
		'signal'    => $signal,
	);

	// Reset the data of peer.
	update_option( $key, array( $kv_value ) );

	return $kv_value;
}
