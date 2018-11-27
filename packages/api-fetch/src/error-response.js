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
				const descriptor = Object.getOwnPropertyDescriptor( response, prop );
				const description = {
					writable: descriptor ? descriptor.writable : true,
					enumerable: descriptor ? descriptor.enumerable : true,
					configurable: descriptor ? descriptor.configurable : true,
				};

				if ( descriptor.get ) {
					description.get = descriptor.get;
				} else {
					description.value = ( descriptor && descriptor.value ) || response[ prop ];
				}

				if ( descriptor.set ) {
					description.set = descriptor.set;
				}

				Object.defineProperty( this, prop, description );
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
