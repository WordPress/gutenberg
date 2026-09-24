import { existsSync, readFileSync } from 'node:fs';
import { getEventPayload, getInput, getRepo, info, setFailed } from './core.ts';
import { GitHubAPI } from './github-api.ts';
import { isParseable, mergeSection } from './comment.ts';
import { getSection } from './sections.ts';

function resolvePrNumber(): number | undefined {
	const input = getInput( 'pr-number' );

	if ( input ) {
		const parsed = Number.parseInt( input, 10 );
		return Number.isNaN( parsed ) ? undefined : parsed;
	}

	/*
	 * `number` covers pull_request and pull_request_target, `issue` covers
	 * issue_comment. A push carries no pull request, so those callers have to
	 * pass `pr-number` themselves.
	 */
	const payload = getEventPayload();
	return payload.number ?? payload.issue?.number;
}

export function resolveBody(): string {
	const path = getInput( 'body-path' );

	if ( ! path ) {
		return getInput( 'body' );
	}

	/*
	 * Large or untrusted content travels as a file rather than a job output,
	 * which caps at 1MB and has to be escaped to survive the transfer. A
	 * producer with nothing to report uploads no artifact at all, so a missing
	 * file means "clear this section", not a mistake.
	 */
	if ( ! existsSync( path ) ) {
		info( `No body at ${ path }, clearing the section.` );
		return '';
	}

	return readFileSync( path, 'utf8' );
}

async function run() {
	const token = getInput( 'repo-token' );
	const section = getInput( 'section' );

	if ( ! token || ! section ) {
		setFailed( 'Both `repo-token` and `section` are required.' );
		return;
	}

	const definition = getSection( section );
	if ( ! definition ) {
		setFailed( `Unknown section "${ section }".` );
		return;
	}

	const prNumber = resolvePrNumber();
	if ( ! prNumber ) {
		setFailed(
			'No pull request to comment on. Pass `pr-number` on events without one.'
		);
		return;
	}

	const api = new GitHubAPI( token, getRepo() );
	const existing = await api.findComment( prNumber );

	if ( existing && ! isParseable( existing.body ) ) {
		setFailed(
			'The existing comment has an unbalanced section delimiter, leaving it untouched.'
		);
		return;
	}

	const body = resolveBody();

	/*
	 * Every write re-renders every section, including the footers marking a
	 * commit-scoped result as no longer current, so the head is needed
	 * whatever this section's own scope is. Letting a failure through to the
	 * outer handler skips the write: rendering without it would present every
	 * stale result as current.
	 */
	const headSha = await api.getHeadSha( prNumber );

	const {
		body: merged,
		remove,
		rejected,
	} = mergeSection(
		existing?.body,
		{
			id: section,
			body,
			sha: getInput( 'commit-sha' ) || undefined,
			runUrl: getInput( 'run-url' ) || undefined,
		},
		headSha
	);

	if ( rejected ) {
		info( `Skipped the "${ section }" section. ${ rejected }` );
		return;
	}

	if ( remove && existing ) {
		await api.deleteComment( existing.id );
		info( 'Removed the comment, its last section having gone.' );
		return;
	}

	if ( ! merged ) {
		info( `Nothing to report for the "${ section }" section.` );
		return;
	}

	const url = existing
		? await api.updateComment( existing.id, merged )
		: await api.createComment( prNumber, merged );

	info( `Wrote the "${ section }" section to ${ url }` );
}

export { run };
