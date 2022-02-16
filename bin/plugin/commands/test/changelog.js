/**
 * Internal dependencies
 */
import {
	getNormalizedTitle,
	reword,
	addTrailingPeriod,
	createOmitByTitlePrefix,
	createOmitByLabel,
	capitalizeAfterColonSeparatedPrefix,
	getIssueType,
	sortGroup,
	getTypesByLabels,
	getTypesByTitle,
	getIssueFeature,
	getFormattedItemDescription,
	getUniqueByUsername,
	getChangelog,
	getContributorProps,
	skipUsers,
} from '../changelog';
import pullRequests from './fixtures/pull-requests.json';

describe( 'getNormalizedTitle', () => {
	const DEFAULT_ISSUE = {
		labels: [],
	};

	it.each( [
		[ 'adds period', 'Fixes a bug', 'Fixes a bug.' ],
		[ 'keeps period', 'Fixes a bug.', 'Fixes a bug.' ],
		[
			'omits mobile by title',
			'[RNMoBILe] Address mobile concern',
			undefined,
		],
		[
			'omits mobile by issue',
			'Address mobile concern',
			undefined,
			{
				...DEFAULT_ISSUE,
				labels: [ { name: 'Mobile App Android/iOS' } ],
			},
		],
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
} );

describe( 'getIssueFeature', () => {
	it( 'returns "Unknown" as feature if there are no labels', () => {
		const result = getIssueFeature( { labels: [] } );

		expect( result ).toBe( 'Uncategorized' );
	} );

	it( 'falls by to "Unknown" as the feature if unable to classify by other means', () => {
		const result = getIssueFeature( {
			labels: [
				{
					name: 'Some Label',
				},
				{
					name: '[Package] Example Package', // 1. has explicit mapping
				},
				{
					name: '[Package] Another One',
				},
			],
		} );

		expect( result ).toEqual( 'Uncategorized' );
	} );

	it( 'gives precedence to manual feature mapping', () => {
		const result = getIssueFeature( {
			labels: [
				{
					name: '[Block] Some Block', // 3. Block-specific label
				},
				{
					name: '[Package] Edit Widgets', // 1. has explicit mapping
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
					name: '[Block] Some Block', // block specific label
				},
				{
					name: '[Package] This package',
				},
				{
					name: '[Feature] Cool Feature', // should have priority despite prescence of block specific label
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
	it( 'returns all normalized type candidates by type prefix', () => {
		const result = getTypesByLabels( [
			'[Type] Regression',
			'[Type] Bug',
			'[Package] Blocks',
			'[Type] Performance',
		] );

		expect( result ).toEqual( [ 'Bug Fixes', 'Performance' ] );
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

describe( 'skipUsers', () => {
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
		expect( skipUsers( entries ) ).toEqual( expected );
	} );
} );

describe( 'getChangelog', () => {
	test( 'verify that the changelog is properly formatted', () => {
		// The fixture with the list of pull requests was generated by running the following command:
		// npm run changelog -- --milestone="Gutenberg 11.3"
		// The response from the `fetchAllPullRequests` call in the `getChangelog` method was stored in the JSON file.
		expect( getChangelog( pullRequests ) ).toMatchSnapshot();
	} );
} );

describe( 'getContributorProps', () => {
	test( 'verify that the contributors list is properly formatted', () => {
		// The fixture with the list of pull requests was generated by running the following command:
		// npm run changelog -- --milestone="Gutenberg 11.3"
		expect( getContributorProps( pullRequests ) ).toMatchSnapshot();
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
