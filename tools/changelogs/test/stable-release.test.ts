import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import yaml from 'js-yaml';
import { run as addFragment } from '../bin/add.mts';
import { validateFragment } from '../lib/validate.ts';
import { execChangie } from '../lib/release.ts';
import { previewUnreleasedFragments } from '../lib/preview.ts';
import { loadChangieConfig } from '../lib/config.ts';

describe( 'Stable Release fragments', () => {
	it( 'renders the promotion note and lists Stable Release last', () => {
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
			yaml.safeDump( {
				...loadChangieConfig(
					path.resolve( import.meta.dirname, '../../..' )
				),
				projects: [
					{
						label: 'PrePkg',
						key: 'pre-pkg',
						changelog: 'packages/pre-pkg/CHANGELOG.md',
					},
				],
			} )
		);

		expect(
			addFragment(
				[
					'-j',
					'pre-pkg',
					'-k',
					'Stable Release',
					'-m',
					'PR=54321',
					'-b',
					'Mark package as stable and production-ready.',
					'--interactive=false',
				],
				tmpDir
			)
		).toBe( 0 );
		const unreleasedDir = path.join( tmpDir, '.changes', 'unreleased' );
		const fragments = fs.readdirSync( unreleasedDir );
		expect( fragments ).toHaveLength( 1 );
		const fragmentPath = path.join( unreleasedDir, fragments[ 0 ] );
		const content = fs.readFileSync( fragmentPath, 'utf8' );
		expect( content ).toContain( 'kind: Stable Release' );

		// Verify the generated fragment passes the same validation used by authoring and CI.
		const errors = validateFragment(
			fragmentPath,
			content,
			{ requirePr: '54321' },
			tmpDir
		);
		expect( errors ).toEqual( [] );
		fs.writeFileSync(
			path.join( tmpDir, '.changes', 'unreleased', 'breaking.yaml' ),
			yaml.safeDump( {
				project: 'pre-pkg',
				kind: 'Breaking Changes',
				body: 'Update the API.',
				time: new Date().toISOString(),
				custom: { PR: '54321' },
			} )
		);
		const note = 'Note: This package is now a stable release.';
		const preview = previewUnreleasedFragments( 'pre-pkg', tmpDir );
		expect( preview ).toContain(
			`## Unreleased\n\n${ note }\n\n### Breaking Changes`
		);
		for ( const version of [ '1.0.0-next.0', '1.0.0' ] ) {
			const compiled = execChangie(
				[ 'batch', version, '--project', 'pre-pkg', '--dry-run' ],
				tmpDir
			);
			expect( compiled.stderr ).toBe( '' );
			expect( compiled.status ).toBe( 0 );
			expect( compiled.stdout ).toContain( `## ${ version } (` );
			expect( compiled.stdout.split( note ) ).toHaveLength( 2 );
			expect( compiled.stdout ).toContain(
				`\n\n${ note }\n\n### Breaking Changes`
			);
			expect( compiled.stdout ).toMatch(
				/### Stable Release\n\n-   Mark package as stable and production-ready\. \(\[#54321\].*\)\.\s*$/
			);
		}
		const batch = execChangie(
			[ 'batch', '1.0.0', '--project', 'pre-pkg' ],
			tmpDir
		);
		expect( batch.stderr ).toBe( '' );
		expect( batch.status ).toBe( 0 );
		const released = fs.readFileSync(
			path.join( tmpDir, '.changes', 'pre-pkg', '1.0.0.md' ),
			'utf8'
		);
		expect( released ).toContain( note );
		expect( released ).toContain( '### Stable Release' );
		expect( fs.existsSync( fragmentPath ) ).toBe( false );

		fs.rmSync( tmpDir, { recursive: true, force: true } );
	} );
} );
