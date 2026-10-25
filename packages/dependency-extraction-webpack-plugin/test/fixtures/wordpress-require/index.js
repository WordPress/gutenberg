const { isBlobURL } = require( '@wordpress/blob' );
const _ = require( 'lodash' );

_.isEmpty( isBlobURL( '' ) );
