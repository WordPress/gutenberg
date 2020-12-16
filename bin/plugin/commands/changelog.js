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

/**
 * @typedef WPChangelogCommandOptions
 *
 * @property {string=} milestone Optional Milestone title.
 * @property {string=} token     Optional personal access token.
 */

/**
 * @typedef WPChangelogSettings
 *
 * @property {string}  owner     Repository owner.
 * @property {string}  repo      Repository name.
 * @property {string=} token     Optional personal access token.
 * @property {string}  milestone Milestone title.
 */

/**
 * Changelog normalization function, returning a string to use as title, or
 * undefined if entry should be omitted.
 *
 * @typedef {(text:string,issue:IssuesListForRepoResponseItem)=>string|undefined} WPChangelogNormalization
 */

/**
 * Mapping of label names to groups to be used in release notes,
 * intended to be more readable in the context of release notes.
 *
 * It's also used in:
 *
 * - merging multiple related groupings to a single heading
 * - prioritize which group is assigned if there are several candidates
 *
 * @type {Record<string,string>}
 */
const LABEL_MAPPING = {
	'[Block] Navigation': 'FSE: Block Navigation',
	'[Block] Query': 'FSE: Block Query',
	'[Block] Post Comments Count': 'FSE: Blocks',
	'[Block] Post Comments Form': 'FSE: Blocks',
	'[Block] Post Comments': 'FSE: Blocks',
	'[Block] Post Featured Image': 'FSE: Blocks',
	'[Block] Post Hierarchical Terms': 'FSE: Blocks',
	'[Block] Post Title': 'FSE: Blocks',
	'[Block] Site Logo': 'FSE: Blocks',
	'[Feature] Full Site Editing': 'FSE: Infrastructure',
	'Global Styles': 'FSE: Style System',
	'[Feature] Navigation Screen': 'Screen: Navigation',
	'[Feature] Widgets Screen': 'Screen: Wigdets',
	'[Package] Dependency Extraction Webpack Plugin': 'Tools',
	'[Package] Jest Puppeteer aXe': 'Tools',
	'[Package] E2E Tests': 'Tools',
	'[Package] E2E Test Utils': 'Tools',
	'[Package] Env': 'Tools',
	'[Package] ESLint plugin': 'Tools',
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
	'Accessibility',
	'Experiments',
	'FSE: Block Navigation',
	'FSE: Block Query',
	'FSE: Blocks',
	'FSE: Infrastructure',
	'FSE: Style System',
	'Screen: Navigation',
	'Screen: Wigdets',
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
 * Returns type candidates based on whether the given labels
 * are part of the allowed list.
 *
 * @param {string[]} labels
 *
 * @return {string[]} Type candidates.
 */
function getTypesByLabels( labels ) {
	return uniq(
		labels
			.filter( ( label ) =>
				Object.keys( LABEL_MAPPING ).includes( label )
			)
			.map( ( label ) => LABEL_MAPPING[ label ] )
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
 * Sort comparator, comparing two group titles.
 *
 * @param {string} a First group title.
 * @param {string} b Second group title.
 *
 * @return {number} Sort result.
 */
function sortType( a, b ) {
	const [ aIndex, bIndex ] = [ a, b ].map( ( title ) => {
		return Object.keys( LABEL_MAPPING ).indexOf( title );
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
	const issues = await getIssuesByMilestone(
		octokit,
		owner,
		repo,
		number,
		'closed'
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
		throw new Error(
			'There are no pull requests associated with the milestone.'
		);
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
