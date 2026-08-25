/**
 * Shared setup for every evaluation spec.
 */
import providers from './providers.js';
import defaultTest from './default-test.js';

/** @type {Partial<import('promptfoo').UnifiedConfig>} */
export default {
	tracing: {
		enabled: true,
		failOnReceiverStartFailure: true,
		// Claude calls its shell tool Bash, so declare it as a command tool
		// name for Promptfoo's trajectory steps to pick up.
		commandToolNames: [ 'Bash' ],
		otlp: {
			http: {
				enabled: true,
				host: '127.0.0.1',
				port: 4318,
				acceptFormats: [ 'json' ],
			},
		},
	},

	extensions: [ 'file://../../lib/workspace-extension.mjs:extensionHook' ],

	providers,

	defaultTest,

	evaluateOptions: {
		// A completed run takes about ninety seconds; this leaves room for a
		// slow one while still cutting off an agent that has stopped making
		// progress.
		timeoutMs: 180000,
		// Never replay a cached agent run: an eval is only meaningful live.
		cache: false,
		maxConcurrency: 2,
		repeat: 2,
	},

	// One file per run rather than per suite. Promptfoo's own store is the
	// history that `npm run view` reads; this is a convenience dump.
	outputPath: 'results/raw/latest.json',
};
