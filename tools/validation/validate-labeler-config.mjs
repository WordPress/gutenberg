#!/usr/bin/env node

import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseArgs } from 'node:util';
import yaml from 'js-yaml';

const { load } = yaml;

const PACKAGE_GLOB_PATTERN = /^packages\/([^/]+)\/\*\*$/;
const PACKAGE_LABEL_COLOR = 'ED2572';

// DO NOT ADD TO THIS LIST. These are packages which do not have an associated
// GitHub label yet. Remove entries from this list as labels are created.
export const EXCLUDED_PACKAGES = [
	'annotations',
	'asset-loader',
	'block-directory',
	'block-serialization-default-parser',
	'block-serialization-spec-parser',
	'connectors',
	'core-abilities',
	'create-block-interactive-template',
	'create-block-tutorial-template',
	'customize-widgets',
	'dashboard-init',
	'edit-site-init',
	'global-styles-engine',
	'global-styles-ui',
	'kebab-case',
	'latex-to-mathml',
	'lazy-editor',
	'list-reusable-blocks',
	'media-editor',
	'media-fields',
	'nux',
	'postcss-themes',
	'preferences-persistence',
	'report-flaky-tests',
	'reusable-blocks',
	'route',
	'shortcode',
	'style-runtime',
	'undo-manager',
	'upload-media',
	'video-conversion',
	'vips',
	'widgets',
	'worker-threads',
	'workflow',
];

function isObject( value ) {
	return (
		value !== null && typeof value === 'object' && ! Array.isArray( value )
	);
}

function visitStrings( value, callback ) {
	if ( typeof value === 'string' ) {
		callback( value );
		return;
	}

	if ( Array.isArray( value ) ) {
		value.forEach( ( item ) => visitStrings( item, callback ) );
		return;
	}

	if ( isObject( value ) ) {
		Object.values( value ).forEach( ( item ) =>
			visitStrings( item, callback )
		);
	}
}

export function parseLabelerConfig( source ) {
	let config;

	try {
		config = load( source );
	} catch ( error ) {
		throw new Error(
			`Could not parse .github/labeler.yml: ${ error.message }`,
			{
				cause: error,
			}
		);
	}

	if ( ! isObject( config ) ) {
		throw new Error(
			'.github/labeler.yml must contain a mapping of label names to rules.'
		);
	}

	return config;
}

export function getPackageLabelRules( config ) {
	const rules = [];

	for ( const [ label, labelConfig ] of Object.entries( config ) ) {
		visitStrings( labelConfig, ( value ) => {
			const match = value.match( PACKAGE_GLOB_PATTERN );

			if ( match ) {
				rules.push( {
					label,
					packageName: match[ 1 ],
					path: value,
				} );
			}
		} );
	}

	return rules;
}

export function getPackageNames( packagesPath ) {
	return readdirSync( packagesPath, { withFileTypes: true } )
		.filter(
			( entry ) =>
				entry.isDirectory() &&
				existsSync( join( packagesPath, entry.name, 'package.json' ) )
		)
		.map( ( entry ) => entry.name )
		.sort();
}

export function validatePackageRules( {
	excludedPackages = EXCLUDED_PACKAGES,
	packageNames,
	rules,
} ) {
	const excludedPackageSet = new Set( excludedPackages );
	const packageNameSet = new Set( packageNames );
	const configuredPackageSet = new Set(
		rules.map( ( { packageName } ) => packageName )
	);

	return {
		missingPackages: packageNames.filter(
			( packageName ) =>
				! excludedPackageSet.has( packageName ) &&
				! configuredPackageSet.has( packageName )
		),
		staleConfiguredPackages: [ ...configuredPackageSet ]
			.filter( ( packageName ) => ! packageNameSet.has( packageName ) )
			.sort(),
	};
}

function escapeRegExp( value ) {
	return value.replace( /[.*+?^${}()|[\]\\]/g, '\\$&' );
}

function descriptionReferencesPackage( description, packageName ) {
	if ( typeof description !== 'string' ) {
		return false;
	}

	const packagePath = escapeRegExp( `packages/${ packageName }` );
	return new RegExp(
		`(^|[^A-Za-z0-9_/-])/?${ packagePath }(?=$|[^A-Za-z0-9_/-])`
	).test( description );
}

export function validateGithubLabelMetadata( rules, githubLabels ) {
	if ( ! Array.isArray( githubLabels ) ) {
		throw new Error( 'GitHub label data must be an array.' );
	}

	const labelsByName = new Map();

	for ( const label of githubLabels ) {
		if ( isObject( label ) && typeof label.name === 'string' ) {
			labelsByName.set( label.name, label );
		}
	}

	const missingLabels = [];
	const colorMismatches = [];
	const descriptionMismatches = [];

	for ( const rule of rules ) {
		const githubLabel = labelsByName.get( rule.label );

		if ( ! githubLabel ) {
			missingLabels.push( rule );
			continue;
		}

		const color =
			typeof githubLabel.color === 'string'
				? githubLabel.color.replace( /^#/, '' ).toUpperCase()
				: '';

		if ( color !== PACKAGE_LABEL_COLOR ) {
			colorMismatches.push( {
				...rule,
				actualColor: githubLabel.color,
			} );
		}

		if (
			! descriptionReferencesPackage(
				githubLabel.description,
				rule.packageName
			)
		) {
			descriptionMismatches.push( {
				...rule,
				actualDescription: githubLabel.description,
			} );
		}
	}

	return { colorMismatches, descriptionMismatches, missingLabels };
}

export async function fetchGithubLabels(
	repository,
	token,
	fetchImpl = fetch
) {
	const labels = [];
	const headers = {
		Accept: 'application/vnd.github+json',
		'X-GitHub-Api-Version': '2022-11-28',
	};

	if ( token ) {
		headers.Authorization = `Bearer ${ token }`;
	}

	for ( let page = 1; ; page++ ) {
		let response;

		try {
			response = await fetchImpl(
				`https://api.github.com/repos/${ repository }/labels?per_page=100&page=${ page }`,
				{ headers }
			);
		} catch ( error ) {
			throw new Error(
				`Could not read GitHub labels for ${ repository }: ${ error.message }`,
				{ cause: error }
			);
		}

		if ( ! response.ok ) {
			throw new Error(
				`GitHub returned status ${ response.status } while reading labels for ${ repository }.`
			);
		}

		const pageLabels = await response.json();

		if ( ! Array.isArray( pageLabels ) ) {
			throw new Error(
				'GitHub returned label data in an unexpected format.'
			);
		}

		labels.push( ...pageLabels );

		if ( pageLabels.length < 100 ) {
			return labels;
		}
	}
}

function printPackageRuleErrors( {
	missingPackages,
	staleConfiguredPackages,
} ) {
	if ( missingPackages.length ) {
		console.error( 'The following packages are missing labeling rules:' );
		missingPackages.forEach( ( packageName ) =>
			console.error( `  - packages/${ packageName }` )
		);
		console.error(
			'Add an exact packages/<name>/** rule to .github/labeler.yml for each package.'
		);
	}

	if ( staleConfiguredPackages.length ) {
		console.error(
			'The following labeling rules refer to packages that do not exist:'
		);
		staleConfiguredPackages.forEach( ( packageName ) =>
			console.error( `  - packages/${ packageName }/**` )
		);
		console.error(
			'Remove each stale rule or restore the package and its package.json file.'
		);
	}
}

function printGithubLabelErrors( {
	colorMismatches,
	descriptionMismatches,
	missingLabels,
} ) {
	if ( missingLabels.length ) {
		console.error(
			'The following configured labels do not exist on GitHub:'
		);
		missingLabels.forEach( ( { label } ) =>
			console.error( `  - ${ label }` )
		);
	}

	if ( colorMismatches.length ) {
		console.error(
			`The following configured labels do not use #${ PACKAGE_LABEL_COLOR }:`
		);
		colorMismatches.forEach( ( { actualColor, label } ) =>
			console.error( `  - ${ label }: ${ actualColor ?? '(missing)' }` )
		);
	}

	if ( descriptionMismatches.length ) {
		console.error(
			'The following configured labels do not reference their package path:'
		);
		descriptionMismatches.forEach(
			( { actualDescription, label, packageName } ) =>
				console.error(
					`  - ${ label }: expected /packages/${ packageName }, received ${
						actualDescription ?? '(missing)'
					}`
				)
		);
	}
}

async function main() {
	let values;

	try {
		( { values } = parseArgs( {
			options: {
				'github-labels-file': { type: 'string' },
				'github-repository': { type: 'string' },
				'repo-root': { type: 'string' },
			},
			strict: true,
		} ) );
	} catch ( error ) {
		console.error( error.message );
		process.exitCode = 1;
		return;
	}

	if ( values[ 'github-labels-file' ] && values[ 'github-repository' ] ) {
		console.error(
			'Use either --github-labels-file or --github-repository, not both.'
		);
		process.exitCode = 1;
		return;
	}

	const defaultRepoRoot = resolve(
		dirname( fileURLToPath( import.meta.url ) ),
		'../..'
	);
	const repoRoot = resolve( values[ 'repo-root' ] ?? defaultRepoRoot );

	try {
		const config = parseLabelerConfig(
			readFileSync( join( repoRoot, '.github/labeler.yml' ), 'utf8' )
		);
		const rules = getPackageLabelRules( config );
		const packageRuleErrors = validatePackageRules( {
			packageNames: getPackageNames( join( repoRoot, 'packages' ) ),
			rules,
		} );
		const hasPackageRuleErrors = Object.values( packageRuleErrors ).some(
			( errors ) => errors.length > 0
		);

		if ( hasPackageRuleErrors ) {
			printPackageRuleErrors( packageRuleErrors );
			process.exitCode = 1;
			return;
		}

		let githubLabels;

		if ( values[ 'github-labels-file' ] ) {
			githubLabels = JSON.parse(
				readFileSync(
					resolve( values[ 'github-labels-file' ] ),
					'utf8'
				)
			);
		} else if ( values[ 'github-repository' ] ) {
			githubLabels = await fetchGithubLabels(
				values[ 'github-repository' ],
				process.env.GITHUB_TOKEN
			);
		}

		if ( githubLabels ) {
			const githubLabelErrors = validateGithubLabelMetadata(
				rules,
				githubLabels
			);
			const hasGithubLabelErrors = Object.values(
				githubLabelErrors
			).some( ( errors ) => errors.length > 0 );

			if ( hasGithubLabelErrors ) {
				printGithubLabelErrors( githubLabelErrors );
				process.exitCode = 1;
				return;
			}
		}

		console.log( 'All package labeling rules are valid.' );
	} catch ( error ) {
		console.error( error.message );
		process.exitCode = 1;
	}
}

if (
	process.argv[ 1 ] &&
	resolve( process.argv[ 1 ] ) === fileURLToPath( import.meta.url )
) {
	await main();
}
