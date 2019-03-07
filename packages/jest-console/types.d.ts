/// <reference types="jest" />

declare namespace jest {

    interface Matchers<R> {

        /**
         * Ensure that `console.error` function was called.
         */
        toHaveErrored(): R;

        /**
         * Ensure that `console.error` function was called with specific arguments.
         */
        toHaveErroredWith(...args: any[]): R;

        /**
         * Ensure that `console.info` function was called.
         */
        toHaveInformed(): R;

        /**
         * Ensure that `console.info` function was called with specific arguments.
         */
        toHaveInformedWith(...args: any[]): R;

        /**
         * Ensure that `console.log` function was called.
         */
        toHaveLogged(): R;

        /**
         * Ensure that `console.log` function was called with specific arguments.
         */
        toHaveLoggedWith(...args: any[]): R;

        /**
         * Ensure that `console.warn` function was called.
         */
        toHaveWarned(): R;

        /**
         * Ensure that `console.warn` function was called with specific arguments.
         */
        toHaveWarnedWith(...args: any[]): R;

    }

}
