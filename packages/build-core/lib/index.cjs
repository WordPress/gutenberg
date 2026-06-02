const WORDPRESS_NAMESPACE = '@wordpress/';

const BUNDLED_PACKAGES = [
	'@wordpress/admin-ui',
	'@wordpress/dataviews',
	'@wordpress/dataviews/wp',
	'@wordpress/fields',
	'@wordpress/grid',
	'@wordpress/icons',
	'@wordpress/interface',
	'@wordpress/style-runtime',
	'@wordpress/ui',
	'@wordpress/undo-manager',
	'@wordpress/views',
];

const VENDOR_EXTERNALS = {
	'@babel/runtime/regenerator': {
		global: 'regeneratorRuntime',
		handle: 'regenerator-runtime',
	},
	jquery: { global: 'jQuery', handle: 'jquery' },
	lodash: { global: 'lodash', handle: 'lodash' },
	'lodash-es': { global: 'lodash', handle: 'lodash' },
	moment: { global: 'moment', handle: 'moment' },
	react: { global: 'React', handle: 'react' },
	'react-dom': { global: 'ReactDOM', handle: 'react-dom' },
	'react-dom/client': { global: 'ReactDOM', handle: 'react-dom' },
	'react/jsx-runtime': {
		global: 'ReactJSXRuntime',
		handle: 'react-jsx-runtime',
	},
	'react/jsx-dev-runtime': {
		global: 'ReactJSXRuntime',
		handle: 'react-jsx-runtime',
	},
};

/**
 * Given a string, returns a new string with dash separators converted to
 * camelCase equivalent. This is not as aggressive as `_.camelCase` in
 * converting to uppercase, where Lodash will also capitalize letters
 * following numbers.
 *
 * @param {string} string Input dash-delimited string.
 * @return {string} Camel-cased string.
 */
function camelCaseDash( string ) {
	return string.replace( /-([a-z])/g, ( _, letter ) => letter.toUpperCase() );
}

/**
 * Given a string, returns a global property name for a package path.
 *
 * @param {string} packagePath Package path after the namespace prefix.
 * @return {string} Camel-cased global property name.
 */
function camelCasePackagePath( packagePath ) {
	return packagePath
		.replace( /\/([a-z])/g, ( _, letter ) => letter.toUpperCase() )
		.replace( /-([a-z])/g, ( _, letter ) => letter.toUpperCase() );
}

/**
 * Get the built-in vendor external metadata for a request.
 *
 * @param {string} request Module request.
 * @return {{ global: string, handle: string }|undefined} Vendor external metadata.
 */
function getVendorExternal( request ) {
	if ( request.includes( 'react-refresh/runtime' ) ) {
		return {
			global: 'ReactRefreshRuntime',
			handle: 'wp-react-refresh-runtime',
		};
	}

	return VENDOR_EXTERNALS[ request ];
}

/**
 * Check if a request is bundled instead of exposed as a default WordPress script.
 *
 * @param {string} request Module request.
 * @return {boolean} True if bundled.
 */
function isBundledPackage( request ) {
	return BUNDLED_PACKAGES.includes( request );
}

/**
 * Parse a scoped package request into package and subpath pieces.
 *
 * @param {string} request Module request.
 * @return {{ packageName: string, packagePath: string, scope: string|null, shortName: string|null, subpath: string|null }} Parsed request.
 */
function parsePackageRequest( request ) {
	const parts = request.split( '/' );

	if ( ! request.startsWith( '@' ) || parts.length < 2 ) {
		return {
			packageName: request,
			packagePath: request,
			scope: null,
			shortName: null,
			subpath: null,
		};
	}

	return {
		packageName: parts.slice( 0, 2 ).join( '/' ),
		packagePath: parts.slice( 1 ).join( '/' ),
		scope: parts[ 0 ].slice( 1 ),
		shortName: parts[ 1 ],
		subpath: parts.length > 2 ? parts.slice( 2 ).join( '/' ) : null,
	};
}

/**
 * Get the built-in package namespace configs.
 *
 * @param {Object}       options                    Options.
 * @param {string}       options.packageNamespace   Custom package namespace.
 * @param {string|false} options.scriptGlobal       Script global for the custom namespace.
 * @param {Object}       options.externalNamespaces Additional external namespace configs.
 * @param {string}       options.handlePrefix       Custom namespace handle prefix.
 * @return {Array<{ namespace: string, pattern: RegExp, globalName: string, handlePrefix: string }>} External namespace configs.
 */
function getPackageExternalConfigs( {
	packageNamespace,
	scriptGlobal,
	externalNamespaces = {},
	handlePrefix,
} = {} ) {
	const packageExternals = [
		{
			namespace: 'wordpress',
			pattern: /^@wordpress\//,
			globalName: 'wp',
			handlePrefix: 'wp',
		},
	];

	if (
		packageNamespace &&
		packageNamespace !== 'wordpress' &&
		scriptGlobal !== false
	) {
		packageExternals.push( {
			namespace: packageNamespace,
			pattern: new RegExp( `^@${ packageNamespace }/` ),
			globalName: scriptGlobal,
			handlePrefix: handlePrefix || packageNamespace,
		} );
	}

	for ( const [ namespace, config ] of Object.entries(
		externalNamespaces
	) ) {
		packageExternals.push( {
			namespace,
			pattern: new RegExp( `^@${ namespace }/` ),
			globalName: config.global,
			handlePrefix: config.handlePrefix || namespace,
		} );
	}

	return packageExternals;
}

/**
 * Check if a package import is a WordPress script module import.
 *
 * @param {Object}      packageJson Package metadata.
 * @param {string|null} subpath     Import subpath.
 * @return {boolean} True if the import is a script module.
 */
function isScriptModuleImport( packageJson, subpath ) {
	const { wpScriptModuleExports } = packageJson;

	if ( ! wpScriptModuleExports ) {
		return false;
	}

	if ( ! subpath ) {
		return (
			typeof wpScriptModuleExports === 'string' ||
			Boolean( wpScriptModuleExports[ '.' ] )
		);
	}

	return Boolean( wpScriptModuleExports[ `./${ subpath }` ] );
}

/**
 * Default request to global transformation.
 *
 * @param {string} request Module request.
 * @return {string|string[]|undefined} The external definition.
 */
function defaultRequestToExternal( request ) {
	const vendorExternal = getVendorExternal( request );
	if ( vendorExternal ) {
		return vendorExternal.global;
	}

	if ( isBundledPackage( request ) ) {
		return undefined;
	}

	if ( request.startsWith( WORDPRESS_NAMESPACE ) ) {
		return [
			'wp',
			camelCaseDash( request.substring( WORDPRESS_NAMESPACE.length ) ),
		];
	}
}

/**
 * Default request to external module transformation.
 *
 * @param {string} request Module request.
 * @return {string|Error|undefined} The external module definition.
 */
function defaultRequestToExternalModule( request ) {
	if ( request === '@wordpress/interactivity' ) {
		return `module ${ request }`;
	}

	switch ( request ) {
		case '@wordpress/interactivity-router':
		case '@wordpress/a11y':
			return `import ${ request }`;
	}

	const isWordPressScript = Boolean( defaultRequestToExternal( request ) );

	if ( isWordPressScript ) {
		throw new Error(
			`Attempted to use WordPress script in a module: ${ request }, which is not supported yet.`
		);
	}
}

/**
 * Default request to WordPress script handle transformation.
 *
 * @param {string} request Module request.
 * @return {string|undefined} WordPress script handle.
 */
function defaultRequestToHandle( request ) {
	switch ( request ) {
		case '@babel/runtime/regenerator':
			return 'regenerator-runtime';

		case 'lodash-es':
			return 'lodash';

		case 'react-dom/client':
			return 'react-dom';

		case 'react/jsx-runtime':
			return 'react-jsx-runtime';
	}

	if ( request.includes( 'react-refresh/runtime' ) ) {
		return 'wp-react-refresh-runtime';
	}

	if ( request.startsWith( WORDPRESS_NAMESPACE ) ) {
		return 'wp-' + request.substring( WORDPRESS_NAMESPACE.length );
	}
}

module.exports = {
	BUNDLED_PACKAGES,
	VENDOR_EXTERNALS,
	WORDPRESS_NAMESPACE,
	camelCaseDash,
	camelCasePackagePath,
	defaultRequestToExternal,
	defaultRequestToExternalModule,
	defaultRequestToHandle,
	getPackageExternalConfigs,
	getVendorExternal,
	isBundledPackage,
	isScriptModuleImport,
	parsePackageRequest,
};
