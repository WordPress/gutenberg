/**
 * Debug logging utilities for vips package (web worker context).
 *
 * Enable debug logging by setting self.VIPS_DEBUG = true
 * in the worker context or window.VIPS_DEBUG = true in main thread.
 */

declare const self: typeof globalThis & {
	VIPS_DEBUG?: boolean;
};

const PREFIX = '[vips-worker]';

function isDebugEnabled(): boolean {
	// Check both self (worker) and globalThis (main thread)
	return (
		( typeof self !== 'undefined' && self.VIPS_DEBUG === true ) ||
		( typeof globalThis !== 'undefined' &&
			( globalThis as typeof self ).VIPS_DEBUG === true )
	);
}

function formatValue( value: unknown ): unknown {
	if ( value instanceof ArrayBuffer ) {
		return `ArrayBuffer(${ ( value.byteLength / 1024 ).toFixed( 2 ) }KB)`;
	}
	return value;
}

function formatArgs( args: unknown[] ): unknown[] {
	return args.map( formatValue );
}

export const debug = {
	log: ( ...args: unknown[] ) => {
		if ( ! isDebugEnabled() ) {
			return;
		}
		// eslint-disable-next-line no-console
		console.log( PREFIX, ...formatArgs( args ) );
	},
	info: ( ...args: unknown[] ) => {
		if ( ! isDebugEnabled() ) {
			return;
		}
		// eslint-disable-next-line no-console
		console.info( PREFIX, ...formatArgs( args ) );
	},
	warn: ( ...args: unknown[] ) => {
		if ( ! isDebugEnabled() ) {
			return;
		}
		// eslint-disable-next-line no-console
		console.warn( PREFIX, ...formatArgs( args ) );
	},
	error: ( ...args: unknown[] ) => {
		if ( ! isDebugEnabled() ) {
			return;
		}
		// eslint-disable-next-line no-console
		console.error( PREFIX, ...formatArgs( args ) );
	},
	group: ( label: string ) => {
		if ( ! isDebugEnabled() ) {
			return;
		}
		// eslint-disable-next-line no-console
		console.group( `${ PREFIX } ${ label }` );
	},
	groupEnd: () => {
		if ( ! isDebugEnabled() ) {
			return;
		}
		// eslint-disable-next-line no-console
		console.groupEnd();
	},
	time: ( label: string ) => {
		if ( ! isDebugEnabled() ) {
			return;
		}
		// eslint-disable-next-line no-console
		console.time( `${ PREFIX } ${ label }` );
	},
	timeEnd: ( label: string ) => {
		if ( ! isDebugEnabled() ) {
			return;
		}
		// eslint-disable-next-line no-console
		console.timeEnd( `${ PREFIX } ${ label }` );
	},
};
