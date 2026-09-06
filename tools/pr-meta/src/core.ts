import { readFileSync } from 'node:fs';

/*
 * A minimal stand-in for the parts of `@actions/core` and `@actions/github`
 * this action uses. Depending on them would mean a full `npm install` in every
 * writer job just to edit one comment, which costs more than the comment is
 * worth. Node 24 gives us `fetch`, and the rest is environment variables.
 */

export function getInput( name: string ): string {
	/* The runner's own mangling: spaces to underscores, then uppercased. */
	const variable = `INPUT_${ name.replace( / /g, '_' ).toUpperCase() }`;

	return ( process.env[ variable ] ?? '' ).trim();
}

export function info( message: string ): void {
	process.stdout.write( `${ message }\n` );
}

function escapeData( value: string ): string {
	return value
		.replace( /%/g, '%25' )
		.replace( /\r/g, '%0D' )
		.replace( /\n/g, '%0A' );
}

export function warning( message: string ): void {
	process.stdout.write( `::warning::${ escapeData( message ) }\n` );
}

export function setFailed( message: string ): void {
	process.stdout.write( `::error::${ escapeData( message ) }\n` );
	process.exitCode = 1;
}

export type Repo = {
	owner: string;
	repo: string;
};

export function getRepo(): Repo {
	const [ owner, repo ] = ( process.env.GITHUB_REPOSITORY ?? '' ).split(
		'/'
	);

	if ( ! owner || ! repo ) {
		throw new Error( 'GITHUB_REPOSITORY is not set.' );
	}

	return { owner, repo };
}

type EventPayload = {
	number?: number;
	issue?: { number?: number };
	pull_request?: { number?: number };
};

export function getEventPayload(): EventPayload {
	const path = process.env.GITHUB_EVENT_PATH;

	if ( ! path ) {
		return {};
	}

	try {
		return JSON.parse( readFileSync( path, 'utf8' ) ) as EventPayload;
	} catch {
		return {};
	}
}

export function getApiUrl(): string {
	return process.env.GITHUB_API_URL ?? 'https://api.github.com';
}
