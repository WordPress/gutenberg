/**
 * Eval harness for agent skills.
 *
 * Verifies that an agent, given a scenario's task prompt, consulted the right
 * guidance: read the skill files and docs it should, didn't read the ones it
 * shouldn't, in the right order, and reached for the right kind of command.
 * Evidence comes from the agent's own transcript; nothing needs a running
 * WordPress environment, and the agent is not granted write permissions — an
 * attempted (denied) edit is still evidence, and your checkout is never
 * touched.
 *
 * Static checks (default) — fast, free:
 *
 *     node eval/harness/run.mjs
 *
 * Live mode — runs scenario queries through real agent sessions (minutes and
 * real tokens per run):
 *
 *     node eval/harness/run.mjs --live
 *     node eval/harness/run.mjs --live --scenario testing-run-e2e --model haiku --repeat 3
 *
 * Options: --scenario <slug>, --agent <name> (default: claude), --model
 * <model> (passed through to the agent CLI), --repeat <n>.
 *
 * Supporting another agent CLI means adding one ADAPTERS entry that invokes
 * it headless and normalizes its transcript into
 * { events: [ { kind: read|write|command, value } ], result }.
 */

import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';

const repoRoot = process.cwd();
const scenariosDir = path.join( repoRoot, 'eval', 'scenarios' );
const artifactsDir = path.join( repoRoot, 'eval', 'artifacts' );

/* -------------------------------------------------------------------------
 * Static checks
 * ---------------------------------------------------------------------- */

function parseFrontmatter( markdown ) {
	const lines = markdown.split( '\n' );
	if ( lines[ 0 ]?.trim() !== '---' ) {
		return null;
	}
	const end = lines.findIndex( ( line, i ) => i > 0 && line.trim() === '---' );
	if ( end === -1 ) {
		return null;
	}
	const metadata = {};
	for ( const line of lines.slice( 1, end ) ) {
		const m = line.match( /^\s*([A-Za-z0-9_-]+)\s*:\s*(.*)\s*$/ );
		if ( m ) {
			metadata[ m[ 1 ] ] = m[ 2 ]
				.replace( /^"(.*)"$/, '$1' )
				.replace( /^'(.*)'$/, '$1' )
				.trim();
		}
	}
	return metadata;
}

function assert( condition, message ) {
	if ( ! condition ) {
		throw new Error( message );
	}
}

function staticChecks() {
	const skillsRoot = path.join( repoRoot, 'skills' );
	const skillDirs = fs.existsSync( skillsRoot )
		? fs
				.readdirSync( skillsRoot, { withFileTypes: true } )
				.filter( ( d ) => d.isDirectory() )
				.map( ( d ) => path.join( skillsRoot, d.name ) )
		: [];
	assert( skillDirs.length > 0, 'No skills found under ./skills' );

	for ( const dir of skillDirs ) {
		const skillPath = path.join( dir, 'SKILL.md' );
		const rel = path.relative( repoRoot, skillPath );
		assert( fs.existsSync( skillPath ), `Missing SKILL.md: ${ rel }` );
		const fm = parseFrontmatter( fs.readFileSync( skillPath, 'utf8' ) );
		assert( fm, `Missing YAML frontmatter in: ${ rel }` );
		assert( fm.name, `Missing frontmatter 'name' in: ${ rel }` );
		assert( fm.description, `Missing frontmatter 'description' in: ${ rel }` );
		assert(
			fm.name === path.basename( dir ),
			`Frontmatter name mismatch in ${ rel }: expected '${ path.basename( dir ) }', got '${ fm.name }'`
		);
	}
	return skillDirs.length;
}

function loadScenarios() {
	return fs
		.readdirSync( scenariosDir )
		.filter( ( f ) => f.endsWith( '.json' ) )
		.map( ( f ) => ( {
			slug: f.replace( /\.json$/, '' ),
			...JSON.parse( fs.readFileSync( path.join( scenariosDir, f ), 'utf8' ) ),
		} ) );
}

/* -------------------------------------------------------------------------
 * Agent adapters
 * ---------------------------------------------------------------------- */

const ADAPTERS = {
	claude: {
		command: 'claude',
		buildArgs( scenario, model ) {
			const args = [ '-p', scenario.query, '--verbose', '--output-format', 'stream-json' ];
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
						events.push( { kind: 'read', value: input.file_path } );
					} else if ( [ 'Edit', 'Write', 'NotebookEdit' ].includes( block.name ) && input.file_path ) {
						events.push( { kind: 'write', value: input.file_path } );
					} else if ( block.name === 'Bash' && input.command ) {
						events.push( { kind: 'command', value: input.command } );
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

/* -------------------------------------------------------------------------
 * Assertions over the normalized event log
 * ---------------------------------------------------------------------- */

function firstIndex( events, kind, needle ) {
	return events.findIndex( ( e ) => e.kind === kind && e.value.includes( needle ) );
}

function checkAssertions( assertions, { events, result } ) {
	const outcomes = [];
	const record = ( label, pass, evidence = [] ) => outcomes.push( { label, pass, evidence } );
	const reads = events.filter( ( e ) => e.kind === 'read' ).map( ( e ) => e.value );
	const commands = events.filter( ( e ) => e.kind === 'command' ).map( ( e ) => e.value );
	const timeline = events.map( ( e ) => `${ e.kind }: ${ e.value.slice( 0, 100 ) }` );

	for ( const needle of assertions.readsInclude ?? [] ) {
		record( `reads include ${ needle }`, reads.some( ( r ) => r.includes( needle ) ), reads );
	}
	for ( const needle of assertions.readsExclude ?? [] ) {
		record( `reads exclude ${ needle }`, ! reads.some( ( r ) => r.includes( needle ) ), reads );
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
		const matching = commands.filter( ( c ) => c.includes( rule.matching ) );
		record( `a command matching '${ rule.matching }' occurred`, matching.length > 0, commands );
		for ( const command of matching ) {
			if ( rule.mustContain ) {
				record( `'${ rule.matching }' command contains '${ rule.mustContain }'`, command.includes( rule.mustContain ), [ command ] );
			}
			for ( const banned of rule.mustNotContain ?? [] ) {
				record( `'${ rule.matching }' command avoids '${ banned }'`, ! command.includes( banned ), [ command ] );
			}
		}
	}
	for ( const needle of assertions.resultIncludes ?? [] ) {
		record( `result includes '${ needle }'`, ( result ?? '' ).includes( needle ), [ ( result ?? '' ).slice( 0, 300 ) ] );
	}
	return outcomes;
}

/* -------------------------------------------------------------------------
 * Live mode
 * ---------------------------------------------------------------------- */

function runOnce( scenario, adapter, model, runIndex ) {
	const out = spawnSync( adapter.command, adapter.buildArgs( scenario, model ), {
		cwd: repoRoot,
		encoding: 'utf8',
		timeout: ( scenario.timeoutSeconds ?? 900 ) * 1000,
		maxBuffer: 256 * 1024 * 1024,
	} );
	fs.mkdirSync( artifactsDir, { recursive: true } );
	const artifact = path.join( artifactsDir, `${ scenario.slug }-${ Date.now() }-${ runIndex }.jsonl` );
	fs.writeFileSync( artifact, out.stdout ?? '' );
	if ( out.error ) {
		throw new Error( `${ adapter.command } failed to run: ${ out.error.message }` );
	}
	return { outcomes: checkAssertions( scenario.assertions, adapter.parse( out.stdout ?? '' ) ), artifact };
}

function runLive( scenarios, { only, agentName, model, repeat } ) {
	const adapter = ADAPTERS[ agentName ];
	if ( ! adapter ) {
		console.error( `Unknown agent '${ agentName }'. Available: ${ Object.keys( ADAPTERS ).join( ', ' ) }` );
		process.exit( 1 );
	}
	let failed = false;
	for ( const scenario of scenarios ) {
		if ( only && scenario.slug !== only ) {
			continue;
		}
		if ( ! scenario.assertions ) {
			console.log( `SKIP ${ scenario.slug }: no assertions block` );
			continue;
		}
		console.log( `\nRUN ${ scenario.slug } [${ agentName }${ model ? `:${ model }` : '' }] "${ scenario.query }" (${ repeat }x)` );
		const totals = new Map();
		for ( let i = 0; i < repeat; i++ ) {
			const { outcomes, artifact } = runOnce( scenario, adapter, model, i );
			console.log( `  transcript: ${ path.relative( repoRoot, artifact ) }` );
			for ( const { label, pass, evidence } of outcomes ) {
				const t = totals.get( label ) ?? { pass: 0, total: 0, evidence: [] };
				t.total += 1;
				if ( pass ) {
					t.pass += 1;
				} else {
					t.evidence = evidence;
				}
				totals.set( label, t );
			}
		}
		for ( const [ label, t ] of totals ) {
			const ok = t.pass === t.total;
			console.log( `  ${ ok ? 'PASS' : 'FAIL' } (${ t.pass }/${ t.total }) ${ label }` );
			if ( ! ok ) {
				for ( const line of t.evidence.slice( 0, 20 ) ) {
					console.log( `        actual: ${ line }` );
				}
				failed = true;
			}
		}
	}
	return failed;
}

/* -------------------------------------------------------------------------
 * Main
 * ---------------------------------------------------------------------- */

function argValue( argv, flag ) {
	const i = argv.indexOf( flag );
	return i !== -1 ? argv[ i + 1 ] : null;
}

function main() {
	const argv = process.argv.slice( 2 );
	const skillCount = staticChecks();
	const scenarios = loadScenarios();
	console.log( `OK: ${ skillCount } skill(s) and ${ scenarios.length } scenario(s) passed sanity checks.` );

	if ( ! argv.includes( '--live' ) ) {
		return;
	}
	const failed = runLive( scenarios, {
		only: argValue( argv, '--scenario' ),
		agentName: argValue( argv, '--agent' ) ?? 'claude',
		model: argValue( argv, '--model' ),
		repeat: Number( argValue( argv, '--repeat' ) ) || 1,
	} );
	process.exit( failed ? 1 : 0 );
}

main();
