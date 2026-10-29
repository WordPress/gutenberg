import path from 'node:path';
import fs from 'node:fs';
import os from 'node:os';
import { describe, expect, it } from 'vitest';
import {
	loadChangieConfig,
	getChangieProjects,
	isChangiePackage,
	validateChangieProjects,
} from '../lib/config.ts';
import { batchChangiePackage } from '../lib/release.ts';

describe( 'Changie configuration loader', () => {
	it.each( [
		undefined,
		'',
		'packages/other/CHANGELOG.md',
		'packages/ui/CHANGELOG.md',
	] )(
		'rejects missing or incorrect project changelog destinations before batching: %s',
		( changelog ) => {
			const root = fs.mkdtempSync(
				path.join( os.tmpdir(), 'changie-destination-' )
			);
			try {
				fs.writeFileSync(
					path.join( root, '.changie.yaml' ),
					JSON.stringify( {
						projects: [ { key: 'ui', label: 'UI', changelog } ],
					} )
				);
				expect( () =>
					batchChangiePackage( 'ui', '1.0.0', root )
				).toThrow( /.changie.yaml:.*(changelog|destination)/ );
				expect( fs.existsSync( path.join( root, '.changes' ) ) ).toBe(
					false
				);
			} finally {
				fs.rmSync( root, { recursive: true, force: true } );
			}
		}
	);

	it( 'preserves release inputs when any project destination is invalid', () => {
		const root = fs.mkdtempSync(
			path.join( os.tmpdir(), 'changie-preflight-' )
		);
		try {
			const pkgDir = path.join( root, 'packages', 'ui' );
			const unreleased = path.join( root, '.changes', 'unreleased' );
			fs.mkdirSync( pkgDir, { recursive: true } );
			fs.mkdirSync( unreleased, { recursive: true } );
			const changelog = '## 0.25.0\n';
			const fragment =
				'project: ui\nkind: Bug Fixes\nbody: Fix alignment\ntime: 2026-10-29T00:00:00Z\ncustom:\n  PR: "85369"\n';
			fs.writeFileSync( path.join( pkgDir, 'CHANGELOG.md' ), changelog );
			fs.writeFileSync( path.join( unreleased, 'entry.yaml' ), fragment );
			fs.writeFileSync(
				path.join( root, '.changie.yaml' ),
				JSON.stringify( {
					projects: [
						{
							key: 'ui',
							label: 'UI',
							changelog: 'packages/ui/CHANGELOG.md',
						},
						{ key: 'other', label: 'Other' },
					],
				} )
			);
			expect( () => batchChangiePackage( 'ui', '0.25.1', root ) ).toThrow(
				/project 'other'.*changelog/
			);
			expect(
				fs.readFileSync( path.join( unreleased, 'entry.yaml' ), 'utf8' )
			).toBe( fragment );
			expect(
				fs.readFileSync( path.join( pkgDir, 'CHANGELOG.md' ), 'utf8' )
			).toBe( changelog );
			expect( fs.readdirSync( path.join( root, '.changes' ) ) ).toEqual( [
				'unreleased',
			] );
		} finally {
			fs.rmSync( root, { recursive: true, force: true } );
		}
	} );

	it( 'accepts valid project destinations', () => {
		expect( () =>
			validateChangieProjects(
				path.resolve( import.meta.dirname, '../../..' )
			)
		).not.toThrow();
	} );
	const repoRoot = path.resolve( import.meta.dirname, '../../..' );

	it( 'loads valid .changie.yaml config', () => {
		const config = loadChangieConfig( repoRoot );
		expect( config.changesDir ).toBe( '.changes' );
		expect( config.unreleasedDir ).toBe( 'unreleased' );
		expect( Array.isArray( config.kinds ) ).toBe( true );
		expect( ( config.kinds || [] ).map( ( k ) => k.label ) ).toContain(
			'Bug Fixes'
		);
	} );

	it( 'returns list of projects', () => {
		const projects = getChangieProjects( repoRoot );
		expect( Array.isArray( projects ) ).toBe( true );
	} );

	it( 'correctly identifies opted-in packages', () => {
		expect( isChangiePackage( 'not-a-real-package', repoRoot ) ).toBe(
			false
		);
		expect(
			isChangiePackage( '@wordpress/not-a-real-package', repoRoot )
		).toBe( false );
	} );
} );
