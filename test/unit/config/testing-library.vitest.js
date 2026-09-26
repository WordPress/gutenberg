/*
 * The `/vitest` entry point resolves `vitest` from jest-dom's own location,
 * which non-hoisting installs do not provide. Extend the matchers manually.
 */
import * as jestDomMatchers from '@testing-library/jest-dom/matchers';
// eslint-disable-next-line testing-library/no-manual-cleanup -- Vitest globals are disabled, so Testing Library cannot register cleanup automatically.
import { cleanup } from '@testing-library/react';
import { afterAll, afterEach, beforeAll, expect } from 'vitest';
import './matchers/to-match-diff-snapshot.vitest';
import './matchers/to-be-positioned-popover.vitest';

expect.extend( jestDomMatchers );

let previousIsReactActEnvironment;

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
