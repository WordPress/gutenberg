import { readFileSync } from 'node:fs';
import path from 'node:path';
import { globSync } from 'glob';

const SOURCE_IGNORES = [ '**/node_modules/**', 'vendor/**' ];
const ISOLATION_OPT_OUT_PATTERN =
	/(?:^|[^\w-])--no-isolate(?=$|[^\w-])|(?:^|[^\w-])--(?:browser\.)?isolate(?:=|\s+)false(?=$|[^\w-])/;
const ROOT_ROUTING_COMMAND =
	'npm run --workspace @wordpress/unit-tests test:unit:routing --';
const WORKSPACE_ROUTING_COMMAND = 'node scripts/validate-test-routing.mjs';

function normalizeShellCommand( command ) {
	return command
		.replace( /\\\r?\n\s*/g, ' ' )
		.replace( /\s+/g, ' ' )
		.trim();
}

function disablesVitestIsolation( command ) {
	return ISOLATION_OPT_OUT_PATTERN.test( normalizeShellCommand( command ) );
}

function getWorkflowRunBlocks( source ) {
	const lines = source.split( /\r?\n/ );
	const blocks = [];

	for ( let index = 0; index < lines.length; index++ ) {
		const match = lines[ index ].match( /^(\s*)(?:-\s*)?run:\s*(.*)$/ );
		if ( ! match ) {
			continue;
		}

		const indentation = match[ 1 ].length;
		const inlineCommand = match[ 2 ].trim();
		if ( ! /^[|>][+-]?(?:\s+#.*)?$/.test( inlineCommand ) ) {
			const isQuoted =
				( inlineCommand.startsWith( '"' ) &&
					inlineCommand.endsWith( '"' ) ) ||
				( inlineCommand.startsWith( "'" ) &&
					inlineCommand.endsWith( "'" ) );
			blocks.push( {
				command: isQuoted
					? inlineCommand.slice( 1, -1 )
					: inlineCommand,
				line: index + 1,
			} );
			continue;
		}

		const commandLines = [];
		for (
			let commandIndex = index + 1;
			commandIndex < lines.length;
			commandIndex++
		) {
			const commandLine = lines[ commandIndex ];
			if (
				commandLine.trim() &&
				commandLine.match( /^\s*/ )[ 0 ].length <= indentation
			) {
				break;
			}
			commandLines.push( commandLine );
		}
		blocks.push( { command: commandLines.join( '\n' ), line: index + 1 } );
	}

	return blocks;
}

export function validateRoutingScripts( rootPackageJson, unitTestPackageJson ) {
	const violations = [];
	if (
		rootPackageJson.scripts?.[ 'test:unit:routing' ] !==
		ROOT_ROUTING_COMMAND
	) {
		violations.push(
			`package.json: scripts.test:unit:routing must be exactly \`${ ROOT_ROUTING_COMMAND }\``
		);
	}
	if (
		unitTestPackageJson.scripts?.[ 'test:unit:routing' ] !==
		WORKSPACE_ROUTING_COMMAND
	) {
		violations.push(
			`test/unit/package.json: scripts.test:unit:routing must be exactly \`${ WORKSPACE_ROUTING_COMMAND }\``
		);
	}

	return violations;
}

function findPackageScriptIsolationOptOuts( rootDir ) {
	const violations = [];
	const packageFiles = globSync( '**/package.json', {
		cwd: rootDir,
		ignore: SOURCE_IGNORES,
		nodir: true,
	} ).sort();

	for ( const packageFile of packageFiles ) {
		const packageJson = JSON.parse(
			readFileSync( path.join( rootDir, packageFile ), 'utf8' )
		);

		for ( const [ scriptName, command ] of Object.entries(
			packageJson.scripts ?? {}
		) ) {
			if ( disablesVitestIsolation( command ) ) {
				violations.push(
					`${ packageFile }:scripts.${ scriptName } disables Vitest module isolation: ${ command }`
				);
			}
		}
	}

	return violations;
}

function findWorkflowIsolationOptOuts( rootDir ) {
	const violations = [];
	const workflowFiles = globSync(
		'.github/{actions,workflows}/**/*.{yml,yaml}',
		{
			cwd: rootDir,
			nodir: true,
		}
	).sort();

	for ( const workflowFile of workflowFiles ) {
		const source = readFileSync(
			path.join( rootDir, workflowFile ),
			'utf8'
		);
		for ( const { command, line } of getWorkflowRunBlocks( source ) ) {
			if ( disablesVitestIsolation( command ) ) {
				violations.push(
					`${ workflowFile }:${ line } disables Vitest module isolation: ${ normalizeShellCommand(
						command
					) }`
				);
			}
		}
	}

	return violations;
}

export function findVitestIsolationOptOuts( rootDir ) {
	return [
		...findPackageScriptIsolationOptOuts( rootDir ),
		...findWorkflowIsolationOptOuts( rootDir ),
	].sort();
}
