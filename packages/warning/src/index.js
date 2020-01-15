function isDev() {
	return (
		typeof process !== 'undefined' &&
		process.env &&
		process.env.NODE_ENV !== 'production'
	);
}

/**
 * Shows a warning with `message` if `condition` passes and environment is not `production`.
 *
 * @param {boolean} condition Whether the warning will be triggered or not.
 * @param {string} message Message to show in the warning.
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
export default function warning( condition, message ) {
	if ( ! isDev() ) {
		return;
	}

	if ( ! condition ) {
		return;
	}

	// eslint-disable-next-line no-console
	console.warn( message );

	// Throwing an error and catching it immediately to improve debugging
	// A consumer can use 'pause on caught exceptions'
	// https://github.com/facebook/react/issues/4216
	try {
		throw Error( message );
	} catch ( x ) {
		// do nothing
	}
}
