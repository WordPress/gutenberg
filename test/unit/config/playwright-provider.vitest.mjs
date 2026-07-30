/**
 * Node dependencies
 */
import { createHash } from 'node:crypto';

/**
 * External dependencies
 */
import { playwright } from '@vitest/browser-playwright';

const STOP_TRACE_COMMAND = '__vitest_stopChunkTrace';
const MAX_TRACE_NAME_LENGTH = 180;

// Vitest 4.1.10 derives trace filenames from the complete nested test name,
// which can exceed the filesystem's per-component limit. Preserve the full
// test identity and shorten only the trace artifact name until Vitest bounds it.
export function shortenTraceName( name ) {
	if ( name.length <= MAX_TRACE_NAME_LENGTH ) {
		return name;
	}

	const hash = createHash( 'sha256' )
		.update( name )
		.digest( 'hex' )
		.slice( 0, 12 );
	const prefixLength = MAX_TRACE_NAME_LENGTH - hash.length - 1;

	return `${ name.slice( 0, prefixLength ) }-${ hash }`;
}

export function withTraceSafeNames( providerOption ) {
	return {
		...providerOption,
		providerFactory( project ) {
			const originalRegisterCommand = project.browser.registerCommand;

			project.browser.registerCommand = function ( name, command ) {
				if ( name !== STOP_TRACE_COMMAND ) {
					return originalRegisterCommand.call( this, name, command );
				}

				return originalRegisterCommand.call(
					this,
					name,
					( context, payload ) =>
						command( context, {
							...payload,
							name: shortenTraceName( payload.name ),
						} )
				);
			};

			try {
				return providerOption.providerFactory( project );
			} finally {
				project.browser.registerCommand = originalRegisterCommand;
			}
		},
	};
}

export function gutenbergPlaywright( options ) {
	return withTraceSafeNames( playwright( options ) );
}
