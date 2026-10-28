import fs from 'node:fs';
import path from 'node:path';
import yaml from 'js-yaml';
import { loadChangieConfig } from './config.ts';

export interface Fragment {
	project: string;
	kind: string;
	body: string;
	time?: unknown;
	custom: { PR: string | number };
}

interface ValidationOptions {
	pr?: string;
	requirePr?: string;
	project?: string;
}

/**
 * Parse and validate a fragment once so all consumers use the same rules.
 *
 * @param filePath Fragment path for diagnostics.
 * @param content  YAML source.
 * @param options  Validation options.
 * @param repoRoot Repository root.
 * @return Validation errors and the parsed fragment when valid.
 */
export function parseFragment(
	filePath: string,
	content: string,
	options: ValidationOptions = {},
	repoRoot = process.cwd()
): { errors: string[]; fragment?: Fragment } {
	const errors = [];
	let parsed;
	try {
		parsed = yaml.safeLoad( content );
	} catch ( error ) {
		return {
			errors: [
				`${ filePath }: invalid YAML: ${ error instanceof Error ? error.message : String( error ) }`,
			],
		};
	}
	if ( ! parsed || typeof parsed !== 'object' || Array.isArray( parsed ) ) {
		return { errors: [ `${ filePath }: fragment must be a YAML object.` ] };
	}
	const data = parsed as Record< string, unknown >;
	const { project, kind, body, custom } = data;
	const config = loadChangieConfig( repoRoot );
	const allowedKinds = [
		'Stable Release',
		...( config.kinds || [] ).map( ( item ) => item.label ),
	];
	const allowedProjects = config.projects.map( ( item ) => item.key );
	if ( typeof project !== 'string' || ! project.trim() ) {
		errors.push( `${ filePath }: missing required 'project' property.` );
	} else if ( ! allowedProjects.includes( project ) ) {
		errors.push(
			`${ filePath }: unknown project '${ project }'. Allowed projects: ${ allowedProjects.join( ', ' ) }`
		);
	}
	if ( typeof kind !== 'string' || ! kind.trim() ) {
		errors.push( `${ filePath }: missing required 'kind' property.` );
	} else if ( ! allowedKinds.includes( kind ) ) {
		errors.push(
			`${ filePath }: unknown kind '${ kind }'. Allowed kinds: ${ allowedKinds.join( ', ' ) }`
		);
	}
	if ( typeof body !== 'string' || ! body.trim() ) {
		errors.push( `${ filePath }: missing or empty 'body' description.` );
	}
	const pr =
		custom && typeof custom === 'object' && ! Array.isArray( custom )
			? ( custom as Record< string, unknown > ).PR
			: undefined;
	const fragmentPr =
		typeof pr === 'string' || typeof pr === 'number'
			? String( pr ).trim()
			: '';
	if (
		! /^[1-9]\d*$/.test( fragmentPr ) ||
		! Number.isSafeInteger( Number( fragmentPr ) )
	) {
		errors.push(
			`${ filePath }: custom.PR must be a positive integer. Add the Gutenberg pull request number.`
		);
	} else if ( options.requirePr && fragmentPr !== options.requirePr ) {
		errors.push(
			`${ filePath }: PR #${ fragmentPr } does not match required PR #${ options.requirePr }`
		);
	}
	if (
		errors.length ||
		typeof project !== 'string' ||
		typeof kind !== 'string' ||
		typeof body !== 'string' ||
		( typeof pr !== 'string' && typeof pr !== 'number' )
	) {
		return { errors };
	}
	return {
		errors,
		fragment: { project, kind, body, time: data.time, custom: { PR: pr } },
	};
}

/**
 * @param filePath Fragment path.
 * @param content  YAML source.
 * @param options  Validation options.
 * @param repoRoot Repository root.
 * @return Validation errors.
 */
export function validateFragment(
	filePath: string,
	content: string,
	options: ValidationOptions = {},
	repoRoot = process.cwd()
) {
	return parseFragment( filePath, content, options, repoRoot ).errors;
}

/**
 * @param options  Validation options.
 * @param repoRoot Repository root.
 * @return Validation errors.
 */
export function validateAllFragments(
	options: ValidationOptions = {},
	repoRoot = process.cwd()
) {
	const config = loadChangieConfig( repoRoot );
	const unreleasedDir = path.resolve(
		repoRoot,
		config.changesDir || '.changes',
		config.unreleasedDir || 'unreleased'
	);
	const files = fs.existsSync( unreleasedDir )
		? fs
				.readdirSync( unreleasedDir )
				.filter( ( file ) => file.endsWith( '.yaml' ) )
		: [];
	const allErrors = [];
	let matchedPrCount = 0;
	for ( const file of files ) {
		const filePath = path.join( unreleasedDir, file );
		const { errors, fragment } = parseFragment(
			filePath,
			fs.readFileSync( filePath, 'utf8' ),
			{},
			repoRoot
		);
		allErrors.push( ...errors );
		if (
			fragment &&
			String( fragment.custom.PR ).trim() === options.requirePr &&
			( ! options.project || fragment.project === options.project )
		) {
			matchedPrCount++;
		}
	}
	if ( options.requirePr && matchedPrCount === 0 ) {
		allErrors.push(
			`No unreleased fragment found citing required PR #${ options.requirePr }` +
				( options.project ? ` for project '${ options.project }'` : '' )
		);
	}
	return allErrors;
}
