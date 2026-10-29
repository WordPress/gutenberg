// In a file of its own, so that no other test has built a ramp before: an
// accent ramp must build on a prebuilt background ramp without one.

import { describe, expect, it } from 'vitest';
import { buildAccentRamp } from '..';
import { DEFAULT_RAMPS } from '../lib/default-ramps';

describe( 'buildAccentRamp', () => {
	it( 'builds on a prebuilt background ramp', () => {
		expect(
			buildAccentRamp( '#cf4339', DEFAULT_RAMPS.background ).ramp
		).toHaveProperty( 'bgFill1' );
	} );
} );
