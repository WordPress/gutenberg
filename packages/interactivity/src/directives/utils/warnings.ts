/**
 * Warning helper functions shared across directives.
 */
import { warn } from '../../utils';

export const warnUniqueIdWithTwoHyphens = (
	prefix: string,
	suffix: string,
	uniqueId?: string
) => {
	if ( globalThis.SCRIPT_DEBUG ) {
		warn(
			`The usage of data-wp-${ prefix }--${ suffix }${
				uniqueId ? `--${ uniqueId }` : ''
			} (two hyphens for unique ID) is deprecated and will stop working in WordPress 7.1. Please use data-wp-${ prefix }${
				uniqueId ? `--${ suffix }---${ uniqueId }` : `---${ suffix }`
			} (three hyphens for unique ID) from now on.`
		);
	}
};

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
