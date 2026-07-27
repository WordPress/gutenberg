/**
 * Agent-session helper for the AI development tests.
 *
 * Runs a task prompt through a real, headless agent CLI session and
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
const repoRoot = path.resolve( here, '..', '..' );
const artifactsDir = path.join( here, 'artifacts' );

/**
 * Paths inside the repository are reported repo-relative so tests can assert
 * with exact matches ( `expect( transcript.reads ).toContain( 'skills/…' )` );
 * paths outside the repository stay absolute.
 *
 * @param {string} filePath
 */
function relativize( filePath ) {
	const relative = path.relative( repoRoot, filePath );
	return relative.startsWith( '..' ) ? filePath : relative;
}

const ADAPTERS = {
	claude: {
		command: 'claude',
		buildArgs( query, model ) {
			const args = [
				'-p',
				query,
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
							value: relativize( input.file_path ),
						} );
					} else if (
						[ 'Edit', 'Write', 'NotebookEdit' ].includes(
							block.name
						) &&
						input.file_path
					) {
						events.push( {
							kind: 'write',
							value: relativize( input.file_path ),
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

/**
 * A parsed agent transcript with the accessors tests assert against.
 */
class Transcript {
	constructor( { events, result, artifact } ) {
		this.events = events;
		this.result = result;
		this.artifact = artifact;
		this.reads = events
			.filter( ( e ) => e.kind === 'read' )
			.map( ( e ) => e.value );
		this.writes = events
			.filter( ( e ) => e.kind === 'write' )
			.map( ( e ) => e.value );
		this.commands = events
			.filter( ( e ) => e.kind === 'command' )
			.map( ( e ) => e.value );
	}

	/**
	 * Event index of the first `kind` event whose value contains `needle`, or
	 * Infinity when it never happened — so ordering comparisons read
	 * naturally: absent bounds pass, absent requirements fail.
	 *
	 * @param {string}  kind   read | write | command.
	 * @param {?string} needle Substring to match; undefined matches any event
	 *                         of that kind.
	 */
	firstIndex( kind, needle ) {
		const i = this.events.findIndex(
			( e ) =>
				e.kind === kind &&
				( needle === undefined || e.value.includes( needle ) )
		);
		return i === -1 ? Infinity : i;
	}

	firstRead( needle ) {
		return this.firstIndex( 'read', needle );
	}

	firstWrite( needle ) {
		return this.firstIndex( 'write', needle );
	}

	firstCommand( needle ) {
		return this.firstIndex( 'command', needle );
	}

	commandsMatching( needle ) {
		return this.commands.filter( ( c ) => c.includes( needle ) );
	}
}

/**
 * Runs a task prompt through an agent session and returns its Transcript.
 *
 * @param {string} query                  The task prompt.
 * @param {Object} options
 * @param {string} options.name           Slug for the saved transcript file.
 * @param {string} options.agent          Adapter name (default: claude).
 * @param {string} options.model          Model passed through to the agent
 *                                        CLI; defaults to AI_EVAL_MODEL.
 * @param {number} options.timeoutSeconds Kill the session after this long.
 *                                        The default must stay below the test
 *                                        timeout in playwright.config.mjs so a
 *                                        hung session fails with evidence
 *                                        rather than a worker kill.
 */
export function runAgent(
	query,
	{
		name = 'run',
		agent = 'claude',
		model = process.env.AI_EVAL_MODEL,
		timeoutSeconds = 10 * 60,
	} = {}
) {
	const adapter = ADAPTERS[ agent ];
	if ( ! adapter ) {
		throw new Error(
			`Unknown agent '${ agent }'. Available: ${ Object.keys(
				ADAPTERS
			).join( ', ' ) }`
		);
	}
	const out = spawnSync( adapter.command, adapter.buildArgs( query, model ), {
		cwd: repoRoot,
		encoding: 'utf8',
		timeout: timeoutSeconds * 1000,
		maxBuffer: 256 * 1024 * 1024,
	} );
	fs.mkdirSync( artifactsDir, { recursive: true } );
	const artifact = path.join(
		artifactsDir,
		`${ name }-${ Date.now() }.jsonl`
	);
	fs.writeFileSync( artifact, out.stdout ?? '' );
	if ( out.error ) {
		throw new Error(
			`${ adapter.command } failed to run: ${ out.error.message }`
		);
	}
	return new Transcript( {
		...adapter.parse( out.stdout ?? '' ),
		artifact,
	} );
}
