import 'vitest';

declare module 'vitest' {
	interface Matchers<
		R extends void | Promise< void > = void | Promise< void >,
		// eslint-disable-next-line @typescript-eslint/no-unused-vars -- Match Vitest's generic interface.
		T = unknown,
	> {
		/**
		 * Ensure that `console.error` was called.
		 */
		toHaveErrored: () => R;

		/**
		 * Ensure that `console.error` was called with specific arguments.
		 */
		toHaveErroredWith: ( ...args: unknown[] ) => R;

		/**
		 * Ensure that `console.info` was called.
		 */
		toHaveInformed: () => R;

		/**
		 * Ensure that `console.info` was called with specific arguments.
		 */
		toHaveInformedWith: ( ...args: unknown[] ) => R;

		/**
		 * Ensure that `console.log` was called.
		 */
		toHaveLogged: () => R;

		/**
		 * Ensure that `console.log` was called with specific arguments.
		 */
		toHaveLoggedWith: ( ...args: unknown[] ) => R;

		/**
		 * Ensure that `console.warn` was called.
		 */
		toHaveWarned: () => R;

		/**
		 * Ensure that `console.warn` was called with specific arguments.
		 */
		toHaveWarnedWith: ( ...args: unknown[] ) => R;
	}
}
