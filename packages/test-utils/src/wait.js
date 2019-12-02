/**
 * External dependencies
 */
import { wait } from '@testing-library/react';

/**
 * When in need to wait for non-deterministic periods of time you can use `wait`
 * to wait for your expectations to pass. The `wait` function is a small
 * wrapper around the [`wait-for-expect`](https://github.com/TheBrainFamily/wait-for-expect)
 * module.
 *
 * @see https://testing-library.com/docs/dom-testing-library/api-async#wait
 * @see https://github.com/TheBrainFamily/wait-for-expect
 */
export default wait;
