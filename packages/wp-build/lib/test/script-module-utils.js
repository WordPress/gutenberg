import { describe, expect, it } from 'vitest';
import {
	assertUniqueScriptModuleIds,
	getScriptModuleExports,
	getScriptModuleId,
} from '../script-module-utils.mjs';

describe( 'getScriptModuleExports()', () => {
	it( 'returns no exports when the field is missing', () => {
		expect( getScriptModuleExports( undefined ) ).toEqual( [] );
	} );

	it( 'treats a string as the root export', () => {
		expect( getScriptModuleExports( './build-module/index.mjs' ) ).toEqual(
			[
				{
					exportName: '.',
					fileName: 'index',
					entryPath: './build-module/index.mjs',
					id: undefined,
				},
			]
		);
	} );

	it( 'accepts paths and `{ path, id }` objects side by side', () => {
		expect(
			getScriptModuleExports( {
				'./page': './build-module/page/index.mjs',
				'./entity-actions/wp_block': {
					path: './build-module/entity-actions/wp_block/index.mjs',
					id: '@wordpress/actions/wp_block',
				},
				'./no-id': { path: './build-module/no-id/index.mjs' },
			} )
		).toEqual( [
			{
				exportName: './page',
				fileName: 'page',
				entryPath: './build-module/page/index.mjs',
				id: undefined,
			},
			{
				exportName: './entity-actions/wp_block',
				fileName: 'entity-actions/wp_block',
				entryPath: './build-module/entity-actions/wp_block/index.mjs',
				id: '@wordpress/actions/wp_block',
			},
			{
				exportName: './no-id',
				fileName: 'no-id',
				entryPath: './build-module/no-id/index.mjs',
				id: undefined,
			},
		] );
	} );

	it( 'rejects an object without a path', () => {
		expect( () =>
			getScriptModuleExports( { './a': { id: '@my/a' } }, '@my/package' )
		).toThrow( /"\.\/a" of @my\/package must be a path/ );
	} );

	it( 'rejects an empty or non-string id', () => {
		expect( () =>
			getScriptModuleExports( { './a': { path: './a.mjs', id: '' } } )
		).toThrow( /"id" .* must be a non-empty string/ );
		expect( () =>
			getScriptModuleExports( { './a': { path: './a.mjs', id: 1 } } )
		).toThrow( /"id" .* must be a non-empty string/ );
	} );
} );

describe( 'getScriptModuleId()', () => {
	const [ root, sub, overridden ] = getScriptModuleExports( {
		'.': './build-module/index.mjs',
		'./sub/path': './build-module/sub/path.mjs',
		'./entity-actions/wp_block': {
			path: './build-module/entity-actions/wp_block/index.mjs',
			id: '@wordpress/actions/wp_block',
		},
	} );

	it( 'builds the ID of the root export from the package name', () => {
		expect( getScriptModuleId( root, 'wordpress', 'fields' ) ).toBe(
			'@wordpress/fields'
		);
	} );

	it( 'builds the ID of a subpath export from the export key', () => {
		expect( getScriptModuleId( sub, 'wordpress', 'fields' ) ).toBe(
			'@wordpress/fields/sub/path'
		);
	} );

	it( 'uses the declared ID when there is one', () => {
		expect( getScriptModuleId( overridden, 'wordpress', 'fields' ) ).toBe(
			'@wordpress/actions/wp_block'
		);
	} );
} );

describe( 'assertUniqueScriptModuleIds()', () => {
	it( 'accepts distinct IDs', () => {
		expect( () =>
			assertUniqueScriptModuleIds( [
				{ id: '@wordpress/fields/page', path: 'fields/page' },
				{
					id: '@wordpress/actions/wp_block',
					path: 'fields/entity-actions/wp_block',
				},
			] )
		).not.toThrow();
	} );

	it( 'names the ID and the modules that collide, across packages', () => {
		expect( () =>
			assertUniqueScriptModuleIds( [
				{ id: '@wordpress/a11y', path: 'a11y/index' },
				{
					id: '@wordpress/actions/wp_block',
					path: 'fields/entity-actions/wp_block',
				},
				{
					id: '@wordpress/actions/wp_block',
					path: 'actions/wp_block',
				},
			] )
		).toThrow(
			'@wordpress/actions/wp_block: build/modules/fields/entity-actions/wp_block, build/modules/actions/wp_block'
		);
	} );
} );
