import * as matchers from '@testing-library/jest-dom/matchers';
// eslint-disable-next-line testing-library/no-manual-cleanup -- Vitest globals are disabled, so Testing Library cannot register cleanup automatically.
import { cleanup } from '@testing-library/react';
import { afterAll, afterEach, beforeAll, expect } from 'vitest';
import './matchers/to-match-diff-snapshot.vitest';
import './matchers/to-be-positioned-popover.vitest';

let previousIsReactActEnvironment;

expect.extend( matchers );

beforeAll( () => {
	previousIsReactActEnvironment = globalThis.IS_REACT_ACT_ENVIRONMENT;
	globalThis.IS_REACT_ACT_ENVIRONMENT = true;
} );

afterAll( () => {
	globalThis.IS_REACT_ACT_ENVIRONMENT = previousIsReactActEnvironment;
} );

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
