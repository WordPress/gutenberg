import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { promotePackageToStable } from '../lib/promote-stable.ts';
import { validateFragment } from '../lib/validate.ts';

describe( 'promotePackageToStable', () => {
	it( 'rejects packages that are already at version >= 1.0.0', () => {
		const tmpDir = fs.mkdtempSync(
			path.join( os.tmpdir(), 'promote-test-' )
		);
		const pkgDir = path.join( tmpDir, 'packages', 'stable-pkg' );
		fs.mkdirSync( pkgDir, { recursive: true } );
		fs.writeFileSync(
			path.join( pkgDir, 'package.json' ),
			JSON.stringify( {
				name: '@wordpress/stable-pkg',
				version: '2.1.0',
			} )
		);
		fs.writeFileSync(
			path.join( tmpDir, '.changie.yaml' ),
			'changes_dir: .changes\nunreleased_dir: unreleased\nprojects:\n  - label: StablePkg\n    key: stable-pkg\n'
		);

		expect( () =>
			promotePackageToStable( {
				packageName: 'stable-pkg',
				pr: 12345,
				repoRoot: tmpDir,
			} )
		).toThrow( /must be < 1.0.0/ );

		fs.rmSync( tmpDir, { recursive: true, force: true } );
	} );

	it( 'creates a Stable Release fragment for 0.x packages configured with Changie', () => {
		const tmpDir = fs.mkdtempSync(
			path.join( os.tmpdir(), 'promote-test-' )
		);
		const pkgDir = path.join( tmpDir, 'packages', 'pre-pkg' );
		fs.mkdirSync( pkgDir, { recursive: true } );
		fs.writeFileSync(
			path.join( pkgDir, 'package.json' ),
			JSON.stringify( {
				name: '@wordpress/pre-pkg',
				version: '0.24.0',
			} )
		);
		fs.writeFileSync(
			path.join( tmpDir, '.changie.yaml' ),
			'changes_dir: .changes\nunreleased_dir: unreleased\nprojects:\n  - label: PrePkg\n    key: pre-pkg\n'
		);

		const result = promotePackageToStable( {
			packageName: 'pre-pkg',
			pr: 54321,
			body: 'Mark package as stable and production-ready.',
			repoRoot: tmpDir,
		} );

		expect( result.packageName ).toBe( 'pre-pkg' );
		expect( result.currentVersion ).toBe( '0.24.0' );
		expect( fs.existsSync( result.fragmentPath ) ).toBe( true );

		const content = fs.readFileSync( result.fragmentPath, 'utf8' );
		expect( content ).toContain( 'kind: Stable Release' );
		expect( content ).toContain( "PR: '54321'" );

		// Verify fragment passes validation even though Stable Release is not in .changie.yaml kinds
		const errors = validateFragment(
			result.fragmentPath,
			content,
			{ requirePr: '54321' },
			tmpDir
		);
		expect( errors ).toEqual( [] );

		fs.rmSync( tmpDir, { recursive: true, force: true } );
	} );
} );
