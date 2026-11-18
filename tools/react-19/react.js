const { warnCompat } = require( './warn-compat' );

const SECRET_INTERNALS_KEY =
	'__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED';

// Polyfill React 18 internals for older versions of `react/jsx-runtime`.
const secretInternals = {
	ReactCurrentOwner: { current: null },
	ReactCurrentDispatcher: { current: null },
	ReactDebugCurrentFrame: {
		setExtraStackFrame() {
			warnCompat(
				'react-secret-internals-setExtraStackFrame',
				`\`${ SECRET_INTERNALS_KEY }.ReactDebugCurrentFrame.setExtraStackFrame\` was removed in React 19 and is a no-op compatibility shim.`
			);
		},
		getStackAddendum() {
			warnCompat(
				'react-secret-internals-getStackAddendum',
				`\`${ SECRET_INTERNALS_KEY }.ReactDebugCurrentFrame.getStackAddendum\` was removed in React 19 and is a no-op compatibility shim.`
			);
			return '';
		},
	},
};

const react = { ...require( 'react' ) };

Object.defineProperty( react, SECRET_INTERNALS_KEY, {
	enumerable: true,
	configurable: true,
	get() {
		warnCompat(
			'react-secret-internals',
			`Accessing \`${ SECRET_INTERNALS_KEY }\` was removed in React 19 and is provided by a compatibility shim.`
		);
		return secretInternals;
	},
} );

module.exports = react;
