/**
 * External dependencies
 */
import { transform } from '@babel/core';

/**
 * Internal dependencies
 */
import { createBabelPlugin } from '../babel-plugin';

function join( ...strings ) {
	return strings.join( '\n' );
}

function compare( input, output, isExperimental, options = {} ) {
	const blockLibraryPlugin = createBabelPlugin( () => true, isExperimental );
	const { code } = transform( input, {
		configFile: false,
		plugins: [ [ blockLibraryPlugin, options ] ],
	} );
	expect( code ).toEqual( output );
}

describe( 'babel-plugin', () => {
	it( 'should ignore stable blocks', () => {
		compare(
			join(
				'import * as experimentalBlock from "./experimental-block";',
				'const blocks = [ experimentalBlock ];'
			),
			join(
				'import * as experimentalBlock from "./experimental-block";',
				'const blocks = [experimentalBlock];'
			),
			() => false
		);
	} );
	it( 'should transform experimental blocks', () => {
		compare(
			join(
				'import * as experimentalBlock from "./experimental-block";',
				'const blocks = [ experimentalBlock ];'
			),
			join(
				'import * as experimentalBlock from "./experimental-block";',
				'const blocks = [process.env.IS_GUTENBERG_PLUGIN === true ? experimentalBlock : void 0];'
			),
			() => true
		);
	} );
	it( 'should work with mixed imports blocks', () => {
		compare(
			join(
				'import * as stableBlock from "./stable-block";',
				'import * as experimentalBlock from "./experimental-block";',
				'const blocks = [ stableBlock, experimentalBlock ];'
			),
			join(
				'import * as stableBlock from "./stable-block";',
				'import * as experimentalBlock from "./experimental-block";',
				'const blocks = [stableBlock, process.env.IS_GUTENBERG_PLUGIN === true ? experimentalBlock : void 0];'
			),
			( path ) =>
				path.node.specifiers[ 0 ].local.name === 'experimentalBlock'
		);
	} );
} );
