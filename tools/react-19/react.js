module.exports = {
	...require( 'react' ),
	// Polyfill React 18 internals for older versions of `react/jsx-runtime`.
	__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED: {
		ReactCurrentOwner: { current: null },
		ReactCurrentDispatcher: { current: null },
		ReactDebugCurrentFrame: {
			setExtraStackFrame: () => {},
			getStackAddendum: () => '',
		},
	},
};
