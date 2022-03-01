/**
 * External dependencies
 */
import { selectors } from '@playwright/test';
import { selectorScript } from 'role-selector/playwright-test';

// Register role selector.
selectors.register( 'role', selectorScript, { contentScript: true } );

export { PageUtils } from './page';
export { RequestUtils } from './request';
export { test, expect } from './test';
