import { describe, expect, it } from 'vitest';
import { previewUnreleasedFragments } from '../lib/preview.ts';

describe( 'previewUnreleasedFragments', () => {
	it( 'handles package with no fragments', () => {
		const preview = previewUnreleasedFragments( 'non-existent-pkg' );
		expect( preview ).toContain( '_No unreleased fragments found' );
	} );
} );
