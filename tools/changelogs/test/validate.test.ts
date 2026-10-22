import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { validateFragment } from '../lib/validate.ts';

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
} );
