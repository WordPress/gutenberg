import { readFileSync } from 'node:fs';
import path from 'node:path';
import { globSync } from 'glob';

const SOURCE_IGNORES = [ '**/node_modules/**', 'vendor/**' ];
const ISOLATION_OPT_OUT_PATTERN =
	/(?:^|[^\w-])--no-isolate(?=$|[^\w-])|(?:^|[^\w-])--isolate(?:=|\s+)false(?=$|[^\w-])/;
const ROOT_ROUTING_COMMAND =
	'npm run --workspace @wordpress/unit-tests test:unit:routing --';
const WORKSPACE_ROUTING_COMMAND = 'node scripts/validate-test-routing.mjs';

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
			if ( ISOLATION_OPT_OUT_PATTERN.test( command ) ) {
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
		for ( const [ index, line ] of readFileSync(
			path.join( rootDir, workflowFile ),
			'utf8'
		)
			.split( /\r?\n/ )
			.entries() ) {
			if ( ISOLATION_OPT_OUT_PATTERN.test( line ) ) {
				violations.push(
					`${ workflowFile }:${
						index + 1
					} disables Vitest module isolation: ${ line.trim() }`
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
