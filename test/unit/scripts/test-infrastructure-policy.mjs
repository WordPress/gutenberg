import { readFileSync } from 'node:fs';
import path from 'node:path';
import { globSync } from 'glob';
import typescript from 'typescript';

const SOURCE_IGNORES = [ '**/node_modules/**', 'vendor/**' ];
const JEST_CONFIG_FILE_PATTERN = /(?:^|\/)[^/]*jest[^/]*\.config\.[^/]+$/;
const JEST_COMMAND_PATTERN =
	/(?:^|[^\w-])(?:jest|test-unit-js)(?=$|[^\w-])|(?:^|\s)npm\s+run(?:\s+--workspace\s+\S+)?\s+test:unit(?::(?:debug|profile|update|watch))?(?=$|\s)/;
const JEST_DEPENDENCY_SECTIONS = [
	'dependencies',
	'devDependencies',
	'optionalDependencies',
	'peerDependencies',
];
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

function isJestOnlyDependency( dependency ) {
	return (
		dependency !== '@testing-library/jest-dom' &&
		( dependency.startsWith( '@jest/' ) ||
			/(?:^|[\/_-])jest(?:$|[\/_-])/.test( dependency ) )
	);
}

function getNpmAliasTarget( specifier ) {
	if ( typeof specifier !== 'string' ) {
		return null;
	}

	return (
		specifier.match( /^npm:(@[^/]+\/[^@]+|[^@]+)(?:@|$)/ )?.[ 1 ] ?? null
	);
}

function usesJestCommand( command ) {
	return JEST_COMMAND_PATTERN.test( normalizeShellCommand( command ) );
}

function disablesVitestIsolation( command ) {
	return ISOLATION_OPT_OUT_PATTERN.test( normalizeShellCommand( command ) );
}

function getWorkflowRunBlocks( source ) {
	const lines = source.split( /\r?\n/ );
	const blocks = [];

	for ( let index = 0; index < lines.length; index++ ) {
		const match = lines[ index ].match(
			/^(\s*)(?:-\s*)?(?:run|["']run["']):\s*(.*)$/
		);
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

export function collectJestInfrastructureEntries( files, readSource ) {
	const entries = new Set();

	for ( const file of files ) {
		const source = readSource( file );
		if ( source === null ) {
			continue;
		}

		if ( JEST_CONFIG_FILE_PATTERN.test( file ) ) {
			entries.add( `config:${ file }` );
		}

		if ( file.endsWith( '/package.json' ) || file === 'package.json' ) {
			const packageJson = JSON.parse( source );
			if ( packageJson.jest !== undefined ) {
				entries.add( `config:${ file }:jest` );
			}
			for ( const section of JEST_DEPENDENCY_SECTIONS ) {
				for ( const [ dependency, specifier ] of Object.entries(
					packageJson[ section ] ?? {}
				) ) {
					const aliasTarget = getNpmAliasTarget( specifier );
					if (
						isJestOnlyDependency( dependency ) ||
						( aliasTarget && isJestOnlyDependency( aliasTarget ) )
					) {
						entries.add(
							`dependency:${ file }:${ section }.${ dependency }`
						);
					}
				}
			}
			for ( const [ scriptName, command ] of Object.entries(
				packageJson.scripts ?? {}
			) ) {
				if ( usesJestCommand( command ) ) {
					entries.add(
						`command:${ file }:scripts.${ scriptName }=${ command }`
					);
				}
			}
		}

		if ( /^\.github\/(?:actions|workflows)\/.*\.ya?ml$/.test( file ) ) {
			for ( const { command } of getWorkflowRunBlocks( source ) ) {
				const normalizedCommand = normalizeShellCommand( command );
				if ( usesJestCommand( normalizedCommand ) ) {
					entries.add( `command:${ file }=${ normalizedCommand }` );
				}
			}
		}
	}

	return [ ...entries ].sort();
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

function getPropertyName( property ) {
	if ( ! property.name ) {
		return null;
	}

	if (
		typescript.isIdentifier( property.name ) ||
		typescript.isStringLiteral( property.name )
	) {
		return property.name.text;
	}
	if (
		typescript.isComputedPropertyName( property.name ) &&
		typescript.isStringLiteral( property.name.expression )
	) {
		return property.name.expression.text;
	}

	return null;
}

function findConfigIsolationOptOuts( rootDir ) {
	const violations = [];
	const configFiles = globSync(
		'**/{vite,vitest}.config.{js,jsx,cjs,mjs,ts,tsx,cts,mts}',
		{
			cwd: rootDir,
			ignore: SOURCE_IGNORES,
			nodir: true,
		}
	).sort();

	for ( const configFile of configFiles ) {
		const source = readFileSync( path.join( rootDir, configFile ), 'utf8' );
		const sourceFile = typescript.createSourceFile(
			configFile,
			source,
			typescript.ScriptTarget.Latest,
			true
		);

		function visit( node ) {
			if (
				node.parent &&
				typescript.isObjectLiteralExpression( node.parent ) &&
				getPropertyName( node ) === 'isolate' &&
				( ! typescript.isPropertyAssignment( node ) ||
					node.initializer.kind !==
						typescript.SyntaxKind.TrueKeyword )
			) {
				const { line } = sourceFile.getLineAndCharacterOfPosition(
					node.getStart( sourceFile )
				);
				violations.push(
					`${ configFile }:${
						line + 1
					} must set isolate to the literal value true`
				);
			}
			typescript.forEachChild( node, visit );
		}

		visit( sourceFile );
	}

	return violations;
}

export function findVitestIsolationOptOuts( rootDir ) {
	return [
		...findConfigIsolationOptOuts( rootDir ),
		...findPackageScriptIsolationOptOuts( rootDir ),
		...findWorkflowIsolationOptOuts( rootDir ),
	].sort();
}
