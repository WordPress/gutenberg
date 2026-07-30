/**
 * External dependencies
 */
import '@testing-library/jest-dom/vitest';
// eslint-disable-next-line testing-library/no-manual-cleanup -- Vitest globals are disabled, so Testing Library cannot register cleanup automatically.
import { cleanup } from '@testing-library/react';
import { afterEach, expect } from 'vitest';

/**
 * Internal dependencies
 */
import './matchers/to-match-style-diff-snapshot.vitest';
import './matchers/to-be-positioned-popover.vitest';

// Run browser tests with the same development feature flags as the jsdom
// project. Browser-native platform APIs intentionally remain untouched.
// eslint-disable-next-line @wordpress/wp-global-usage
globalThis.SCRIPT_DEBUG = true;

globalThis.tinyMCEPreInit = {
	baseURL: 'about:blank',
};
globalThis.userSettings = { uid: 1 };

afterEach( cleanup );

expect.addSnapshotSerializer( {
	test( value ) {
		return (
			typeof value === 'string' && value.startsWith( 'Snapshot Diff:\n' )
		);
	},
	serialize( value ) {
		return value;
	},
} );
