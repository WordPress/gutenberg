const { warnCompat } = require( './warn-compat' );

const SECRET_INTERNALS_KEY =
	'__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED';

const secretInternals = {};

const reactDOM = {
	...require( 'react-dom' ),
	...require( 'react-dom/client' ),
	...require( './react-polyfill' ),
};

Object.defineProperty( reactDOM, SECRET_INTERNALS_KEY, {
	enumerable: true,
	configurable: true,
	get() {
		warnCompat(
			'react-dom-secret-internals',
			`Accessing \`${ SECRET_INTERNALS_KEY }\` was removed in React 19 and is provided by a compatibility shim.`
		);
		return secretInternals;
	},
} );

module.exports = reactDOM;
