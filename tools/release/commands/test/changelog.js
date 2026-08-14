jest.mock( '@octokit/rest' );
jest.mock( '../../lib/milestone' );
jest.mock( '../../lib/logger', () => ( {
	log: jest.fn(),
	warn: jest.fn(),
	formats: {
		title: jest.fn( ( message ) => message ),
		error: jest.fn( ( message ) => message ),
		warning: jest.fn( ( message ) => message ),
	},
} ) );

import {
	getNormalizedTitle,
	reword,
	addTrailingPeriod,
	createOmitByTitlePrefix,
	createOmitByLabel,
	capitalizeAfterColonSeparatedPrefix,
	getIssueType,
	sortGroup,
	skipCreatedByBots,
	getTypesByLabels,
	getTypesByTitle,
	getIssueFeature,
	getFormattedItemDescription,
	getUniqueByUsername,
	getChangelog,
	getContributorProps,
	getContributorsList,
	mapLabelsToFeatures,
	createChangelog,
	fetchAllPullRequests,
	getManualChangelogInstructions,
} from '../changelog';
import _pullRequests from './fixtures/pull-requests.json';
import botPullRequestFixture from './fixtures/bot-pull-requests.json';
const { Octokit } = require( '@octokit/rest' );
const {
	getMilestoneByTitle,
	getIssuesByMilestone,
} = require( '../../lib/milestone' );
const { log, warn } = require( '../../lib/logger' );

/**
 * pull-requests.json is a static snapshot of real data from the GitHub API.
 * We merge this with dummy fixture data for a "bot" pull request so as to
 * ensure future updates to the pull-requests.json doesn't reduce test coverage
 * of filtering out of bot PRs.
 * See: https://github.com/WordPress/gutenberg/pull/38777#discussion_r808992346.
 */
const pullRequests = _pullRequests.concat( botPullRequestFixture );

/**
 * Returns an Octokit stub for a repository without any release, so that
 * `--unreleased` runs find no previous release in the series.
 *
 * @return {Object} Octokit stub.
 */
const createOctokitWithoutReleases = () => ( {
	repos: {
		listReleases: {
			endpoint: {
				merge: jest.fn().mockReturnValue( {} ),
			},
		},
	},
	paginate: {
		iterator: jest.fn().mockReturnValue(
			( async function* () {
				yield { data: [] };
			} )()
		),
	},
} );

describe( 'createChangelog', () => {
	const settings = {
		owner: 'WordPress',
		repo: 'gutenberg',
		milestone: 'Gutenberg 23.5',
		unreleased: false,
	};

	beforeEach( () => {
		jest.clearAllMocks();
		Octokit.mockImplementation( () => ( {} ) );
	} );

	it( 'keeps successful changelog output unchanged', async () => {
		getMilestoneByTitle.mockResolvedValue( {
			number: 235,
			title: settings.milestone,
		} );
		getIssuesByMilestone.mockResolvedValue( pullRequests );

		await createChangelog( settings );

		expect( log ).toHaveBeenCalledTimes( 2 );
		expect( log ).toHaveBeenNthCalledWith(
			2,
			getChangelog( pullRequests ) +
				getContributorProps( pullRequests ) +
				getContributorsList( pullRequests )
		);
	} );

	it( 'does not swallow operational errors', async () => {
		getMilestoneByTitle.mockRejectedValue(
			new Error( 'GitHub request failed.' )
		);

		await expect( createChangelog( settings ) ).rejects.toThrow(
			'GitHub request failed.'
		);
		expect( log ).toHaveBeenCalledTimes( 1 );
	} );

	it( 'explains how to fill the notes in by hand when there are no unreleased pull requests', async () => {
		Octokit.mockImplementation( createOctokitWithoutReleases );
		getMilestoneByTitle.mockResolvedValue( {
			number: 235,
			title: settings.milestone,
		} );
		// An issue that is not a pull request, so no pull request is found.
		getIssuesByMilestone.mockResolvedValue( [ { number: 123 } ] );

		await createChangelog( { ...settings, unreleased: true } );

		expect( warn ).toHaveBeenCalledTimes( 1 );
		expect( log ).toHaveBeenCalledTimes( 2 );
		expect( log ).toHaveBeenNthCalledWith(
			2,
			getManualChangelogInstructions( settings.milestone )
		);
	} );
} );

describe( 'getManualChangelogInstructions', () => {
	it( 'includes the command that regenerates the notes for the milestone', () => {
		expect( getManualChangelogInstructions( 'Gutenberg 23.5' ) ).toContain(
			'npm run other:changelog -- --milestone="Gutenberg 23.5" --unreleased'
		);
	} );
} );

describe( 'fetchAllPullRequests', () => {
	it( 'resolves to an empty list when a milestone has no unreleased pull requests', async () => {
		const milestone = 'Gutenberg 23.5';

		getMilestoneByTitle.mockResolvedValue( {
			number: 235,
			title: milestone,
		} );
		getIssuesByMilestone.mockResolvedValue( [ { number: 123 } ] );

		await expect(
			fetchAllPullRequests( createOctokitWithoutReleases(), {
				owner: 'WordPress',
				repo: 'gutenberg',
				milestone,
				unreleased: true,
			} )
		).resolves.toEqual( [] );
	} );

	it( 'fails when a milestone has no pull requests at all', async () => {
		const milestone = 'Gutenberg 23.5';

		getMilestoneByTitle.mockResolvedValue( {
			number: 235,
			title: milestone,
		} );
		getIssuesByMilestone.mockResolvedValue( [ { number: 123 } ] );

		await expect(
			// Without `unreleased`, no release is looked up.
			fetchAllPullRequests(
				{},
				{
					owner: 'WordPress',
					repo: 'gutenberg',
					milestone,
					unreleased: false,
				}
			)
		).rejects.toThrow(
			'There are no pull requests associated with milestone "Gutenberg 23.5".'
		);
	} );
} );

describe( 'getNormalizedTitle', () => {
	const DEFAULT_ISSUE = {
		labels: [],
	};

	it.each( [
		[ 'adds period', 'Fixes a bug', 'Fixes a bug.' ],
		[ 'keeps period', 'Fixes a bug.', 'Fixes a bug.' ],
		[
			'avoids reword of joined terms',
			'e2e-tests: Improve test stability',
			'e2e-tests: Improve test stability.',
		],
		[
			'rewords',
			'Improve e2e url stability',
			'Improve end-to-end URL stability.',
		],
		[ 'capitalizes', 'fix bug', 'Fix bug.' ],
		[
			'removes redundant prefix',
			'Code quality: Enable import/no-unresolved ESLint rule for Gutenberg',
			'Enable import/no-unresolved ESLint rule for Gutenberg.',
			{
				...DEFAULT_ISSUE,
				labels: [ { name: '[Type] Code Quality' } ],
			},
		],
		[
			'removes redundant prefix with normalized type',
			'[Enhancement] Add ability to transform audio shortcodes to audio blocks',
			'Add ability to transform audio shortcodes to audio blocks.',
			{
				...DEFAULT_ISSUE,
				labels: [ { name: '[Type] Enhancement' } ],
			},
		],
	] )( '%s', ( _label, original, expected, issue = DEFAULT_ISSUE ) => {
		expect( getNormalizedTitle( original, issue ) ).toBe( expected );
	} );
} );

describe( 'addTrailingPeriod', () => {
	it( 'adds a period if missing', () => {
		const result = addTrailingPeriod( 'Fixes a bug' );

		expect( result ).toBe( 'Fixes a bug.' );
	} );

	it( 'does not add a period if already present', () => {
		const result = addTrailingPeriod( 'Fixes a bug.' );

		expect( result ).toBe( 'Fixes a bug.' );
	} );

	it( 'trims trailing whitespace before appending period', () => {
		const result = addTrailingPeriod( 'Fixes a bug ' );

		expect( result ).toBe( 'Fixes a bug.' );
	} );
} );

describe( 'createOmitByTitlePrefix', () => {
	it( 'returns identity if not containing matching prefix', () => {
		const result = createOmitByTitlePrefix( [ '[omIT]' ] )( 'Fix' );

		expect( result ).toBe( 'Fix' );
	} );

	it( 'returns undefined if given prefix', () => {
		const result = createOmitByTitlePrefix( [ '[omIT]' ] )( '[omit] Fix' );

		expect( result ).toBe( undefined );
	} );
} );

describe( 'createOmitByLabel', () => {
	it( 'returns identity if label is not assigned to issue', () => {
		const result = createOmitByLabel( [ 'Omit' ] )( 'Fix', { labels: [] } );

		expect( result ).toBe( 'Fix' );
	} );

	it( 'returns undefined if given prefix', () => {
		const result = createOmitByLabel( [ 'Omit' ] )( 'Fix', {
			labels: [ { name: 'Omit' } ],
		} );

		expect( result ).toBe( undefined );
	} );
} );

describe( 'reword', () => {
	it( 'avoids reword of joined terms', () => {
		const result = reword( 'e2e-tests: Improve test stability' );

		expect( result ).toBe( 'e2e-tests: Improve test stability' );
	} );

	it( 'rewords terms', () => {
		const result = reword( 'Improve e2e url stability' );

		expect( result ).toBe( 'Improve end-to-end URL stability' );
	} );
} );

describe( 'capitalizeAfterColonSeparatedPrefix', () => {
	it( 'capitalizes the last segment after a colon', () => {
		const result = capitalizeAfterColonSeparatedPrefix( 'blocks: fix bug' );

		expect( result ).toBe( 'blocks: Fix bug' );
	} );
} );

describe( 'getIssueType', () => {
	it( 'returns various if unable to find appropriate type by label', () => {
		const result = getIssueType( { labels: [] } );

		expect( result ).toBe( 'Various' );
	} );

	it( 'returns type by label', () => {
		const result = getIssueType( {
			labels: [ { name: '[Type] Code Quality' } ],
		} );

		expect( result ).toBe( 'Code Quality' );
	} );

	it( 'returns remapped type by label', () => {
		const result = getIssueType( { labels: [ { name: '[Type] Bug' } ] } );

		expect( result ).toBe( 'Bug Fixes' );
	} );

	it( 'prioritizes by group order', () => {
		const result = getIssueType( {
			labels: [ { name: '[Type] Task' }, { name: '[Type] Enhancement' } ],
		} );

		expect( result ).toBe( 'Enhancements' );
	} );

	it( 'prioritizes meta categories', () => {
		const result = getIssueType( {
			labels: [
				{ name: '[Type] Bug' },
				{ name: '[Type] Build Tooling' },
			],
		} );

		expect( result ).toBe( 'Tools' );
	} );
} );

describe( 'getIssueFeature', () => {
	it( 'returns "Uncategorized" as feature if there are no labels', () => {
		const result = getIssueFeature( { labels: [] } );

		expect( result ).toBe( 'Uncategorized' );
	} );

	it( 'falls back to "Uncategorized" when no label can classify the issue', () => {
		const result = getIssueFeature( {
			labels: [ { name: 'Some Label' } ],
		} );

		expect( result ).toBe( 'Uncategorized' );
	} );

	it.each( [
		[ '[Package] Element', 'Element' ],
		[ '[Package] Widget Dashboard', 'Widget Dashboard' ],
		[ '[Package] Boot', 'Boot' ],
		[ '[Tool] WP Scripts', 'WP Scripts' ],
		[ '[Package] Interface', 'Interface' ],
	] )(
		'uses an otherwise-unmapped %s label as a fallback category',
		( label, expected ) => {
			const result = getIssueFeature( {
				labels: [ { name: 'Some Label' }, { name: label } ],
			} );

			expect( result ).toEqual( expected );
		}
	);

	it( 'gives precedence to manual feature mapping', () => {
		const result = getIssueFeature( {
			labels: [
				{
					name: '[Block] Some Block', // 3. Block-specific label.
				},
				{
					name: '[Package] Edit Widgets', // 1. has explicit mapping.
				},
				{
					name: '[Feature] Some Feature', // 2. Feature label.
				},
				{
					name: '[Package] Another One',
				},
			],
		} );

		const mappingForPackageEditWidgets = 'Widgets Editor';

		expect( result ).toEqual( mappingForPackageEditWidgets );
	} );

	it( 'gives secondary priority to feature labels when manually mapped label is not present', () => {
		const result = getIssueFeature( {
			labels: [
				{
					name: '[Block] Some Block', // Block specific label.
				},
				{
					name: '[Package] This package',
				},
				{
					name: '[Feature] Cool Feature', // Should have priority despite presence of block specific label.
				},
				{
					name: '[Package] Another One',
				},
			],
		} );

		expect( result ).toEqual( 'Cool Feature' );
	} );

	it( 'gives tertiary priority to "Block Library" as feature for all PRs that have a block specific label (and where manually mapped or feature label not present)', () => {
		const result = getIssueFeature( {
			labels: [
				{
					name: '[Block] Some Block',
				},
				{
					name: '[Package] This package',
				},
				{
					name: '[Package] Another One',
				},
			],
		} );

		expect( result ).toEqual( 'Block Library' );
	} );
} );

describe( 'sortGroup', () => {
	it( 'returns groups in order', () => {
		const result = [
			'Code Quality',
			'Bug Fixes',
			'Various',
			'New APIs',
			'Enhancements',
			'Performance',
		].sort( sortGroup );

		expect( result ).toEqual( [
			'Enhancements',
			'New APIs',
			'Bug Fixes',
			'Performance',
			'Code Quality',
			'Various',
		] );
	} );
} );

describe( 'getTypesByLabels', () => {
	it( 'returns all normalized type candidates by type prefix. it is case insensitive', () => {
		const result = getTypesByLabels( [
			'[Type] Regression',
			'[Type] Bug',
			'[Package] Blocks',
			'[Type] performance',
		] );

		expect( result ).toEqual( [ 'Bug Fixes', 'Performance' ] );
	} );
} );

describe( 'mapLabelsToFeatures', () => {
	it( 'returns all normalized feature candidates case-insensitively', () => {
		const result = mapLabelsToFeatures( [
			'[Package] Commands',
			'[Package] Block Library',
			'[Feature] Link Editing',
			'[Feature] block Multi Selection',
			'[Type] Flaky Test',
		] );

		expect( result ).toEqual( [
			'Commands',
			'Block Library',
			'Block Editor',
			'Testing',
		] );
	} );
} );

describe( 'getTypesByTitle', () => {
	it.each( [
		[ 'Fix Typography panel rendering from style hooks' ],
		[ 'fix: unset max-width for reusable blocks' ],
		[
			'Bug fix "Cannot read property \'end\' of undefined" on babel-plugin-makepot #21466',
		],
		[ 'Editor: Fix "Attempt Recovery" error boundary handler' ],
		[ 'Fix/Remove edit gallery from media library modal' ],
		[ 'Fixes a broken dev doc example for plugin Sidebars' ],
	] )( 'returns bug type by title (%s)', ( title ) => {
		const result = getTypesByTitle( title );

		expect( result ).toEqual( [ 'Bug Fixes' ] );
	} );
} );

describe( 'getUniqueByUsername', () => {
	it( 'removes duplicate entries by username', () => {
		const entries = [
			{
				user: {
					login: '@user1',
				},
			},
			{
				user: {
					login: '@user1',
				},
			},
			{
				user: {
					login: '@user2',
				},
			},
			{
				user: {
					login: '@user3',
				},
			},
			{
				user: {
					login: '@user4',
				},
			},
		];

		const expected = [
			{
				user: {
					login: '@user1',
				},
			},
			{
				user: {
					login: '@user2',
				},
			},
			{
				user: {
					login: '@user3',
				},
			},
			{
				user: {
					login: '@user4',
				},
			},
		];
		expect( getUniqueByUsername( entries ) ).toEqual( expected );
	} );
} );

describe( 'skipCreatedByBots', () => {
	it( 'removes entries created by bots', () => {
		const entries = [
			{
				user: {
					login: '@user1',
					type: 'User',
				},
			},
			{
				user: {
					login: '@dependabot[bot]',
					type: 'Bot',
				},
			},
			{
				user: {
					login: '@user2',
					type: 'User',
				},
			},
			{
				user: {
					login: '@someotherrandombotusername',
					type: 'Bot',
				},
			},
			{
				user: {
					login: '@user3',
					type: 'User',
				},
			},
		];

		const expected = [
			{
				user: {
					login: '@user1',
					type: 'User',
				},
			},
			{
				user: {
					login: '@user2',
					type: 'User',
				},
			},
			{
				user: {
					login: '@user3',
					type: 'User',
				},
			},
		];
		expect( skipCreatedByBots( entries ) ).toEqual( expected );
	} );
} );

describe( 'getFormattedItemDescription', () => {
	it( 'creates a markdown formatted description', () => {
		const expected =
			'This is a test title and should have a link. ([123456](https://github.com/123456))';
		expect(
			getFormattedItemDescription(
				'This is a test title and should have a link.',
				123456,
				'https://github.com/123456'
			)
		).toEqual( expected );
	} );
} );

describe( 'getChangelog', () => {
	test( 'verify that the changelog is properly formatted', () => {
		// The fixture with the list of pull requests was generated by running the following command:
		// npm run other:changelog -- --milestone="Gutenberg 16.8"
		// The response from the `fetchAllPullRequests` call in the `getChangelog` method was stored in the JSON file.
		expect( getChangelog( pullRequests ) ).toMatchSnapshot();
	} );
} );

describe( 'getContributorProps', () => {
	test( 'verify that the contributors props are properly formatted', () => {
		// The fixture with the list of pull requests was generated by running the following command:
		// npm run other:changelog -- --milestone="Gutenberg 11.3"
		expect( getContributorProps( pullRequests ) ).toMatchSnapshot();
	} );
	test( 'do not include first time contributors section if there are not any', () => {
		expect(
			getContributorProps( pullRequests.slice( 0, 4 ) )
		).toMatchInlineSnapshot( `""` );
	} );
} );

describe( 'getContributorList', () => {
	test( 'verify that the contributors list is properly formatted', () => {
		// The fixture with the list of pull requests was generated by running the following command:
		// npm run other:changelog -- --milestone="Gutenberg 11.3"
		expect( getContributorsList( pullRequests ) ).toMatchSnapshot();
	} );
} );
