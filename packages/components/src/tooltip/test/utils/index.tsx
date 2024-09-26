/**
 * External dependencies
 */
import { click, press } from '@ariakit/test';

// TODO: may need to be tested with Playwright; further context:
// https://github.com/WordPress/gutenberg/pull/52133#issuecomment-1613691258
// below workaround ensures tooltip is umounted after each test to prevent leaking
// similarly to ariakit tooltip tests: https://github.com/ariakit/ariakit/blob/249d376e41115e6d4ceba244e231a95fa457bd04/examples/tooltip/test.ts#L12-L14

/**
 * Ensures the async behaviors and animations in tooltip complete
 * to avoid leaking into other tests
 *
 */
export default async function cleanupTooltip() {
	await press.Tab();
	await press.Tab();
	await click( document.body );
}
