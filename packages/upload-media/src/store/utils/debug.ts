/**
 * Debug logging utilities for upload-media package.
 *
 * Debug logging is automatically enabled when SCRIPT_DEBUG is true.
 * It can also be manually enabled by setting window.UPLOAD_MEDIA_DEBUG = true
 * in the browser console before uploading.
 */

declare global {
	interface Window {
		UPLOAD_MEDIA_DEBUG?: boolean;
	}
}

const PREFIX = '[upload-media]';

type LogLevel = 'log' | 'info' | 'warn' | 'error' | 'group' | 'groupEnd';

function isDebugEnabled(): boolean {
	if ( typeof window === 'undefined' ) {
		return false;
	}
	if ( window.UPLOAD_MEDIA_DEBUG === true ) {
		return true;
	}
	if ( globalThis.SCRIPT_DEBUG ) {
		return true;
	}
	return false;
}

function formatValue( value: unknown ): unknown {
	if ( value instanceof File ) {
		return {
			name: value.name,
			type: value.type,
			size: `${ ( value.size / 1024 ).toFixed( 2 ) }KB`,
		};
	}
	if ( value instanceof Blob ) {
		return {
			type: value.type,
			size: `${ ( value.size / 1024 ).toFixed( 2 ) }KB`,
		};
	}
	if ( value instanceof ArrayBuffer ) {
		return `ArrayBuffer(${ ( value.byteLength / 1024 ).toFixed( 2 ) }KB)`;
	}
	return value;
}

function formatArgs( args: unknown[] ): unknown[] {
	return args.map( formatValue );
}

function createLogger( level: LogLevel ) {
	return ( ...args: unknown[] ) => {
		if ( ! isDebugEnabled() ) {
			return;
		}
		const formattedArgs = formatArgs( args );
		// eslint-disable-next-line no-console
		console[ level ]( PREFIX, ...formattedArgs );
	};
}

export const debug = {
	log: createLogger( 'log' ),
	info: createLogger( 'info' ),
	warn: createLogger( 'warn' ),
	error: createLogger( 'error' ),
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
	table: ( data: unknown ) => {
		if ( ! isDebugEnabled() ) {
			return;
		}
		// eslint-disable-next-line no-console
		console.table( data );
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
