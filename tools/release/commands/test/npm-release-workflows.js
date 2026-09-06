import { readFile } from 'node:fs/promises';
import { describe, expect, it } from 'vitest';

describe( 'npm release workflow concurrency', () => {
	it( 'serializes plugin RC1 and manual latest releases on wp/latest', async () => {
		const [ pluginWorkflow, packageWorkflow ] = await Promise.all( [
			readFile( '.github/workflows/build-plugin-zip.yml', 'utf8' ),
			readFile( '.github/workflows/publish-npm-packages.yml', 'utf8' ),
		] );

		expect( pluginWorkflow ).toContain(
			"github.event_name == 'workflow_dispatch' && 'npm-publish-wp-latest'"
		);
		expect( packageWorkflow ).toContain( 'group: npm-publish-wp-${{' );
	} );
} );
