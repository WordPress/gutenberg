// Definitions originally written by Damien Sorel <https://github.com/mistic100> under MIT license.
// https://github.com/DefinitelyTyped/DefinitelyTyped/blob/f0b72c12f6b561e4342dc8a1cf87432d2ad40ae7/types/wordpress__jest-console/index.d.ts

declare namespace jest {
	interface Matchers< R, T > {
		/**
		 * Ensure that `console.error` function was called.
		 */
		toHaveErrored(): R;

		/**
		 * Ensure that `console.error` function was called with specific arguments.
		 */
		toHaveErroredWith( ...args: unknown[] ): R;

		/**
		 * Ensure that `console.info` function was called.
		 */
		toHaveInformed(): R;

		/**
		 * Ensure that `console.info` function was called with specific arguments.
		 */
		toHaveInformedWith( ...args: unknown[] ): R;

		/**
		 * Ensure that `console.log` function was called.
		 */
		toHaveLogged(): R;

		/**
		 * Ensure that `console.log` function was called with specific arguments.
		 */
		toHaveLoggedWith( ...args: unknown[] ): R;

		/**
		 * Ensure that `console.warn` function was called.
		 */
		toHaveWarned(): R;

		/**
		 * Ensure that `console.warn` function was called with specific arguments.
		 */
		toHaveWarnedWith( ...args: unknown[] ): R;
	}
}
