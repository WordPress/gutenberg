/**
 * External dependencies
 */
import { version as RNV } from 'react-native/Libraries/Core/ReactNativeVersion';

/**
 * Internal dependencies
 */
import { version as reactNativeBridgeVersion } from '../package.json';

// The stack trace is limited to prevent crash logging service fail processing the exception.
const STACKTRACE_LIMIT = 50;

const isHermesEnabled = () => {
	return !! global.HermesInternal;
};

// Based on environment functions of Sentry React Native SDK:
// https://github.com/getsentry/sentry-react-native/blob/e0f0885fa26f28909e28001fb7c25270655588cf/src/js/utils/environment.ts
const getReactNativeContext = () => {
	const isTurboModuleEnabled =
		typeof global.__turboModuleProxy !== 'undefined';
	const isFabricEnabled = typeof global.nativeFabricUIManager !== 'undefined';
	const hermesVersion =
		global.HermesInternal &&
		global.HermesInternal.getRuntimeProperties &&
		global.HermesInternal.getRuntimeProperties()[ 'OSS Release Version' ];
	const reactNativeVersion = `${ RNV.major }.${ RNV.minor }.${ RNV.patch }${
		RNV.prerelease !== null ? `-${ RNV.prerelease }` : ''
	}`;
	return {
		is_hermes_enabled: isHermesEnabled(),
		is_turbo_module_enabled: isTurboModuleEnabled,
		is_fabric_enabled: isFabricEnabled,
		hermes_version: isHermesEnabled() ? hermesVersion : null,
		react_native_version: reactNativeVersion,
	};
};

const stacktraceLineRegex =
	/^\s*at (?:(.+?\)(?: \[.+\])?|.*?) ?\((?:address at )?)?(?:async )?((?:<anonymous>|[-a-z]+:|.*bundle|\/)?.*?)(?::(\d+))?(?::(\d+))?\)?\s*$/i;
const UNKNOWN_FUNCTION = '?';

// Based on function `chrome` Stack line parser of Sentry React Native SDK:
// https://github.com/getsentry/sentry-javascript/blob/de681dcf7d6dac69da9374bbdbe2e2f7e00f0fdc/packages/browser/src/stack-parsers.ts#L53-L83
// And function `createReactNativeRewriteFrames`:
// https://github.com/getsentry/sentry-react-native/blob/adfb66f16438dfd98f280307844778c7291b584b/src/js/integrations/rewriteframes.ts#L17-L69
const parseStacktraceLine = ( line ) => {
	const parts = stacktraceLineRegex.exec( line );

	if ( ! parts ) {
		return;
	}

	let filename = parts[ 2 ];
	const func = parts[ 1 ] || UNKNOWN_FUNCTION;
	const lineno = parts[ 3 ] ? +parts[ 3 ] : undefined;
	let colno = parts[ 4 ] ? +parts[ 4 ] : undefined;

	if ( filename ) {
		// Filter out unneeded parts from filename
		filename = filename
			.replace( /^file:\/\//, '' )
			.replace( /^address at /, '' )
			.replace( /^.*\/[^.]+(\.app|CodePush|.*(?=\/))/, '' );

		// Add prefix to filename
		if ( filename !== '[native code]' && filename !== 'native' ) {
			const appPrefix = 'app://';
			filename =
				filename.indexOf( '/' ) === 0
					? `${ appPrefix }${ filename }`
					: `${ appPrefix }/${ filename }`;
		}
	}

	// Check Hermes Bytecode stack trace and convert to 1-based column
	if ( isHermesEnabled() && lineno === 1 && colno !== undefined ) {
		// hermes bytecode columns are 0-based, while v8 and jsc are 1-based.
		// Hermes stack trace without debug info have always line with value 1
		// and column points to a bytecode position.
		// https://github.com/facebook/react/issues/21792#issuecomment-873171991
		colno += 1;
	}

	return {
		filename,
		function: func,
		...( lineno ? { lineno } : null ),
		...( colno ? { colno } : null ),
	};
};

// Based on function `createStackParser` and `parseStackFrames` of Sentry JavaScript SDK:
// - https://github.com/getsentry/sentry-javascript/blob/de681dcf7d6dac69da9374bbdbe2e2f7e00f0fdc/packages/utils/src/stacktrace.ts#L16-L59
// - https://github.com/getsentry/sentry-javascript/blob/de681dcf7d6dac69da9374bbdbe2e2f7e00f0fdc/packages/browser/src/eventbuilder.ts#L100-L118
// And function `stripSentryFramesAndReverse` of Sentry React Native SDK:
// https://github.com/getsentry/sentry-javascript/blob/de681dcf7d6dac69da9374bbdbe2e2f7e00f0fdc/packages/utils/src/stacktrace.ts#L80-L117
const parseStacktrace = ( exception ) => {
	const plainStacktrace = exception.stacktrace || exception.stack || '';
	const entries = [];
	const lines = plainStacktrace.split( '\n' );

	for ( let i = 0; i < lines.length; i++ ) {
		const line = lines[ i ];
		// Ignore lines over 1kb as they are unlikely to be valid entries.
		if ( line.length > 1024 ) {
			continue;
		}

		// Skip error message lines.
		if ( line.match( /\S*Error: / ) ) {
			continue;
		}

		const entry = parseStacktraceLine( line );
		if ( entry ) {
			entries.push( entry );
		}

		if ( entries.length >= STACKTRACE_LIMIT ) {
			break;
		}
	}

	const reverseEntries = Array.from( entries ).reverse();

	return reverseEntries.slice( 0, STACKTRACE_LIMIT ).map( ( entry ) => ( {
		...entry,
		filename:
			entry.filename ||
			reverseEntries[ reverseEntries.length - 1 ].filename,
	} ) );
};

// Based on function `extractMessage` of Sentry JavaScript SDK:
// https://github.com/getsentry/sentry-javascript/blob/de681dcf7d6dac69da9374bbdbe2e2f7e00f0fdc/packages/browser/src/eventbuilder.ts#L142-L151
const extractMessage = ( exception ) => {
	const message = exception?.message;
	if ( ! message ) {
		return 'No error message';
	}
	if ( typeof message.error?.message === 'string' ) {
		return message.error.message;
	}
	return message;
};

// Based on function `exceptionFromError` of Sentry JavaScript SDK:
// https://github.com/getsentry/sentry-javascript/blob/de681dcf7d6dac69da9374bbdbe2e2f7e00f0fdc/packages/browser/src/eventbuilder.ts#L31-L49
const parseException = ( originalException ) => {
	const exception = {
		type: originalException?.name,
		message: extractMessage( originalException ),
	};

	const stacktrace = parseStacktrace( originalException );
	if ( stacktrace.length ) {
		exception.stacktrace = stacktrace;
	}

	if ( exception.type === undefined && exception.message === '' ) {
		exception.message = 'Unknown error';
	}

	return exception;
};

export default ( exception, { context, tags } = {} ) => {
	return {
		...parseException( exception ),
		context: {
			...context,
			...getReactNativeContext(),
		},
		tags: {
			...tags,
			gutenberg_mobile_version: reactNativeBridgeVersion,
		},
	};
};
