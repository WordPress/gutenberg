import path from 'node:path';
import { describe, expect, it } from 'vitest';
import {
	loadChangieConfig,
	getChangieProjects,
	isChangiePackage,
} from '../lib/config.ts';

describe( 'Changie configuration loader', () => {
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
