import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import {
	findSharedImports,
	readSharedModulesManifest,
} from '../shared-modules-manifest.mjs';

describe( 'findSharedImports', () => {
	const ids = new Set( [ '@my-shared/ui', '@my-shared/api' ] );
	const imports = ( source ) =>
		Object.fromEntries(
			[ ...findSharedImports( source, ids ) ].map( ( [ id, names ] ) => [
				id,
				[ ...names ].sort(),
			] )
		);

	it.each( [
		[
			'named with as',
			'import{Button as t,Badge}from"@my-shared/ui";',
			{ '@my-shared/ui': [ 'Badge', 'Button' ] },
		],
		[
			'default',
			'import e from"@my-shared/ui";',
			{ '@my-shared/ui': [ 'default' ] },
		],
		[
			'default and named',
			'import e,{Badge as b}from"@my-shared/ui";',
			{ '@my-shared/ui': [ 'Badge', 'default' ] },
		],
		[
			'namespace',
			'import*as e from"@my-shared/ui";',
			{ '@my-shared/ui': [ '*' ] },
		],
		[
			'named re-export',
			'export{Badge}from"@my-shared/ui";',
			{ '@my-shared/ui': [ 'Badge' ] },
		],
		[
			'star re-export',
			'export*from"@my-shared/ui";',
			{ '@my-shared/ui': [ '*' ] },
		],
		[ 'bare import', 'import"@my-shared/ui";', { '@my-shared/ui': [] } ],
		[
			'dynamic import',
			'const m=import("@my-shared/api");',
			{ '@my-shared/api': [ '*' ] },
		],
		[
			'id not in the set',
			'import{a}from"@my-shared/other";import"react";',
			{},
		],
		[
			'several statements',
			'import{Badge}from"@my-shared/ui";import{apiFetch as f}from"@my-shared/api";import{Card}from"@my-shared/ui";',
			{
				'@my-shared/api': [ 'apiFetch' ],
				'@my-shared/ui': [ 'Badge', 'Card' ],
			},
		],
	] )( '%s', ( _, source, expected ) => {
		expect( imports( source ) ).toEqual( expected );
	} );
} );

describe( 'readSharedModulesManifest', () => {
	let directory;

	afterEach( () => {
		if ( directory ) {
			rmSync( directory, { force: true, recursive: true } );
			directory = undefined;
		}
	} );

	function writePackage( wpSharedModules, exportList ) {
		directory = mkdtempSync(
			path.join( os.tmpdir(), 'wordpress-build-shared-modules-' )
		);
		writeFileSync(
			path.join( directory, 'package.json' ),
			JSON.stringify( { name: 'provider', wpSharedModules } )
		);
		if ( exportList ) {
			writeFileSync(
				path.join( directory, 'exports.json' ),
				JSON.stringify( exportList )
			);
		}
		return path.join( directory, 'package.json' );
	}

	it( 'maps each library to a module ID in the namespace', async () => {
		const manifest = await readSharedModulesManifest(
			writePackage(
				{
					namespace: 'my-shared',
					modules: { '@wordpress/ui': 'ui' },
					exports: 'exports.json',
				},
				{ ui: [ 'Button' ] }
			)
		);
		expect( manifest.modules ).toEqual( {
			'@wordpress/ui': '@my-shared/ui',
		} );
		expect( manifest.names ).toEqual( { '@my-shared/ui': 'ui' } );
		expect( manifest.exports ).toEqual( { ui: [ 'Button' ] } );
		expect( manifest.exportsPath ).toBe(
			path.join( directory, 'exports.json' )
		);
		expect( manifest.config.outdir ).toBe( 'build/shared-modules' );
	} );

	it( 'reads an export list that does not exist yet as empty', async () => {
		const manifest = await readSharedModulesManifest(
			writePackage( {
				namespace: 'my-shared',
				modules: { '@wordpress/ui': 'ui' },
				exports: 'exports.json',
			} )
		);
		expect( manifest.exports ).toEqual( {} );
	} );

	it.each( [ 'namespace', 'modules', 'exports' ] )(
		'requires %s',
		async ( key ) => {
			const config = {
				namespace: 'my-shared',
				modules: { '@wordpress/ui': 'ui' },
				exports: 'exports.json',
			};
			delete config[ key ];
			await expect(
				readSharedModulesManifest( writePackage( config ) )
			).rejects.toThrow( `wpSharedModules.${ key }` );
		}
	);
} );
