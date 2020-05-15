/*
 * External dependencies
 */
const { groupBy } = require( 'lodash' );
const Octokit = require( '@octokit/rest' );

/*
 * Internal dependencies
 */
const { getNextMajorVersion } = require( '../lib/version' );
const { log, formats } = require( '../lib/logger' );
const config = require( '../config' );
// @ts-ignore
const manifest = require( '../../../package.json' );

/** @typedef {import('@octokit/rest')} GitHub */
/** @typedef {import('@octokit/rest').IssuesListForRepoResponseItem} IssuesListForRepoResponseItem */
/** @typedef {import('@octokit/rest').IssuesListMilestonesForRepoResponseItem} OktokitIssuesListMilestonesForRepoResponseItem */

/**
 * @typedef WPChangelogSettings
 *
 * @property {string}  owner     Repository owner.
 * @property {string}  repo      Repository name.
 * @property {string=} token     Optional personal access token.
 * @property {string}  milestone Milestone title.
 */

/**
 * Given a SemVer-formatted version string, returns an assumed milestone title
 * associated with that version.
 *
 * @see https://semver.org/
 *
 * @param {string} version Version string.
 *
 * @return {string} Milestone title.
 */
function getMilestone( version ) {
	const [ major, minor ] = version.split( '.' );

	return `Gutenberg ${ major }.${ minor }`;
}

/**
 * Returns a type label for a given issue object, or a default if type cannot
 * be determined.
 *
 * @param {IssuesListForRepoResponseItem} issue Issue object.
 *
 * @return {string} Type label.
 */
function getIssueType( issue ) {
	const typeLabel = issue.labels.find( ( label ) =>
		label.name.startsWith( '[Type] ' )
	);

	return typeLabel ? typeLabel.name.replace( /^\[Type\] /, '' ) : 'Various';
}

/**
 * Given an issue title, returns the title with normalization transforms
 * applied.
 *
 * @param {string} title Original title.
 *
 * @return {string} Normalized title.
 */
function getNormalizedTitle( title ) {
	if ( ! title.endsWith( '.' ) ) {
		title = title + '.';
	}

	return title;
}

/**
 * Returns a formatted changelog entry for a given issue object.
 *
 * @param {IssuesListForRepoResponseItem} issue Issue object.
 *
 * @return {string} Formatted changelog entry.
 */
function getEntry( issue ) {
	const title = getNormalizedTitle( issue.title );

	return `- ${ title } ([${ issue.number }](${ issue.html_url }))`;
}

/**
 * Returns a promise resolving to a milestone by a given title, if exists.
 *
 * @param {GitHub} octokit Initialized Octokit REST client.
 * @param {string} owner   Repository owner.
 * @param {string} repo    Repository name.
 * @param {string} title   Milestone title.
 *
 * @return {Promise<OktokitIssuesListMilestonesForRepoResponseItem|void>} Promise resolving to milestone, if exists.
 */
async function getMilestoneByTitle( octokit, owner, repo, title ) {
	const options = octokit.issues.listMilestonesForRepo.endpoint.merge( {
		owner,
		repo,
	} );

	/**
	 * @type {AsyncIterableIterator<import('@octokit/rest').Response<import('@octokit/rest').IssuesListMilestonesForRepoResponse>>}
	 */
	const responses = octokit.paginate.iterator( options );

	for await ( const response of responses ) {
		const milestones = response.data;
		for ( const milestone of milestones ) {
			if ( milestone.title === title ) {
				return milestone;
			}
		}
	}
}

/**
 * Returns a promise resolving to pull requests by a given milestone ID.
 *
 * @param {GitHub} octokit   Initialized Octokit REST client.
 * @param {string} owner     Repository owner.
 * @param {string} repo      Repository name.
 * @param {number} milestone Milestone ID.
 *
 * @return {Promise<IssuesListForRepoResponseItem[]>} Promise resolving to pull
 *                                                    requests for the given
 *                                                    milestone.
 */
async function getPullRequestsByMilestone( octokit, owner, repo, milestone ) {
	const options = octokit.issues.listForRepo.endpoint.merge( {
		owner,
		repo,
		milestone,
		state: 'closed',
	} );

	/**
	 * @type {AsyncIterableIterator<import('@octokit/rest').Response<import('@octokit/rest').IssuesListForRepoResponse>>}
	 */
	const responses = octokit.paginate.iterator( options );

	const pulls = [];

	for await ( const response of responses ) {
		const issues = response.data;
		pulls.push( ...issues.filter( ( issue ) => issue.pull_request ) );
	}

	return pulls;
}

/**
 * Returns a promise resolving to an array of pull requests associated with the
 * changelog settings object.
 *
 * @param {GitHub}              octokit  GitHub REST client.
 * @param {WPChangelogSettings} settings Changelog settings.
 *
 * @return {Promise<IssuesListForRepoResponseItem[]>} Promise resolving to array of
 *                                            pull requests.
 */
async function fetchAllPullRequests( octokit, settings ) {
	const { owner, repo, milestone: milestoneTitle } = settings;
	const milestone = await getMilestoneByTitle(
		octokit,
		owner,
		repo,
		milestoneTitle
	);

	if ( ! milestone ) {
		throw new Error(
			`Cannot find milestone by title: ${ settings.milestone }`
		);
	}

	const { number } = milestone;
	return getPullRequestsByMilestone( octokit, owner, repo, number );
}

/**
 * Returns a promise resolving to the changelog string for given settings.
 *
 * @param {WPChangelogSettings} settings Changelog settings.
 *
 * @return {Promise<string>} Promise resolving to changelog.
 */
async function getChangelog( settings ) {
	const octokit = new Octokit( {
		auth: settings.token,
	} );

	const pullRequests = await fetchAllPullRequests( octokit, settings );
	if ( ! pullRequests.length ) {
		throw new Error(
			'There are no pull requests associated with the milestone.'
		);
	}

	let changelog = '';

	const groupedPullRequests = groupBy( pullRequests, getIssueType );
	for ( const group of Object.keys( groupedPullRequests ) ) {
		changelog += '### ' + group + '\n\n';

		const groupPullRequests = groupedPullRequests[ group ];
		for ( const pullRequest of groupPullRequests ) {
			changelog += getEntry( pullRequest ) + '\n';
		}

		changelog += '\n';
	}

	return changelog;
}

/**
 * Generates and logs changelog for a milestone.
 *
 * @param {WPChangelogSettings} settings Changelog settings.
 */
async function createChangelog( settings ) {
	log(
		formats.title(
			`\n💃Preparing changelog for milestone: "${ settings.milestone }"\n\n`
		)
	);

	let changelog;
	try {
		changelog = await getChangelog( settings );
	} catch ( error ) {
		changelog = formats.error( error.stack );
	}

	log( changelog );
}

async function getReleaseChangelog( options ) {
	await createChangelog( {
		owner: config.githubRepositoryOwner,
		repo: config.githubRepositoryName,
		token: options.token,
		milestone:
			options.milestone === undefined
				? getMilestone( getNextMajorVersion( manifest.version ) )
				: options.milestone,
	} );
}

/** @type {NodeJS.Module} */ ( module ).exports = {
	getNormalizedTitle,
	getReleaseChangelog,
};
