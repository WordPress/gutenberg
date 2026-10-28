import path from 'node:path';
import fs from 'node:fs';
import os from 'node:os';
import { afterEach, describe, expect, it } from 'vitest';
import yaml from 'js-yaml';
import { validateAllFragments, validateFragment } from '../lib/validate.ts';
import { loadUnreleasedFragments } from '../lib/preview.ts';
import { run as addFragment } from '../bin/add.mts';

const validFragment = {
	project: 'components',
	kind: 'Bug Fixes',
	body: 'Fixed a button alignment issue',
	custom: { PR: '12345' },
};
const directories: string[] = [];

afterEach( () => {
	for ( const directory of directories.splice( 0 ) ) {
		fs.rmSync( directory, { recursive: true, force: true } );
	}
} );

describe( 'validateFragment', () => {
	const repoRoot = path.resolve( import.meta.dirname, '../../..' );

	it( 'accepts valid fragment', () => {
		const yamlContent = `project: components
kind: Bug Fixes
body: Fixed a button alignment issue
time: 2026-10-14T00:00:00Z
custom:
  PR: "12345"
`;
		const errors = validateFragment(
			'sample.yaml',
			yamlContent,
			{ pr: '12345' },
			repoRoot
		);
		expect( errors ).toEqual( [] );
	} );

	it( 'rejects fragment missing required fields', () => {
		const yamlContent = `kind: Bug Fixes
body: Fixed a button alignment issue
`;
		const errors = validateFragment(
			'sample.yaml',
			yamlContent,
			{},
			repoRoot
		);
		expect( errors ).toContain(
			"sample.yaml: missing required 'project' property."
		);
	} );

	it( 'enforces requirePr match', () => {
		const yamlContent = `project: components
kind: Bug Fixes
body: Fixed a button alignment issue
custom:
  PR: "99999"
`;
		const errors = validateFragment(
			'sample.yaml',
			yamlContent,
			{ requirePr: '12345' },
			repoRoot
		);
		expect( errors.length ).toBeGreaterThan( 0 );
		expect( errors[ 0 ] ).toContain( 'does not match required PR #12345' );
	} );

	it.each( [ '12345', 12345 ] )(
		'accepts PR number %j without requirePr',
		( pr ) => {
			expect(
				validateFragment(
					'sample.yaml',
					yaml.safeDump( { ...validFragment, custom: { PR: pr } } ),
					{},
					repoRoot
				)
			).toEqual( [] );
		}
	);

	it.each(
		[ null, '', 'abc', '123abc', 0, -1, 1.5, '1.5', true, [], {} ].map(
			( pr ) => ( { pr } )
		)
	)( 'rejects invalid PR number $pr without requirePr', ( { pr } ) => {
		expect(
			validateFragment(
				'sample.yaml',
				yaml.safeDump( { ...validFragment, custom: { PR: pr } } ),
				{},
				repoRoot
			)
		).toContain(
			'sample.yaml: custom.PR must be a positive integer. Add the Gutenberg pull request number.'
		);
	} );
} );

describe( 'shared fragment validation entry points', () => {
	it.each( [ '1.0.0', '2.1.0', '1.0.0-next.0' ] )(
		'rejects Stable Release fragments for already-stable packages at %s',
		( version ) => {
			const root = fs.mkdtempSync(
				path.join( os.tmpdir(), 'fragment-promotion-' )
			);
			directories.push( root );
			fs.copyFileSync(
				path.resolve( import.meta.dirname, '../../../.changie.yaml' ),
				path.join( root, '.changie.yaml' )
			);
			const pkgDir = path.join( root, 'packages', 'ui' );
			fs.mkdirSync( pkgDir, { recursive: true } );
			fs.writeFileSync(
				path.join( pkgDir, 'package.json' ),
				JSON.stringify( { version } )
			);
			expect(
				addFragment(
					[
						'-j',
						'ui',
						'-k',
						'Stable Release',
						'-b',
						'Mark package as stable.',
						'-m',
						'PR=85369',
						'--interactive=false',
					],
					root
				)
			).toBe( 1 );
			expect( validateAllFragments( {}, root ) ).toEqual( [
				expect.stringContaining(
					'Stable Release requires a 0.x package version'
				),
			] );
			expect( console ).toHaveErroredWith(
				expect.stringContaining(
					'Stable Release requires a 0.x package version'
				)
			);
		}
	);

	it( 'allows older PRs and requires a matching fragment for the target package', () => {
		const root = fs.mkdtempSync(
			path.join( os.tmpdir(), 'fragment-validation-' )
		);
		directories.push( root );
		fs.copyFileSync(
			path.resolve( import.meta.dirname, '../../../.changie.yaml' ),
			path.join( root, '.changie.yaml' )
		);
		const unreleased = path.join( root, '.changes', 'unreleased' );
		fs.mkdirSync( unreleased, { recursive: true } );
		fs.writeFileSync(
			path.join( unreleased, 'older.yaml' ),
			yaml.safeDump( validFragment )
		);
		fs.writeFileSync(
			path.join( unreleased, 'current.yaml' ),
			yaml.safeDump( { ...validFragment, custom: { PR: '67890' } } )
		);
		expect(
			validateAllFragments(
				{ requirePr: '67890', project: 'components' },
				root
			)
		).toEqual( [] );
		expect(
			validateAllFragments( { requirePr: '67890', project: 'ui' }, root )
		).toEqual( [
			"No unreleased fragment found citing required PR #67890 for project 'ui'",
		] );
	} );

	it.each( [ 'body: [', yaml.safeDump( { ...validFragment, custom: {} } ) ] )(
		'reports invalid fragments in both CI validation and preview: %s',
		( content ) => {
			const root = fs.mkdtempSync(
				path.join( os.tmpdir(), 'fragment-validation-' )
			);
			directories.push( root );
			fs.copyFileSync(
				path.resolve( import.meta.dirname, '../../../.changie.yaml' ),
				path.join( root, '.changie.yaml' )
			);
			const unreleased = path.join( root, '.changes', 'unreleased' );
			fs.mkdirSync( unreleased, { recursive: true } );
			fs.writeFileSync(
				path.join( unreleased, 'invalid.yaml' ),
				content
			);
			const errors = validateAllFragments(
				{ requirePr: '12345', project: 'components' },
				root
			);
			expect( errors[ 0 ] ).toContain( 'invalid.yaml:' );
			expect( errors[ 1 ] ).toContain( 'No unreleased fragment found' );
			expect( () => loadUnreleasedFragments( root ) ).toThrow(
				errors[ 0 ]
			);
		}
	);

	it( 'rejects authored fragments that omit the PR even when Changie config permits it', () => {
		const root = fs.mkdtempSync(
			path.join( os.tmpdir(), 'fragment-authoring-' )
		);
		directories.push( root );
		fs.writeFileSync(
			path.join( root, '.changie.yaml' ),
			yaml.safeDump( {
				changesDir: '.changes',
				unreleasedDir: 'unreleased',
				projects: [ { key: 'components', label: 'Components' } ],
				kinds: [ { label: 'Bug Fixes' } ],
			} )
		);
		expect(
			addFragment(
				[
					'-j',
					'components',
					'-k',
					'Bug Fixes',
					'-b',
					'Fix alignment',
					'--interactive=false',
				],
				root
			)
		).toBe( 1 );
		const files = fs.readdirSync(
			path.join( root, '.changes', 'unreleased' )
		);
		expect( files ).toHaveLength( 1 );
		expect( validateAllFragments( {}, root ) ).toEqual( [
			expect.stringContaining( 'custom.PR must be a positive integer' ),
		] );
		expect( console ).toHaveErroredWith(
			expect.stringContaining( 'custom.PR must be a positive integer' )
		);
	} );
} );
