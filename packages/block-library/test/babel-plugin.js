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

function transformCode( input, isExperimental, options = {} ) {
	const blockLibraryPlugin = createBabelPlugin( isExperimental, false );
	const { code } = transform( input, {
		configFile: false,
		plugins: [ [ blockLibraryPlugin, options ] ],
	} );
	return code;
}

describe( 'babel-plugin', () => {
	it( 'should ignore stable blocks', () => {
		const input = join(
			'import * as experimentalBlock from "./experimental-block";',
			'const blocks = [ experimentalBlock ];'
		);
		const expected = join(
			'import * as experimentalBlock from "./experimental-block";',
			'const blocks = [experimentalBlock];'
		);

		expect( transformCode( input, () => false ) ).toEqual( expected );
	} );

	it( 'should transform experimental blocks', () => {
		const input = join(
			'import * as experimentalBlock from "./experimental-block";',
			'const blocks = [ experimentalBlock ];'
		);
		const expected = join(
			'const experimentalBlock = null;',
			'const blocks = [experimentalBlock];'
		);

		expect( transformCode( input, () => true ) ).toEqual( expected );
	} );

	it( 'should work with mixed imports blocks', () => {
		const input = join(
			'import * as stableBlock from "./stable-block";',
			'import * as experimentalBlock from "./experimental-block";',
			'const blocks = [ stableBlock, experimentalBlock ];'
		);
		const expected = join(
			'import * as stableBlock from "./stable-block";',
			'const experimentalBlock = null;',
			'const blocks = [stableBlock, experimentalBlock];'
		);
		const isExperimental = ( path ) =>
			path.node.specifiers[ 0 ].local.name === 'experimentalBlock';

		expect( transformCode( input, isExperimental ) ).toEqual( expected );
	} );
} );
