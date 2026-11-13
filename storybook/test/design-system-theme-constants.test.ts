import { describe, expect, it } from 'vitest';
import { contrastLevels } from '@wordpress/theme';
import {
	CONTRAST_LEVELS,
	normalizeContrast,
} from '../addons/design-system-theme/constants';

describe( 'design system theme constants', () => {
	it( 'mirrors the contrast levels exported by @wordpress/theme', () => {
		expect( CONTRAST_LEVELS ).toEqual( contrastLevels );
	} );

	it( 'normalizes the contrast global', () => {
		expect( normalizeContrast( '0.44' ) ).toBe( 0.4 );
		expect( normalizeContrast( '-3' ) ).toBe( -1 );
		expect( normalizeContrast( undefined ) ).toBe( 0 );
		expect( normalizeContrast( 'high' ) ).toBe( 0 );
	} );
} );
