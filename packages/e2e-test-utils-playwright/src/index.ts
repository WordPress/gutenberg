/**
 * External dependencies
 */
import { selectors } from '@playwright/test';
import { selectorScript } from 'role-selector/playwright-test';

// Register role selector.
// Replace this with the native role engine when it's ready.
selectors.register( 'role', selectorScript, { contentScript: true } );

export { Admin } from './admin';
export { Editor } from './editor';
export { PageUtils } from './page-utils';
export { RequestUtils } from './request-utils';
export { test, expect } from './test';
