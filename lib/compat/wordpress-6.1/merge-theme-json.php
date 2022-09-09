<?php

function gutenberg_merge_theme_json( $existing_data, $incoming_data, $origin ) {
	$existing = new WP_Theme_JSON_Gutenberg( $existing_data, $origin );
	$incoming = new WP_Theme_JSON_Gutenberg( $incoming_data, $origin );
	$existing->merge( $incoming );

	return $existing->get_raw_data();
}
