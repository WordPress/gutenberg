import {
	auditImmediateBackports,
	findVersionSection,
	parseChangelog,
	parsePackageTag,
	readReleaseLanes,
	subtractSemanticallyEquivalentBlocks,
} from '../historical-changelog-audit';
import {
	applyIndependentReviewResolutions,
	buildIndependentReviewRequirements,
	classifySectionNormalization,
	classifyPostpublishRestorations,
	classifyTransientDuplicateOccurrences,
	classifyUnreleasedNonShipments,
	compactFrozenAttributionEvidence,
	consolidateDuplicateDestinations,
	extractPullRequests,
	locateEquivalentBlock,
	pairHistoricalReplacements,
} from '../historical-changelog-ledger';
import {
	assertGeneratorReadyLedger,
	insertBlockGroup,
	insertVersionSection,
	partitionDestinationRows,
	preserveTerminalNewlines,
	removeLedgerBlock,
} from '../historical-changelog-generator';
import {
	blocksEquivalent,
	evaluateCandidateCorrection,
	explainFileDifference,
	mapCandidateChangesToLedger,
	mergeCandidateFile,
} from '../historical-changelog-comparator';
import { parseArgs as parseAuditArgs } from '../../audit-historical-package-changelogs';

describe( 'historical changelog audit', () => {
	describe( 'audit CLI', () => {
		it( 'accepts an explicit summary output path', () => {
			expect(
				parseAuditArgs( [
					'--summary-only',
					'--summary-output',
					'audit-summary.json',
				] )
			).toMatchObject( {
				summaryOnly: true,
				summaryOutputPath:
					expect.stringMatching( /audit-summary\.json$/ ),
			} );
		} );
	} );

	describe( 'candidate comparison', () => {
		it( 'applies non-overlapping candidate changes to frozen bytes', () => {
			const base = `## Unreleased

- Pending.

## 1.0.0 (2024-01-01)

- Released.
`;
			const frozen = base.replace( '- Pending.', '- New trunk work.' );
			const candidate = base.replace(
				'- Released.',
				'- Candidate correction.'
			);
			expect(
				mergeCandidateFile( frozen, base, candidate, 'fixture' )
			).toContain( '- New trunk work.\n\n## 1.0.0' );
			expect(
				mergeCandidateFile( frozen, base, candidate, 'fixture' )
			).toContain( '- Candidate correction.' );
		} );

		it( 'requires shared PR identity and token similarity', () => {
			expect(
				blocksEquivalent(
					{
						hash: 'a',
						text: '- Notice visual alignment ([#78231](https://github.com/WordPress/gutenberg/pull/78231))',
					},
					{
						hash: 'b',
						text: '- Breaking DOM changes to Notice actions ([#78231](https://github.com/WordPress/gutenberg/pull/78231))',
					}
				)
			).toBe( false );
		} );

		it( 'distinguishes exact and equivalent candidate satisfaction', () => {
			const block = {
				hash: 'unused',
				text: '- Fix wording ([#123](https://github.com/WordPress/gutenberg/pull/123))',
				subsection: null,
			};
			const parsed = parseChangelog( `## 2.0.0 (2024-02-01)

-   Fix wording ([#123](https://github.com/WordPress/gutenberg/pull/123))

## 1.0.0 (2024-01-01)
` );
			const result = evaluateCandidateCorrection(
				{
					id: 'row',
					filePath: 'CHANGELOG.md',
					operation: 'restore-entry',
					fromVersion: null,
					toVersion: '2.0.0',
					entry: { evidenceBlock: block, currentBlock: null },
				},
				parsed
			);
			expect( result.status ).toBe( 'satisfied-equivalent-bytes-differ' );
		} );

		it( 'explains exact block and heading differences', () => {
			const result = explainFileDifference(
				'CHANGELOG.md',
				'## 2.0.0 (2024-02-01)\n\n- Expected.\n',
				'## 2.0.0 (2024-02-02)\n\n- Candidate.\n'
			);
			expect( result.missingFromCandidate ).toHaveLength( 1 );
			expect( result.extraInCandidate ).toHaveLength( 1 );
			expect( result.headingDifferences ).toHaveLength( 1 );
		} );

		it( 'identifies a candidate source removal beyond a parallel restoration', () => {
			const block = {
				hash: 'entry',
				text: '- Parallel lane entry.',
			};
			const result = mapCandidateChangesToLedger(
				{
					moves: [
						{
							id: 'candidate:move',
							filePath: 'CHANGELOG.md',
							fromVersion: '2.0.0',
							toVersion: '1.9.1',
							block,
						},
					],
					additions: [],
					removals: [],
					headingChanges: [],
					byteOnlyFiles: [],
				},
				[
					{
						id: 'correction:restore',
						filePath: 'CHANGELOG.md',
						operation: 'restore-entry',
						fromVersion: null,
						toVersion: '1.9.1',
						entry: { evidenceBlock: block },
					},
				]
			);

			expect( result.unauthorized ).toMatchObject( [
				{
					candidateChangeId: 'candidate:move',
					status: 'mapped-destination-unauthorized-source-removal',
					correctionIds: [ 'correction:restore' ],
				},
			] );
		} );

		it( 'maps one shared heading to every authorizing correction', () => {
			const destinationSection = {
				heading: '## 1.9.1 (2024-01-02)',
			};
			const result = mapCandidateChangesToLedger(
				{
					moves: [],
					additions: [],
					removals: [],
					headingChanges: [
						{
							id: 'candidate:heading',
							filePath: 'CHANGELOG.md',
							version: '1.9.1',
							after: destinationSection.heading,
						},
					],
					byteOnlyFiles: [],
				},
				[ 'one', 'two' ].map( ( id ) => ( {
					id: `correction:${ id }`,
					filePath: 'CHANGELOG.md',
					toVersion: '1.9.1',
					destinationSection,
				} ) )
			);

			expect( result.ambiguous ).toEqual( [] );
			expect( result.mappings[ 0 ].status ).toBe(
				'mapped-shared-destination'
			);
		} );
	} );

	describe( 'parsePackageTag', () => {
		it( 'classifies stable tags with build metadata as stable', () => {
			expect(
				parsePackageTag( '@wordpress/data@10.1.0+backport.1' )
			).toMatchObject( {
				package: '@wordpress/data',
				version: '10.1.0+backport.1',
				stable: true,
			} );
		} );

		it( 'classifies prerelease tags as non-stable', () => {
			expect(
				parsePackageTag( '@wordpress/data@10.1.0-rc.1' ).stable
			).toBe( false );
		} );

		it( 'rejects malformed package tags', () => {
			expect( () => parsePackageTag( 'data@10.1.0' ) ).toThrow(
				'Malformed WordPress package tag'
			);
			expect( () =>
				parsePackageTag( '@wordpress/data@not-semver' )
			).toThrow( 'Invalid semantic version in tag' );
		} );
	} );

	describe( 'parseChangelog', () => {
		it( 'preserves multiline and nested list entries as atomic blocks', () => {
			const parsed = parseChangelog( `## Unreleased

### Enhancements

- First line.
  Continued line.
  - Nested item.
    Nested continuation.

- Second entry.

## 1.0.0 (2024-01-01)

- Released entry.
` );

			expect( parsed.sections[ 0 ].blocks ).toHaveLength( 2 );
			expect( parsed.sections[ 0 ].blocks[ 0 ] ).toMatchObject( {
				type: 'list-item',
				subsection: 'Enhancements',
				text: `- First line.
  Continued line.
  - Nested item.
    Nested continuation.`,
			} );
			expect( parsed.sections[ 1 ].blocks[ 0 ].text ).toBe(
				'- Released entry.'
			);
		} );

		it( 'adapts historical level-one, level-three, and master headings', () => {
			const parsed = parseChangelog( `## Master

- Pending.

### 1.0.0 (Unreleased)

Initial release.

# 0.9.0 (2018-01-01)

- Earlier release.
` );

			expect( parsed.sections ).toMatchObject( [
				{ unreleased: true, headingLevel: 2 },
				{
					version: '1.0.0',
					headingLevel: 3,
					annotation: 'Unreleased',
				},
				{ version: '0.9.0', headingLevel: 1 },
			] );
		} );

		it( 'preserves empty parallel patch-release headings', () => {
			const parsed = parseChangelog( `## Unreleased

## 2.0.1 (2024-01-02)

## 1.9.3 (2024-01-02)
` );

			expect( parsed.sections.map( ( section ) => section.key ) ).toEqual(
				[ 'Unreleased', '2.0.1', '1.9.3' ]
			);
			expect( parsed.sections[ 1 ].blocks ).toEqual( [] );
			expect( parsed.sections[ 2 ].blocks ).toEqual( [] );
		} );

		it( 'rejects duplicate headings unless diagnostics are requested', () => {
			const changelog = `## 1.0.0 (2024-01-01)

## 1.0.0 (2024-01-02)
`;

			expect( () => parseChangelog( changelog ) ).toThrow(
				'duplicate version heading 1.0.0'
			);
			expect(
				parseChangelog( changelog, 'fixture', {
					allowDuplicateVersions: true,
				} ).diagnostics
			).toMatchObject( [
				{ type: 'duplicate-version-heading', version: '1.0.0' },
			] );
		} );
	} );

	describe( 'readReleaseLanes', () => {
		it( 'rejects an empty frozen lane snapshot', () => {
			expect( () =>
				readReleaseLanes( '.', { schemaVersion: 1, lanes: [] } )
			).toThrow( 'Frozen release lanes must use schema version 1' );
		} );

		it( 'rejects mutable and prerelease lane names', () => {
			expect( () =>
				readReleaseLanes( '.', {
					schemaVersion: 1,
					lanes: [ { id: 'wp/next', sha: 'a'.repeat( 40 ) } ],
				} )
			).toThrow( 'Frozen release lane 1 is invalid' );
		} );
	} );

	describe( 'correction ledger identities', () => {
		it( 'subtracts carried-forward formatting variants without merging distinct entries', () => {
			const pullRequest =
				'https://github.com/WordPress/gutenberg/pull/67139';
			const previous = [
				{
					hash: 'old',
					text: `-  Prevent HEIC uploads ([#67139](${ pullRequest })).`,
				},
			];
			const carried = {
				hash: 'new',
				text: `-   Prevent HEIC uploads ([#67139](${ pullRequest })).`,
			};
			const distinct = {
				hash: 'distinct',
				text: `-   Refactor unrelated upload state ([#67139](${ pullRequest })).`,
			};

			expect(
				subtractSemanticallyEquivalentBlocks( [ carried ], previous )
			).toEqual( [] );
			expect(
				subtractSemanticallyEquivalentBlocks( [ distinct ], previous )
			).toMatchObject( [ { hash: 'distinct' } ] );
		} );

		it( 'accounts for a tag Unreleased entry with no package-tree transition', () => {
			const corrections = [
				{
					id: 'correction:unreleased',
					package: '@wordpress/components',
					filePath: 'packages/components/CHANGELOG.md',
					toVersion: '28.8.11',
					entry: { evidenceBlock: { text: '- Carried entry.' } },
					evidence: {
						method: 'stable-tag-unreleased-tree-shipment-candidate',
						unreleasedShipmentCandidateIds: [ 'candidate:one' ],
						wrongTag: { name: '@wordpress/components@28.8.10' },
						destinationTag: {
							name: '@wordpress/components@28.8.11',
						},
						logicalLane: '@wordpress/components:wp/6.7',
						shipmentProof: {
							status: 'proved-nonshipment',
							method: 'unchanged-implementation-blobs-across-stable-tag-transition',
						},
					},
				},
			];
			const exceptions = [];

			expect(
				classifyUnreleasedNonShipments( corrections, exceptions )
			).toBe( 1 );
			expect( corrections ).toEqual( [] );
			expect( exceptions ).toMatchObject( [
				{
					type: 'stable-tag-unreleased-entry-without-package-tree-transition',
					unreleasedShipmentCandidateIds: [ 'candidate:one' ],
				},
			] );
		} );

		it( 'extracts only Gutenberg pull request link identities', () => {
			expect(
				extractPullRequests(
					'- Fix ([#123](https://github.com/WordPress/gutenberg/pull/123)); see https://example.com/pull/456.'
				)
			).toEqual( [ '123' ] );
		} );

		it( 'pairs a citation-only historical replacement', () => {
			const common = {
				package: '@wordpress/example',
				filePath: 'packages/example/CHANGELOG.md',
				version: '1.0.0',
				publishSha: 'a'.repeat( 40 ),
				nextReleaseCutSha: 'b'.repeat( 40 ),
			};
			const result = pairHistoricalReplacements( [
				{
					...common,
					id: 'added',
					type: 'block-added-before-next-release-cut',
					block: {
						text: '- Fix a thing ([#123](https://github.com/WordPress/gutenberg/pull/123)).',
					},
				},
				{
					...common,
					id: 'removed',
					type: 'block-removed-before-next-release-cut',
					block: { text: '- Fix a thing (#123).' },
				},
			] );

			expect( result.replacements ).toHaveLength( 1 );
			expect( result.unpairedAdditions ).toEqual( [] );
			expect( result.unpairedRemovals ).toEqual( [] );
		} );

		it( 'locates a rewritten entry by pull request and token similarity', () => {
			const parsed = parseChangelog( `## 1.0.0 (2024-01-01)

- Fix the detailed problem ([#123](https://github.com/WordPress/gutenberg/pull/123)).
` );
			const match = locateEquivalentBlock( parsed.sections[ 0 ], {
				hash: 'not-an-exact-hash',
				text: '- Fix problem ([#123](https://github.com/WordPress/gutenberg/pull/123)).',
			} );

			expect( match ).toMatchObject( {
				status: 'found',
				identityMethod: 'pull-request-and-token-similarity',
				pullRequests: [ '123' ],
			} );
		} );

		it( 'does not equate distinct low-similarity notes from one pull request', () => {
			const parsed = parseChangelog( `## 2.0.0 (2024-02-01)

- Rework internal DOM structure and class names ([#123](https://github.com/WordPress/gutenberg/pull/123)).
` );
			const match = locateEquivalentBlock( parsed.sections[ 0 ], {
				hash: 'not-an-exact-hash',
				text: '- Align visual appearance, colors, and spacing ([#123](https://github.com/WordPress/gutenberg/pull/123)).',
			} );

			expect( match ).toMatchObject( { status: 'not-found' } );
		} );

		it( 'accepts a transient duplicate removed before the frozen baseline', () => {
			const corrections = [
				{
					id: 'correction:duplicate',
					package: '@wordpress/example',
					filePath: 'packages/example/CHANGELOG.md',
					fromVersion: '1.0.0',
					evidence: {
						method: 'exact-pre-next-cut-changelog-diff',
						immediateFindingIds: [],
						secondaryMutationIds: [ 'mutation:duplicate' ],
						wrongTag: { name: '@wordpress/example@1.0.0' },
						trunkNextReleaseCutSha: 'a'.repeat( 40 ),
						destinationTag: { name: '@wordpress/example@1.1.0' },
						shipmentProof: {
							entryEvidence: {
								precedingExactCount: 1,
								destinationExactCount: 2,
							},
						},
					},
					currentState: { wrongExactCount: 1 },
				},
			];
			const exceptions = [];

			classifyTransientDuplicateOccurrences( corrections, exceptions );

			expect( corrections ).toEqual( [] );
			expect( exceptions ).toMatchObject( [
				{
					type: 'transient-duplicate-occurrence-removed-before-baseline',
					publishedExactCount: 1,
					preNextCutExactCount: 2,
					frozenBaselineExactCount: 1,
				},
			] );
		} );

		it( 'consolidates duplicate destinations into one insertion', () => {
			const block = {
				hash: 'a'.repeat( 64 ),
				text: '- Published entry.',
			};
			const corrections = [
				{
					id: 'correction:move-a',
					disposition: 'proposed',
					operation: 'move-entry',
					filePath: 'packages/example/CHANGELOG.md',
					fromVersion: '1.1.0',
					toVersion: '1.0.0',
					entry: { currentBlock: { block } },
					evidence: {},
				},
				{
					id: 'correction:restore',
					disposition: 'proposed',
					operation: 'restore-entry',
					filePath: 'packages/example/CHANGELOG.md',
					fromVersion: null,
					toVersion: '1.0.0',
					entry: { evidenceBlock: block },
					evidence: {},
				},
				{
					id: 'correction:move-b',
					disposition: 'proposed',
					operation: 'move-entry',
					filePath: 'packages/example/CHANGELOG.md',
					fromVersion: '1.2.0',
					toVersion: '1.0.0',
					entry: { currentBlock: { block } },
					evidence: {},
				},
			];

			const result = consolidateDuplicateDestinations( corrections );

			expect( result ).toMatchObject( {
				groupCount: 1,
				removalOnlyCount: 2,
			} );
			expect(
				corrections.map( ( row ) => [ row.id, row.operation ] )
			).toEqual( [
				[ 'correction:move-a', 'remove-duplicate-entry' ],
				[ 'correction:restore', 'restore-entry' ],
				[ 'correction:move-b', 'remove-duplicate-entry' ],
			] );
			expect( corrections[ 0 ].toVersion ).toBe( '1.0.0' );
		} );

		it( 'compacts exhaustive frozen tag matches to immutable endpoints', () => {
			const corrections = [
				{
					evidence: {
						attributionStableMatches: [
							{
								publishSha: 'a'.repeat( 40 ),
								tag: '@wordpress/example@1.0.0',
								tagVersion: '1.0.0',
								observedSection: '0.9.0',
								identityMethod: 'exact-block-bytes',
							},
							{
								publishSha: 'b'.repeat( 40 ),
								tag: '@wordpress/example@2.0.0',
								tagVersion: '2.0.0',
								observedSection: '0.9.0',
								identityMethod: 'normalized-block-whitespace',
							},
						],
					},
				},
			];

			compactFrozenAttributionEvidence( corrections );

			expect( corrections[ 0 ].evidence ).not.toHaveProperty(
				'attributionStableMatches'
			);
			expect(
				corrections[ 0 ].evidence.attributionStableMatchSummary
			).toMatchObject( {
				count: 2,
				first: { tagVersion: '1.0.0' },
				last: { tagVersion: '2.0.0' },
			} );
		} );

		it( 'accepts an evidenced postpublish restoration in its shipped version', () => {
			const corrections = [
				{
					id: 'correction:restoration',
					package: '@wordpress/example',
					filePath: 'packages/example/CHANGELOG.md',
					fromVersion: '1.0.0',
					entry: { evidenceBlock: { text: '- Restored entry.' } },
					evidence: {
						immediateFindingIds: [],
						secondaryMutationIds: [ 'mutation:restoration' ],
						precedingWrongTag: { name: '@wordpress/example@0.9.0' },
						wrongTag: { name: '@wordpress/example@1.0.0' },
						trunkNextReleaseCutSha: 'a'.repeat( 40 ),
						shipmentProof: {
							status: 'proved-restoration',
							entryEvidence: { precedingExactCount: 0 },
						},
					},
					currentState: { wrongMatch: 'found' },
				},
			];
			const exceptions = [];

			classifyPostpublishRestorations( corrections, exceptions );

			expect( corrections ).toEqual( [] );
			expect( exceptions ).toMatchObject( [
				{
					type: 'postpublish-entry-restoration-for-shipped-code',
					mutationId: 'mutation:restoration',
					version: '1.0.0',
				},
			] );
		} );

		it( 'classifies section reordering without hiding entry mutations', () => {
			const before = parseChangelog( `## 1.0.0 (2024-01-01)

### Enhancements

- First.

### Enhancements

- Second.
` ).sections[ 0 ];
			const after = parseChangelog( `## 1.0.0 (2024-01-01)

### Enhancements

- Second.
- First.
` ).sections[ 0 ];

			expect(
				classifySectionNormalization( before, after )
			).toMatchObject( {
				classification: 'entry-order-and-subsection-normalization',
				blockMultisetUnchanged: true,
				blockOrderEqual: false,
				subsectionHeadingsEqual: false,
			} );
		} );

		it( 'fails closed on missing or stale independent reviews', () => {
			const requirements = buildIndependentReviewRequirements(
				[
					{
						id: 'correction:uncited',
						package: '@wordpress/example',
						filePath: 'packages/example/CHANGELOG.md',
						operation: 'move-entry',
						fromVersion: '1.0.0',
						toVersion: '1.1.0',
						entry: {
							evidenceBlock: {
								hash: 'a'.repeat( 64 ),
								text: '- Uncited entry.',
							},
						},
						evidence: { shipmentProof: { method: 'tree-proof' } },
					},
				],
				[]
			);
			const baselineSha = 'b'.repeat( 40 );

			expect( requirements ).toHaveLength( 1 );
			expect( () =>
				applyIndependentReviewResolutions(
					requirements,
					{
						schemaVersion: 1,
						baselineSha,
						reviews: [],
					},
					baselineSha
				)
			).toThrow( 'omits 1 requirements' );
			expect( () =>
				applyIndependentReviewResolutions(
					requirements,
					{
						schemaVersion: 1,
						baselineSha,
						reviews: [
							{
								id: requirements[ 0 ].id,
								status: 'reviewed',
								evidenceHash: 'stale',
								rationale: 'Reviewed.',
							},
						],
					},
					baselineSha
				)
			).toThrow( 'has stale evidence' );
		} );
	} );

	describe( 'historical changelog generator', () => {
		it( 'preserves the frozen terminal-newline convention', () => {
			expect(
				preserveTerminalNewlines( '## Empty\n\n', '## Released\n' )
			).toBe( '## Empty\n' );
			expect(
				preserveTerminalNewlines( '## Empty\n', '## Released' )
			).toBe( '## Empty' );
		} );

		it( 'locates and inserts into the unique Unreleased section', () => {
			const content = `## Unreleased

### Bug Fixes

- Existing.

## 1.0.0 (2024-01-01)

- Released.
`;
			const parsed = parseChangelog( content );
			expect( findVersionSection( parsed, 'Unreleased' ).status ).toBe(
				'found'
			);
			const result = insertBlockGroup(
				content,
				'packages/example/CHANGELOG.md',
				'Unreleased',
				'Bug Fixes',
				[ { hash: 'new', text: '- Postpublish fix.' } ]
			);

			expect( result ).toContain(
				'- Existing.\n- Postpublish fix.\n\n## 1.0.0'
			);
		} );

		it( 'fails closed on zero coverage and pending reviews', () => {
			expect( () =>
				assertGeneratorReadyLedger( {
					schemaVersion: 1,
					baseline: { trunkSha: 'a'.repeat( 40 ) },
					corrections: [],
				} )
			).toThrow( 'non-empty schema-version-1 correction ledger' );
			expect( () =>
				assertGeneratorReadyLedger( {
					schemaVersion: 1,
					baseline: { trunkSha: 'a'.repeat( 40 ) },
					corrections: [
						{
							id: 'correction:one',
							disposition: 'proposed',
							operation: 'restore-entry',
							filePath: 'packages/example/CHANGELOG.md',
						},
					],
					summary: {
						unresolvedCorrectionCount: 0,
						pendingShipmentProofCount: 0,
						pendingIndependentReviewCount: 1,
					},
				} )
			).toThrow( 'pending independent reviews' );
		} );

		it( 'removes one exact atomic block without deleting headings', () => {
			const content = `## 1.0.0 (2024-01-01)

### Fixes

- Remove me.
- Preserve me.
`;
			const parsed = parseChangelog( content );
			const block = parsed.sections[ 0 ].blocks[ 0 ];
			const result = removeLedgerBlock( content, {
				id: 'correction:remove',
				filePath: 'packages/example/CHANGELOG.md',
				fromVersion: '1.0.0',
				entry: { currentBlock: { block } },
			} );

			expect( result ).toContain( '### Fixes' );
			expect( result ).not.toContain( 'Remove me.' );
			expect( result ).toContain( '- Preserve me.' );
		} );

		it( 'creates a missing subsection and inserts ordered blocks', () => {
			const result = insertBlockGroup(
				`## 1.0.0 (2024-01-01)

`,
				'packages/example/CHANGELOG.md',
				'1.0.0',
				'Enhancements',
				[
					{ hash: 'a', text: '- First.' },
					{ hash: 'b', text: '- Second.' },
				]
			);

			expect( result ).toBe( `## 1.0.0 (2024-01-01)

### Enhancements

- First.
- Second.

` );
		} );

		it( 'restores an empty parallel patch section in version order', () => {
			const result = insertVersionSection(
				`## Unreleased

## 2.0.0 (2024-02-01)

## 1.9.0 (2024-01-01)
`,
				{
					filePath: 'packages/example/CHANGELOG.md',
					toVersion: '1.9.1',
					section: { text: '## 1.9.1 (2024-01-15)\n\n' },
				}
			);

			expect( result.indexOf( '## 1.9.1' ) ).toBeLessThan(
				result.indexOf( '## 1.9.0' )
			);
			expect( parseChangelog( result ).sections ).toHaveLength( 4 );
		} );

		it( 'does not reinsert an entry already restored with its version section', () => {
			const block = parseChangelog( `## 2.0.1 (2024-02-02)

- Restored with section.
` ).sections[ 0 ].blocks[ 0 ];
			const row = {
				id: 'correction:restored-overlap',
				filePath: 'packages/example/CHANGELOG.md',
				toVersion: '2.0.1',
				entry: { evidenceBlock: block },
			};
			const parsed = parseChangelog( `## Unreleased

## 2.0.1 (2024-02-02)

- Restored with section.
` );

			expect( partitionDestinationRows( parsed, [ row ] ) ).toEqual( {
				satisfiedRows: [ row ],
				missingRows: [],
			} );
		} );
	} );

	describe( 'auditImmediateBackports', () => {
		it( 'rejects zero-event coverage', () => {
			expect( () =>
				auditImmediateBackports( {
					repositoryPath: '.',
					inventory: { events: [] },
				} )
			).toThrow( 'Immediate audit received zero events' );
		} );

		it( 'rejects zero-file coverage', () => {
			expect( () =>
				auditImmediateBackports( {
					repositoryPath: '.',
					inventory: {
						events: [
							{
								inAuditScope: true,
								classification: 'prepublish-changelog',
								publishSha: 'a'.repeat( 40 ),
								changelogCommitSha: 'b'.repeat( 40 ),
								releaseSourceSha: 'c'.repeat( 40 ),
								releasedChangelogSha: 'd'.repeat( 40 ),
								changedChangelogs: [],
								tags: [],
								trunk: {
									pairingStatus: 'paired',
									preSha: 'e'.repeat( 40 ),
									postSha: 'f'.repeat( 40 ),
								},
							},
						],
					},
				} )
			).toThrow( 'Immediate audit covered zero changelog files' );
		} );
	} );
} );
