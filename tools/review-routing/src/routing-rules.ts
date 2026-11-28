import { readdir, readFile } from 'node:fs/promises';
import path from 'node:path';

export type RoutingRule = {
	/** File name without `.md`. Also the question id sent to the model. */
	id: string;
	/** Who to ask for review: GitHub usernames, or teams as `org/team-slug`. */
	reviewers: string[];
	/** Lowest probability that asks for review. */
	threshold: number;
	/** File body, sent to the model as the question. */
	instructions: string;
	/** Reference data from the rule's optional `.mts` file. */
	context?: Record< string, unknown >;
};

export const DEFAULT_THRESHOLD = 0.7;

export const RULES_DIRECTORY = new URL(
	'../../../.github/review-routing/',
	import.meta.url
);

/**
 * Parses one routing file: `key: value` front matter, then the instructions.
 *
 * @param id     Rule id.
 * @param source File contents.
 * @return The rule.
 */
export function parseRoutingRule( id: string, source: string ): RoutingRule {
	// The model accepts question ids of up to 100 of these characters.
	if ( ! /^[A-Za-z0-9_.-]{1,100}$/.test( id ) ) {
		throw new Error( `${ id }: the file name is not a valid question id.` );
	}

	const match = source.match( /^---\n([\s\S]*?)\n---\n([\s\S]*)$/ );
	if ( ! match ) {
		throw new Error( `${ id }: the file has no front matter.` );
	}

	const fields: Record< string, string > = {};
	for ( const line of match[ 1 ].split( '\n' ) ) {
		const [ key, ...value ] = line.split( ':' );
		if ( key.trim() ) {
			fields[ key.trim() ] = value.join( ':' ).trim();
		}
	}

	// One reviewer, or several as a YAML flow sequence: `[ octocat, org/team ]`.
	const value = fields.reviewer ?? '';
	const list = value.match( /^\[(.*)\]$/ );
	const reviewers = ( list ? list[ 1 ].split( ',' ) : [ value ] )
		.map( ( reviewer ) => reviewer.trim().replace( /^@/, '' ) )
		.filter( Boolean );
	if ( ! reviewers.length ) {
		throw new Error( `${ id }: the front matter has no \`reviewer\`.` );
	}

	const threshold = fields.threshold
		? Number( fields.threshold )
		: DEFAULT_THRESHOLD;
	if ( ! ( threshold > 0 && threshold <= 1 ) ) {
		throw new Error( `${ id }: \`threshold\` must be above 0, up to 1.` );
	}

	const instructions = match[ 2 ].trim();
	if ( ! instructions ) {
		throw new Error( `${ id }: the file has no instructions.` );
	}

	return { id, reviewers, threshold, instructions };
}

/** The imported `.mts` file of a rule. */
type ContextModule = { default?: unknown };

/**
 * Reads the reference data from the module of a rule's `.mts` file. Its
 * default export takes no arguments and returns the data, which the model
 * reads in named fields next to the question.
 *
 * @param id     Rule id.
 * @param module The imported module.
 * @return The reference data.
 */
export async function readContext(
	id: string,
	module: ContextModule
): Promise< Record< string, unknown > > {
	if ( typeof module.default !== 'function' ) {
		throw new Error( `${ id }.mts: the default export is not a function.` );
	}

	const context: unknown = await module.default();
	if (
		typeof context !== 'object' ||
		context === null ||
		Object.getPrototypeOf( context ) !== Object.prototype
	) {
		throw new Error( `${ id }.mts: the function must return an object.` );
	}

	// The question goes in this field, so the context cannot replace it.
	if ( 'question' in context ) {
		throw new Error(
			`${ id }.mts: the object cannot have a \`question\`.`
		);
	}

	return context as Record< string, unknown >;
}

/**
 * Reads every routing file in a directory.
 *
 * @param directory Directory of `.md` routing files.
 * @return The rules, sorted by id.
 */
export async function loadRoutingRules(
	directory: URL = RULES_DIRECTORY
): Promise< RoutingRule[] > {
	const files = await readdir( directory );
	const names = files.filter( ( name ) => name.endsWith( '.md' ) ).sort();

	return Promise.all(
		names.map( async ( name ) => {
			const id = path.basename( name, '.md' );
			const rule = parseRoutingRule(
				id,
				await readFile( new URL( name, directory ), 'utf8' )
			);

			if ( files.includes( `${ id }.mts` ) ) {
				rule.context = await readContext(
					id,
					await import( new URL( `${ id }.mts`, directory ).href )
				);
			}

			return rule;
		} )
	);
}
