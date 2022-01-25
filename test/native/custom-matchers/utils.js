/**
 * External dependencies
 */
import {
	RECEIVED_COLOR as receivedColor,
	matcherHint,
	printReceived,
	printWithType,
} from 'jest-matcher-utils';

// "ReactElementTypeError" class is extracted from "@testing-library/jest-native" package.
// Reference: https://github.com/testing-library/jest-native/blob/0dbda7191106f15a57eda1be10eadf95ad8bd81f/src/utils.js#L27
export class ReactElementTypeError extends Error {
	constructor( received, matcherFn, context ) {
		super();

		if ( Error.captureStackTrace ) {
			Error.captureStackTrace( this, matcherFn );
		}
		let withType = '';
		try {
			withType = printWithType( 'Received', received, printReceived );
		} catch ( e ) {}
		this.message = [
			matcherHint(
				`${ context.isNot ? '.not' : '' }.${ matcherFn.name }`,
				'received',
				''
			),
			'',
			`${ receivedColor( 'received' ) } value must be an React Element.`,
			withType,
		].join( '\n' );
	}
}

const VALID_ELEMENTS = [
	'Image',
	'Text',
	'TextInput',
	'Modal',
	'View',
	'RefreshControl',
	'ScrollView',
	'ActivityIndicator',
	'ListView',
	'ListViewDataSource',
];

// "checkReactElement" util function is extracted from "@testing-library/jest-native" package.
// Reference: https://github.com/testing-library/jest-native/blob/0dbda7191106f15a57eda1be10eadf95ad8bd81f/src/utils.js#L49
export function checkReactElement( element, ...args ) {
	if ( ! VALID_ELEMENTS.includes( element.type ) && ! element._fiber ) {
		throw new ReactElementTypeError( element, ...args );
	}
}

export function printElement( { type, props } ) {
	return JSON.stringify( { type, props }, null, 4 );
}
