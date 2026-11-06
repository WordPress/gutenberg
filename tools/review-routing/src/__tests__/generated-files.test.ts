import { describe, expect, it } from 'vitest';
import { findGeneratedFiles } from '../generated-files.ts';

describe( 'findGeneratedFiles', () => {
	it( 'finds the paths that the repository marks as generated', () => {
		expect(
			findGeneratedFiles( [
				'package-lock.json',
				'packages/theme/src/prebuilt/ts/color-tokens.ts',
				'packages/ui/src/button/button.tsx',
				'a path that does not exist.ts',
			] )
		).toEqual(
			new Set( [
				'package-lock.json',
				'packages/theme/src/prebuilt/ts/color-tokens.ts',
			] )
		);
	} );

	it( 'returns nothing for no paths', () => {
		expect( findGeneratedFiles( [] ) ).toEqual( new Set() );
	} );
} );
