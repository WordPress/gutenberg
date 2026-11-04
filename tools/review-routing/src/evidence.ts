import type { PullRequest } from './github.ts';

/*
 * Character budgets, at about four characters to a token. Together they stay
 * well inside the model's context, with room left for the questions.
 */
export const BUDGET = {
	description: 4000,
	fileList: 8000,
	perFile: 8000,
	diff: 40000,
};

export type EvidenceStats = {
	files: number;
	generated: number;
	trimmed: number;
	omitted: number;
	characters: number;
};

export type Evidence = {
	state: string;
	stats: EvidenceStats;
};

/**
 * Cuts text to a length at a line break, and marks the cut.
 *
 * @param text  Text to cut.
 * @param limit Maximum length.
 * @return The text, cut when it is longer than the limit.
 */
export function truncate( text: string, limit: number ): string {
	if ( text.length <= limit ) {
		return text;
	}

	const end = text.lastIndexOf( '\n', limit );
	return `${ text.slice( 0, end > 0 ? end : limit ) }\n[trimmed]`;
}

/**
 * Keeps only the hunk headers and the changed lines of a patch. Context lines
 * repeat code that did not change.
 *
 * @param patch Unified diff of one file.
 * @return The compacted patch.
 */
export function compactPatch( patch: string ): string {
	return patch
		.split( '\n' )
		.filter( ( line ) => /^(@@|\+|-)/.test( line ) )
		.join( '\n' );
}

/**
 * Removes the HTML comments that the pull request template leaves in a
 * description.
 *
 * @param body Pull request description.
 * @return The description without comments.
 */
export function stripComments( body: string ): string {
	return body
		.replace( /<!--[\s\S]*?-->/g, '' )
		.replace( /\n{3,}/g, '\n\n' )
		.trim();
}

/**
 * Builds the state that the decision model reads: the title, description,
 * file list and changed lines, each held to a budget. Generated files stay in
 * the file list, so the model knows they changed, but their diffs are noise.
 *
 * @param pull      Pull request.
 * @param generated Paths of the generated files in the pull request.
 * @return The state, and counts that describe what was left out.
 */
export function buildEvidence(
	pull: PullRequest,
	generated: Set< string >
): Evidence {
	const stats: EvidenceStats = {
		files: pull.files.length,
		generated: 0,
		trimmed: 0,
		omitted: 0,
		characters: 0,
	};
	const fileList: string[] = [];
	const diffs: string[] = [];
	let remaining = BUDGET.diff;

	for ( const file of pull.files ) {
		const isGenerated = generated.has( file.filename );
		fileList.push(
			`- ${ file.status } ${ file.filename } (+${ file.additions } -${
				file.deletions
			})${ isGenerated ? ' [generated]' : '' }`
		);

		if ( isGenerated ) {
			stats.generated++;
			continue;
		}

		if ( ! file.patch ) {
			continue;
		}

		if ( remaining <= 0 ) {
			stats.omitted++;
			continue;
		}

		const section = `### ${ file.filename }\n${ compactPatch(
			file.patch
		) }`;
		const limit = Math.min( BUDGET.perFile, remaining );
		if ( section.length > limit ) {
			stats.trimmed++;
		}

		const kept = truncate( section, limit );
		diffs.push( kept );
		remaining -= kept.length;
	}

	const description = truncate(
		stripComments( pull.body ),
		BUDGET.description
	);

	const state = [
		`# Pull request: ${ pull.title }`,
		pull.labels.length ? `Labels: ${ pull.labels.join( ', ' ) }` : '',
		'## Description',
		description || '(none)',
		`## Changed files (${ pull.files.length })`,
		truncate( fileList.join( '\n' ), BUDGET.fileList ),
		'## Changed lines (context lines removed)',
		diffs.join( '\n\n' ) || '(none)',
	]
		.filter( Boolean )
		.join( '\n\n' );

	stats.characters = state.length;

	return { state, stats };
}
