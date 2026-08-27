import '@testing-library/jest-dom/vitest';
import { cleanup } from '@testing-library/react';
import { afterEach, expect } from 'vitest';
import './matchers/to-match-diff-snapshot.vitest';
import './matchers/to-be-positioned-popover.vitest';

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
