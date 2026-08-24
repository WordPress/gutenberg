const DependencyExtractionWebpackPlugin = require( '../lib/index' );

describe( 'stringify', () => {
	const asset = {
		dependencies: [ 'react', 'wp-element' ],
		version: 'abc123',
	};

	test( 'pretty-prints PHP with line breaks and indentation', () => {
		const plugin = new DependencyExtractionWebpackPlugin( {
			outputFormat: 'php',
		} );

		expect( plugin.stringify( asset ) ).toBe(
			`<?php return array(
	'dependencies' => array(
		'react',
		'wp-element'
	),
	'version' => 'abc123'
);\n`
		);
	} );

	test( 'pretty-prints JSON with tab indentation', () => {
		const plugin = new DependencyExtractionWebpackPlugin( {
			outputFormat: 'json',
		} );

		expect( plugin.stringify( asset ) ).toBe(
			JSON.stringify( asset, null, '\t' )
		);
	} );
} );
