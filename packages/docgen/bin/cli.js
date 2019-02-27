#!/usr/bin/env node

const docgen = require( '../src' );

const optionator = require( 'optionator' )( {
	prepend: 'Usage: node <path-to-docgen> <relative-path-to-entry-point>',
	options: [ {
		option: 'formatter',
		type: 'String',
		description: 'A custom function to format the generated documentation. By default, a Markdown formatter will be used.',
	}, {
		option: 'output',
		type: 'String',
		description: 'Output file to contain the API documentation.',
	}, {
		option: 'ignore',
		type: 'RegExp',
		description: 'A regular expression used to ignore symbols whose name match it.',
	}, {
		option: 'to-section',
		type: 'String',
		description: 'Append generated documentation to this section in the Markdown output. To be used by the default Markdown formatter.',
		dependsOn: 'output',
	}, {
		option: 'to-token',
		type: 'Boolean',
		description: 'Embed generated documentation within this token in the Markdown output. To be used by the default Markdown formatter.',
		dependsOn: 'output',
	}, {
		option: 'debug',
		type: 'Boolean',
		default: false,
		description: 'Run in debug mode, which outputs some intermediate files useful for debugging.',
	} ],
} );

const options = optionator.parseArgv( process.argv );
docgen( options._[ 0 ], options );
