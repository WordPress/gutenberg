const jsxRuntime = require( 'react/jsx-runtime' );

function applyDefaultProps( type, config ) {
	if ( ! type || ! type.defaultProps ) {
		return config;
	}

	const defaultProps = type.defaultProps;
	let props = config;

	for ( const propName in defaultProps ) {
		if ( props[ propName ] === undefined ) {
			// Clone lazily so the caller's config object is never mutated.
			if ( props === config ) {
				props = { ...config };
			}
			props[ propName ] = defaultProps[ propName ];
		}
	}

	return props;
}

function jsx( type, config, maybeKey ) {
	return jsxRuntime.jsx( type, applyDefaultProps( type, config ), maybeKey );
}

function jsxs( type, config, maybeKey ) {
	return jsxRuntime.jsxs( type, applyDefaultProps( type, config ), maybeKey );
}

module.exports = {
	...jsxRuntime,
	jsx,
	jsxs,
};
