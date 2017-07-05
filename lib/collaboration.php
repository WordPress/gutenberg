<?php
/**
 * This is collaboration route for set and get of key value of RTC signals.
 *
 * @package gutenberg
 */

if ( ! defined( 'ABSPATH' ) ) {
	die( 'Silence is golden.' );
}

add_action( 'rest_api_init', 'collaboration_routes' );

function collaboration_routes() {
  $current_user = wp_get_current_user();

  register_rest_route( 'collaborate', '/username', array(
    'methods'  => 'GET',
    'callback' => 'get_username',
    'args'     => array(
      'username' => $current_user->user_login
    )
  ));

  register_rest_route( 'collaborate', '/get/(?P<key>\w+.*)', array(
    'methods'  => 'GET',
    'callback' => 'collaboration_get',
  ));

  register_rest_route( 'collaborate', '/set', array(
    'methods'  => 'POST',
    'callback' => 'collaboration_set',
  ));

  register_rest_route( 'collaborate', '/remove', array(
    'methods'  => 'POST',
    'callback' => 'collaboration_remove',
  ));
}

/**
 * Returns the username who is logged in.
 *
 * @param object $data as request data along with args.
 * @return bool else username if logged in.
 */
function get_username( $data ){
  $username = $data->get_attributes();
  return $username['args']['username'];
}

/**
 * Check if string is valid base64.
 * 
 * @param string base64
 * @return bool if its valid
 */
function base64_check( $string ) {
  $decoded = base64_decode( $string, true );

  // Check if there is no invalid character in string
  if ( ! preg_match( '/^[a-zA-Z0-9\/\r\n+]*={0,2}$/', $string ) ) return false;

  // String mode check
  if ( ! base64_decode( $string, true ) ) return false;

  // Encode and compare it to original one
  if ( base64_encode( $decoded ) != $string ) return false;
  
  return true;
}

/**
 * Check if array has same peer already
 *
 * @param array decoded from request
 * @return [string, string, string, string] type, peerID, peerName, signal
 */
 function get_peer_data( $request_value ) {
  if ( base64_check( $request_value ) ) {
    $decoded_data = json_decode( base64_decode( $request_value ) );
  }

  $type     = isset( $decoded_data->type ) ? $decoded_data->type : '';
  $peerID   = isset( $decoded_data->peerID ) ? $decoded_data->peerID : '';
  $signal   = isset( $decoded_data->signal ) ? $decoded_data->signal : '';
  $peerName = isset( $decoded_data->peerName ) ? $decoded_data->peerName : '';
  
  return [$type, $peerID, $peerName, $signal];
 }


/**
 * Check if array has same peer already
 *
 * @param array fetch from db
 * @param peerName from request
 *
 * @return array [boolean, array, array ]
 */
function peer_exist_update( $kv_key, $peerName, $peerID ) {
  for ( $i = 0; $i < count( $kv_key ); $i++ ) {
    if ( $kv_key[ $i ][ 'peerName' ] == $peerName ) {
      $kv_key[ $i ][ 'peerID' ] = $peerID;
      $kv_key[ $i ][ 'signal' ] = false;
      return [ true, $kv_key[ $i ], $kv_key ];
    }
  }
  return [ false, [], [] ];
}

/**
 * Get the data from signal key value store.
 *
 * @param object request data
 * @return string data fetched from key value store.
 */
function collaboration_get( $request_data ) {
  return get_option( $request_data['key'] );
}

/**
 * Set the data from route to signal key value store.
 *
 * @param object request data
 * @return string data which is pushed to key value store.
 */
function collaboration_set( $request_data ) {
  $body = $request_data->get_body_params();
  $key = array_keys( $body )[0];
  $value = $body[ $key ];
  $kv_key = get_option( $key );

  list( $type, $peerID, $peerName, $signal ) = get_peer_data( $value );

  // Assuming true initiator unset if required.
  $kv_value = array(
    'peerID' => $peerID,
    'type' => $type,
    'peerName' => $peerName,
    'initiator' => true
  );

  // If no option in db, create new one.
  if ( ! $kv_key && $type === 'initial' ) {
    add_option( $key, [ $kv_value ] );
    return $kv_value;
  }
  
  // If key is not empty, new peer is not initiator
  if ( $kv_key && $type === 'initial' ) {
    // duplicate request check
    $check_peer = peer_exist_update( $kv_key, $peerName, $peerID );
    if ( $check_peer[ 0 ] ) {
      update_option( $key, $check_peer[2] );
      return $check_peer[1];
    }

    // reset the initiator to false if initiator already exist.
    $kv_value['initiator'] = false;
    $kv_key[] = $kv_value;
    update_option( $key, $kv_key );
    return $kv_value;
  }
  
  if ( $type === 'register' ) {
    for ( $i = 0; $i < count( $kv_key ); $i++ ) {
      if ( $kv_key[ $i ][ 'peerID' ] == $peerID ) {
        $kv_key[ $i ][ 'signal' ] = $signal;
        break;
      }
    }
    update_option( $key, $kv_key );
    return get_option( $key );
  }
}

/**
 * Remove the key from signal key value store.
 *
 * @param object request data
 * @return string data which is pushed to key value store.
 */
function collaboration_remove( $request_data ) {
  $body = $request_data->get_body_params();
  $key = array_keys( $body )[0];
  $value = $body[ $key ];

  list( $type, $peerID, $peerName, $signal ) = get_peer_data( $value );

  // Assuming true initiator unset if required.
  $kv_value = array(
    'peerID' => $peerID,
    'type' => $type,
    'initiator' => true,
    'signal' => $signal
  );

  // Reset the data of peer.
  update_option( $key, [ $kv_value ]);
  return $kv_value;
}

?>