import fs from 'node:fs';
import path from 'node:path';
import yaml from 'js-yaml';
import { loadChangieConfig } from './config.ts';

export interface FragmentValidationError {
	filePath: string;
	message: string;
}

export function validateFragment(
	filePath: string,
	content: string,
	options: { pr?: string; requirePr?: string } = {},
	repoRoot: string = process.cwd()
): string[] {
	const errors: string[] = [];
	let parsed: any;
	try {
		parsed = yaml.safeLoad( content );
	} catch ( err: any ) {
		return [ `${ filePath }: invalid YAML: ${ err.message }` ];
	}

	if ( ! parsed || typeof parsed !== 'object' ) {
		return [ `${ filePath }: fragment must be a YAML object.` ];
	}

	const config = loadChangieConfig( repoRoot );
	const allowedKinds = ( config.kinds || [] ).map( ( k ) => k.label );
	const allowedProjects = ( config.projects || [] ).map( ( p ) => p.key );

	if ( ! parsed.project ) {
		errors.push( `${ filePath }: missing required 'project' property.` );
	} else if (
		allowedProjects.length > 0 &&
		! allowedProjects.includes( parsed.project )
	) {
		errors.push(
			`${ filePath }: unknown project '${ parsed.project }'. Allowed projects: ${ allowedProjects.join( ', ' ) }`
		);
	}

	if ( ! parsed.kind ) {
		errors.push( `${ filePath }: missing required 'kind' property.` );
	} else if (
		allowedKinds.length > 0 &&
		! allowedKinds.includes( parsed.kind )
	) {
		errors.push(
			`${ filePath }: unknown kind '${ parsed.kind }'. Allowed kinds: ${ allowedKinds.join( ', ' ) }`
		);
	}

	if (
		! parsed.body ||
		typeof parsed.body !== 'string' ||
		parsed.body.trim() === ''
	) {
		errors.push( `${ filePath }: missing or empty 'body' description.` );
	}

	const fragmentPr = parsed.custom?.PR
		? String( parsed.custom.PR ).trim()
		: '';

	if ( options.requirePr ) {
		if ( ! fragmentPr ) {
			errors.push(
				`${ filePath }: must include custom.PR matching #${ options.requirePr }`
			);
		} else if ( fragmentPr !== options.requirePr ) {
			errors.push(
				`${ filePath }: PR #${ fragmentPr } does not match required PR #${ options.requirePr }`
			);
		}
	}

	if ( options.pr && fragmentPr && fragmentPr !== options.pr ) {
		errors.push(
			`${ filePath }: PR #${ fragmentPr } does not match current PR #${ options.pr }`
		);
	}

	return errors;
}

export function validateAllFragments(
	options: { pr?: string; requirePr?: string; project?: string } = {},
	repoRoot: string = process.cwd()
): string[] {
	const config = loadChangieConfig( repoRoot );
	const unreleasedDir = path.resolve(
		repoRoot,
		config.changesDir || '.changes',
		config.unreleasedDir || 'unreleased'
	);
	if ( ! fs.existsSync( unreleasedDir ) ) {
		return [];
	}

	const files = fs
		.readdirSync( unreleasedDir )
		.filter( ( f ) => f.endsWith( '.yaml' ) );
	const allErrors: string[] = [];

	let matchedPrCount = 0;
	for ( const f of files ) {
		const filePath = path.join( unreleasedDir, f );
		const content = fs.readFileSync( filePath, 'utf8' );
		const errors = validateFragment( filePath, content, options, repoRoot );
		allErrors.push( ...errors );

		if (
			options.requirePr &&
			! errors.some( ( e ) => e.includes( 'does not match' ) )
		) {
			const parsed = yaml.safeLoad( content ) as any;
			if ( String( parsed?.custom?.PR ) === options.requirePr ) {
				if (
					! options.project ||
					parsed?.project === options.project
				) {
					matchedPrCount++;
				}
			}
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
