import { describe, expect, it } from 'vitest';
import parseSpxMode from '../../../packages/env/lib/parse-spx-mode';

describe( 'Vitest Node repository setup', () => {
	it( 'exposes repository globals', () => {
		// eslint-disable-next-line @wordpress/wp-global-usage -- This compatibility test verifies the test-only global.
		expect( globalThis.IS_WORDPRESS_CORE ).toBe( true );
		// eslint-disable-next-line @wordpress/wp-global-usage -- This compatibility test verifies the test-only global.
		expect( globalThis.IS_GUTENBERG_PLUGIN ).toBe( true );
		// eslint-disable-next-line @wordpress/wp-global-usage -- This compatibility test verifies the test-only global.
		expect( globalThis.SCRIPT_DEBUG ).toBe( true );
	} );

	it( 'loads CommonJS repository modules', () => {
		expect( parseSpxMode() ).toBe( 'off' );
	} );
} );
