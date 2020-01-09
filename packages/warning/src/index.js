function isDev() {
	return (
		typeof process !== 'undefined' &&
		process.env &&
		process.env.NODE_ENV !== 'production'
	);
}

/**
 * Shows a warning with `messages` if `condition` passes and environment is not `production`.
 *
 * @param {boolean} condition Whether the warning will be triggered or not.
 * @param {string[]} messages Message(s) to show in the warning.
 *
 * @example
 * ```js
 * import warning from '@wordpress/warning';
 *
 * function MyComponent( props ) {
 *   warning( ! props.title, '`props.title` was not passed' );
 *   ...
 * }
 * ```
 */
export default function warning( condition, ...messages ) {
	if ( isDev() ) {
		if ( ! condition ) {
			return;
		}

		const text = messages.join( '\n' );

		// eslint-disable-next-line no-console
		console.warn( text );

		// Throwing an error and catching it immediately to improve debugging
		// A consumer can use 'pause on caught exceptions'
		// https://github.com/facebook/react/issues/4216
		try {
			throw Error( text );
		} catch ( x ) {
			// do nothing
		}
	}
}
