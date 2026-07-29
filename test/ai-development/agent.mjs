/**
 * Agent-session helper for the AI development tests.
 *
 * Runs a task prompt through a real, headless agent CLI session and
 * normalizes the transcript into ordered evidence so tests can verify the
 * agent consulted the right guidance. The agent is granted no write
 * permissions — an attempted (denied) edit is still evidence, and the checkout
 * is never modified. No running WordPress environment is required.
 *
 * Supporting another agent CLI means adding one ADAPTERS entry that invokes
 * it headless and normalizes its transcript into { evidence, result, failure }.
 * Evidence records what was observed and whether it came from an explicit
 * provider event or was inferred from a shell command.
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
	const absolute = path.isAbsolute( filePath )
		? filePath
		: path.resolve( repoRoot, filePath );
	const relative = path.relative( repoRoot, absolute );
	return relative.startsWith( '..' ) ? absolute : relative;
}

function fileEvidence(
	operation,
	filePath,
	{ outcome = 'attempted', source = 'native_tool', confidence = 'exact' } = {}
) {
	return {
		type: 'file_access',
		operation,
		path: relativize( filePath ),
		outcome,
		source,
		confidence,
	};
}

function commandEvidence( command, outcome = 'attempted' ) {
	return {
		type: 'command',
		command,
		outcome,
		source: 'native_tool',
		confidence: 'exact',
	};
}

/**
 * Codex exposes shell commands rather than dedicated read events. Infer reads
 * only for commands whose purpose includes displaying or searching file
 * contents, and only for path-like arguments that resolve to existing files.
 *
 * @param {string} command Shell command reported by Codex.
 * @return {string[]} Repo-relative or absolute paths read by the command.
 */
function inferReadPaths( command ) {
	if (
		! /(?:^|["';&|(\s])(?:cat|sed|head|tail|less|more|rg|grep|awk|wc|nl)(?:\s|$)/.test(
			command
		)
	) {
		return [];
	}

	const pathLike = /(?:(?:\/|\.{0,2}\/)?(?:[\w@.+-]+\/)+[\w@.+-]+)/g;
	const matches = command.match( pathLike ) ?? [];
	const paths = new Set();
	const shellExecutables = new Set( [
		'/bin/bash',
		'/bin/sh',
		'/bin/zsh',
		'/usr/bin/env',
	] );

	for ( let candidate of matches ) {
		candidate = candidate.replace( /[,:]\d+(?::\d+)?$/, '' );
		if ( shellExecutables.has( candidate ) ) {
			continue;
		}
		const absolute = path.isAbsolute( candidate )
			? candidate
			: path.resolve( repoRoot, candidate );
		try {
			if ( fs.statSync( absolute ).isFile() ) {
				paths.add( relativize( absolute ) );
			}
		} catch {
			// Shell arguments that merely look like paths are not read evidence.
		}
	}

	return [ ...paths ];
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
			const evidence = [];
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
						evidence.push(
							fileEvidence( 'read', input.file_path )
						);
					} else if (
						[ 'Edit', 'Write', 'NotebookEdit' ].includes(
							block.name
						) &&
						input.file_path
					) {
						evidence.push(
							fileEvidence( 'write', input.file_path )
						);
					} else if ( block.name === 'Bash' && input.command ) {
						evidence.push( commandEvidence( input.command ) );
					}
				}
				if ( obj?.type === 'result' ) {
					result = obj.result ?? '';
				}
			}
			return { evidence, result, failure: null };
		},
	},
	codex: {
		command: 'codex',
		buildArgs( query, model ) {
			const args = [
				'exec',
				'--json',
				'--ephemeral',
				'--sandbox',
				'read-only',
			];
			if ( model ) {
				args.push( '--model', model );
			}
			args.push( query );
			return args;
		},
		parse( raw ) {
			const evidence = [];
			let result = null;
			let failure = null;
			for ( const line of raw.split( '\n' ) ) {
				let obj;
				try {
					obj = JSON.parse( line );
				} catch {
					continue;
				}

				if ( obj?.type === 'turn.failed' ) {
					failure = obj.error?.message ?? 'Codex turn failed';
				} else if ( obj?.type === 'error' ) {
					failure = obj.message ?? 'Codex stream failed';
				}

				if ( obj?.type !== 'item.completed' ) {
					continue;
				}

				const item = obj.item ?? {};
				if ( item.type === 'command_execution' && item.command ) {
					const outcome =
						item.status === 'completed' ? 'completed' : 'failed';
					for ( const filePath of inferReadPaths( item.command ) ) {
						evidence.push(
							fileEvidence( 'read', filePath, {
								outcome,
								source: 'shell_command',
								confidence: 'inferred',
							} )
						);
					}
					evidence.push( commandEvidence( item.command, outcome ) );
				} else if ( item.type === 'file_change' ) {
					for ( const change of item.changes ?? [] ) {
						if ( change.path ) {
							evidence.push(
								fileEvidence( 'write', change.path, {
									outcome:
										item.status === 'completed'
											? 'completed'
											: 'failed',
									source: 'file_change',
								} )
							);
						}
					}
				} else if ( item.type === 'agent_message' ) {
					result = item.text ?? '';
				}
			}
			return { evidence, result, failure };
		},
	},
};

/**
 * Parse provider output without running an agent.
 *
 * @param {string} agent Adapter name.
 * @param {string} raw   Raw JSONL output.
 * @return {Object} Normalized provider output.
 */
function parseAgentOutput( agent, raw ) {
	const adapter = ADAPTERS[ agent ];
	if ( ! adapter ) {
		throw new Error(
			`Unknown agent '${ agent }'. Available: ${ Object.keys(
				ADAPTERS
			).join( ', ' ) }`
		);
	}
	return adapter.parse( raw );
}

function resolveAgentName( agent, env = process.env ) {
	return agent ?? env.AI_EVAL_AGENT ?? 'claude';
}

function describeProcessFailure( out ) {
	if ( ! out.error && out.status === 0 && ! out.signal ) {
		return null;
	}
	return (
		out.error?.message ??
		`exit status ${ out.status ?? 'unknown' }${
			out.signal ? ` (signal ${ out.signal })` : ''
		}`
	);
}

/**
 * A parsed agent transcript with the accessors tests assert against.
 */
class Transcript {
	constructor( { evidence, result, artifact } ) {
		this.evidence = evidence;
		this.result = result;
		this.artifact = artifact;
		this.reads = evidence
			.filter(
				( item ) =>
					item.type === 'file_access' && item.operation === 'read'
			)
			.map( ( item ) => item.path );
		this.writes = evidence
			.filter(
				( item ) =>
					item.type === 'file_access' && item.operation === 'write'
			)
			.map( ( item ) => item.path );
		this.commands = evidence
			.filter( ( item ) => item.type === 'command' )
			.map( ( item ) => item.command );
	}

	/**
	 * Evidence index of the first matching item, or
	 * Infinity when it never happened — so ordering comparisons read
	 * naturally: absent bounds pass, absent requirements fail.
	 *
	 * @param {string}  kind   read | write | command.
	 * @param {?string} needle Substring to match; undefined matches any event
	 *                         of that kind.
	 */
	firstIndex( kind, needle ) {
		const i = this.evidence.findIndex( ( item ) => {
			const isCommand = kind === 'command' && item.type === 'command';
			const isFileAccess =
				item.type === 'file_access' && item.operation === kind;
			const value = isCommand ? item.command : item.path;
			return (
				( isCommand || isFileAccess ) &&
				( needle === undefined || value.includes( needle ) )
			);
		} );
		return i === -1 ? Infinity : i;
	}

	consulted( filePath ) {
		return this.reads.includes( filePath );
	}

	attemptedWrite( needle ) {
		return this.firstWrite( needle ) !== Infinity;
	}

	ranCommandMatching( needle ) {
		return this.firstCommand( needle ) !== Infinity;
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
		agent,
		model = process.env.AI_EVAL_MODEL,
		timeoutSeconds = 10 * 60,
	} = {}
) {
	agent = resolveAgentName( agent );
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
	const stderrArtifact = `${ artifact }.stderr`;
	if ( out.stderr ) {
		fs.writeFileSync( stderrArtifact, out.stderr );
	}
	const processFailure = describeProcessFailure( out );
	if ( processFailure ) {
		throw new Error(
			`${
				adapter.command
			} failed to run: ${ processFailure }. Transcript: ${ artifact }${
				out.stderr ? `; stderr: ${ stderrArtifact }` : ''
			}`
		);
	}
	const parsed = parseAgentOutput( agent, out.stdout ?? '' );
	if ( parsed.failure ) {
		throw new Error(
			`${ adapter.command } session failed: ${ parsed.failure }. Transcript: ${ artifact }`
		);
	}
	return new Transcript( {
		...parsed,
		artifact,
	} );
}
