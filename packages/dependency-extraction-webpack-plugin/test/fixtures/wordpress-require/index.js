/**
 * WordPress dependencies
 */
const { isBlobURL } = require( '@wordpress/blob' );

/**
 * External dependencies
 */
const _ = require( 'lodash' );

_.isEmpty( isBlobURL( '' ) );
