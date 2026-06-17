( function () {
	const { registerBlockType } = wp.blocks;
	const { useBlockProps } = wp.blockEditor;

	// The externalized React JSX runtime (the `react-jsx-runtime` script
	// handle). When the React 19 experiment is enabled this is React 19's
	// runtime, which tags elements with `Symbol.for( 'react.transitional.element' )`
	// and no longer resolves `defaultProps` for function components.
	const { jsx } = window.ReactJSXRuntime;

	// --- Bundled React 18 development JSX runtime ----------------------------
	//
	// A faithful, self-contained reimplementation of `jsxDEV` from React 18's
	// `react/cjs/react-jsx-dev-runtime.development.js`. A real-world plugin
	// would get this by bundling `react/jsx-dev-runtime` instead of using the
	// externalized WordPress handle.
	//
	// It reads `ReactCurrentOwner` and `ReactCurrentDispatcher` from React's
	// shared internals (removed in React 19, polyfilled by `tools/react-19`)
	// and produces "legacy" elements tagged with `Symbol.for( 'react.element' )`.
	const REACT_ELEMENT_TYPE = Symbol.for( 'react.element' );
	const hasOwnProperty = Object.prototype.hasOwnProperty;
	const RESERVED_PROPS = {
		key: true,
		ref: true,
		__self: true,
		__source: true,
	};

	function jsxDEV( type, config, maybeKey ) {
		const internals =
			window.React.__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED;
		const { ReactCurrentOwner, ReactCurrentDispatcher } = internals;

		// The real development runtime consults the current dispatcher; touch
		// it so that a missing polyfill fails loudly here as well.
		void ReactCurrentDispatcher.current;

		let propName;
		const props = {};
		let key = null;
		const ref = config.ref !== undefined ? config.ref : null;

		if ( maybeKey !== undefined ) {
			key = '' + maybeKey;
		}
		if ( config.key !== undefined ) {
			key = '' + config.key;
		}

		for ( propName in config ) {
			if (
				hasOwnProperty.call( config, propName ) &&
				! hasOwnProperty.call( RESERVED_PROPS, propName )
			) {
				props[ propName ] = config[ propName ];
			}
		}

		// React 18's runtime resolves `defaultProps`.
		if ( type && type.defaultProps ) {
			const defaultProps = type.defaultProps;
			for ( propName in defaultProps ) {
				if ( props[ propName ] === undefined ) {
					props[ propName ] = defaultProps[ propName ];
				}
			}
		}

		return {
			$$typeof: REACT_ELEMENT_TYPE,
			type,
			key,
			ref,
			props,
			_owner: ReactCurrentOwner.current,
		};
	}

	// A function component that relies on `defaultProps`. Rendered through the
	// externalized React runtime.
	function Greeting( props ) {
		return jsx( 'span', {
			className: 'react-18-compat-block__greeting',
			children: props.label,
		} );
	}
	Greeting.defaultProps = {
		label: 'Hello from defaultProps',
	};

	registerBlockType( 'test/react-18-compat-block', {
		apiVersion: 3,
		edit: function Edit() {
			const blockProps = useBlockProps( {
				className: 'react-18-compat-block',
			} );

			return jsx( 'div', {
				...blockProps,
				children: [
					// An element that relies on the `inert` attribute, created with
					// the bundled React 18 runtime (legacy `react.element` symbol).
					jsxDEV(
						'div',
						{
							className: 'react-18-compat-block__inert',
							inert: 'inert',
							children:
								'This subtree is inert and built with the React 18 runtime.',
						},
						'inert'
					),
					// The `defaultProps` component, created with the
					// externalized React runtime.
					jsx( Greeting, {}, 'greeting' ),
				],
			} );
		},
		save: function Save() {
			return null;
		},
	} );
} )();
