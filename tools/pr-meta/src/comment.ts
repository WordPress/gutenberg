import { COMMENT_LIMIT, SECTIONS, getSection } from './sections.ts';
import type { SectionDefinition } from './sections.ts';

export const COMMENT_MARKER = '<!-- gutenberg-pr-meta -->';
const COMMENT_HEADING = '### 🤖 PR meta 🤖';

export type ParsedSection = {
	id: string;
	body: string;
	sha?: string;
	runUrl?: string;
};

export type SectionUpdate = {
	id: string;
	body: string;
	sha?: string;
	runUrl?: string;
};

const SECTION_PATTERN =
	/<!-- pr-meta:section:([a-z0-9-]+)((?: [a-z]+=[^\s>]*)*) -->\n([\s\S]*?)\n<!-- \/pr-meta:section:\1 -->/g;

export function isPrMetaComment( body: string ): boolean {
	return body.startsWith( COMMENT_MARKER );
}

/**
 * Neutralises section delimiters in producer content.
 *
 * Some bodies carry text this repository does not control, most of all the
 * flaky tests section, which interpolates errors thrown by PR-authored tests.
 * An unescaped delimiter there could close its own section early and forge
 * another one.
 *
 * @param body Untrusted markdown.
 * @return The same markdown with every delimiter rendered inert.
 */
export function sanitizeBody( body: string ): string {
	return body.replace( /<!--(\s*\/?\s*)pr-meta:/g, '&lt;!--$1pr-meta:' );
}

function parseAttributes( raw: string ): { sha?: string; runUrl?: string } {
	const attributes: { sha?: string; runUrl?: string } = {};

	for ( const pair of raw.trim().split( /\s+/ ).filter( Boolean ) ) {
		const [ key, value ] = pair.split( '=' );
		if ( key === 'sha' ) {
			attributes.sha = value;
		} else if ( key === 'run' ) {
			attributes.runUrl = value;
		}
	}

	return attributes;
}

export function parseSections( commentBody: string ): ParsedSection[] {
	const sections: ParsedSection[] = [];

	for ( const match of commentBody.matchAll( SECTION_PATTERN ) ) {
		const [ , id, rawAttributes, body ] = match;
		sections.push( { id, body, ...parseAttributes( rawAttributes ) } );
	}

	return sections;
}

/**
 * Whether every delimiter in a comment belongs to a section that parses.
 *
 * A body with an unbalanced delimiter would lose the surrounding content on
 * the next render, so the writer refuses to touch it rather than quietly
 * dropping someone else's section.
 *
 * @param commentBody An existing unified comment.
 * @return Whether the comment can be safely rewritten.
 */
export function isParseable( commentBody: string ): boolean {
	const delimiters = commentBody.match( /<!-- \/?pr-meta:section:/g ) ?? [];

	return delimiters.length === parseSections( commentBody ).length * 2;
}

/* A section written by a newer revision of this action still has to fit. */
const UNKNOWN_SECTION: SectionDefinition = {
	id: 'unknown',
	heading: '',
	scope: 'pr-state',
	budget: 4000,
};

function truncate(
	body: string,
	definition: SectionDefinition,
	runUrl?: string
) {
	if ( body.length <= definition.budget ) {
		return body;
	}

	const cut = body.slice( 0, definition.budget );

	/*
	 * Cut at a paragraph break so the break falls between whole items rather
	 * than mid-sentence, then close whatever the cut left open. A note
	 * appended inside a fence renders as code, taking its link with it.
	 */
	const boundary = cut.lastIndexOf( '\n\n' );
	const kept = boundary > 0 ? cut.slice( 0, boundary ) : cut;
	const link = runUrl ? ` [See the full report](${ runUrl }).` : '';

	return `${ kept }${ closeOpenBlocks(
		kept
	) }\n\n<sub>Truncated.${ link }</sub>`;
}

/**
 * Closes the code fences and disclosures a truncated body left open.
 *
 * @param body A body that has been cut short.
 * @return The closing markup it needs, if any.
 */
function closeOpenBlocks( body: string ): string {
	const closing = [];

	if ( ( body.match( /^```/gm ) ?? [] ).length % 2 !== 0 ) {
		closing.push( '```' );
	}

	const open = ( body.match( /<details>/g ) ?? [] ).length;
	const closed = ( body.match( /<\/details>/g ) ?? [] ).length;
	closing.push(
		...Array( Math.max( open - closed, 0 ) ).fill( '</details>' )
	);

	return closing.length > 0 ? `\n${ closing.join( '\n' ) }` : '';
}

function renderFooter( section: ParsedSection, headSha?: string ) {
	if ( ! section.sha ) {
		return '';
	}

	const short = section.sha.slice( 0, 7 );
	const link = section.runUrl ? ` [Run](${ section.runUrl })` : '';
	const stale = headSha && section.sha !== headSha;

	return stale
		? `\n\n<sub>From \`${ short }\`, not the current head.${ link }</sub>`
		: `\n\n<sub>\`${ short }\`${ link }</sub>`;
}

function renderSection(
	section: ParsedSection,
	definition: SectionDefinition | undefined,
	headSha?: string
) {
	const attributes = [
		section.sha && `sha=${ section.sha }`,
		section.runUrl && `run=${ section.runUrl }`,
	]
		.filter( Boolean )
		.join( ' ' );
	const open = `<!-- pr-meta:section:${ section.id }${
		attributes ? ` ${ attributes }` : ''
	} -->`;
	const close = `<!-- /pr-meta:section:${ section.id } -->`;
	const heading = definition ? `#### ${ definition.heading }\n\n` : '';
	const body = truncate(
		section.body,
		definition ?? UNKNOWN_SECTION,
		section.runUrl
	);

	const delimited = `${ open }\n${ body }\n${ close }`;

	/*
	 * The heading, the fold and the footer all sit outside the delimiters.
	 * Everything between them is read back verbatim as the body, so a
	 * decoration kept inside would be re-rendered on top of itself at every
	 * write. The blank lines are what let GitHub render markdown inside the
	 * fold.
	 */
	const content = definition?.summary
		? `<details>\n<summary>${ definition.summary }</summary>\n\n${ delimited }\n\n</details>`
		: delimited;

	return `${ heading }${ content }${ renderFooter( section, headSha ) }`;
}

/**
 * Orders sections by the registry, keeping ids it does not know at the end so
 * a workflow running an older revision of this action never loses its section.
 *
 * @param sections Sections in no particular order.
 * @return The same sections in render order.
 */
function inRegistryOrder( sections: ParsedSection[] ): ParsedSection[] {
	const known = SECTIONS.map( ( { id } ) =>
		sections.find( ( section ) => section.id === id )
	).filter( ( section ): section is ParsedSection => Boolean( section ) );
	const unknown = sections.filter(
		( section ) => ! getSection( section.id )
	);

	return [ ...known, ...unknown ];
}

/**
 * Drops trailing sections until the comment fits.
 *
 * Section budgets are chosen to fit together, but a section written by a newer
 * revision of this action is outside that arithmetic, and GitHub rejects an
 * oversized body outright. Registry order puts what a human acts on first, so
 * trimming from the end sheds the least important content.
 *
 * @param sections Sections in render order.
 * @param render   Renders the whole comment from a list of sections.
 * @return The sections that fit.
 */
function withinLimit(
	sections: ParsedSection[],
	render: ( kept: ParsedSection[] ) => string
): ParsedSection[] {
	const kept = [ ...sections ];

	while ( kept.length > 1 && render( kept ).length > COMMENT_LIMIT ) {
		kept.pop();
	}

	return kept;
}

export function renderComment(
	sections: ParsedSection[],
	headSha?: string
): string {
	const render = ( kept: ParsedSection[] ) =>
		`${ COMMENT_MARKER }\n${ COMMENT_HEADING }\n\n${ kept
			.map( ( section ) =>
				renderSection( section, getSection( section.id ), headSha )
			)
			.join( '\n\n' ) }\n`;

	return render( withinLimit( inRegistryOrder( sections ), render ) );
}

export type MergeResult = {
	/** The full comment body to write, when there is one. */
	body?: string;
	/** Whether the comment should be deleted, its last section having gone. */
	remove?: boolean;
	/** Set when the update was dropped, explaining why. */
	rejected?: string;
};

/**
 * Applies one section update to an existing unified comment.
 *
 * @param existing The current comment body, or `undefined` when there is none.
 * @param update   The section to insert, replace or, with an empty body, remove.
 * @param headSha  Current head SHA of the pull request, when known.
 * @return The merged comment body, or the reason the update was dropped.
 */
export function mergeSection(
	existing: string | undefined,
	update: SectionUpdate,
	headSha?: string
): MergeResult {
	const definition = getSection( update.id );

	if ( ! definition ) {
		return { rejected: `Unknown section "${ update.id }".` };
	}

	const sections = existing ? parseSections( existing ) : [];

	const current = sections.find( ( section ) => section.id === update.id );

	/*
	 * A rerun of an older commit, or a run cancelled mid-flight, can finish
	 * after a newer one. Only the current head, or a refresh of what the
	 * section already shows, may write it. This covers clearing a section as
	 * much as filling one: an old rerun that happens to be clean would
	 * otherwise wipe a newer result. Both SHAs are required rather than
	 * optional, since without either one the two cases are indistinguishable
	 * and guessing lets the stale run through.
	 */
	if ( definition.scope === 'commit' && ( update.body || current ) ) {
		if ( ! update.sha || ! headSha ) {
			return {
				rejected:
					'A commit-scoped section needs both its own commit and the current head.',
			};
		}

		if ( update.sha !== headSha && update.sha !== current?.sha ) {
			return {
				rejected: `Result is for ${ update.sha }, which is neither the head (${ headSha }) nor the commit already reported.`,
			};
		}
	}

	const body = sanitizeBody( update.body ).trim();
	const remaining = sections.filter(
		( section ) => section.id !== update.id
	);
	const next = body
		? [
				...remaining,
				{
					id: update.id,
					body,
					sha: definition.scope === 'commit' ? update.sha : undefined,
					runUrl:
						definition.scope === 'commit'
							? update.runUrl
							: undefined,
				},
		  ]
		: remaining;

	if ( next.length === 0 ) {
		return { remove: Boolean( existing ) };
	}

	return { body: renderComment( next, headSha ) };
}
