/**
 * External dependencies
 */
import { createSerializer as createEmotionSerializer } from '@emotion/jest';
import '@testing-library/jest-dom/vitest';
// eslint-disable-next-line testing-library/no-manual-cleanup -- Vitest globals are disabled, so Testing Library cannot register cleanup automatically.
import { cleanup } from '@testing-library/react';
import { afterEach, expect } from 'vitest';

/**
 * Internal dependencies
 */
import './matchers/to-match-diff-snapshot.vitest';
import './matchers/to-match-style-diff-snapshot.vitest';
import './matchers/to-be-positioned-popover.vitest';
import { createClassNameReplacer } from './emotion-serializer.vitest';

afterEach( cleanup );

expect.addSnapshotSerializer(
	createEmotionSerializer( {
		classNameReplacer: createClassNameReplacer(),
	} )
);
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
