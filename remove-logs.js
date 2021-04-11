/**
 * External dependencies
 */

const fs = require( 'fs' );

const logConfig = [
	{
		path: 'packages/blocks/src/api/parser.js',
		commentLogs: [
			{
				nonCommented: /\t\tconsole.info\(/g,
				commented: '\t\t/*console.info(',
			},
			{
				nonCommented: /block.originalContent\n\t\t\t\);\n/g,
				commented: 'block.originalContent\n\t\t\t);*/\n',
			},
		],
	},
	{
		path: '../../../wp-includes/js/jquery/jquery-migrate.js',
		commentLogs: [
			{
				nonCommented: /\twindow.console.log\( "JQMIGRATE: Migrate is installed"/g,
				commented:
					'\t/*window.console.log( "JQMIGRATE: Migrate is installed"',
			},
			{
				nonCommented: /\t\t", version " \+ jQuery.migrateVersion \);\n/g,
				commented: '\t\t", version " + jQuery.migrateVersion );*/\n',
			},
		],
	},
];

const commentFunc = ( logConfigs ) => {
	logConfigs.forEach( ( { path, commentLogs } ) => {
		fs.readFile( path, 'utf8', ( err, data ) => {
			if ( err ) {
				// eslint-disable-next-line no-console
				console.error( err );
				return;
			}
			commentLogs.forEach( ( { nonCommented, commented } ) => {
				data = data.replace( nonCommented, commented );
			} );

			fs.writeFile( path, data, 'utf8', function ( error ) {
				// eslint-disable-next-line no-console
				if ( error ) return console.log( err );
			} );
		} );
	} );
};

commentFunc( logConfig );
