import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { previewUnreleasedFragments } from '../lib/preview.ts';

const REPO_ROOT = path.resolve( import.meta.dirname, '../../..' );

describe( 'previewUnreleasedFragments', () => {
	it( 'handles package with no fragments', () => {
		const preview = previewUnreleasedFragments(
			'non-existent-pkg',
			REPO_ROOT
		);
		expect( preview ).toContain( '_No unreleased fragments found' );
	} );

	it( 'renders unreleased fragments for configured package using Changie batch dry-run', () => {
		const preview = previewUnreleasedFragments( 'ui', REPO_ROOT );
		expect( preview ).toContain( '## Unreleased' );
		expect( preview ).toContain( '### Breaking Changes' );
		expect( preview ).not.toContain( '0-unreleased' );
		expect( preview ).not.toContain( '## Unreleased (@wordpress/ui)' );
	} );
} );
