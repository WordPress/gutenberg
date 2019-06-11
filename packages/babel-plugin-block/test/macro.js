/**
 * External dependencies
 */
import plugin from 'babel-plugin-macros';
import pluginTester from 'babel-plugin-tester';

pluginTester( {
	plugin,
	babelOptions: {
		babelrc: false,
		filename: __filename,
		presets: [ '@wordpress/babel-preset-default' ],
	},
	tests: {
		'valid metadata file': {
			code: `
				import getBlockData from '../macro';
				const metadata = getBlockData( './fixtures/block.json' );
			`,
			snapshot: true,
		},
		'valid metadata file with i18n support': {
			code: `
				import getBlockData from '../macro';
				const metadata = getBlockData( './fixtures/block-i18n.json' );
			`,
			snapshot: true,
		},
		'valid metadata file with i18n support and default text domain': {
			code: `
				import getBlockData from '../macro';
				const metadata = getBlockData( './fixtures/block-i18n-default.json' );
			`,
			snapshot: true,
		},
		'invalid metadata file name': {
			code: `
				import getBlockData from '../macro';
				const metadata = getBlockData( './invalid-file.json' );
			`,
			error: 'Invalid file name provided: packages/babel-plugin-block/test/invalid-file.json.',
		},
		'invalid usage: as function argument': {
			code: `
				import getBlockData from '../macro';
        		const metadata = doSomething( getBlockData );
      		`,
			error: true,
		},
		'invalid usage: missing file path': {
			code: `
				import getBlockData from '../macro';
				const metadata = getBlockData;
			`,
			error: true,
		},
	},
} );
