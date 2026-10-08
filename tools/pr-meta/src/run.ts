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
	 * issue_comment, and `pull_request` covers the review events, which carry
	 * no number of their own. A push has no pull request at all, so those
	 * callers have to pass `pr-number` themselves.
	 */
	const payload = getEventPayload();
	return (
		payload.number ?? payload.issue?.number ?? payload.pull_request?.number
	);
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
	const retire = getInput( 'retire-comments-matching' );
	const { comment: existing, retirable } = await api.findComments(
		prNumber,
		retire
	);

	if ( existing && ! isParseable( existing.body ) ) {
		setFailed(
			'The existing comment has an unbalanced section delimiter, leaving it untouched.'
		);
		return;
	}

	/*
	 * Every write re-renders every section, including the footers marking a
	 * commit-scoped result as no longer current, so the head is needed
	 * whatever this section's own scope is. Letting a failure through to the
	 * outer handler skips the write: rendering without it would present every
	 * stale result as current.
	 */
	const pullRequest = await api.getPullRequest( prNumber );

	/*
	 * A `pull_request_target` workflow comes from the default branch whatever
	 * a pull request targets, so a caller can reach a branch whose own writers
	 * are older than this and would re-cut the section on their next write.
	 */
	const requireBase = getInput( 'require-base' );
	if ( requireBase && pullRequest.baseRef !== requireBase ) {
		info(
			`Skipped the "${ section }" section: this pull request targets ${ pullRequest.baseRef }, not ${ requireBase }.`
		);
		return;
	}

	const body = resolveBody();

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
		pullRequest.headSha
	);

	if ( rejected ) {
		info( `Skipped the "${ section }" section. ${ rejected }` );
		return;
	}

	/*
	 * Once the section says what it should, including saying nothing, the
	 * standalone comment it replaced is only a second and drifting copy.
	 */
	const retireStandalone = async () => {
		for ( const id of retirable ) {
			await api.deleteComment( id );
			info( `Retired the standalone comment ${ id }.` );
		}
	};

	if ( remove && existing ) {
		await api.deleteComment( existing.id );
		info( 'Removed the comment, its last section having gone.' );
		await retireStandalone();
		return;
	}

	if ( ! merged ) {
		info( `Nothing to report for the "${ section }" section.` );
		await retireStandalone();
		return;
	}

	/* Props runs on every comment, so most writes change nothing. */
	if ( existing?.body === merged ) {
		info( `The "${ section }" section is already up to date.` );
		await retireStandalone();
		return;
	}

	const url = existing
		? await api.updateComment( existing.id, merged )
		: await api.createComment( prNumber, merged );

	info( `Wrote the "${ section }" section to ${ url }` );
	await retireStandalone();
}

export { run };
