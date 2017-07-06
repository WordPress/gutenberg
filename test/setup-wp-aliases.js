const lazySetupAlias = object =>
	name =>
		Object.defineProperty( object, name, {
			get: () => require( name ),
		} );
const lazySetupWpAlias = lazySetupAlias( global.wp );

const entryPointNames = [
	'element',
	'i18n',
	'components',
	'utils',
	'blocks',
	'date',
	'editor',
];

entryPointNames.forEach( lazySetupWpAlias );
