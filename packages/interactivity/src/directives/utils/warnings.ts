import { warn } from '../../utils';

/**
 * Warns that suffixes are not supported for a lifecycle directive.
 *
 * @param prefix Directive name.
 * @param suffix Unsupported suffix.
 */
export const warnSuffixNotSupported = (
	prefix: string,
	suffix: string
): void => {
	if ( globalThis.SCRIPT_DEBUG ) {
		warn(
			`Suffixes are not supported for the data-wp-${ prefix } directive. Ignoring the directive with suffix "${ suffix }".`
		);
	}
};

// Warns that unique IDs are not supported for a given directive.
export const warnUniqueIdNotSupported = (
	prefix: string,
	uniqueId: string
) => {
	if ( globalThis.SCRIPT_DEBUG ) {
		warn(
			`Unique IDs are not supported for the data-wp-${ prefix } directive. Ignoring the directive with unique ID "${ uniqueId }".`
		);
	}
};

// Warns about a deprecated async directive name and suggests the replacement.
// `withSyncEvent()` should be used for synchronous event access.
export const warnWithSyncEvent = (
	wrongPrefix: string,
	rightPrefix: string
) => {
	if ( globalThis.SCRIPT_DEBUG ) {
		warn(
			`The usage of data-wp-${ wrongPrefix } is deprecated and will stop working in WordPress 7.0. Please, use data-wp-${ rightPrefix } with the withSyncEvent() helper from now on.`
		);
	}
};
