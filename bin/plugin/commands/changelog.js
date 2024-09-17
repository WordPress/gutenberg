/**
 * External dependencies
 */
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

const UNKNOWN_FEATURE_FALLBACK_NAME = 'Uncategorized';

/** @typedef {import('@octokit/rest')} GitHub */
/** @typedef {import('@octokit/rest').IssuesListForRepoResponseItem} IssuesListForRepoResponseItem */
/** @typedef {import('@octokit/rest').IssuesListMilestonesForRepoResponseItem} OktokitIssuesListMilestonesForRepoResponseItem */
/** @typedef {import('@octokit/rest').ReposListReleasesResponseItem} ReposListReleasesResponseItem */

/**
 * @typedef WPChangelogCommandOptions
 *
 * @property {string=}  milestone  Optional Milestone title.
 * @property {string=}  token      Optional personal access token.
 * @property {boolean=} unreleased Optional flag to only include issues that haven't been part of a release yet.
 */

/**
 * @typedef WPChangelogSettings
 *
 * @property {string}   owner      Repository owner.
 * @property {string}   repo       Repository name.
 * @property {string=}  token      Optional personal access token.
 * @property {string}   milestone  Milestone title.
 * @property {boolean=} unreleased Only include issues that have been closed since the milestone's latest release.
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
	'[Type] Developer Documentation': 'Documentation',
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
	'[Type] Automated Testing': 'Tools',
	'[Package] Dependency Extraction Webpack Plugin': 'Tools',
	'[Type] Code Quality': 'Code Quality',
	'[Focus] Accessibility (a11y)': 'Accessibility',
	'[Type] Performance': 'Performance',
	'[Type] Security': 'Security',
	'[Feature] Navigation Screen': 'Experiments',
	'[Type] Experimental': 'Experiments',
	'[Type] Bug': 'Bug Fixes',
	'[Type] Regression': 'Bug Fixes',
	'[Type] Enhancement': 'Enhancements',
	'[Type] New API': 'New APIs',
	'[Type] Feature': 'Features',
};

/**
 * Mapping of label names to arbitary features in the release notes.
 *
 * Mapping a given label to a feature will guarantee it will be categorised
 * under that feature name in the changelog within each section.
 *
 * @type {Record<string,string>}
 */
const LABEL_FEATURE_MAPPING = {
	'[Feature] Widgets Screen': 'Widgets Editor',
	'[Feature] Widgets Customizer': 'Widgets Editor',
	'[Feature] Design Tools': 'Design Tools',
	'[Feature] UI Components': 'Components',
	'[Feature] Component System': 'Components',
	Storybook: 'Components',
	'[Feature] Template Editing Mode': 'Template Editor',
	'[Feature] Writing Flow': 'Block Editor',
	'[Feature] Pattern Directory': 'Patterns',
	'[Feature] Patterns': 'Patterns',
	'[Feature] Blocks': 'Block Library',
	'[Feature] Inserter': 'Block Editor',
	'[Feature] Interactivity API': 'Interactivity API',
	'[Feature] Drag and Drop': 'Block Editor',
	'[Feature] Block Multi Selection': 'Block Editor',
	'[Feature] Link Editing': 'Block Editor',
	'[Feature] Raw Handling': 'Block Editor',
	'[Package] Edit Post': 'Post Editor',
	'[Package] Icons': 'Icons',
	'[Package] Block editor': 'Block Editor',
	'[Package] Block library': 'Block Library',
	'[Package] Editor': 'Post Editor',
	'[Package] Edit Site': 'Site Editor',
	'[Package] Edit Widgets': 'Widgets Editor',
	'[Package] Widgets Customizer': 'Widgets Editor',
	'[Package] Components': 'Components',
	'[Package] Block Library': 'Block Library',
	'[Package] Rich text': 'Block Editor',
	'[Package] Data': 'Data Layer',
	'[Package] Commands': 'Commands',
	'[Block] Legacy Widget': 'Widgets Editor',
	'REST API Interaction': 'REST API',
	'New Block': 'Block Library',
	'[Package] E2E Tests': 'Testing',
	'[Package] E2E Test Utils': 'Testing',
	'[Type] Automated Testing': 'Testing',
	'CSS Styling': 'CSS & Styling',
	'developer-docs': 'Documentation',
	'[Type] Developer Documentation': 'Documentation',
	'Global Styles': 'Global Styles',
	'[Type] Build Tooling': 'Build Tooling',
	'npm Packages': 'npm Packages',
	'Gutenberg Plugin': 'Plugin',
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
	`Accessibility`,
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
 * Creates a pipe function. Performs left-to-right function composition, where
 * each successive invocation is supplied the return value of the previous.
 *
 * @param {Function[]} functions Functions to pipe.
 */
function pipe( functions ) {
	return ( /** @type {unknown[]} */ ...args ) => {
		return functions.reduce(
			( prev, func ) => [ func( ...prev ) ],
			args
		)[ 0 ];
	};
}

/**
 * Escapes the RegExp special characters.
 *
 * @param {string} string Input string.
 *
 * @return {string} Regex-escaped string.
 */
function escapeRegExp( string ) {
	return string.replace( /[\\^$.*+?()[\]{}|]/g, '\\$&' );
}

/**
 * Returns candidates based on whether the given labels
 * are part of the allowed list.
 *
 * @param {string[]} labels Label names.
 *
 * @return {string[]} Type candidates.
 */
function getTypesByLabels( labels ) {
	return [
		...new Set(
			labels
				.filter( ( label ) =>
					Object.keys( LABEL_TYPE_MAPPING )
						.map( ( currentLabel ) => currentLabel.toLowerCase() )
						.includes( label.toLowerCase() )
				)
				.map( ( label ) => {
					const lowerCaseLabel =
						Object.keys( LABEL_TYPE_MAPPING ).find(
							( key ) => key.toLowerCase() === label.toLowerCase()
						) || label;

					return LABEL_TYPE_MAPPING[ lowerCaseLabel ];
				} )
		),
	];
}

/**
 * Returns candidates by retrieving the appropriate mapping
 * from the label -> feature lookup.
 *
 * @param {string[]} labels Label names.
 *
 * @return {string[]} Feature candidates.
 */
function mapLabelsToFeatures( labels ) {
	return [
		...new Set(
			labels
				.filter( ( label ) =>
					Object.keys( LABEL_FEATURE_MAPPING )
						.map( ( currentLabel ) => currentLabel.toLowerCase() )
						.includes( label.toLowerCase() )
				)
				.map( ( label ) => {
					const lowerCaseLabel =
						Object.keys( LABEL_FEATURE_MAPPING ).find(
							( key ) => key.toLowerCase() === label.toLowerCase()
						) || label;

					return LABEL_FEATURE_MAPPING[ lowerCaseLabel ];
				} )
		),
	];
}

/**
 * Returns whether not the given labels contain the block specific
 * label "block library".
 *
 * @param {string[]} labels Label names.
 *
 * @return {boolean} whether or not the issue's is labbeled as block specific
 */
function getIsBlockSpecificIssue( labels ) {
	return !! labels.find( ( label ) => label.startsWith( '[Block] ' ) );
}

/**
 * Returns the first feature specific label from the given labels.
 *
 * @param {string[]} labels Label names.
 *
 * @return {string|undefined} the feature specific label.
 */
function getFeatureSpecificLabels( labels ) {
	return labels.find( ( label ) => label.startsWith( '[Feature] ' ) );
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
 * Returns the most appropriate feature category for the given issue based
 * on a basic heuristic.
 *
 * @param {IssuesListForRepoResponseItem} issue Issue object.
 *
 * @return {string} the feature name.
 */
function getIssueFeature( issue ) {
	const labels = issue.labels.map( ( { name } ) => name );

	const featureCandidates = mapLabelsToFeatures( labels );

	// 1. Prefer explicit mapping of label to feature.
	if ( featureCandidates.length ) {
		// Get occurances of the feature labels.
		const featureCounts = featureCandidates.reduce(
			/**
			 * @param {Record<string,number>} acc     Accumulator
			 * @param {string}                feature Feature label
			 */
			( acc, feature ) => ( {
				...acc,
				[ feature ]: ( acc[ feature ] || 0 ) + 1,
			} ),
			{}
		);

		// Check which matching label occurs most often.
		const rankedFeatures = Object.keys( featureCounts ).sort(
			( a, b ) => featureCounts[ b ] - featureCounts[ a ]
		);

		// Return the one that appeared most often.
		return rankedFeatures[ 0 ];
	}

	// 2. `[Feature]` labels.
	const featureSpecificLabel = getFeatureSpecificLabels( labels );

	if ( featureSpecificLabel ) {
		return removeFeaturePrefix( featureSpecificLabel );
	}

	// 3. Block specific labels.
	const blockSpecificLabels = getIsBlockSpecificIssue( labels );

	if ( blockSpecificLabels ) {
		return 'Block Library';
	}

	// Fallback - if we couldn't find a good match.
	return UNKNOWN_FEATURE_FALLBACK_NAME;
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
		return Object.values( LABEL_TYPE_MAPPING ).indexOf( title );
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
 * Higher-order function which returns a normalization function to omit by issue
 * label starting with any of the given prefixes
 *
 * @param {string[]} prefixes Label prefixes from which to determine if given entry
 *                            should be omitted.
 *
 * @return {WPChangelogNormalization} Normalization function.
 */
const createOmitByLabelPrefix = ( prefixes ) => ( text, issue ) =>
	issue.labels.some( ( label ) =>
		prefixes.some( ( prefix ) => label.name.startsWith( prefix ) )
	)
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
 * Removes any `[Feature] ` prefix from a given string.
 *
 * @param {string} text The string of text potentially containing a prefix.
 *
 * @return {string} the text without the prefix.
 */
function removeFeaturePrefix( text ) {
	return text.replace( '[Feature] ', '' );
}

/**
 * Array of normalizations applying to title, each returning a new string, or
 * undefined to indicate an entry which should be omitted.
 *
 * @type {Array<WPChangelogNormalization>}
 */
const TITLE_NORMALIZATIONS = [
	createOmitByLabelPrefix( [ 'Mobile App' ] ),
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
 * Returns a formatted changelog list item entry for a given issue object, or undefined
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
		: '- ' +
				getFormattedItemDescription(
					title,
					issue.number,
					issue.html_url
				);
}

/**
 * Builds a formatted string of the Issue/PR title with a link
 * to the GitHub URL for that item.
 *
 * @param {string} title  the title of the Issue/PR.
 * @param {number} number the ID/number of the Issue/PR.
 * @param {string} url    the URL of the GitHub Issue/PR.
 * @return {string} the formatted item
 */
function getFormattedItemDescription( title, number, url ) {
	return `${ title } ([${ number }](${ url }))`;
}

/**
 * Returns a formatted changelog entry for a given issue object and matching feature name, or undefined
 * if entry should be omitted.
 *
 * @param {IssuesListForRepoResponseItem} issue       Issue object.
 * @param {string}                        featureName Feature name.
 *
 * @return {string=} Formatted changelog entry, or undefined to omit.
 */
function getFeatureEntry( issue, featureName ) {
	return getEntry( issue )
		?.replace(
			new RegExp( `\\[${ featureName.toLowerCase() } \- `, 'i' ),
			'['
		)
		.replace(
			new RegExp( `(?<=^- )${ featureName.toLowerCase() }: `, 'i' ),
			''
		);
}

/**
 * Returns the latest release for a given series
 *
 * @param {GitHub} octokit Initialized Octokit REST client.
 * @param {string} owner   Repository owner.
 * @param {string} repo    Repository name.
 * @param {string} series  Gutenberg release series (e.g. '6.7' or '9.8').
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

	if ( ! issues.length ) {
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

	return issues.filter( ( issue ) => issue.pull_request );
}

/**
 * Formats the changelog string for a given list of pull requests.
 *
 * @param {IssuesListForRepoResponseItem[]} pullRequests List of pull requests.
 *
 * @return {string} The formatted changelog string.
 */
function getChangelog( pullRequests ) {
	let changelog = '## Changelog\n\n';

	const groupedPullRequests = skipCreatedByBots( pullRequests ).reduce(
		(
			/** @type {Record<string, IssuesListForRepoResponseItem[]>} */ acc,
			pr
		) => {
			const issueType = getIssueType( pr );
			if ( ! acc[ issueType ] ) {
				acc[ issueType ] = [];
			}
			acc[ issueType ].push( pr );
			return acc;
		},
		{}
	);

	const sortedGroups = Object.keys( groupedPullRequests ).sort( sortGroup );

	for ( const group of sortedGroups ) {
		const groupPullRequests = groupedPullRequests[ group ];
		const groupEntries = groupPullRequests
			.map( getEntry )
			.filter( Boolean );

		if ( ! groupEntries.length ) {
			continue;
		}

		// Start a new section within the changelog.
		changelog += '### ' + group + '\n\n';

		// Group PRs within this section into "Features".
		const featureGroups = groupPullRequests.reduce(
			(
				/** @type {Record<string, IssuesListForRepoResponseItem[]>} */ acc,
				pr
			) => {
				const issueFeature = getIssueFeature( pr );
				if ( ! acc[ issueFeature ] ) {
					acc[ issueFeature ] = [];
				}
				acc[ issueFeature ].push( pr );
				return acc;
			},
			{}
		);

		const featuredGroupNames = sortFeatureGroups( featureGroups );

		// Start output of Features within the section.
		featuredGroupNames.forEach( ( featureName ) => {
			const featureGroupPRs = featureGroups[ featureName ];

			const featureGroupEntries = featureGroupPRs
				.map( ( issue ) => getFeatureEntry( issue, featureName ) )
				.filter( Boolean )
				.sort();

			// Don't create feature sections when there are no PRs.
			if ( ! featureGroupEntries.length ) {
				return;
			}

			// Avoids double nesting such as "Documentation" feature under
			// the "Documentation" section.
			if (
				group !== featureName &&
				featureName !== UNKNOWN_FEATURE_FALLBACK_NAME
			) {
				// Start new <ul> for the Feature group.
				changelog += '#### ' + featureName + '\n';
			}

			// Add a <li> for each PR in the Feature.
			featureGroupEntries.forEach( ( entry ) => {
				// Add a new bullet point to the list.
				changelog += `${ entry }\n`;
			} );

			// Close the <ul> for the Feature group.
			changelog += '\n';
		} );

		changelog += '\n';
	}

	return changelog;
}

/**
 * Sorts the feature groups by the feature which contains the greatest number of PRs
 * ready for output into the changelog.
 *
 * @param {Object.<string, IssuesListForRepoResponseItem[]>} featureGroups feature specific PRs keyed by feature name.
 * @return {string[]} sorted list of feature names.
 */
function sortFeatureGroups( featureGroups ) {
	return Object.keys( featureGroups ).sort(
		( featureAName, featureBName ) => {
			// Sort "uncategorized" items to *always* be at the top of the section.
			if ( featureAName === UNKNOWN_FEATURE_FALLBACK_NAME ) {
				return -1;
			} else if ( featureBName === UNKNOWN_FEATURE_FALLBACK_NAME ) {
				return 1;
			}

			// Sort by greatest number of PRs in the group first.
			return (
				featureGroups[ featureBName ].length -
				featureGroups[ featureAName ].length
			);
		}
	);
}

/**
 * Returns a list of PRs created by first time contributors based on the GitHub
 * label associated with the PR. Also filters out any "bots".
 *
 * @param {IssuesListForRepoResponseItem[]} pullRequests List of pull requests.
 *
 * @return {IssuesListForRepoResponseItem[]} pullRequests List of first time contributor PRs.
 */
function getFirstTimeContributorPRs( pullRequests ) {
	return pullRequests.filter( ( pr ) => {
		return pr.labels.find(
			( { name } ) => name.toLowerCase() === 'first-time contributor'
		);
	} );
}

/**
 * Creates a set of markdown formatted list items for each first time contributor
 * and their associated PR.
 *
 * @param {IssuesListForRepoResponseItem[]} ftcPRs List of first time contributor PRs.
 *
 * @return {string} The formatted markdown list of contributors and their PRs.
 */
function getContributorPropsMarkdownList( ftcPRs ) {
	return ftcPRs.reduce( ( markdownList, pr ) => {
		const title = getNormalizedTitle( pr.title, pr ) || '';

		const formattedTitle = getFormattedItemDescription(
			title,
			pr.number,
			pr.pull_request.html_url
		);

		markdownList +=
			'- ' + '@' + pr.user.login + ': ' + formattedTitle + '\n';
		return markdownList;
	}, '' );
}

/**
 * Sorts a given Issue/PR by the username of the user who created.
 *
 * @param {IssuesListForRepoResponseItem[]} items List of pull requests.
 * @return {IssuesListForRepoResponseItem[]} The sorted list of pull requests.
 */
function sortByUsername( items ) {
	return [ ...items ].sort( ( a, b ) =>
		a.user.login.toLowerCase().localeCompare( b.user.login.toLowerCase() )
	);
}

/**
 * Removes duplicate PRs by the username of the user who created.
 *
 * @param {IssuesListForRepoResponseItem[]} items List of pull requests.
 * @return {IssuesListForRepoResponseItem[]} The list of pull requests unique per user.
 */
function getUniqueByUsername( items ) {
	/**
	 * @type {IssuesListForRepoResponseItem[]} List of pull requests.
	 */
	const EMPTY_PR_LIST = [];

	return items.reduce( ( acc, item ) => {
		if ( ! acc.some( ( i ) => i.user.login === item.user.login ) ) {
			acc.push( item );
		}
		return acc;
	}, EMPTY_PR_LIST );
}

/**
 * Excludes users who should not be included in the changelog.
 * Typically this is "bot" users.
 *
 * @param {IssuesListForRepoResponseItem[]} pullRequests List of pull requests.
 * @return {IssuesListForRepoResponseItem[]} The list of filtered pull requests.
 */
function skipCreatedByBots( pullRequests ) {
	return pullRequests.filter(
		( pr ) => pr.user.type.toLowerCase() !== 'bot'
	);
}

/**
 * Produces the formatted markdown for the contributor props seciton.
 *
 * @param {IssuesListForRepoResponseItem[]} pullRequests List of pull requests.
 *
 * @return {string} The formatted props section.
 */
function getContributorProps( pullRequests ) {
	const contributorsList = pipe( [
		skipCreatedByBots,
		getFirstTimeContributorPRs,
		getUniqueByUsername,
		sortByUsername,
		getContributorPropsMarkdownList,
	] )( pullRequests );

	if ( ! contributorsList ) {
		return '';
	}

	return (
		'## First-time contributors' +
		'\n\n' +
		'The following PRs were merged by first-time contributors:' +
		'\n\n' +
		contributorsList
	);
}

/**
 *
 * @param {IssuesListForRepoResponseItem[]} pullRequests List of first time contributor PRs.
 * @return {string} The formatted markdown list of contributor usernames.
 */
function getContributorsMarkdownList( pullRequests ) {
	return pullRequests
		.reduce( ( markdownList = '', pr ) => {
			markdownList += ` @${ pr.user.login }`;
			return markdownList;
		}, '' )
		.trim();
}

/**
 * Produces the formatted markdown for the full time contributors section of
 * the changelog output.
 *
 * @param {IssuesListForRepoResponseItem[]} pullRequests List of pull requests.
 *
 * @return {string} The formatted contributors section.
 */
function getContributorsList( pullRequests ) {
	const contributorsList = pipe( [
		skipCreatedByBots,
		getUniqueByUsername,
		sortByUsername,
		getContributorsMarkdownList,
	] )( pullRequests );

	return (
		'\n\n' +
		'## Contributors' +
		'\n\n' +
		'The following contributors merged PRs in this release:' +
		'\n\n' +
		contributorsList
	);
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

	const octokit = new Octokit( {
		auth: settings.token,
	} );

	let releaselog = '';

	try {
		const pullRequests = await fetchAllPullRequests( octokit, settings );

		const changelog = getChangelog( pullRequests );
		const contributorProps = getContributorProps( pullRequests );
		const contributorsList = getContributorsList( pullRequests );

		releaselog = releaselog.concat(
			changelog,
			contributorProps,
			contributorsList
		);
	} catch ( error ) {
		if ( error instanceof Error ) {
			releaselog = formats.error( error.stack );
		}
	}

	log( releaselog );
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

/** @type {NodeJS.Module} */ module.exports = {
	reword,
	capitalizeAfterColonSeparatedPrefix,
	createOmitByTitlePrefix,
	createOmitByLabel,
	createOmitByLabelPrefix,
	addTrailingPeriod,
	getNormalizedTitle,
	getReleaseChangelog,
	getIssueType,
	getIssueFeature,
	sortGroup,
	getTypesByLabels,
	getTypesByTitle,
	getFormattedItemDescription,
	getContributorProps,
	getContributorsList,
	getChangelog,
	getUniqueByUsername,
	skipCreatedByBots,
	mapLabelsToFeatures,
};
