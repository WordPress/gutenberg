/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';

export default class ErrorResponse extends Error {
	constructor( response, ...args ) {
		super( response.message || __( 'An unknown error occurred.' ), ...args );

		if ( Error.captureStackTrace ) {
			Error.captureStackTrace( this, ErrorResponse );
		}

		this.__response = response;

		for ( const prop in response ) {
			if ( response.hasOwnProperty( prop ) ) {
				Object.defineProperty( this, prop, {
					value: response[ prop ],
					configurable: true,
					enumerable: true,
					writable: true,
				} );
			}
		}
	}

	toString() {
		return this.__response.toString();
	}

	getResponse() {
		return this.__response;
	}
}
