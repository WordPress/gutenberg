import { warn } from '../../utils';

// Warns that suffixes are not supported for a given directive.
export const warnSuffixNotSupported = ( prefix: string, suffix: string ) => {
	if ( globalThis.SCRIPT_DEBUG ) {
		warn(
			`Suffixes for the data-wp-${ prefix } directive are not supported. Ignoring the directive with suffix "${ suffix }".`
		);
	}
};

// Warns that an event name contains `--`, which is most likely a leftover of
// the removed two-hyphen unique ID syntax.
export const warnEventNameWithTwoHyphens = (
	prefix: string,
	eventName: string
) => {
	if ( globalThis.SCRIPT_DEBUG ) {
		const [ event, ...rest ] = eventName.split( '--' );
		warn(
			`The data-wp-${ prefix }--${ eventName } directive listens for an event named "${ eventName }". Two-hyphen unique IDs are no longer supported. If you meant to add a unique ID, please use data-wp-${ prefix }--${ event }---${ rest.join(
				'--'
			) } instead.`
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
