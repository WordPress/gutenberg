import 'vitest';

declare module 'vitest' {
	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	interface Matchers< T = any > {
		/**
		 * Ensure that `console.error` was called.
		 */
		toHaveErrored: () => void;

		/**
		 * Ensure that `console.error` was called with specific arguments.
		 */
		toHaveErroredWith: ( ...args: unknown[] ) => void;

		/**
		 * Ensure that `console.info` was called.
		 */
		toHaveInformed: () => void;

		/**
		 * Ensure that `console.info` was called with specific arguments.
		 */
		toHaveInformedWith: ( ...args: unknown[] ) => void;

		/**
		 * Ensure that `console.log` was called.
		 */
		toHaveLogged: () => void;

		/**
		 * Ensure that `console.log` was called with specific arguments.
		 */
		toHaveLoggedWith: ( ...args: unknown[] ) => void;

		/**
		 * Ensure that `console.warn` was called.
		 */
		toHaveWarned: () => void;

		/**
		 * Ensure that `console.warn` was called with specific arguments.
		 */
		toHaveWarnedWith: ( ...args: unknown[] ) => void;
	}
}
