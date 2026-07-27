/**
 * Agent-session helpers for the AI development tests.
 *
 * Runs a scenario's task prompt through a real agent CLI session and
 * normalizes the transcript into ordered read/write/command events so tests
 * can verify the agent consulted the right guidance. The agent is granted no
 * write permissions — an attempted (denied) edit is still evidence, and the
 * checkout is never modified. No running WordPress environment is required.
 *
 * Supporting another agent CLI means adding one ADAPTERS entry that invokes
 * it headless and normalizes its transcript into
 * { events: [ { kind: read|write|command, value } ], result }.
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';

const here = path.dirname( fileURLToPath( import.meta.url ) );
const scenariosDir = path.join( here, 'scenarios' );
const artifactsDir = path.join( here, 'artifacts' );

export function loadScenarios() {
	return fs
		.readdirSync( scenariosDir )
		.filter( ( f ) => f.endsWith( '.json' ) )
		.map( ( f ) => ( {
			slug: f.replace( /\.json$/, '' ),
			...JSON.parse(
				fs.readFileSync( path.join( scenariosDir, f ), 'utf8' )
			),
		} ) );
}

const ADAPTERS = {
	claude: {
		command: 'claude',
		buildArgs( scenario, model ) {
			const args = [
				'-p',
				scenario.query,
				'--verbose',
				'--output-format',
				'stream-json',
			];
			if ( model ) {
				args.push( '--model', model );
			}
			return args;
		},
		parse( raw ) {
			const events = [];
			let result = null;
			for ( const line of raw.split( '\n' ) ) {
				let obj;
				try {
					obj = JSON.parse( line );
				} catch {
					continue;
				}
				for ( const block of obj?.message?.content ?? [] ) {
					if ( block?.type !== 'tool_use' ) {
						continue;
					}
					const input = block.input ?? {};
					if ( block.name === 'Read' && input.file_path ) {
						events.push( {
							kind: 'read',
							value: input.file_path,
						} );
					} else if (
						[ 'Edit', 'Write', 'NotebookEdit' ].includes(
							block.name
						) &&
						input.file_path
					) {
						events.push( {
							kind: 'write',
							value: input.file_path,
						} );
					} else if ( block.name === 'Bash' && input.command ) {
						events.push( {
							kind: 'command',
							value: input.command,
						} );
					}
				}
				if ( obj?.type === 'result' ) {
					result = obj.result ?? '';
				}
			}
			return { events, result };
		},
	},
};

export function runAgent( scenario, { agent = 'claude', model } = {} ) {
	const adapter = ADAPTERS[ agent ];
	if ( ! adapter ) {
		throw new Error(
			`Unknown agent '${ agent }'. Available: ${ Object.keys(
				ADAPTERS
			).join( ', ' ) }`
		);
	}
	const out = spawnSync(
		adapter.command,
		adapter.buildArgs( scenario, model ),
		{
			cwd: path.resolve( here, '..', '..' ),
			encoding: 'utf8',
			timeout: ( scenario.timeoutSeconds ?? 900 ) * 1000,
			maxBuffer: 256 * 1024 * 1024,
		}
	);
	fs.mkdirSync( artifactsDir, { recursive: true } );
	const artifact = path.join(
		artifactsDir,
		`${ scenario.slug }-${ Date.now() }.jsonl`
	);
	fs.writeFileSync( artifact, out.stdout ?? '' );
	if ( out.error ) {
		throw new Error(
			`${ adapter.command } failed to run: ${ out.error.message }`
		);
	}
	return { ...adapter.parse( out.stdout ?? '' ), artifact };
}

function firstIndex( events, kind, needle ) {
	return events.findIndex(
		( e ) => e.kind === kind && e.value.includes( needle )
	);
}

/**
 * Evaluates a scenario's declarative assertions against a normalized
 * transcript. Returns outcomes: { label, pass, evidence }.
 *
 * @param {Object}  assertions        The scenario's `assertions` block.
 * @param {Object}  transcript        Normalized transcript.
 * @param {Array}   transcript.events Ordered read/write/command events.
 * @param {?string} transcript.result The agent's final message.
 */
export function checkAssertions( assertions, { events, result } ) {
	const outcomes = [];
	const record = ( label, pass, evidence = [] ) =>
		outcomes.push( { label, pass, evidence } );
	const reads = events
		.filter( ( e ) => e.kind === 'read' )
		.map( ( e ) => e.value );
	const commands = events
		.filter( ( e ) => e.kind === 'command' )
		.map( ( e ) => e.value );
	const timeline = events.map(
		( e ) => `${ e.kind }: ${ e.value.slice( 0, 100 ) }`
	);

	for ( const needle of assertions.readsInclude ?? [] ) {
		record(
			`reads include ${ needle }`,
			reads.some( ( r ) => r.includes( needle ) ),
			reads
		);
	}
	for ( const needle of assertions.readsExclude ?? [] ) {
		record(
			`reads exclude ${ needle }`,
			! reads.some( ( r ) => r.includes( needle ) ),
			reads
		);
	}
	for ( const { read, command } of assertions.readsBeforeCommand ?? [] ) {
		const readIdx = firstIndex( events, 'read', read );
		const cmdIdx = firstIndex( events, 'command', command );
		record(
			`read ${ read } before command '${ command }'`,
			readIdx !== -1 && ( cmdIdx === -1 || readIdx < cmdIdx ),
			timeline
		);
	}
	for ( const { read } of assertions.readsBeforeWrite ?? [] ) {
		const readIdx = firstIndex( events, 'read', read );
		const writeIdx = events.findIndex( ( e ) => e.kind === 'write' );
		record(
			`read ${ read } before first write attempt`,
			readIdx !== -1 && ( writeIdx === -1 || readIdx < writeIdx ),
			timeline
		);
	}
	for ( const [ before, after ] of assertions.commandOrder ?? [] ) {
		const afterIdx = firstIndex( events, 'command', after );
		const beforeIdx = firstIndex( events, 'command', before );
		record(
			`command '${ before }' before '${ after }'`,
			afterIdx === -1 || ( beforeIdx !== -1 && beforeIdx < afterIdx ),
			commands
		);
	}
	for ( const rule of assertions.commandRules ?? [] ) {
		const matching = commands.filter( ( c ) =>
			c.includes( rule.matching )
		);
		record(
			`a command matching '${ rule.matching }' occurred`,
			matching.length > 0,
			commands
		);
		for ( const command of matching ) {
			if ( rule.mustContain ) {
				record(
					`'${ rule.matching }' command contains '${ rule.mustContain }'`,
					command.includes( rule.mustContain ),
					[ command ]
				);
			}
			for ( const banned of rule.mustNotContain ?? [] ) {
				record(
					`'${ rule.matching }' command avoids '${ banned }'`,
					! command.includes( banned ),
					[ command ]
				);
			}
		}
	}
	for ( const needle of assertions.resultIncludes ?? [] ) {
		record(
			`result includes '${ needle }'`,
			( result ?? '' ).includes( needle ),
			[ ( result ?? '' ).slice( 0, 300 ) ]
		);
	}
	return outcomes;
}
