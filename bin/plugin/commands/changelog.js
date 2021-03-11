/**
 * External dependencies
 */
const { groupBy, escapeRegExp, uniq } = require( 'lodash' );
const Octokit = require( '@octokit/rest' );
const { sprintf } = require( 'sprintf-js' );
const semver = require( 'semver' );

/**
 * Internal dependencies
 */
const { getNextMajorVersion } = require( '../lib/version' );
const {
	getMilestoneByTitle,
	getIssuesByMilestone,
} = require( '../lib/milestone' );
const { log, formats } = require( '../lib/logger' );
const config = require( '../config' );
// @ts-ignore
const manifest = require( '../../../package.json' );

/** @typedef {import('@octokit/rest')} GitHub */
/** @typedef {import('@octokit/rest').IssuesListForRepoResponseItem} IssuesListForRepoResponseItem */
/** @typedef {import('@octokit/rest').IssuesListMilestonesForRepoResponseItem} OktokitIssuesListMilestonesForRepoResponseItem */
/** @typedef {import('@octokit/rest').ReposListReleasesResponseItem} ReposListReleasesResponseItem */

/**
 * @typedef WPChangelogCommandOptions
 *
 * @property {string=}  milestone   Optional Milestone title.
 * @property {string=}  token       Optional personal access token.
 * @property {boolean=} unreleased  Optional flag to only include issues that haven't been part of a release yet.
 */

/**
 * @typedef WPChangelogSettings
 *
 * @property {string}   owner       Repository owner.
 * @property {string}   repo        Repository name.
 * @property {string=}  token       Optional personal access token.
 * @property {string}   milestone   Milestone title.
 * @property {boolean=} unreleased  Only include issues that have been closed since the milestone's latest release.
 */

/**
 * Changelog normalization function, returning a string to use as title, or
 * undefined if entry should be omitted.
 *
 * @typedef {(text:string,issue:IssuesListForRepoResponseItem)=>string|undefined} WPChangelogNormalization
 */

/**
 * Mapping of label names to sections in the release notes.
 *
 * Labels are sorted by the priority they have when there are
 * multiple candidates. For example, if an issue has the labels
 * "[Block] Navigation" and "[Type] Bug", it'll be assigned the
 * section declared by "[Block] Navigation".
 *
 * @type {Record<string,string>}
 */
const LABEL_TYPE_MAPPING = {
	'[Block] Navigation': 'Experiments',
	'[Block] Query': 'Experiments',
	'[Block] Post Comments Count': 'Experiments',
	'[Block] Post Comments Form': 'Experiments',
	'[Block] Post Comments': 'Experiments',
	'[Block] Post Featured Image': 'Experiments',
	'[Block] Post Hierarchical Terms': 'Experiments',
	'[Block] Post Title': 'Experiments',
	'[Block] Site Logo': 'Experiments',
	'[Feature] Full Site Editing': 'Experiments',
	'Global Styles': 'Experiments',
	'[Feature] Navigation Screen': 'Experiments',
	'[Feature] Widgets Screen': 'Experiments',
	'[Package] Dependency Extraction Webpack Plugin': 'Tools',
	'[Package] Jest Puppeteer aXe': 'Tools',
	'[Package] E2E Tests': 'Tools',
	'[Package] E2E Test Utils': 'Tools',
	'[Package] Env': 'Tools',
	'[Package] ESLint plugin': 'Tools',
	'[Package] stylelint config': 'Tools',
	'[Package] Project management automation': 'Tools',
	'[Type] Project Management': 'Tools',
	'[Package] Scripts': 'Tools',
	'[Type] Build Tooling': 'Tools',
	'Automated Testing': 'Tools',
	'[Type] Experimental': 'Experiments',
	'[Type] Bug': 'Bug Fixes',
	'[Type] Regression': 'Bug Fixes',
	'[Type] Feature': 'Features',
	'[Type] Enhancement': 'Enhancements',
	'[Type] New API': 'New APIs',
	'[Type] Performance': 'Performance',
	'[Type] Documentation': 'Documentation',
	'[Type] Code Quality': 'Code Quality',
	'[Type] Security': 'Security',
};

/**
 * Order in which to print group titles. A value of `undefined` is used as slot
 * in which unrecognized headings are to be inserted.
 *
 * @type {Array<string|undefined>}
 */
const GROUP_TITLE_ORDER = [
	'Features',
	'Enhancements',
	'New APIs',
	'Bug Fixes',
	'Performance',
	'Experiments',
	'Documentation',
	'Code Quality',
	'Tools',
	undefined,
	'Various',
];

/**
 * Mapping of patterns to match a title to a grouping type.
 *
 * @type {Map<RegExp,string>}
 */
const TITLE_TYPE_PATTERNS = new Map( [
	[ /^(\w+:)?(bug)?\s*fix(es)?(:|\/ )?/i, 'Bug Fixes' ],
] );

/**
 * Map of common technical terms to a corresponding replacement term more
 * appropriate for release notes.
 *
 * @type {Record<string,string>}
 */
const REWORD_TERMS = {
	e2e: 'end-to-end',
	url: 'URL',
	config: 'configuration',
	docs: 'documentation',
};

/**
 * Returns candidates based on whether the given labels
 * are part of the allowed list.
 *
 * @param {string[]} labels Label names.
 *
 * @return {string[]} Type candidates.
 */
function getTypesByLabels( labels ) {
	return uniq(
		labels
			.filter( ( label ) =>
				Object.keys( LABEL_TYPE_MAPPING ).includes( label )
			)
			.map( ( label ) => LABEL_TYPE_MAPPING[ label ] )
	);
}

/**
 * Returns type candidates based on given issue title.
 *
 * @param {string} title Issue title.
 *
 * @return {string[]} Type candidates.
 */
function getTypesByTitle( title ) {
	const types = [];
	for ( const [ pattern, type ] of TITLE_TYPE_PATTERNS.entries() ) {
		if ( pattern.test( title ) ) {
			types.push( type );
		}
	}

	return types;
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
	const labels = issue.labels.map( ( { name } ) => name );
	const candidates = [
		...getTypesByLabels( labels ),
		...getTypesByTitle( issue.title ),
	];

	return candidates.length ? candidates.sort( sortType )[ 0 ] : 'Various';
}

/**
 * Sort comparator, comparing two label candidates.
 *
 * @param {string} a First candidate.
 * @param {string} b Second candidate.
 *
 * @return {number} Sort result.
 */
function sortType( a, b ) {
	const [ aIndex, bIndex ] = [ a, b ].map( ( title ) => {
		return Object.keys( LABEL_TYPE_MAPPING ).indexOf( title );
	} );

	return aIndex - bIndex;
}

/**
 * Sort comparator, comparing two group titles.
 *
 * @param {string} a First group title.
 * @param {string} b Second group title.
 *
 * @return {number} Sort result.
 */
function sortGroup( a, b ) {
	const [ aIndex, bIndex ] = [ a, b ].map( ( title ) => {
		const index = GROUP_TITLE_ORDER.indexOf( title );
		return index === -1 ? GROUP_TITLE_ORDER.indexOf( undefined ) : index;
	} );

	return aIndex - bIndex;
}

/**
 * Given a text string, appends a period if not already ending with one.
 *
 * @param {string} text Original text.
 *
 * @return {string} Text with trailing period.
 */
function addTrailingPeriod( text ) {
	return text.replace( /\s*\.?$/, '' ) + '.';
}

/**
 * Given a text string, replaces reworded terms.
 *
 * @param {string} text Original text.
 *
 * @return {string} Text with reworded terms.
 */
function reword( text ) {
	for ( const [ term, replacement ] of Object.entries( REWORD_TERMS ) ) {
		const pattern = new RegExp(
			'(^| )' + escapeRegExp( term ) + '( |$)',
			'ig'
		);
		text = text.replace( pattern, '$1' + replacement + '$2' );
	}

	return text;
}

/**
 * Given a text string, capitalizes the first letter of the last segment
 * following a colon.
 *
 * @param {string} text Original text.
 *
 * @return {string} Text with capitalizes last segment.
 */
function capitalizeAfterColonSeparatedPrefix( text ) {
	const parts = text.split( ':' );
	parts[ parts.length - 1 ] = parts[ parts.length - 1 ].replace(
		/^(\s*)([a-z])/,
		( _match, whitespace, letter ) => whitespace + letter.toUpperCase()
	);

	return parts.join( ':' );
}

/**
 * Higher-order function which returns a normalization function to omit by title
 * prefix matching any of the given prefixes.
 *
 * @param {string[]} prefixes Prefixes from which to determine if given entry
 *                            should be omitted.
 *
 * @return {WPChangelogNormalization} Normalization function.
 */
const createOmitByTitlePrefix = ( prefixes ) => ( title ) =>
	prefixes.some( ( prefix ) =>
		new RegExp( '^' + escapeRegExp( prefix ), 'i' ).test( title )
	)
		? undefined
		: title;

/**
 * Higher-order function which returns a normalization function to omit by issue
 * label matching any of the given label names.
 *
 * @param {string[]} labels Label names from which to determine if given entry
 *                          should be omitted.
 *
 * @return {WPChangelogNormalization} Normalization function.
 */
const createOmitByLabel = ( labels ) => ( text, issue ) =>
	issue.labels.some( ( label ) => labels.includes( label.name ) )
		? undefined
		: text;

/**
 * Given an issue title and issue, returns the title with redundant grouping
 * type details removed. The prefix is redundant since it would already be clear
 * enough by group assignment that the prefix would be inferred.
 *
 * @type {WPChangelogNormalization}
 *
 * @return {string} Title with redundant grouping type details removed.
 */
function removeRedundantTypePrefix( title, issue ) {
	const type = getIssueType( issue );

	return title.replace(
		new RegExp(
			`^\\[?${
				// Naively try to convert to singular form, to match "Bug Fixes"
				// type as either "Bug Fix" or "Bug Fixes" (technically matches
				// "Bug Fixs" as well).
				escapeRegExp( type.replace( /(es|s)$/, '' ) )
			}(es|s)?\\]?:?\\s*`,
			'i'
		),
		''
	);
}

/**
 * Array of normalizations applying to title, each returning a new string, or
 * undefined to indicate an entry which should be omitted.
 *
 * @type {Array<WPChangelogNormalization>}
 */
const TITLE_NORMALIZATIONS = [
	createOmitByLabel( [ 'Mobile App Android/iOS' ] ),
	createOmitByTitlePrefix( [ '[rnmobile]', '[mobile]', 'Mobile Release' ] ),
	removeRedundantTypePrefix,
	reword,
	capitalizeAfterColonSeparatedPrefix,
	addTrailingPeriod,
];

/**
 * Given an issue title, returns the title with normalization transforms
 * applied, or undefined to indicate that the entry should be omitted.
 *
 * @param {string}                        title Original title.
 * @param {IssuesListForRepoResponseItem} issue Issue object.
 *
 * @return {string|undefined} Normalized title.
 */
function getNormalizedTitle( title, issue ) {
	/** @type {string|undefined} */
	let normalizedTitle = title;
	for ( const normalize of TITLE_NORMALIZATIONS ) {
		normalizedTitle = normalize( normalizedTitle, issue );
		if ( normalizedTitle === undefined ) {
			break;
		}
	}

	return normalizedTitle;
}

/**
 * Returns a formatted changelog entry for a given issue object, or undefined
 * if entry should be omitted.
 *
 * @param {IssuesListForRepoResponseItem} issue Issue object.
 *
 * @return {string=} Formatted changelog entry, or undefined to omit.
 */
function getEntry( issue ) {
	const title = getNormalizedTitle( issue.title, issue );

	return title === undefined
		? title
		: `- ${ title } ([${ issue.number }](${ issue.html_url }))`;
}

/**
 * Returns the latest release for a given series
 *
 * @param {GitHub} octokit  Initialized Octokit REST client.
 * @param {string} owner    Repository owner.
 * @param {string} repo     Repository name.
 * @param {string} series   Gutenberg release series (e.g. '6.7' or '9.8').
 *
 * @return {Promise<ReposListReleasesResponseItem|undefined>} Promise resolving to pull
 *                                                            requests for the given
 *                                                            milestone.
 */
async function getLatestReleaseInSeries( octokit, owner, repo, series ) {
	const releaseOptions = await octokit.repos.listReleases.endpoint.merge( {
		owner,
		repo,
	} );

	let latestReleaseForMilestone;

	/**
	 * @type {AsyncIterableIterator<import('@octokit/rest').Response<import('@octokit/rest').ReposListReleasesResponse>>}
	 */
	const releases = octokit.paginate.iterator( releaseOptions );

	for await ( const releasesPage of releases ) {
		latestReleaseForMilestone = releasesPage.data.find( ( release ) =>
			release.name.startsWith( series )
		);

		if ( latestReleaseForMilestone ) {
			return latestReleaseForMilestone;
		}
	}
	return undefined;
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
	const { owner, repo, milestone: milestoneTitle, unreleased } = settings;
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

	const series = milestoneTitle.replace( 'Gutenberg ', '' );
	const latestReleaseInSeries = unreleased
		? await getLatestReleaseInSeries( octokit, owner, repo, series )
		: undefined;

	const { number } = milestone;
	const issues = await getIssuesByMilestone(
		octokit,
		owner,
		repo,
		number,
		'closed',
		latestReleaseInSeries ? latestReleaseInSeries.published_at : undefined
	);
	return issues.filter( ( issue ) => issue.pull_request );
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
		if ( settings.unreleased ) {
			throw new Error(
				'There are no unreleased pull requests associated with the milestone.'
			);
		} else {
			throw new Error(
				'There are no pull requests associated with the milestone.'
			);
		}
	}

	let changelog = '';

	const groupedPullRequests = groupBy( pullRequests, getIssueType );
	const sortedGroups = Object.keys( groupedPullRequests ).sort( sortGroup );
	for ( const group of sortedGroups ) {
		const groupPullRequests = groupedPullRequests[ group ];
		const groupEntries = groupPullRequests
			.map( getEntry )
			.filter( Boolean );

		if ( ! groupEntries.length ) {
			continue;
		}

		changelog += '### ' + group + '\n\n';
		groupEntries.forEach( ( entry ) => ( changelog += entry + '\n' ) );
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

/**
 * Command that generates the release changelog.
 *
 * @param {WPChangelogCommandOptions} options
 */
async function getReleaseChangelog( options ) {
	await createChangelog( {
		owner: config.githubRepositoryOwner,
		repo: config.githubRepositoryName,
		token: options.token,
		milestone:
			options.milestone === undefined
				? // Disable reason: valid-sprintf applies to `@wordpress/i18n` where
				  // strings are expected to need to be extracted, and thus variables are
				  // not allowed. This string will not need to be extracted.
				  // eslint-disable-next-line @wordpress/valid-sprintf
				  sprintf( config.versionMilestoneFormat, {
						...config,
						...semver.parse(
							getNextMajorVersion( manifest.version )
						),
				  } )
				: options.milestone,
		unreleased: options.unreleased,
	} );
}

/** @type {NodeJS.Module} */ ( module ).exports = {
	reword,
	capitalizeAfterColonSeparatedPrefix,
	createOmitByTitlePrefix,
	createOmitByLabel,
	addTrailingPeriod,
	getNormalizedTitle,
	getReleaseChangelog,
	getIssueType,
	sortGroup,
	getTypesByLabels,
	getTypesByTitle,
};
