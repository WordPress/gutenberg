/**
 * Internal dependencies
 */
const {
	groupByPath,
	getFirstPropertyName,
	adaptFunctionsFormat,
} = require( './utils' );

module.exports = ( rootDir, docPath, symbols ) => {
	const symbolsGroupedByPath = groupByPath( symbols );
	const path = getFirstPropertyName( symbolsGroupedByPath );

	if ( symbolsGroupedByPath[ path ] === undefined ) {
		return JSON.stringify( symbols, null, 2 );
	}

	const phpDocParserJSON = {
		file: {
			description: path,
			tags: [
				{
					name: 'package',
					content: 'WordPress',
				},
			],
		},
		path,
		root: '/',
		includes: [],
		functions: symbolsGroupedByPath[ path ].map( adaptFunctionsFormat ),
	};

	return JSON.stringify( phpDocParserJSON, null, 2 );
};
