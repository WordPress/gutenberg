const fs = require( 'fs' );
const os = require( 'os' );
const path = require( 'path' );
const { execFileSync } = require( 'child_process' );
const {
	findVersionSection,
	hashText,
	parseChangelog,
	readFilesAtCommits,
	runGit,
	serializeBlock,
} = require( './historical-changelog-audit' );

/**
 * Fails closed when external audit data violates a ledger invariant.
 *
 * @param {boolean} condition Whether the invariant is satisfied.
 * @param {string}  message   Failure message.
 */
function invariant( condition, message ) {
	if ( ! condition ) {
		throw new Error( message );
	}
}

/**
 * Extracts Gutenberg pull request identities from Markdown links.
 *
 * @param {string} text Atomic changelog block text.
 * @return {string[]} Sorted pull request numbers.
 */
function extractPullRequests( text ) {
	const pullRequests = new Set();
	const pattern = /github\.com\/WordPress\/gutenberg\/pull\/(\d+)/g;
	for ( const match of text.matchAll( pattern ) ) {
		pullRequests.add( match[ 1 ] );
	}
	return [ ...pullRequests ].sort(
		( left, right ) => Number( left ) - Number( right )
	);
}

/**
 * Returns normalized words for conservative historical-entry matching.
 *
 * @param {string} text Markdown block text.
 * @return {Set<string>} Normalized tokens.
 */
function tokenize( text ) {
	return new Set(
		text
			.toLowerCase()
			.replace( /https?:\/\/[^\s)]+/g, ' ' )
			.replace( /[^a-z0-9_]+/g, ' ' )
			.trim()
			.split( /\s+/ )
			.filter( Boolean )
	);
}

/**
 * Computes token-set similarity without treating line formatting as identity.
 *
 * @param {string} left  First block.
 * @param {string} right Second block.
 * @return {number} Jaccard similarity from zero through one.
 */
function tokenSimilarity( left, right ) {
	const leftTokens = tokenize( left );
	const rightTokens = tokenize( right );
	const union = new Set( [ ...leftTokens, ...rightTokens ] );
	if ( union.size === 0 ) {
		return 1;
	}
	let intersection = 0;
	for ( const token of leftTokens ) {
		if ( rightTokens.has( token ) ) {
			intersection++;
		}
	}
	return intersection / union.size;
}

/**
 * Returns the pull request identities shared by two blocks.
 *
 * @param {Object} left  First serialized block.
 * @param {Object} right Second serialized block.
 * @return {string[]} Shared pull requests.
 */
function sharedPullRequests( left, right ) {
	const rightPullRequests = new Set( extractPullRequests( right.text ) );
	return extractPullRequests( left.text ).filter( ( pullRequest ) =>
		rightPullRequests.has( pullRequest )
	);
}

/**
 * Pairs additions and removals that are wording, citation, or formatting
 * replacements of one released entry rather than release-attribution changes.
 *
 * @param {Object[]} mutations Secondary audit mutations.
 * @return {Object} Paired replacements and unpaired mutations.
 */
function pairHistoricalReplacements( mutations ) {
	const groups = new Map();
	for ( const mutation of mutations ) {
		if ( ! mutation.block ) {
			continue;
		}
		const key = JSON.stringify( [
			mutation.publishSha,
			mutation.filePath,
			mutation.version,
		] );
		if ( ! groups.has( key ) ) {
			groups.set( key, { additions: [], removals: [] } );
		}
		const group = groups.get( key );
		if ( mutation.type === 'block-added-before-next-release-cut' ) {
			group.additions.push( mutation );
		} else if (
			mutation.type === 'block-removed-before-next-release-cut'
		) {
			group.removals.push( mutation );
		}
	}

	const replacements = [];
	const pairedIds = new Set();
	for ( const group of groups.values() ) {
		const candidates = [];
		for ( const addition of group.additions ) {
			for ( const removal of group.removals ) {
				const shared = sharedPullRequests(
					addition.block,
					removal.block
				);
				const similarity = tokenSimilarity(
					addition.block.text,
					removal.block.text
				);
				if ( shared.length > 0 || similarity >= 0.72 ) {
					candidates.push( {
						addition,
						removal,
						shared,
						similarity,
						score: ( shared.length > 0 ? 2 : 0 ) + similarity,
					} );
				}
			}
		}
		candidates.sort(
			( left, right ) =>
				right.score - left.score ||
				left.addition.id.localeCompare( right.addition.id ) ||
				left.removal.id.localeCompare( right.removal.id )
		);
		for ( const candidate of candidates ) {
			if (
				pairedIds.has( candidate.addition.id ) ||
				pairedIds.has( candidate.removal.id )
			) {
				continue;
			}
			pairedIds.add( candidate.addition.id );
			pairedIds.add( candidate.removal.id );
			replacements.push( {
				id: `accepted-replacement:${ candidate.removal.id }`,
				type: 'accepted-historical-entry-replacement',
				filePath: candidate.removal.filePath,
				package: candidate.removal.package,
				version: candidate.removal.version,
				publishSha: candidate.removal.publishSha,
				nextReleaseCutSha: candidate.removal.nextReleaseCutSha,
				removedMutationId: candidate.removal.id,
				addedMutationId: candidate.addition.id,
				identityMethod:
					candidate.shared.length > 0
						? 'shared-pull-request-and-token-similarity'
						: 'token-similarity',
				pullRequests: candidate.shared,
				tokenSimilarity: Number( candidate.similarity.toFixed( 6 ) ),
				before: candidate.removal.block,
				after: candidate.addition.block,
				structuralReview: {
					status:
						candidate.shared.length > 0 &&
						candidate.similarity < 0.72
							? 'independent-review-required'
							: 'classified',
					method:
						candidate.shared.length > 0
							? 'same-version-shared-pull-request-one-to-one-pair'
							: 'same-version-high-token-similarity-one-to-one-pair',
				},
			} );
		}
	}

	return {
		replacements: replacements.sort( ( left, right ) =>
			left.id.localeCompare( right.id )
		),
		unpairedAdditions: mutations.filter(
			( mutation ) =>
				mutation.type === 'block-added-before-next-release-cut' &&
				! pairedIds.has( mutation.id )
		),
		unpairedRemovals: mutations.filter(
			( mutation ) =>
				mutation.type === 'block-removed-before-next-release-cut' &&
				! pairedIds.has( mutation.id )
		),
	};
}

/**
 * Returns immutable structural evidence for a section whose atomic entry
 * multiset did not change, while retaining heading, subsection, and ordering
 * differences that a hash-only exception would conceal.
 *
 * @param {Object} beforeSection Published version section.
 * @param {Object} afterSection  Later version section.
 * @return {Object} Exact structural classification.
 */
function classifySectionNormalization( beforeSection, afterSection ) {
	const beforeOrder = beforeSection.blocks.map( ( block ) => block.hash );
	const afterOrder = afterSection.blocks.map( ( block ) => block.hash );
	const beforeClassifiedOrder = beforeSection.blocks.map( ( block ) => [
		block.hash,
		block.subsection,
	] );
	const afterClassifiedOrder = afterSection.blocks.map( ( block ) => [
		block.hash,
		block.subsection,
	] );
	const beforeSubsections = beforeSection.subsections.map( ( subsection ) => [
		subsection.level,
		subsection.heading,
	] );
	const afterSubsections = afterSection.subsections.map( ( subsection ) => [
		subsection.level,
		subsection.heading,
	] );
	const equal = ( left, right ) =>
		JSON.stringify( left ) === JSON.stringify( right );
	const blockOrderEqual = equal( beforeOrder, afterOrder );
	const classifiedBlockOrderEqual = equal(
		beforeClassifiedOrder,
		afterClassifiedOrder
	);
	const subsectionHeadingsEqual = equal(
		beforeSubsections,
		afterSubsections
	);

	let classification = 'whitespace-only-normalization';
	if ( ! blockOrderEqual ) {
		classification = 'entry-order-and-subsection-normalization';
	} else if ( ! classifiedBlockOrderEqual || ! subsectionHeadingsEqual ) {
		classification = 'subsection-heading-normalization';
	} else if ( beforeSection.heading !== afterSection.heading ) {
		classification = 'version-heading-normalization';
	}

	return {
		classification,
		blockMultisetUnchanged: true,
		blockOrderEqual,
		classifiedBlockOrderEqual,
		subsectionHeadingsEqual,
		before: {
			heading: beforeSection.heading,
			subsections: beforeSubsections,
			blockOrder: beforeOrder,
			classifiedBlockOrder: beforeClassifiedOrder,
		},
		after: {
			heading: afterSection.heading,
			subsections: afterSubsections,
			blockOrder: afterOrder,
			classifiedBlockOrder: afterClassifiedOrder,
		},
	};
}

/**
 * Expands every section-byte exception with an exact structural comparison.
 * The originating auditors only emit these rows when the atomic entry
 * multiset is unchanged; this function verifies that invariant again.
 *
 * @param {string}   repositoryPath Repository path.
 * @param {Object[]} exceptions     Ledger exceptions.
 */
function attachSectionNormalizationEvidence( repositoryPath, exceptions ) {
	const rows = exceptions.filter( ( row ) =>
		[
			'accepted-immediate-section-byte-normalization',
			'accepted-released-section-byte-normalization',
		].includes( row.type )
	);
	const queries = rows.flatMap( ( row ) => [
		{ commitSha: row.publishSha, filePath: row.filePath },
		{
			commitSha: row.nextReleaseCutSha || row.trunkPostSha,
			filePath: row.filePath,
		},
	] );
	const files = readFilesAtCommits( repositoryPath, queries );

	for ( const row of rows ) {
		const afterSha = row.nextReleaseCutSha || row.trunkPostSha;
		const beforeContent = files.get(
			`${ row.publishSha }:${ row.filePath }`
		);
		const afterContent = files.get( `${ afterSha }:${ row.filePath }` );
		invariant(
			beforeContent !== null && beforeContent !== undefined,
			`Section normalization omits ${ row.filePath } at ${ row.publishSha }`
		);
		invariant(
			afterContent !== null && afterContent !== undefined,
			`Section normalization omits ${ row.filePath } at ${ afterSha }`
		);
		const beforeLookup = findVersionSection(
			parseChangelog(
				beforeContent,
				`${ row.publishSha }:${ row.filePath }`,
				{ allowDuplicateVersions: true }
			),
			row.version
		);
		const afterLookup = findVersionSection(
			parseChangelog( afterContent, `${ afterSha }:${ row.filePath }`, {
				allowDuplicateVersions: true,
			} ),
			row.version
		);
		invariant(
			beforeLookup.status === 'found' && afterLookup.status === 'found',
			`Section normalization cannot uniquely locate ${ row.filePath } ${ row.version }`
		);
		const beforeMultiset = beforeLookup.section.blocks
			.map( ( block ) => block.hash )
			.sort();
		const afterMultiset = afterLookup.section.blocks
			.map( ( block ) => block.hash )
			.sort();
		invariant(
			JSON.stringify( beforeMultiset ) ===
				JSON.stringify( afterMultiset ),
			`Section normalization changed atomic entries in ${ row.filePath } ${ row.version }`
		);
		row.structuralEvidence = classifySectionNormalization(
			beforeLookup.section,
			afterLookup.section
		);
	}
}

/**
 * Attaches exact or explicitly synthesized destination headings to corrections
 * whose proven release has no section in the frozen baseline. Historical
 * package publishes did not always update changelogs, so synthesis is based on
 * the immutable publish event rather than semantic-version assumptions.
 *
 * @param {Object}             options                Heading evidence options.
 * @param {string}             options.repositoryPath Repository path.
 * @param {Object}             options.inventory      Publish inventory.
 * @param {Object[]}           options.corrections    Correction rows.
 * @param {Map<string,Object>} options.parsedByPath   Frozen changelogs.
 */
function attachDestinationSectionEvidence( {
	repositoryPath,
	inventory,
	corrections,
	parsedByPath,
} ) {
	const rows = corrections.filter(
		( row ) =>
			row.disposition === 'proposed' &&
			row.toVersion &&
			getOptionalSection(
				parsedByPath.get( row.filePath ),
				row.toVersion
			) === null &&
			row.operation !== 'restore-version-section'
	);
	const queries = rows.map( ( row ) => ( {
		commitSha: row.evidence.destinationTag.publishSha,
		filePath: row.filePath,
	} ) );
	const files = readFilesAtCommits( repositoryPath, queries );
	const eventsBySha = new Map(
		inventory.events.map( ( event ) => [ event.publishSha, event ] )
	);
	const evidenceByDestination = new Map();

	for ( const row of rows ) {
		const destinationKey = JSON.stringify( [
			row.filePath,
			row.toVersion,
		] );
		if ( evidenceByDestination.has( destinationKey ) ) {
			row.destinationSection =
				evidenceByDestination.get( destinationKey );
			continue;
		}
		const destinationSha = row.evidence.destinationTag.publishSha;
		const content = files.get( `${ destinationSha }:${ row.filePath }` );
		invariant(
			content !== null && content !== undefined,
			`Destination heading evidence omits ${ row.filePath } at ${ destinationSha }`
		);
		const destination = parseChangelog(
			content,
			`${ destinationSha }:${ row.filePath }`,
			{ allowDuplicateVersions: true }
		);
		const lookup = findVersionSection( destination, row.toVersion );
		invariant(
			lookup.status !== 'ambiguous',
			`Destination tag has ambiguous heading ${ row.filePath } ${ row.toVersion }`
		);
		let evidence;
		if ( lookup.status === 'found' ) {
			evidence = {
				status: 'missing-in-frozen-baseline',
				method: 'exact-immutable-destination-tag-heading',
				heading: lookup.section.heading,
				headingLevel: lookup.section.headingLevel,
				sourceSha: destinationSha,
				destinationTag: row.evidence.destinationTag.name,
			};
		} else {
			const event = eventsBySha.get( destinationSha );
			invariant(
				event && /^\d{4}-\d{2}-\d{2}T/.test( event.authorDate ),
				`Destination heading lacks immutable publish metadata for ${ row.id }`
			);
			const baseline = parsedByPath.get( row.filePath );
			invariant(
				baseline,
				`Destination heading lacks frozen changelog ${ row.filePath }`
			);
			const headingLevel =
				baseline.sections.find( ( section ) => section.version )
					?.headingLevel || 2;
			const publishDate = event.authorDate.slice( 0, 10 );
			evidence = {
				status: 'missing-in-frozen-baseline',
				method: 'synthesized-from-immutable-publish-event-with-optional-historical-changelog-update',
				heading: `${ '#'.repeat( headingLevel ) } ${
					row.toVersion
				} (${ publishDate })`,
				headingLevel,
				sourceSha: destinationSha,
				destinationTag: row.evidence.destinationTag.name,
				publishDate,
				publishClassification: event.classification,
			};
		}
		evidence.headingHash = hashText( evidence.heading );
		evidenceByDestination.set( destinationKey, evidence );
		row.destinationSection = evidence;
	}
}

/**
 * Returns the unique atomic changelog blocks carried by a ledger row.
 *
 * @param {Object} row Correction or exception row.
 * @return {Object[]} Serialized blocks.
 */
function collectRowBlocks( row ) {
	const candidates = [
		row.entry?.evidenceBlock,
		row.entry?.currentBlock?.block,
		row.entry?.replacementBlock,
		...( row.section?.blocks || [] ),
		row.evidenceBlock,
		row.publishedBlock,
		row.currentBlock?.block || row.currentBlock,
		row.before,
		row.after,
	].filter( ( block ) => block && typeof block.text === 'string' );
	const seen = new Set();
	return candidates.filter( ( block ) => {
		const identity = block.hash || hashText( block.text );
		if ( seen.has( identity ) ) {
			return false;
		}
		seen.add( identity );
		return true;
	} );
}

/**
 * Promotes immutable-tag-to-baseline losses and byte rewrites into explicit
 * correction or exception rows. This closes the gap left by a next-release
 * sweep when a published section changes only after that exact cut.
 *
 * @param {Object}   options                Integration options.
 * @param {string}   options.repositoryPath Repository path.
 * @param {Object}   options.inventory      Publish inventory.
 * @param {Object}   options.frozen         Frozen mutation audit.
 * @param {Map}      options.parsedByPath   Frozen parsed changelogs.
 * @param {Object[]} options.corrections    Correction rows to extend.
 * @param {Object[]} options.exceptions     Exception rows to extend.
 * @return {Object} Integration summary and unresolved additions.
 */
function integrateFrozenMutationEvidence( {
	repositoryPath,
	inventory,
	frozen,
	parsedByPath,
	corrections,
	exceptions,
} ) {
	const mutations = frozen.mutations;
	invariant(
		Array.isArray( mutations ) && mutations.length > 0,
		'Frozen mutation integration requires non-empty mutation coverage'
	);
	const sectionKey = ( mutation ) =>
		JSON.stringify( [
			mutation.filePath,
			mutation.version,
			mutation.publishSha,
		] );
	const groups = new Map();
	for ( const mutation of mutations ) {
		const key = sectionKey( mutation );
		if ( ! groups.has( key ) ) {
			groups.set( key, [] );
		}
		groups.get( key ).push( mutation );
	}
	const publishedQueries = [
		...new Map(
			mutations.map( ( mutation ) => [
				`${ mutation.publishSha }:${ mutation.filePath }`,
				{
					commitSha: mutation.publishSha,
					filePath: mutation.filePath,
				},
			] )
		).values(),
	];
	const publishedFiles = readFilesAtCommits(
		repositoryPath,
		publishedQueries
	);
	const publishedParses = new Map();
	const getPublishedSection = ( mutation ) => {
		const key = `${ mutation.publishSha }:${ mutation.filePath }`;
		if ( ! publishedParses.has( key ) ) {
			const content = publishedFiles.get( key );
			invariant(
				content !== null && content !== undefined,
				`Frozen mutation evidence omits ${ key }`
			);
			publishedParses.set(
				key,
				parseChangelog( content, key, { allowDuplicateVersions: true } )
			);
		}
		const lookup = findVersionSection(
			publishedParses.get( key ),
			mutation.version
		);
		invariant(
			lookup.status === 'found',
			`Frozen mutation source section is not unique for ${ mutation.id }`
		);
		return lookup.section;
	};
	const eventBySha = new Map(
		inventory.events.map( ( event ) => [ event.publishSha, event ] )
	);
	const tagForMutation = ( mutation ) => {
		const event = eventBySha.get( mutation.publishSha );
		const tag = event?.tags.find(
			( candidate ) =>
				candidate.package === mutation.package &&
				candidate.version === mutation.version
		);
		invariant( event && tag, `Frozen mutation omits tag ${ mutation.id }` );
		return { event, tag };
	};

	let restoredSectionCount = 0;
	for ( const group of groups.values() ) {
		const headingMutation = group.find(
			( mutation ) =>
				mutation.type ===
				'published-version-heading-missing-from-frozen-baseline'
		);
		if ( ! headingMutation ) {
			continue;
		}
		const frozenMutationIds = group
			.filter(
				( mutation ) =>
					mutation === headingMutation ||
					mutation.type === 'block-removed-after-published-tag'
			)
			.map( ( mutation ) => mutation.id )
			.sort();
		const existing = corrections.find(
			( row ) =>
				row.operation === 'restore-version-section' &&
				row.filePath === headingMutation.filePath &&
				row.toVersion === headingMutation.version
		);
		if ( existing ) {
			existing.evidence.frozenMutationIds = [
				...new Set( [
					...( existing.evidence.frozenMutationIds || [] ),
					...frozenMutationIds,
				] ),
			].sort();
			continue;
		}
		if ( headingMutation.baselineStatus === 'ambiguous' ) {
			exceptions.push( {
				id: `accepted-ambiguous-frozen-heading:${ headingMutation.id }`,
				type: 'ambiguous-frozen-version-heading-preserved-for-manual-review',
				package: headingMutation.package,
				filePath: headingMutation.filePath,
				version: headingMutation.version,
				publishSha: headingMutation.publishSha,
				frozenMutationIds,
				publishedHeading: headingMutation.publishedHeading,
				structuralReview: { status: 'independent-review-required' },
			} );
			continue;
		}
		const section = getPublishedSection( headingMutation );
		const { event, tag } = tagForMutation( headingMutation );
		corrections.push( {
			id: `correction:${ headingMutation.id }`,
			disposition: 'proposed',
			operation: 'restore-version-section',
			package: headingMutation.package,
			filePath: headingMutation.filePath,
			fromVersion: null,
			fromSubsection: null,
			toVersion: headingMutation.version,
			toSubsection: null,
			entry: null,
			section: {
				heading: section.heading,
				text: section.text,
				hash: hashText( section.text ),
				blocks: section.blocks.map( ( block ) =>
					serializeBlock( block )
				),
			},
			evidence: {
				method: 'immutable-published-section-missing-from-frozen-baseline',
				immediateFindingIds: [],
				secondaryMutationIds: [],
				frozenMutationIds,
				wrongTag: null,
				trunkNextReleaseCutSha: inventory.baseline.trunkSha,
				destinationTag: {
					name: tag.name,
					publishSha: event.publishSha,
					version: tag.version,
					entryStatus: 'section-present-exact',
				},
				precedingDestinationTag: null,
				lane: event.primaryLaneId,
				releaseKind: 'published-section-restoration',
				shipmentProof: {
					status: 'proved-by-published-changelog',
					method: 'exact-tag-section-bytes',
				},
			},
			currentState: {
				wrongMatch: null,
				intendedMatch: 'section-missing',
				allLocationVersions: [],
				intendedHeadingPresent: false,
			},
		} );
		restoredSectionCount++;
	}

	const directMutationIds = new Set(
		[ ...corrections, ...exceptions ].flatMap( ( row ) => [
			...( row.frozenMutationIds || [] ),
			...( row.evidence?.frozenMutationIds || [] ),
		] )
	);
	const versionsForRow = ( row ) =>
		new Set(
			[
				row.fromVersion,
				row.toVersion,
				row.version,
				row.wrongVersion,
				row.intendedVersion,
				...( row.currentState?.allLocationVersions || [] ),
			].filter( Boolean )
		);
	const hasExactRow = ( mutation ) =>
		directMutationIds.has( mutation.id ) ||
		[ ...corrections, ...exceptions ].some(
			( row ) =>
				row.filePath === mutation.filePath &&
				versionsForRow( row ).has( mutation.version ) &&
				collectRowBlocks( row ).some(
					( block ) =>
						( block.hash || hashText( block.text ) ) ===
						mutation.block.hash
				)
		);
	let chainedReplacementCount = 0;
	for ( const group of groups.values() ) {
		const additions = group.filter(
			( mutation ) =>
				mutation.type === 'block-added-after-published-tag' &&
				! hasExactRow( mutation )
		);
		const removals = group.filter(
			( mutation ) =>
				mutation.type === 'block-removed-after-published-tag'
		);
		for ( const addition of additions ) {
			const candidates = [];
			for ( const removal of removals ) {
				const matchingRows = [ ...corrections, ...exceptions ].filter(
					( row ) =>
						row.filePath === removal.filePath &&
						versionsForRow( row ).has( removal.version ) &&
						collectRowBlocks( row ).some(
							( block ) =>
								( block.hash || hashText( block.text ) ) ===
								removal.block.hash
						)
				);
				const similarity =
					matchingRows.length === 1
						? Math.max(
								...collectRowBlocks( matchingRows[ 0 ] ).map(
									( block ) =>
										tokenSimilarity(
											addition.block.text,
											block.text
										)
								)
						  )
						: 0;
				if ( matchingRows.length === 1 && similarity >= 0.72 ) {
					candidates.push( {
						row: matchingRows[ 0 ],
						removal,
						similarity,
					} );
				}
			}
			candidates.sort(
				( left, right ) =>
					right.similarity - left.similarity ||
					left.row.id.localeCompare( right.row.id )
			);
			const best = candidates[ 0 ];
			const runnerUp = candidates[ 1 ];
			if (
				! best ||
				( runnerUp && best.similarity - runnerUp.similarity < 0.1 )
			) {
				continue;
			}
			best.row.evidence = best.row.evidence || {};
			best.row.evidence.frozenMutationIds = [
				...new Set( [
					...( best.row.evidence.frozenMutationIds || [] ),
					addition.id,
				] ),
			].sort();
			directMutationIds.add( addition.id );
			chainedReplacementCount++;
		}
	}
	const atomic = mutations.filter(
		( mutation ) => mutation.block && ! hasExactRow( mutation )
	);
	const atomicGroups = new Map();
	for ( const mutation of atomic ) {
		const key = sectionKey( mutation );
		if ( ! atomicGroups.has( key ) ) {
			atomicGroups.set( key, { additions: [], removals: [] } );
		}
		const group = atomicGroups.get( key );
		if ( mutation.type === 'block-added-after-published-tag' ) {
			group.additions.push( mutation );
		} else if ( mutation.type === 'block-removed-after-published-tag' ) {
			group.removals.push( mutation );
		}
	}
	const pairedMutationIds = new Set();
	let replacementCount = 0;
	for ( const group of atomicGroups.values() ) {
		const candidates = [];
		for ( const addition of group.additions ) {
			for ( const removal of group.removals ) {
				const shared = sharedPullRequests(
					addition.block,
					removal.block
				);
				const similarity = tokenSimilarity(
					addition.block.text,
					removal.block.text
				);
				if ( shared.length > 0 || similarity >= 0.72 ) {
					candidates.push( {
						addition,
						removal,
						shared,
						similarity,
						score: ( shared.length > 0 ? 2 : 0 ) + similarity,
					} );
				}
			}
		}
		candidates.sort(
			( left, right ) =>
				right.score - left.score ||
				left.addition.id.localeCompare( right.addition.id ) ||
				left.removal.id.localeCompare( right.removal.id )
		);
		for ( const candidate of candidates ) {
			if (
				pairedMutationIds.has( candidate.addition.id ) ||
				pairedMutationIds.has( candidate.removal.id )
			) {
				continue;
			}
			pairedMutationIds.add( candidate.addition.id );
			pairedMutationIds.add( candidate.removal.id );
			exceptions.push( {
				id: `accepted-frozen-replacement:${ candidate.removal.id }`,
				type: 'accepted-frozen-entry-replacement',
				package: candidate.removal.package,
				filePath: candidate.removal.filePath,
				version: candidate.removal.version,
				publishSha: candidate.removal.publishSha,
				frozenMutationIds: [
					candidate.addition.id,
					candidate.removal.id,
				].sort(),
				before: candidate.removal.block,
				after: candidate.addition.block,
				pullRequests: candidate.shared,
				tokenSimilarity: Number( candidate.similarity.toFixed( 6 ) ),
				structuralReview: {
					status:
						candidate.shared.length > 0 &&
						candidate.similarity < 0.72
							? 'independent-review-required'
							: 'classified',
				},
			} );
			replacementCount++;
		}
	}

	let restoredEntryCount = 0;
	let removedDuplicateCount = 0;
	const unresolvedAdditions = [];
	for ( const mutation of atomic ) {
		if ( pairedMutationIds.has( mutation.id ) ) {
			continue;
		}
		if ( mutation.type === 'block-added-after-published-tag' ) {
			const publishedSection = getPublishedSection( mutation );
			const baselineSection = getOptionalSection(
				parsedByPath.get( mutation.filePath ),
				mutation.version
			);
			const publishedExactCount = publishedSection.blocks.filter(
				( block ) => block.hash === mutation.block.hash
			).length;
			const baselineExactCount = baselineSection
				? baselineSection.blocks.filter(
						( block ) => block.hash === mutation.block.hash
				  ).length
				: 0;
			if (
				baselineSection &&
				baselineExactCount > publishedExactCount &&
				mutation.block.occurrence > publishedExactCount
			) {
				const { event, tag } = tagForMutation( mutation );
				corrections.push( {
					id: `correction:${ mutation.id }`,
					disposition: 'proposed',
					operation: 'remove-duplicate-entry',
					package: mutation.package,
					filePath: mutation.filePath,
					fromVersion: mutation.version,
					fromSubsection: mutation.block.subsection,
					toVersion: mutation.version,
					toSubsection: mutation.block.subsection,
					entry: {
						evidenceBlock: {
							...mutation.block,
							occurrence: 1,
						},
						currentBlock: {
							identityMethod: 'exact-extra-occurrence',
							pullRequests: extractPullRequests(
								mutation.block.text
							),
							tokenSimilarity: 1,
							block: mutation.block,
						},
					},
					evidence: {
						method: 'immutable-published-and-frozen-occurrence-counts',
						immediateFindingIds: [],
						secondaryMutationIds: [],
						frozenMutationIds: [ mutation.id ],
						wrongTag: {
							name: tag.name,
							publishSha: event.publishSha,
							version: tag.version,
						},
						trunkNextReleaseCutSha: inventory.baseline.trunkSha,
						destinationTag: {
							name: tag.name,
							publishSha: event.publishSha,
							version: tag.version,
						},
						precedingDestinationTag: null,
						lane: event.primaryLaneId,
						releaseKind: 'duplicate-occurrence-removal',
						shipmentProof: {
							status: 'proved',
							method: 'published-and-frozen-exact-occurrence-counts',
							entryEvidence: {
								publishedExactCount,
								frozenBaselineExactCount: baselineExactCount,
							},
						},
					},
					currentState: {
						wrongMatch: 'found',
						wrongExactCount: baselineExactCount,
						intendedMatch: 'found',
						allLocationVersions: [ mutation.version ],
						intendedHeadingPresent: true,
					},
				} );
				removedDuplicateCount++;
				continue;
			}
			unresolvedAdditions.push( mutation );
			continue;
		}
		const baseline = parsedByPath.get( mutation.filePath );
		const section = getOptionalSection( baseline, mutation.version );
		invariant(
			section,
			`Frozen removed entry lacks a destination section for ${ mutation.id }`
		);
		const { event, tag } = tagForMutation( mutation );
		corrections.push( {
			id: `correction:${ mutation.id }`,
			disposition: 'proposed',
			operation: 'restore-entry',
			package: mutation.package,
			filePath: mutation.filePath,
			fromVersion: null,
			fromSubsection: mutation.block.subsection,
			toVersion: mutation.version,
			toSubsection: mutation.block.subsection,
			entry: { evidenceBlock: mutation.block, currentBlock: null },
			evidence: {
				method: 'immutable-published-entry-missing-from-frozen-baseline',
				immediateFindingIds: [],
				secondaryMutationIds: [],
				frozenMutationIds: [ mutation.id ],
				wrongTag: null,
				trunkNextReleaseCutSha: inventory.baseline.trunkSha,
				destinationTag: {
					name: tag.name,
					publishSha: event.publishSha,
					version: tag.version,
					entryStatus: 'present-exact',
				},
				precedingDestinationTag: null,
				lane: event.primaryLaneId,
				releaseKind: 'published-entry-restoration',
				shipmentProof: {
					status: 'proved-by-published-changelog',
					method: 'exact-tag-section-bytes',
				},
			},
			currentState: {
				wrongMatch: null,
				intendedMatch: 'not-found',
				allLocationVersions: [],
				intendedHeadingPresent: true,
			},
		} );
		restoredEntryCount++;
	}

	let normalizationCount = 0;
	for ( const mutation of mutations.filter(
		( item ) =>
			item.type === 'released-section-byte-drift-after-published-tag'
	) ) {
		const beforeSection = getPublishedSection( mutation );
		const baseline = parsedByPath.get( mutation.filePath );
		const afterLookup = findVersionSection( baseline, mutation.version );
		invariant(
			afterLookup.status === 'found',
			`Frozen structural drift lacks a unique baseline section for ${ mutation.id }`
		);
		const structuralEvidence = classifySectionNormalization(
			beforeSection,
			afterLookup.section
		);
		invariant(
			structuralEvidence.blockMultisetUnchanged,
			`Frozen structural drift changed atomic blocks for ${ mutation.id }`
		);
		exceptions.push( {
			id: `accepted-frozen-byte-drift:${ mutation.id }`,
			type: 'accepted-frozen-section-byte-normalization',
			package: mutation.package,
			filePath: mutation.filePath,
			version: mutation.version,
			publishSha: mutation.publishSha,
			frozenMutationIds: [ mutation.id ],
			publishedSectionHash: mutation.publishedSectionHash,
			baselineSectionHash: mutation.baselineSectionHash,
			structuralEvidence,
		} );
		normalizationCount++;
	}

	return {
		restoredSectionCount,
		replacementCount,
		chainedReplacementCount,
		restoredEntryCount,
		removedDuplicateCount,
		normalizationCount,
		unresolvedAdditions,
	};
}

/**
 * Returns whether a row was accepted by a baseline-bound special-evidence
 * resolution whose tree predicates have already been validated.
 *
 * @param {Object} row Correction or exception row.
 * @return {boolean} Whether the row has reviewed special evidence.
 */
function hasReviewedSpecialEvidence( row ) {
	return (
		row.evidence?.shipmentProof?.method ===
			'reviewed-special-tree-evidence' ||
		row.evidence?.shipmentProof?.method ===
			'reviewed-postpublish-unreleased-evidence' ||
		row.evidence?.shipmentProof?.method ===
			'reviewed-stable-tag-unreleased-tree-evidence' ||
		row.evidence?.method === 'reviewed-special-tree-evidence'
	);
}

/**
 * Returns whether an accepted exception is a mechanical scope exclusion rather
 * than a historical assertion requiring independent content review.
 *
 * @param {Object} row Exception row.
 * @return {boolean} Whether the row is mechanically excluded.
 */
function isMechanicalScopeExclusion( row ) {
	return [
		'wrong-version-has-no-stable-package-tag',
		'package-changelog-absent-from-frozen-baseline',
	].includes( row.type );
}

/**
 * Builds stable review requirements for every uncited or otherwise special
 * row not already covered by the validated shipment-resolution manifest.
 *
 * @param {Object[]} corrections Correction rows.
 * @param {Object[]} exceptions  Exception rows.
 * @return {Object[]} Review requirements.
 */
function buildIndependentReviewRequirements( corrections, exceptions ) {
	const requirements = [];
	const add = ( category, row ) => {
		const blocks = collectRowBlocks( row );
		const introducingCommitShas = [
			...new Set(
				[
					...(
						row.evidence?.shipmentProof?.pullRequests || []
					).flatMap( ( proof ) => [
						...( proof.provedCandidates || [] ),
						...( proof.restoration?.provedCandidates || [] ),
					] ),
					...( row.evidence?.shipmentProof?.commitShas || [] ).map(
						( commitSha ) => ( { commitSha } )
					),
				]
					.map( ( candidate ) => candidate.commitSha )
					.filter( Boolean )
			),
		].sort();
		const evidence = {
			rowId: row.id,
			category,
			type: row.type || null,
			operation: row.operation || null,
			package: row.package,
			filePath: row.filePath,
			fromVersion: row.fromVersion || null,
			toVersion: row.toVersion || row.version || null,
			blockHashes: blocks
				.map( ( block ) => block.hash || hashText( block.text ) )
				.sort(),
			introducingCommitShas,
			tokenSimilarity: row.tokenSimilarity ?? null,
			structuralClassification:
				row.structuralEvidence?.classification || null,
			destinationSection:
				category === 'synthesized-destination-heading'
					? row.destinationSection
					: null,
		};
		requirements.push( {
			id: `review:${ category }:${ row.id }`,
			...evidence,
			evidenceHash: hashText( JSON.stringify( evidence ) ),
			status: 'pending',
		} );
	};

	for ( const row of corrections ) {
		const blocks = collectRowBlocks( row );
		if (
			blocks.length > 0 &&
			blocks.every(
				( block ) => extractPullRequests( block.text ).length === 0
			) &&
			! hasReviewedSpecialEvidence( row )
		) {
			add( 'uncited-correction', row );
		}
	}
	const reviewedDestinationSections = new Set();
	for ( const row of corrections ) {
		if (
			row.destinationSection?.method !==
			'synthesized-from-immutable-publish-event-with-optional-historical-changelog-update'
		) {
			continue;
		}
		const key = `${ row.filePath }:${ row.toVersion }`;
		if ( ! reviewedDestinationSections.has( key ) ) {
			reviewedDestinationSections.add( key );
			add( 'synthesized-destination-heading', row );
		}
	}
	for ( const row of exceptions ) {
		const blocks = collectRowBlocks( row );
		if (
			blocks.length > 0 &&
			blocks.every(
				( block ) => extractPullRequests( block.text ).length === 0
			) &&
			! hasReviewedSpecialEvidence( row ) &&
			! isMechanicalScopeExclusion( row )
		) {
			add( 'uncited-exception', row );
		}
		if (
			row.structuralReview?.status === 'independent-review-required' &&
			! isMechanicalScopeExclusion( row )
		) {
			add( 'low-similarity-replacement', row );
		}
		if (
			row.structuralEvidence?.classification ===
			'entry-order-and-subsection-normalization'
		) {
			add( 'structural-section-reordering', row );
		}
	}

	requirements.sort( ( left, right ) => left.id.localeCompare( right.id ) );
	invariant(
		new Set( requirements.map( ( row ) => row.id ) ).size ===
			requirements.length,
		'Independent review requirements contain duplicate IDs'
	);
	return requirements;
}

/**
 * Accounts for every immutable-tag-to-frozen-baseline mutation using exact
 * block identities or an explicit structural explanation. Structure rows that
 * accompany atomic mutations are derivative; structure-only rows require a
 * normalization, heading, or diagnostic ledger row.
 *
 * @param {Object}   frozen      Frozen-section audit.
 * @param {Object[]} corrections Correction rows.
 * @param {Object[]} exceptions  Accepted exception rows.
 * @return {Object} Deterministic per-mutation accounting.
 */
function accountFrozenMutations( frozen, corrections, exceptions ) {
	if ( ! frozen ) {
		return null;
	}
	invariant(
		Array.isArray( frozen.mutations ) && frozen.mutations.length > 0,
		'Frozen mutation accounting requires non-empty mutation coverage'
	);
	const rows = [ ...corrections, ...exceptions ];
	const blockRows = new Map();
	const sectionRows = new Map();
	const headingRows = new Map();
	const directRows = new Map();
	const addIndex = ( index, key, rowId ) => {
		if ( ! index.has( key ) ) {
			index.set( key, new Set() );
		}
		index.get( key ).add( rowId );
	};
	for ( const row of rows ) {
		for ( const mutationId of [
			...( row.frozenMutationIds || [] ),
			...( row.evidence?.frozenMutationIds || [] ),
		] ) {
			addIndex( directRows, mutationId, row.id );
		}
		const versions = new Set(
			[
				row.fromVersion,
				row.toVersion,
				row.version,
				row.wrongVersion,
				row.intendedVersion,
				...( row.currentState?.allLocationVersions || [] ),
			].filter( Boolean )
		);
		for ( const version of versions ) {
			addIndex(
				headingRows,
				JSON.stringify( [ row.filePath, version ] ),
				row.id
			);
			for ( const block of collectRowBlocks( row ) ) {
				addIndex(
					blockRows,
					JSON.stringify( [
						row.filePath,
						version,
						block.hash || hashText( block.text ),
					] ),
					row.id
				);
			}
		}
		const publishShas = [
			row.publishSha,
			row.evidence?.wrongTag?.publishSha,
			row.diagnostic?.publishSha,
		].filter( Boolean );
		for ( const publishSha of publishShas ) {
			for ( const version of versions ) {
				addIndex(
					sectionRows,
					JSON.stringify( [ row.filePath, version, publishSha ] ),
					row.id
				);
			}
		}
	}

	const atomicMutationIdsBySection = new Map();
	for ( const mutation of frozen.mutations ) {
		if ( ! mutation.block ) {
			continue;
		}
		const key = JSON.stringify( [
			mutation.filePath,
			mutation.version,
			mutation.publishSha,
		] );
		if ( ! atomicMutationIdsBySection.has( key ) ) {
			atomicMutationIdsBySection.set( key, [] );
		}
		atomicMutationIdsBySection.get( key ).push( mutation.id );
	}

	const accounting = frozen.mutations.map( ( mutation ) => {
		let method;
		let rowIds = [ ...( directRows.get( mutation.id ) || [] ) ];
		let supportingMutationIds = [];
		if ( rowIds.length > 0 ) {
			method = 'direct-frozen-mutation-ledger-row';
		} else if ( mutation.block ) {
			method = 'exact-atomic-block-ledger-row';
			rowIds = [
				...( blockRows.get(
					JSON.stringify( [
						mutation.filePath,
						mutation.version,
						mutation.block.hash,
					] )
				) || [] ),
			];
		} else if (
			mutation.type === 'released-section-byte-drift-after-published-tag'
		) {
			const sectionKey = JSON.stringify( [
				mutation.filePath,
				mutation.version,
				mutation.publishSha,
			] );
			supportingMutationIds =
				atomicMutationIdsBySection.get( sectionKey ) || [];
			if ( supportingMutationIds.length > 0 ) {
				method = 'derived-from-accounted-atomic-mutations';
			} else {
				method = 'explicit-structure-only-ledger-row';
				rowIds = [ ...( sectionRows.get( sectionKey ) || [] ) ];
			}
		} else if (
			mutation.type ===
			'published-version-heading-missing-from-frozen-baseline'
		) {
			method = 'explicit-heading-ledger-row';
			rowIds = [
				...( headingRows.get(
					JSON.stringify( [ mutation.filePath, mutation.version ] )
				) || [] ),
			];
		} else {
			method = 'unsupported-frozen-mutation-type';
		}
		return {
			mutationId: mutation.id,
			type: mutation.type,
			method,
			rowIds: rowIds.sort(),
			supportingMutationIds: supportingMutationIds.sort(),
			status:
				rowIds.length > 0 || supportingMutationIds.length > 0
					? 'accounted'
					: 'unexplained',
		};
	} );
	const unexplained = accounting.filter(
		( row ) => row.status === 'unexplained'
	);
	return {
		mutationCount: frozen.mutations.length,
		accountedCount: accounting.length - unexplained.length,
		unexplainedCount: unexplained.length,
		methodCounts: [
			...accounting.reduce( ( counts, row ) => {
				counts.set( row.method, ( counts.get( row.method ) || 0 ) + 1 );
				return counts;
			}, new Map() ),
		]
			.map( ( [ method, count ] ) => ( { method, count } ) )
			.sort( ( left, right ) =>
				left.method.localeCompare( right.method )
			),
		accounting,
	};
}

/**
 * Validates a baseline-bound independent review manifest and marks each exact
 * requirement reviewed. Extra, missing, or stale decisions fail closed.
 *
 * @param {Object[]} requirements Review requirements.
 * @param {?Object}  resolutions  Review manifest.
 * @param {string}   baselineSha  Frozen trunk SHA.
 */
function applyIndependentReviewResolutions(
	requirements,
	resolutions,
	baselineSha
) {
	if ( resolutions === null ) {
		return;
	}
	invariant(
		resolutions &&
			resolutions.schemaVersion === 1 &&
			resolutions.baselineSha === baselineSha &&
			Array.isArray( resolutions.reviews ),
		'Independent review resolutions must use schema version 1 and match the frozen baseline'
	);
	const requirementsById = new Map(
		requirements.map( ( requirement ) => [ requirement.id, requirement ] )
	);
	const seen = new Set();
	for ( const review of resolutions.reviews ) {
		invariant(
			review &&
				typeof review.id === 'string' &&
				! seen.has( review.id ) &&
				review.status === 'reviewed' &&
				typeof review.evidenceHash === 'string' &&
				typeof review.rationale === 'string' &&
				review.rationale.length > 0,
			`Independent review ${ review?.id || '<unknown>' } is invalid`
		);
		seen.add( review.id );
		const requirement = requirementsById.get( review.id );
		invariant(
			requirement,
			`Independent review ${ review.id } does not match a requirement`
		);
		invariant(
			review.evidenceHash === requirement.evidenceHash,
			`Independent review ${ review.id } has stale evidence`
		);
		requirement.status = 'reviewed';
		requirement.rationale = review.rationale;
	}
	const pending = requirements.filter( ( row ) => row.status === 'pending' );
	invariant(
		pending.length === 0,
		`Independent review manifest omits ${ pending.length } requirements`
	);
}

/**
 * Locates one exact or conservatively equivalent block in a version section.
 *
 * @param {?Object} section       Parsed version section.
 * @param {Object}  evidenceBlock Serialized historical block.
 * @return {Object} Match status and evidence.
 */
function locateEquivalentBlock( section, evidenceBlock ) {
	if ( ! section ) {
		return { status: 'section-missing', matches: [] };
	}
	const exact = section.blocks.filter(
		( block ) => block.hash === evidenceBlock.hash
	);
	if ( exact.length === 1 ) {
		return {
			status: 'found',
			identityMethod: 'exact-bytes',
			block: exact[ 0 ],
			matches: exact,
		};
	}
	if ( exact.length > 1 ) {
		return { status: 'ambiguous-exact', matches: exact };
	}

	const pullRequests = extractPullRequests( evidenceBlock.text );
	if ( pullRequests.length === 0 ) {
		return { status: 'not-found', matches: [] };
	}
	const candidates = section.blocks
		.map( ( block ) => ( {
			block,
			shared: sharedPullRequests( evidenceBlock, block ),
			similarity: tokenSimilarity( evidenceBlock.text, block.text ),
		} ) )
		.filter(
			( candidate ) =>
				candidate.shared.length > 0 && candidate.similarity >= 0.5
		)
		.sort(
			( left, right ) =>
				right.similarity - left.similarity ||
				left.block.hash.localeCompare( right.block.hash )
		);
	if ( candidates.length === 0 ) {
		return { status: 'not-found', matches: [] };
	}
	if (
		candidates.length > 1 &&
		candidates[ 0 ].similarity === candidates[ 1 ].similarity
	) {
		return {
			status: 'ambiguous-pull-request',
			matches: candidates.map( ( candidate ) => candidate.block ),
		};
	}
	return {
		status: 'found',
		identityMethod: 'pull-request-and-token-similarity',
		pullRequests: candidates[ 0 ].shared,
		tokenSimilarity: Number( candidates[ 0 ].similarity.toFixed( 6 ) ),
		block: candidates[ 0 ].block,
		matches: [ candidates[ 0 ].block ],
	};
}

/**
 * Reads and structurally parses the frozen changelog files used by findings.
 *
 * @param {Object}   options                Read options.
 * @param {string}   options.repositoryPath Repository path.
 * @param {string}   options.baselineSha    Frozen baseline SHA.
 * @param {string[]} options.filePaths      Changelog paths.
 * @return {Map<string,Object>} Parsed changelogs by path.
 */
function readBaselineChangelogs( { repositoryPath, baselineSha, filePaths } ) {
	const uniquePaths = [ ...new Set( filePaths ) ].sort();
	invariant(
		uniquePaths.length > 0,
		'Correction ledger covers zero changelog files'
	);
	const files = readFilesAtCommits(
		repositoryPath,
		uniquePaths.map( ( filePath ) => ( {
			commitSha: baselineSha,
			filePath,
		} ) )
	);
	const parsed = new Map();
	for ( const filePath of uniquePaths ) {
		const content = files.get( `${ baselineSha }:${ filePath }` ) ?? null;
		if ( content === null ) {
			parsed.set( filePath, null );
			continue;
		}
		parsed.set(
			filePath,
			parseChangelog( content, `${ baselineSha }:${ filePath }`, {
				allowDuplicateVersions: true,
			} )
		);
	}
	return parsed;
}

/**
 * Finds a unique version section, returning null for a missing heading.
 *
 * @param {Object} parsed  Parsed changelog.
 * @param {string} version Version number.
 * @return {?Object} Unique section.
 */
function getOptionalSection( parsed, version ) {
	const result = findVersionSection( parsed, version );
	invariant(
		result.status !== 'ambiguous',
		`${ parsed.label } has ambiguous version ${ version }`
	);
	return result.status === 'found' ? result.section : null;
}

/**
 * Finds equivalent blocks throughout one parsed changelog.
 *
 * @param {Object} parsed        Parsed changelog.
 * @param {Object} evidenceBlock Serialized historical block.
 * @return {Object[]} Located matches.
 */
function locateAcrossChangelog( parsed, evidenceBlock ) {
	const locations = [];
	for ( const section of parsed.sections ) {
		const match = locateEquivalentBlock( section, evidenceBlock );
		if ( match.status === 'found' ) {
			locations.push( {
				version: section.key,
				section,
				...match,
			} );
		} else if ( match.status.startsWith( 'ambiguous' ) ) {
			locations.push( {
				version: section.key,
				section,
				...match,
			} );
		}
	}
	return locations;
}

/**
 * Serializes a current-tree block for deterministic generation later.
 *
 * @param {Object} match Located block match.
 * @return {?Object} Serialized block and identity method.
 */
function serializeCurrentMatch( match ) {
	if ( match.status !== 'found' ) {
		return null;
	}
	return {
		identityMethod: match.identityMethod,
		pullRequests: match.pullRequests || [],
		tokenSimilarity: match.tokenSimilarity ?? 1,
		block: serializeBlock( { ...match.block, occurrence: 1 } ),
	};
}

/**
 * Recomputes frozen-tree state after shipment proof advances or overrides a
 * destination tag. This prevents provisional next-tag state from surviving in
 * the final ledger.
 *
 * @param {Object[]}           corrections  Correction rows.
 * @param {Map<string,Object>} parsedByPath Frozen changelogs.
 */
function refreshCorrectionCurrentState( corrections, parsedByPath ) {
	for ( const row of corrections ) {
		if ( ! row.entry || ! row.toVersion ) {
			continue;
		}
		const parsed = parsedByPath.get( row.filePath );
		if ( ! parsed ) {
			continue;
		}
		const sourceBlock = row.entry.currentBlock?.block || null;
		const destinationBlock =
			row.entry.replacementBlock ||
			sourceBlock ||
			row.entry.evidenceBlock;
		const sourceSection = row.fromVersion
			? getOptionalSection( parsed, row.fromVersion )
			: null;
		const destinationSection = getOptionalSection( parsed, row.toVersion );
		const sourceMatch = sourceBlock
			? locateEquivalentBlock( sourceSection, sourceBlock )
			: { status: 'not-found' };
		const destinationMatch = locateEquivalentBlock(
			destinationSection,
			destinationBlock
		);
		row.currentState.wrongMatch = sourceMatch.status;
		row.currentState.wrongExactCount =
			sourceSection && sourceBlock
				? sourceSection.blocks.filter(
						( block ) => block.hash === sourceBlock.hash
				  ).length
				: 0;
		row.currentState.intendedMatch = destinationMatch.status;
		row.currentState.intendedHeadingPresent = destinationSection !== null;

		if (
			row.evidence.shipmentProof.status === 'proved-restoration' ||
			row.operation === 'move-and-replace-entry'
		) {
			continue;
		}
		if (
			sourceMatch.status === 'found' &&
			destinationMatch.status === 'found'
		) {
			row.disposition = 'proposed';
			row.operation = 'remove-duplicate-entry';
		} else if ( sourceMatch.status === 'found' ) {
			row.disposition = 'proposed';
			row.operation = 'move-entry';
		} else if ( destinationMatch.status === 'found' ) {
			row.disposition = 'already-corrected';
			row.operation = 'move-entry';
		} else if ( row.fromVersion ) {
			row.disposition = 'unresolved';
			row.operation = null;
		} else {
			row.disposition = 'proposed';
			row.operation = 'restore-entry';
		}
	}
}

/**
 * Creates a correction row for an entry added to a frozen version after its
 * package tag was published.
 *
 * @param {Object}   mutation            Secondary audit mutation.
 * @param {Object}   parsed              Frozen baseline changelog.
 * @param {string[]} immediateFindingIds Matching primary findings.
 * @return {Object} Correction row.
 */
function buildAddedBlockRow( mutation, parsed, immediateFindingIds ) {
	const wrongSection = getOptionalSection( parsed, mutation.version );
	const intendedSection = getOptionalSection(
		parsed,
		mutation.intendedVersion
	);
	const wrongMatch = locateEquivalentBlock( wrongSection, mutation.block );
	const intendedMatch = locateEquivalentBlock(
		intendedSection,
		mutation.block
	);
	const allLocations = locateAcrossChangelog( parsed, mutation.block );
	let disposition;
	let operation;
	let fromVersion = mutation.version;

	if ( wrongMatch.status === 'found' && intendedMatch.status === 'found' ) {
		disposition = 'proposed';
		operation = 'remove-duplicate-entry';
	} else if ( wrongMatch.status === 'found' ) {
		disposition = 'proposed';
		operation = 'move-entry';
	} else if ( intendedMatch.status === 'found' ) {
		disposition = 'already-corrected';
		operation = 'move-entry';
	} else if (
		allLocations.length === 1 &&
		allLocations[ 0 ].status === 'found'
	) {
		disposition = 'proposed';
		operation = 'move-entry';
		fromVersion = allLocations[ 0 ].version;
	} else if ( allLocations.length === 0 ) {
		disposition = 'proposed';
		operation = 'restore-entry';
		fromVersion = null;
	} else {
		disposition = 'unresolved';
		operation = null;
	}

	const currentSource = fromVersion
		? locateEquivalentBlock(
				getOptionalSection( parsed, fromVersion ),
				mutation.block
		  )
		: { status: 'not-found', matches: [] };
	return {
		id: `correction:${ mutation.id }`,
		disposition,
		operation,
		package: mutation.package,
		filePath: mutation.filePath,
		fromVersion,
		fromSubsection:
			currentSource.status === 'found'
				? currentSource.block.subsection
				: mutation.block.subsection,
		toVersion: mutation.intendedVersion,
		toSubsection: mutation.block.subsection,
		entry: {
			evidenceBlock: mutation.block,
			currentBlock: serializeCurrentMatch( currentSource ) || {
				identityMethod: 'immutable-next-cut-bytes',
				pullRequests: extractPullRequests( mutation.block.text ),
				tokenSimilarity: 1,
				block: mutation.block,
			},
		},
		evidence: {
			method: 'exact-pre-next-cut-changelog-diff',
			immediateFindingIds,
			secondaryMutationIds: [ mutation.id ],
			wrongTag: {
				name: mutation.precedingTag,
				publishSha: mutation.publishSha,
				version: mutation.version,
				entryStatus: 'absent-exact',
			},
			trunkNextReleaseCutSha: mutation.nextReleaseCutSha,
			destinationTag: {
				name: mutation.destinationTag,
				publishSha: mutation.nextEventSha,
				version: mutation.intendedVersion,
			},
			precedingDestinationTag: mutation.precedingTag,
			lane: mutation.lane,
			releaseKind: mutation.releaseKind,
			shipmentProof: {
				status: 'pending',
				method: null,
			},
		},
		currentState: {
			wrongMatch: wrongMatch.status,
			wrongExactCount: wrongSection
				? wrongSection.blocks.filter(
						( block ) => block.hash === mutation.block.hash
				  ).length
				: 0,
			intendedMatch: intendedMatch.status,
			allLocationVersions: allLocations.map(
				( location ) => location.version
			),
			intendedHeadingPresent: intendedSection !== null,
		},
	};
}

/**
 * Converts entries newly present in a stable tag's Unreleased section into
 * source-less restoration candidates for that exact package version. These
 * candidates are intentionally separate from cross-version moves: WordPress
 * patch lines and the regular package lane may both legitimately ship the
 * same change.
 *
 * @param {Object[]}           candidates   Stable-tag Unreleased shipment candidates.
 * @param {Map<string,Object>} parsedByPath Frozen changelogs.
 * @return {Object[]} Provisional correction rows.
 */
function buildUnreleasedShipmentCandidates( candidates, parsedByPath ) {
	const corrections = [];
	for ( const candidate of candidates ) {
		const parsed = parsedByPath.get( candidate.filePath );
		invariant(
			parsed,
			`Unreleased shipment candidate ${ candidate.id } has no frozen changelog`
		);
		const destinationSection = getOptionalSection(
			parsed,
			candidate.version
		);
		const destinationMatch = locateEquivalentBlock(
			destinationSection,
			candidate.block
		);
		const allLocations = locateAcrossChangelog( parsed, candidate.block );
		let disposition = 'proposed';
		if ( destinationMatch.status === 'found' ) {
			disposition = 'already-corrected';
		} else if ( destinationMatch.status.startsWith( 'ambiguous' ) ) {
			disposition = 'unresolved';
		}
		corrections.push( {
			id: `correction:${ candidate.id }`,
			disposition,
			operation: destinationMatch.status.startsWith( 'ambiguous' )
				? null
				: 'restore-entry',
			package: candidate.package,
			filePath: candidate.filePath,
			fromVersion: null,
			fromSubsection: candidate.block.subsection,
			toVersion: candidate.version,
			toSubsection: candidate.block.subsection,
			entry: {
				evidenceBlock: candidate.block,
				currentBlock: null,
			},
			evidence: {
				method: 'stable-tag-unreleased-tree-shipment-candidate',
				immediateFindingIds: [],
				secondaryMutationIds: [],
				frozenAttributionIds: [],
				unreleasedShipmentCandidateIds: [ candidate.id ],
				wrongTag: {
					name: candidate.precedingTag.name,
					publishSha: candidate.precedingTag.publishSha,
					version: candidate.precedingTag.version,
					entryStatus: 'absent-from-unreleased-exact',
				},
				trunkNextReleaseCutSha: null,
				destinationTag: {
					name: candidate.tag,
					publishSha: candidate.publishSha,
					version: candidate.version,
					entryStatus: 'new-unreleased-entry',
					observedSection: 'Unreleased',
				},
				precedingDestinationTag: {
					name: candidate.precedingTag.name,
					publishSha: candidate.precedingTag.publishSha,
					version: candidate.precedingTag.version,
				},
				lane: candidate.primaryLaneId,
				logicalLane: candidate.lane,
				releaseKind: candidate.releaseKind,
				shipmentProof: { status: 'pending', method: null },
			},
			currentState: {
				wrongMatch: null,
				wrongExactCount: 0,
				intendedMatch: destinationMatch.status,
				allLocationVersions: allLocations.map(
					( location ) => location.version
				),
				intendedHeadingPresent: destinationSection !== null,
			},
		} );
	}
	return corrections;
}

/**
 * Converts additions that only created a temporary second copy of an entry
 * into explicit exceptions when the frozen baseline is back to the published
 * occurrence count. An extra copy still present remains a correction.
 *
 * @param {Object[]} corrections Correction rows.
 * @param {Object[]} exceptions  Accepted exception rows.
 */
function classifyTransientDuplicateOccurrences( corrections, exceptions ) {
	for ( let index = corrections.length - 1; index >= 0; index-- ) {
		const row = corrections[ index ];
		const entryEvidence = row.evidence.shipmentProof.entryEvidence;
		if (
			row.evidence.method !== 'exact-pre-next-cut-changelog-diff' ||
			! entryEvidence ||
			entryEvidence.precedingExactCount === 0
		) {
			continue;
		}
		invariant(
			row.evidence.secondaryMutationIds.length === 1,
			`Duplicate occurrence ${ row.id } must cover exactly one secondary mutation`
		);
		if (
			row.currentState.wrongExactCount <=
			entryEvidence.precedingExactCount
		) {
			corrections.splice( index, 1 );
			exceptions.push( {
				id: `accepted-transient-duplicate:${ row.id }`,
				type: 'transient-duplicate-occurrence-removed-before-baseline',
				mutationId: row.evidence.secondaryMutationIds[ 0 ],
				immediateFindingIds: row.evidence.immediateFindingIds,
				package: row.package,
				filePath: row.filePath,
				version: row.fromVersion,
				entry: row.entry,
				publishedExactCount: entryEvidence.precedingExactCount,
				preNextCutExactCount: entryEvidence.destinationExactCount,
				frozenBaselineExactCount: row.currentState.wrongExactCount,
				evidence: {
					wrongTag: row.evidence.wrongTag,
					trunkNextReleaseCutSha: row.evidence.trunkNextReleaseCutSha,
					destinationTag: row.evidence.destinationTag,
				},
			} );
			continue;
		}

		row.operation = 'remove-duplicate-entry';
		row.toVersion = null;
		row.toSubsection = null;
		row.evidence.shipmentProof = {
			status: 'proved',
			method: 'published-and-frozen-exact-occurrence-counts',
			entryEvidence,
		};
	}
}

/**
 * Accepts an entry added after publication when package-tree evidence proves
 * the implementation first shipped in that published version and the frozen
 * baseline still keeps the entry in that version section.
 *
 * @param {Object[]} corrections Correction rows.
 * @param {Object[]} exceptions  Accepted exception rows.
 */
function classifyPostpublishRestorations( corrections, exceptions ) {
	for ( let index = corrections.length - 1; index >= 0; index-- ) {
		const row = corrections[ index ];
		if ( row.evidence.shipmentProof.status !== 'proved-restoration' ) {
			continue;
		}
		if (
			row.evidence.shipmentProof.entryEvidence.precedingExactCount > 0
		) {
			continue;
		}
		if ( row.currentState.wrongMatch !== 'found' ) {
			row.evidence.shipmentProof.status = 'pending';
			continue;
		}
		invariant(
			row.evidence.secondaryMutationIds.length === 1,
			`Postpublish restoration ${ row.id } must cover exactly one secondary mutation`
		);
		corrections.splice( index, 1 );
		exceptions.push( {
			id: `accepted-postpublish-restoration:${ row.id }`,
			type: 'postpublish-entry-restoration-for-shipped-code',
			mutationId: row.evidence.secondaryMutationIds[ 0 ],
			immediateFindingIds: row.evidence.immediateFindingIds,
			package: row.package,
			filePath: row.filePath,
			version: row.fromVersion,
			entry: row.entry,
			evidence: {
				precedingWrongTag: row.evidence.precedingWrongTag,
				wrongTag: row.evidence.wrongTag,
				trunkNextReleaseCutSha: row.evidence.trunkNextReleaseCutSha,
				shipmentProof: row.evidence.shipmentProof,
			},
		} );
	}
}

/**
 * Converts stable-tag Unreleased candidates into accepted non-shipment rows
 * when every attributed implementation file is byte-identical across the
 * candidate tag transition. The changelog bytes were carried into the tag,
 * but that version did not first ship the described implementation.
 *
 * @param {Object[]} corrections Candidate correction rows.
 * @param {Object[]} exceptions  Accepted exception rows.
 * @return {number} Number of classified non-shipments.
 */
function classifyUnreleasedNonShipments( corrections, exceptions ) {
	let count = 0;
	for ( let index = corrections.length - 1; index >= 0; index-- ) {
		const row = corrections[ index ];
		if (
			row.evidence.method !==
				'stable-tag-unreleased-tree-shipment-candidate' ||
			row.evidence.shipmentProof.status !== 'proved-nonshipment'
		) {
			continue;
		}
		invariant(
			row.evidence.unreleasedShipmentCandidateIds.length === 1,
			`Unreleased non-shipment ${ row.id } must cover exactly one candidate`
		);
		corrections.splice( index, 1 );
		exceptions.push( {
			id: `accepted-unreleased-nonshipment:${ row.id }`,
			type: 'stable-tag-unreleased-entry-without-package-tree-transition',
			package: row.package,
			filePath: row.filePath,
			version: row.toVersion,
			entry: row.entry,
			unreleasedShipmentCandidateIds:
				row.evidence.unreleasedShipmentCandidateIds,
			evidence: {
				method: 'stable-tag-unreleased-nonshipment-tree-proof',
				precedingTag: row.evidence.wrongTag,
				destinationTag: row.evidence.destinationTag,
				logicalLane: row.evidence.logicalLane,
				shipmentProof: row.evidence.shipmentProof,
			},
		} );
		count++;
	}
	return count;
}

/**
 * Applies baseline-bound, independently reviewable resolutions for cases that
 * require cross-package, repository-level, replacement, or behavioral proof.
 * Every resolution must validate immutable tree predicates before it can alter
 * a pending ledger row.
 *
 * @param {Object}   options                Resolution options.
 * @param {string}   options.repositoryPath Repository path.
 * @param {Object}   options.inventory      Publish inventory.
 * @param {Object[]} options.corrections    Correction rows.
 * @param {?Object}  options.resolutions    Reviewed resolution manifest.
 */
function applyReviewedShipmentResolutions( {
	repositoryPath,
	inventory,
	corrections,
	resolutions,
} ) {
	if ( resolutions === null ) {
		return;
	}
	invariant(
		resolutions &&
			resolutions.schemaVersion === 1 &&
			resolutions.baselineSha === inventory.baseline.trunkSha &&
			Array.isArray( resolutions.resolutions ) &&
			resolutions.resolutions.length > 0,
		'Reviewed shipment resolutions must use schema version 1, match the frozen baseline, and contain rows'
	);
	const seen = new Set();
	const tagIndex = new Map();
	for ( const event of inventory.events ) {
		for ( const tag of event.tags ) {
			tagIndex.set( tag.name, { event, tag } );
		}
	}

	for ( const resolution of resolutions.resolutions ) {
		invariant(
			resolution &&
				typeof resolution.id === 'string' &&
				! seen.has( resolution.id ) &&
				typeof resolution.package === 'string' &&
				/^[0-9a-f]{64}$/.test( resolution.entryHash ) &&
				typeof resolution.wrongTag === 'string' &&
				[
					'move-entry',
					'move-to-unreleased',
					'postpublish-restoration',
					'move-and-replace-entry',
					'restore-entry',
				].includes( resolution.decision ) &&
				resolution.review &&
				resolution.review.status === 'reviewed' &&
				typeof resolution.review.rationale === 'string' &&
				resolution.review.rationale.length > 0 &&
				resolution.evidence &&
				Array.isArray( resolution.evidence.treeTransitions ) &&
				resolution.evidence.treeTransitions.length > 0,
			`Reviewed shipment resolution ${
				resolution?.id || '<unknown>'
			} is invalid`
		);
		seen.add( resolution.id );
		const matches = corrections.filter(
			( row ) =>
				row.package === resolution.package &&
				row.entry?.evidenceBlock.hash === resolution.entryHash &&
				row.evidence.wrongTag?.name === resolution.wrongTag
		);
		invariant(
			matches.length === 1,
			`Reviewed shipment resolution ${ resolution.id } matched ${ matches.length } correction rows`
		);
		const row = matches[ 0 ];
		invariant(
			row.evidence.shipmentProof.status === 'pending',
			`Reviewed shipment resolution ${ resolution.id } targets a non-pending row`
		);

		for ( const commitSha of resolution.evidence.commitShas || [] ) {
			invariant(
				/^[0-9a-f]{40}$/.test( commitSha ) &&
					runGit( repositoryPath, [
						'rev-parse',
						`${ commitSha }^{commit}`,
					] ).trim() === commitSha,
				`Reviewed shipment resolution ${ resolution.id } references an invalid commit`
			);
		}

		for ( const artifact of resolution.evidence.npmArtifacts || [] ) {
			invariant(
				artifact &&
					typeof artifact.version === 'string' &&
					artifact.version.length > 0 &&
					typeof artifact.tarball === 'string' &&
					artifact.tarball.startsWith(
						'https://registry.npmjs.org/'
					) &&
					/^[0-9a-f]{40}$/.test( artifact.shasum ) &&
					typeof artifact.integrity === 'string' &&
					artifact.integrity.startsWith( 'sha512-' ) &&
					typeof artifact.filePath === 'string' &&
					artifact.filePath.length > 0 &&
					/^[0-9a-f]{64}$/.test( artifact.fileSha256 ) &&
					[ 'contains', 'excludes' ].some(
						( field ) =>
							Array.isArray( artifact[ field ] ) &&
							artifact[ field ].length > 0
					) &&
					[ 'contains', 'excludes' ].every(
						( field ) =>
							artifact[ field ] === undefined ||
							( Array.isArray( artifact[ field ] ) &&
								artifact[ field ].every(
									( text ) =>
										typeof text === 'string' &&
										text.length > 0
								) )
					),
				`Reviewed shipment resolution ${ resolution.id } has invalid npm artifact evidence`
			);
		}

		for ( const transition of resolution.evidence.treeTransitions ) {
			const listFields = [
				'beforeContains',
				'beforeExcludes',
				'afterContains',
				'afterExcludes',
			];
			invariant(
				transition &&
					/^[0-9a-f]{40}$/.test( transition.beforeSha ) &&
					/^[0-9a-f]{40}$/.test( transition.afterSha ) &&
					typeof transition.filePath === 'string' &&
					transition.filePath.length > 0 &&
					listFields.some(
						( field ) =>
							Array.isArray( transition[ field ] ) &&
							transition[ field ].length > 0
					) &&
					listFields.every(
						( field ) =>
							transition[ field ] === undefined ||
							( Array.isArray( transition[ field ] ) &&
								transition[ field ].every(
									( text ) =>
										typeof text === 'string' &&
										text.length > 0
								) )
					),
				`Reviewed shipment resolution ${ resolution.id } has an invalid tree transition`
			);
			const snapshots = readFilesAtCommits( repositoryPath, [
				{
					commitSha: transition.beforeSha,
					filePath: transition.filePath,
				},
				{
					commitSha: transition.afterSha,
					filePath: transition.filePath,
				},
			] );
			const before =
				snapshots.get(
					`${ transition.beforeSha }:${ transition.filePath }`
				) || '';
			const after =
				snapshots.get(
					`${ transition.afterSha }:${ transition.filePath }`
				) || '';
			for ( const text of transition.beforeContains || [] ) {
				invariant(
					before.includes( text ),
					`Reviewed shipment resolution ${ resolution.id } is missing its before predicate`
				);
			}
			for ( const text of transition.beforeExcludes || [] ) {
				invariant(
					! before.includes( text ),
					`Reviewed shipment resolution ${ resolution.id } violates its before exclusion`
				);
			}
			for ( const text of transition.afterContains || [] ) {
				invariant(
					after.includes( text ),
					`Reviewed shipment resolution ${ resolution.id } is missing its after predicate`
				);
			}
			for ( const text of transition.afterExcludes || [] ) {
				invariant(
					! after.includes( text ),
					`Reviewed shipment resolution ${ resolution.id } violates its after exclusion`
				);
			}
		}

		if ( resolution.destinationTag ) {
			const destination = tagIndex.get( resolution.destinationTag );
			invariant(
				destination && destination.tag.package === row.package,
				`Reviewed shipment resolution ${ resolution.id } has an invalid destination tag`
			);
			row.toVersion = destination.tag.version;
			row.evidence.destinationTag = {
				name: destination.tag.name,
				publishSha: destination.event.publishSha,
				version: destination.tag.version,
			};
		}
		if ( resolution.decision === 'move-to-unreleased' ) {
			invariant(
				! resolution.destinationTag,
				`Reviewed shipment resolution ${ resolution.id } cannot combine an Unreleased destination with a package tag`
			);
			row.operation = 'move-entry';
			row.disposition = 'proposed';
			row.toVersion = 'Unreleased';
			row.toSubsection =
				resolution.destinationSubsection || row.fromSubsection;
			row.evidence.destinationTag = {
				name: `frozen-baseline:${ inventory.baseline.trunkSha }:Unreleased`,
				publishSha: inventory.baseline.trunkSha,
				version: 'Unreleased',
			};
			row.evidence.precedingDestinationTag = row.evidence.wrongTag;
			row.evidence.lane = 'postpublish-frozen-baseline';
			row.evidence.releaseKind = 'not-yet-published';
		}
		if ( resolution.decision === 'move-and-replace-entry' ) {
			invariant(
				resolution.replacement &&
					typeof resolution.replacement.text === 'string' &&
					resolution.replacement.text.length > 0,
				`Reviewed shipment resolution ${ resolution.id } requires replacement bytes`
			);
			row.operation = 'move-and-replace-entry';
			row.toSubsection = resolution.replacement.subsection || null;
			row.entry.replacementBlock = {
				type: 'list-item',
				subsection: row.toSubsection,
				text: resolution.replacement.text,
				hash: hashText( resolution.replacement.text ),
			};
		}
		let method = 'reviewed-special-tree-evidence';
		if ( resolution.decision === 'move-to-unreleased' ) {
			method = 'reviewed-postpublish-unreleased-evidence';
		} else if ( resolution.decision === 'restore-entry' ) {
			method = 'reviewed-stable-tag-unreleased-tree-evidence';
		}
		row.evidence.shipmentProof = {
			status:
				resolution.decision === 'postpublish-restoration'
					? 'proved-restoration'
					: 'proved',
			method,
			resolutionId: resolution.id,
			entryEvidence: row.evidence.shipmentProof.entryEvidence,
			treeTransitions: resolution.evidence.treeTransitions,
			commitShas: resolution.evidence.commitShas || [],
		};
	}
}

/**
 * Finds the next immutable tag for a package on the event's release lane.
 *
 * @param {Object} inventory   Publish inventory.
 * @param {string} publishSha  Starting publish SHA.
 * @param {string} packageName Package name.
 * @return {?Object} Current and destination tag evidence.
 */
function findNextPackageTag( inventory, publishSha, packageName ) {
	const eventsBySha = new Map(
		inventory.events.map( ( event ) => [ event.publishSha, event ] )
	);
	const event = eventsBySha.get( publishSha );
	invariant(
		event,
		`Immediate finding references unknown event ${ publishSha }`
	);
	if ( ! event.primaryLaneId ) {
		return null;
	}
	const precedingTag = event.tags.find(
		( tag ) => tag.package === packageName
	);
	if ( ! precedingTag ) {
		return null;
	}
	const visited = new Set( [ publishSha ] );
	let current = event;
	while ( true ) {
		const lane = current.lanes.find(
			( candidate ) => candidate.id === event.primaryLaneId
		);
		if ( ! lane || ! lane.nextEventSha ) {
			return null;
		}
		invariant(
			! visited.has( lane.nextEventSha ),
			`Release lane ${ event.primaryLaneId } cycles at ${ lane.nextEventSha }`
		);
		visited.add( lane.nextEventSha );
		current = eventsBySha.get( lane.nextEventSha );
		invariant(
			current,
			`Release lane references unknown event ${ lane.nextEventSha }`
		);
		const destinationTag = current.tags.find(
			( tag ) => tag.package === packageName
		);
		if ( destinationTag ) {
			let releaseKind = 'regular-wp-latest';
			if ( event.primaryLaneId !== 'wp/latest' ) {
				releaseKind = 'wordpress-patch-line';
			} else if ( event.tags.length === 1 ) {
				releaseKind = 'standalone-wp-latest';
			}
			return {
				event,
				precedingTag,
				destinationEvent: current,
				destinationTag,
				lane: event.primaryLaneId,
				releaseKind,
			};
		}
	}
}

/**
 * Finds the preceding immutable tag for a package on one release lane.
 *
 * @param {Object} inventory   Publish inventory.
 * @param {string} publishSha  Starting publish SHA.
 * @param {string} packageName Package name.
 * @param {string} laneId      Frozen release lane ID.
 * @return {?Object} Preceding package tag and event.
 */
function findPreviousPackageTag( inventory, publishSha, packageName, laneId ) {
	const eventsBySha = new Map(
		inventory.events.map( ( event ) => [ event.publishSha, event ] )
	);
	let current = eventsBySha.get( publishSha );
	if ( ! current || ! laneId ) {
		return null;
	}
	const visited = new Set( [ publishSha ] );
	while ( true ) {
		const lane = current.lanes.find(
			( candidate ) => candidate.id === laneId
		);
		if ( ! lane || ! lane.previousEventSha ) {
			return null;
		}
		invariant(
			! visited.has( lane.previousEventSha ),
			`Release lane ${ laneId } cycles at ${ lane.previousEventSha }`
		);
		visited.add( lane.previousEventSha );
		current = eventsBySha.get( lane.previousEventSha );
		invariant(
			current,
			`Release lane references unknown event ${ lane.previousEventSha }`
		);
		const tag = current.tags.find(
			( candidate ) => candidate.package === packageName
		);
		if ( tag ) {
			return { event: current, tag };
		}
	}
}

/**
 * Summarizes candidate commit proofs without silently selecting between
 * materially different patches carrying the same pull request number.
 *
 * @param {Object[]} provedCandidates Proved commit candidates.
 * @param {number}   candidateCount   Total commit candidates inspected.
 * @return {Object} Deterministic proof status.
 */
function summarizeCandidateProofs( provedCandidates, candidateCount ) {
	const proofFingerprints = new Map();
	for ( const candidate of provedCandidates ) {
		const fingerprint = JSON.stringify(
			candidate.predicates.map( ( predicate ) => ( {
				method: predicate.method,
				filePath: predicate.filePath,
				beforeHash: predicate.beforeHash || null,
				afterHash: predicate.afterHash || null,
				lineHash: predicate.lineHash || null,
				tokenHash: predicate.tokenHash || null,
				patchHash: predicate.patchHash || null,
			} ) )
		);
		if ( ! proofFingerprints.has( fingerprint ) ) {
			proofFingerprints.set( fingerprint, [] );
		}
		proofFingerprints.get( fingerprint ).push( candidate );
	}
	const patchEquivalent =
		provedCandidates.length > 1 && proofFingerprints.size === 1;
	let status = 'ambiguous';
	if ( provedCandidates.length === 1 || patchEquivalent ) {
		status = 'proved';
	} else if ( provedCandidates.length === 0 ) {
		status = 'not-proved';
	}
	return {
		status,
		candidateCount,
		provedCandidates: patchEquivalent
			? [ provedCandidates[ 0 ] ]
			: provedCandidates,
		equivalentCommitShas: patchEquivalent
			? provedCandidates.map( ( candidate ) => candidate.commitSha )
			: [],
	};
}

/**
 * Advances a correction to the next tag for its package on the same lane.
 * This is used only when the currently proposed destination tag does not even
 * carry the entry; a present entry with inconclusive code proof stays pending
 * for independent review rather than being moved farther forward.
 *
 * @param {Object} inventory Publish inventory.
 * @param {Object} row       Correction row to update.
 * @return {boolean} Whether a later package tag was selected.
 */
function advanceDestinationTag( inventory, row ) {
	const eventsBySha = new Map(
		inventory.events.map( ( event ) => [ event.publishSha, event ] )
	);
	let current = eventsBySha.get( row.evidence.destinationTag.publishSha );
	if ( ! current || ! row.evidence.lane ) {
		return false;
	}
	const visited = new Set( [ current.publishSha ] );
	while ( true ) {
		const lane = current.lanes.find(
			( candidate ) => candidate.id === row.evidence.lane
		);
		if ( ! lane || ! lane.nextEventSha ) {
			return false;
		}
		invariant(
			! visited.has( lane.nextEventSha ),
			`Release lane ${ row.evidence.lane } cycles at ${ lane.nextEventSha }`
		);
		visited.add( lane.nextEventSha );
		current = eventsBySha.get( lane.nextEventSha );
		invariant(
			current,
			`Release lane references unknown event ${ lane.nextEventSha }`
		);
		const tag = current.tags.find(
			( candidate ) => candidate.package === row.package
		);
		if ( tag ) {
			row.toVersion = tag.version;
			row.evidence.destinationTag = {
				name: tag.name,
				publishSha: current.publishSha,
				version: tag.version,
			};
			row.evidence.shipmentProof = { status: 'pending', method: null };
			return true;
		}
	}
}

/**
 * Indexes commits whose subjects refer to the requested Gutenberg pull
 * requests. Multiple candidates remain explicit until tree evidence chooses
 * one; subject matching alone is not shipment proof.
 *
 * @param {string}   repositoryPath Repository path.
 * @param {string[]} pullRequests   Pull request numbers.
 * @param {string}   trunkSha       Frozen trunk commit.
 * @return {Map<string,Object[]>} Candidate commits by pull request.
 */
function indexPullRequestCommits( repositoryPath, pullRequests, trunkSha ) {
	const uniquePullRequests = [ ...new Set( pullRequests ) ].sort(
		( left, right ) => Number( left ) - Number( right )
	);
	if ( uniquePullRequests.length === 0 ) {
		return new Map();
	}
	const output = runGit( repositoryPath, [
		'log',
		trunkSha,
		'--format=%H%x1f%P%x1f%aI%x1f%s%x1e',
		...uniquePullRequests.map(
			( pullRequest ) => `--grep=#${ pullRequest }`
		),
	] );
	const records = output
		.split( '\u001e' )
		.map( ( record ) => record.replace( /^\n+|\n+$/g, '' ) )
		.filter( Boolean )
		.map( ( record, index ) => {
			const fields = record.split( '\u001f' );
			invariant(
				fields.length === 4,
				`Pull request commit record ${ index + 1 } is malformed`
			);
			const [ sha, parentsText, authorDate, subject ] = fields;
			return {
				sha,
				parents: parentsText ? parentsText.split( ' ' ) : [],
				authorDate,
				subject,
			};
		} );
	const index = new Map(
		uniquePullRequests.map( ( pullRequest ) => [ pullRequest, [] ] )
	);
	for ( const record of records ) {
		for ( const pullRequest of uniquePullRequests ) {
			const pattern = new RegExp( `#${ pullRequest }(?!\\d)` );
			if ( pattern.test( record.subject ) ) {
				index.get( pullRequest ).push( record );
			}
		}
	}
	for ( const [ pullRequest, candidates ] of index ) {
		candidates.sort( ( left, right ) => {
			const leftExact = new RegExp( `\\(#${ pullRequest }\\)\\s*$` ).test(
				left.subject
			);
			const rightExact = new RegExp(
				`\\(#${ pullRequest }\\)\\s*$`
			).test( right.subject );
			return (
				Number( rightExact ) - Number( leftExact ) ||
				left.authorDate.localeCompare( right.authorDate ) ||
				left.sha.localeCompare( right.sha )
			);
		} );
		index.set( pullRequest, candidates.slice( 0, 8 ) );
	}
	return index;
}

/**
 * Finds non-merge commits that added the exact first line of an uncited entry
 * to its package changelog. The later tree transition still has to prove that
 * the same commit's implementation shipped in the attributed package tag.
 *
 * @param {string} repositoryPath Repository path.
 * @param {Object} row            Correction row.
 * @param {number} latestDate     Latest accepted commit time in milliseconds.
 * @param {string} trunkSha       Frozen trunk commit.
 * @return {Object} Pickaxe anchor and candidate commits.
 */
function findEntryIntroducingCommits(
	repositoryPath,
	row,
	latestDate,
	trunkSha
) {
	const anchor = row.entry.evidenceBlock.text.split( '\n' )[ 0 ];
	invariant(
		anchor.length >= 12 && ! /[\r\n]/.test( anchor ),
		`Uncited entry ${ row.id } has no safe pickaxe anchor`
	);
	const anchors = new Set( [ anchor ] );
	if ( anchor.startsWith( '-   ' ) ) {
		anchors.add( `- ${ anchor.slice( 4 ) }` );
	} else if ( anchor.startsWith( '- ' ) ) {
		anchors.add( `-   ${ anchor.slice( 2 ) }` );
	}
	const output = [ ...anchors ]
		.map( ( candidateAnchor ) =>
			runGit( repositoryPath, [
				'log',
				trunkSha,
				'--format=%H%x1f%P%x1f%aI%x1f%s%x1e',
				`-S${ candidateAnchor }`,
				'--',
				row.filePath,
			] )
		)
		.join( '' );
	const candidates = [];
	const seenCandidates = new Set();
	for ( const record of output.split( '\u001e' ) ) {
		const trimmed = record.replace( /^\n+|\n+$/g, '' );
		if ( ! trimmed ) {
			continue;
		}
		const fields = trimmed.split( '\u001f' );
		invariant(
			fields.length === 4,
			`Pickaxe record for ${ row.id } is malformed`
		);
		const [ sha, parentsText, authorDate, subject ] = fields;
		const parents = parentsText ? parentsText.split( ' ' ) : [];
		if (
			seenCandidates.has( sha ) ||
			parents.length !== 1 ||
			Date.parse( authorDate ) > latestDate ||
			/^Merge changes published in the Gutenberg plugin /.test(
				subject
			) ||
			/^(?:Update changelog files|chore\(release\):)/.test( subject )
		) {
			continue;
		}
		seenCandidates.add( sha );
		const diff = runGit( repositoryPath, [
			'diff',
			'--unified=0',
			'--no-ext-diff',
			parents[ 0 ],
			sha,
			'--',
			row.filePath,
		] );
		if (
			! [ ...anchors ].some( ( candidateAnchor ) =>
				diff.split( '\n' ).includes( `+${ candidateAnchor }` )
			)
		) {
			continue;
		}
		candidates.push( { sha, parents, authorDate, subject } );
	}
	candidates.sort(
		( left, right ) =>
			left.authorDate.localeCompare( right.authorDate ) ||
			left.sha.localeCompare( right.sha )
	);
	return {
		anchorHash: hashText( anchor ),
		candidates: candidates.slice( 0, 8 ),
	};
}

/**
 * Parses package-scoped implementation additions from one commit.
 *
 * @param {string} repositoryPath Repository path.
 * @param {Object} commit         Commit metadata.
 * @param {string} packagePath    Package directory.
 * @return {Object} Changed implementation files and discriminating lines.
 */
function readImplementationDiff( repositoryPath, commit, packagePath ) {
	if ( commit.parents.length === 0 ) {
		return { status: 'root-commit', files: [] };
	}
	const parentSha = commit.parents[ 0 ];
	const output = runGit( repositoryPath, [
		'diff',
		'--unified=0',
		'--no-ext-diff',
		'--no-renames',
		parentSha,
		commit.sha,
		'--',
		packagePath,
	] );
	const files = new Map();
	let oldPath = null;
	let currentPath = null;
	const addLine = ( line, field ) => {
		if ( ! currentPath ) {
			return;
		}
		const tokens = line.match( /[A-Za-z0-9_$-]+/g ) || [];
		const tokenField =
			field === 'addedLines' ? 'addedTokens' : 'removedTokens';
		for ( const token of tokens ) {
			if (
				token.length >= 8 &&
				( token.length >= 12 || /[A-Z_$-]/.test( token.slice( 1 ) ) )
			) {
				files.get( currentPath )[ tokenField ].add( token );
			}
		}
		if (
			line.trim().length >= 12 &&
			new Set( tokens.map( ( token ) => token.toLowerCase() ) ).size >= 2
		) {
			files.get( currentPath )[ field ].add( line );
		}
	};
	for ( const line of output.split( '\n' ) ) {
		if ( /^--- (?:a\/|\/dev\/null$)/.test( line ) ) {
			oldPath = line === '--- /dev/null' ? null : line.slice( 6 );
			continue;
		}
		if ( /^\+\+\+ (?:b\/|\/dev\/null$)/.test( line ) ) {
			const newPath = line === '+++ /dev/null' ? null : line.slice( 6 );
			currentPath = newPath || oldPath;
			if ( currentPath && /(^|\/)CHANGELOG\.md$/.test( currentPath ) ) {
				currentPath = null;
			}
			if ( currentPath && ! files.has( currentPath ) ) {
				files.set( currentPath, {
					addedLines: new Set(),
					removedLines: new Set(),
					addedTokens: new Set(),
					removedTokens: new Set(),
				} );
			}
			continue;
		}
		if ( line.startsWith( '+' ) ) {
			addLine( line.slice( 1 ), 'addedLines' );
		} else if ( line.startsWith( '-' ) ) {
			addLine( line.slice( 1 ), 'removedLines' );
		}
	}
	return {
		status:
			files.size > 0 ? 'diff-found' : 'no-package-implementation-diff',
		parentSha,
		files: [ ...files ].map( ( [ filePath, lines ] ) => ( {
			filePath,
			addedLines: [ ...lines.addedLines ].sort(),
			removedLines: [ ...lines.removedLines ].sort(),
			addedTokens: [ ...lines.addedTokens ].sort(),
			removedTokens: [ ...lines.removedTokens ].sort(),
		} ) ),
	};
}

/**
 * Proves an implementation transition when a package-scoped commit patch
 * applies to the preceding tag and its reverse applies to the destination tag.
 * The temporary Git index never reads from or writes to the working tree.
 *
 * @param {string} repositoryPath Repository path.
 * @param {Object} commit         Commit metadata.
 * @param {string} packagePath    Package directory.
 * @param {string} precedingSha   Preceding package tag commit.
 * @param {string} destinationSha Destination package tag commit.
 * @return {?Object} Strict patch-applicability proof, if found.
 */
function provePackagePatchTransition(
	repositoryPath,
	commit,
	packagePath,
	precedingSha,
	destinationSha
) {
	if ( commit.parents.length === 0 ) {
		return null;
	}
	const patch = runGit( repositoryPath, [
		'diff',
		'--binary',
		'--no-ext-diff',
		'--no-renames',
		commit.parents[ 0 ],
		commit.sha,
		'--',
		packagePath,
		`:(exclude)${ packagePath }/CHANGELOG.md`,
	] );
	if ( patch.length === 0 ) {
		return null;
	}

	const temporaryDirectory = fs.mkdtempSync(
		path.join( os.tmpdir(), 'gutenberg-changelog-audit-' )
	);
	const indexPath = path.join( temporaryDirectory, 'index' );
	const environment = { ...process.env, GIT_INDEX_FILE: indexPath };
	const applies = ( treeSha, reverse ) => {
		execFileSync( 'git', [ 'read-tree', treeSha ], {
			cwd: repositoryPath,
			env: environment,
			stdio: [ 'ignore', 'pipe', 'pipe' ],
		} );
		try {
			execFileSync(
				'git',
				[
					'apply',
					'--cached',
					'--check',
					'--whitespace=nowarn',
					...( reverse ? [ '--reverse' ] : [] ),
					'-',
				],
				{
					cwd: repositoryPath,
					env: environment,
					input: patch,
					stdio: [ 'pipe', 'pipe', 'pipe' ],
				}
			);
			return true;
		} catch ( error ) {
			if ( error && error.status === 1 ) {
				return false;
			}
			throw error;
		}
	};

	try {
		if (
			! applies( precedingSha, false ) ||
			! applies( destinationSha, true )
		) {
			return null;
		}
		return {
			method: 'package-patch-forward-and-reverse-applicability',
			patchHash: hashText( patch ),
			fileCount: ( patch.match( /^diff --git /gm ) || [] ).length,
		};
	} finally {
		invariant(
			temporaryDirectory.startsWith(
				path.join( os.tmpdir(), 'gutenberg-changelog-audit-' )
			),
			'Unsafe temporary audit directory'
		);
		fs.rmSync( temporaryDirectory, { recursive: true, force: true } );
	}
}

/**
 * Returns exact lines in text, preserving significant indentation.
 *
 * @param {?string} content File content or null for an absent file.
 * @return {Set<string>} Exact line set.
 */
function exactLines( content ) {
	return new Set( content === null ? [] : content.split( /\r?\n/ ) );
}

/**
 * Returns identifier-like code tokens for an exact file snapshot.
 *
 * @param {?string} content File content or null for an absent file.
 * @return {Set<string>} Exact token set.
 */
function exactCodeTokens( content ) {
	return new Set(
		content === null ? [] : content.match( /[A-Za-z0-9_$-]+/g ) || []
	);
}

/**
 * Counts non-overlapping exact block occurrences in a changelog snapshot.
 *
 * @param {?string} content Changelog content.
 * @param {string}  block   Exact atomic block bytes.
 * @return {number} Occurrence count.
 */
function countOccurrences( content, block ) {
	if ( content === null || block.length === 0 ) {
		return 0;
	}
	let count = 0;
	let offset = 0;
	while ( true ) {
		const index = content.indexOf( block, offset );
		if ( index === -1 ) {
			return count;
		}
		count++;
		offset = index + block.length;
	}
}

/**
 * Adds implementation and changelog shipment evidence to pending rows.
 *
 * @param {Object}   options                Proof options.
 * @param {string}   options.repositoryPath Repository path.
 * @param {Object}   options.inventory      Publish inventory.
 * @param {Object[]} options.corrections    Correction rows to update.
 */
function proveCorrectionShipments( {
	repositoryPath,
	inventory,
	corrections,
} ) {
	const pending = corrections.filter(
		( row ) => row.evidence.shipmentProof.status === 'pending'
	);
	const pullRequests = pending.flatMap( ( row ) =>
		row.entry ? extractPullRequests( row.entry.evidenceBlock.text ) : []
	);
	const commitIndex = indexPullRequestCommits(
		repositoryPath,
		pullRequests,
		inventory.baseline.trunkSha
	);
	const eventsBySha = new Map(
		inventory.events.map( ( event ) => [ event.publishSha, event ] )
	);
	const diffCache = new Map();
	const patchProofCache = new Map();
	const rowProofSpecs = [];
	const queries = [];

	for ( const row of pending ) {
		const rowPullRequests = extractPullRequests(
			row.entry.evidenceBlock.text
		);
		const packagePath = row.filePath.replace( /\/CHANGELOG\.md$/, '' );
		const destinationEvent = row.evidence.destinationTag
			? eventsBySha.get( row.evidence.destinationTag.publishSha )
			: null;
		const isFrozenAttribution =
			row.evidence.method === 'first-stable-whole-tag-entry-identity';
		const isUnreleasedShipment =
			row.evidence.method ===
			'stable-tag-unreleased-tree-shipment-candidate';
		const movementBeforeTag =
			isFrozenAttribution &&
			row.evidence.precedingDestinationTag?.publishSha
				? row.evidence.precedingDestinationTag
				: row.evidence.wrongTag;
		const previousPackageTag = findPreviousPackageTag(
			inventory,
			row.evidence.wrongTag.publishSha,
			row.package,
			row.evidence.lane
		);
		row.evidence.precedingWrongTag = previousPackageTag
			? {
					name: previousPackageTag.tag.name,
					publishSha: previousPackageTag.event.publishSha,
					version: previousPackageTag.tag.version,
			  }
			: null;
		const specs = [];
		const buildCandidateSpecs = ( candidates ) => {
			const candidateSpecs = [];
			for ( const commit of candidates ) {
				const key = `${ commit.sha }:${ packagePath }`;
				if ( ! diffCache.has( key ) ) {
					diffCache.set(
						key,
						readImplementationDiff(
							repositoryPath,
							commit,
							packagePath
						)
					);
				}
				const implementationDiff = diffCache.get( key );
				candidateSpecs.push( { commit, implementationDiff } );
				for ( const file of implementationDiff.files ) {
					for ( const commitSha of [
						implementationDiff.parentSha,
						commit.sha,
						...( previousPackageTag
							? [ previousPackageTag.event.publishSha ]
							: [] ),
						row.evidence.wrongTag.publishSha,
						movementBeforeTag.publishSha,
						row.evidence.destinationTag.publishSha,
					] ) {
						queries.push( { commitSha, filePath: file.filePath } );
					}
				}
			}
			return candidateSpecs;
		};
		for ( const pullRequest of rowPullRequests ) {
			const candidates = ( commitIndex.get( pullRequest ) || [] ).filter(
				( commit ) =>
					! destinationEvent ||
					Date.parse( commit.authorDate ) <=
						Date.parse( destinationEvent.authorDate )
			);
			specs.push( {
				pullRequest,
				attributionMethod: 'linked-pull-request-subject',
				candidateSpecs: buildCandidateSpecs( candidates ),
			} );
		}
		if ( rowPullRequests.length === 0 && destinationEvent ) {
			const history = findEntryIntroducingCommits(
				repositoryPath,
				row,
				Date.parse( destinationEvent.authorDate ),
				inventory.baseline.trunkSha
			);
			specs.push( {
				pullRequest: null,
				attributionMethod: 'exact-changelog-pickaxe',
				attributionAnchorHash: history.anchorHash,
				candidateSpecs: buildCandidateSpecs( history.candidates ),
			} );
		}
		queries.push(
			{
				commitSha: movementBeforeTag.publishSha,
				filePath: row.filePath,
			},
			{
				commitSha: row.evidence.destinationTag.publishSha,
				filePath: row.filePath,
			}
		);
		rowProofSpecs.push( {
			row,
			rowPullRequests,
			packagePath,
			specs,
			isFrozenAttribution,
			isUnreleasedShipment,
			movementBeforeTag,
		} );
	}

	const files = readFilesAtCommits( repositoryPath, queries );
	for ( const {
		row,
		rowPullRequests,
		packagePath,
		specs,
		isFrozenAttribution,
		isUnreleasedShipment,
		movementBeforeTag,
	} of rowProofSpecs ) {
		const wrongEvent = eventsBySha.get( row.evidence.wrongTag.publishSha );
		const precedingChangelog =
			files.get(
				`${ movementBeforeTag.publishSha }:${ row.filePath }`
			) ?? null;
		const destinationChangelog =
			files.get(
				`${ row.evidence.destinationTag.publishSha }:${ row.filePath }`
			) ?? null;
		const entryText = row.entry.evidenceBlock.text;
		const precedingPullRequests = new Set(
			extractPullRequests( precedingChangelog || '' )
		);
		const destinationPullRequests = new Set(
			extractPullRequests( destinationChangelog || '' )
		);
		const precedingEntryCount = countOccurrences(
			precedingChangelog,
			entryText
		);
		const destinationEntryCount = countOccurrences(
			destinationChangelog,
			entryText
		);
		let destinationTagStatus = 'absent';
		if ( destinationEntryCount > precedingEntryCount ) {
			destinationTagStatus = 'additional-exact-occurrence-present';
		} else if (
			rowPullRequests.some(
				( pullRequest ) =>
					destinationPullRequests.has( pullRequest ) &&
					! precedingPullRequests.has( pullRequest )
			)
		) {
			destinationTagStatus = 'present-by-pull-request';
		}
		const entryEvidence = {
			precedingExactCount: precedingEntryCount,
			destinationExactCount: destinationEntryCount,
			destinationTagStatus,
		};
		const pullRequestProofs = [];
		for ( const spec of specs ) {
			const movementCandidates = [];
			const wrongArtifactAbsenceCandidates = [];
			const wrongArtifactPresenceCandidates = [];
			const restorationCandidates = [];
			const nonShipmentCandidates = [];
			for ( const candidateSpec of spec.candidateSpecs ) {
				const { commit, implementationDiff } = candidateSpec;
				const collectPredicates = (
					transitionBeforeSha,
					transitionAfterSha
				) => {
					const predicates = [];
					for ( const file of implementationDiff.files ) {
						const getContent = ( commitSha ) =>
							files.get( `${ commitSha }:${ file.filePath }` ) ??
							null;
						const before = getContent(
							implementationDiff.parentSha
						);
						const after = getContent( commit.sha );
						const transitionBefore =
							getContent( transitionBeforeSha );
						const transitionAfter =
							getContent( transitionAfterSha );
						if (
							before !== after &&
							transitionBefore === before &&
							transitionAfter === after
						) {
							predicates.push( {
								method: 'exact-before-and-after-file-blobs',
								filePath: file.filePath,
								beforeHash:
									before === null ? null : hashText( before ),
								afterHash:
									after === null ? null : hashText( after ),
							} );
							continue;
						}
						const transitionBeforeLines =
							exactLines( transitionBefore );
						const transitionAfterLines =
							exactLines( transitionAfter );
						const beforeTokens = exactCodeTokens( before );
						const afterTokens = exactCodeTokens( after );
						const transitionBeforeTokens =
							exactCodeTokens( transitionBefore );
						const transitionAfterTokens =
							exactCodeTokens( transitionAfter );
						for ( const addedLine of file.addedLines ) {
							if (
								! transitionBeforeLines.has( addedLine ) &&
								transitionAfterLines.has( addedLine )
							) {
								predicates.push( {
									method: 'added-code-line-absent-then-present',
									filePath: file.filePath,
									lineHash: hashText( addedLine ),
									line: addedLine,
								} );
							}
						}
						for ( const removedLine of file.removedLines ) {
							if (
								transitionBeforeLines.has( removedLine ) &&
								! transitionAfterLines.has( removedLine )
							) {
								predicates.push( {
									method: 'removed-code-line-present-then-absent',
									filePath: file.filePath,
									lineHash: hashText( removedLine ),
									line: removedLine,
								} );
							}
						}
						for ( const addedToken of file.addedTokens ) {
							if (
								! beforeTokens.has( addedToken ) &&
								afterTokens.has( addedToken ) &&
								! transitionBeforeTokens.has( addedToken ) &&
								transitionAfterTokens.has( addedToken )
							) {
								predicates.push( {
									method: 'added-code-token-absent-then-present',
									filePath: file.filePath,
									tokenHash: hashText( addedToken ),
									token: addedToken,
								} );
							}
						}
						for ( const removedToken of file.removedTokens ) {
							if (
								beforeTokens.has( removedToken ) &&
								! afterTokens.has( removedToken ) &&
								transitionBeforeTokens.has( removedToken ) &&
								! transitionAfterTokens.has( removedToken )
							) {
								predicates.push( {
									method: 'removed-code-token-present-then-absent',
									filePath: file.filePath,
									tokenHash: hashText( removedToken ),
									token: removedToken,
								} );
							}
						}
					}
					if ( predicates.length > 0 ) {
						return predicates;
					}
					const patchKey = JSON.stringify( [
						commit.sha,
						packagePath,
						transitionBeforeSha,
						transitionAfterSha,
					] );
					if ( ! patchProofCache.has( patchKey ) ) {
						patchProofCache.set(
							patchKey,
							provePackagePatchTransition(
								repositoryPath,
								commit,
								packagePath,
								transitionBeforeSha,
								transitionAfterSha
							)
						);
					}
					const patchProof = patchProofCache.get( patchKey );
					if ( patchProof ) {
						predicates.push( patchProof );
					}
					return predicates;
				};
				const serializeCandidate = ( predicates ) => ( {
					commitSha: commit.sha,
					authorDate: commit.authorDate,
					subject: commit.subject,
					predicates: predicates.slice( 0, 3 ),
				} );
				const movementPredicates = collectPredicates(
					movementBeforeTag.publishSha,
					row.evidence.destinationTag.publishSha
				);
				if ( movementPredicates.length > 0 ) {
					movementCandidates.push(
						serializeCandidate( movementPredicates )
					);
				}
				if (
					isUnreleasedShipment &&
					implementationDiff.files.length > 0
				) {
					const unchangedPredicates = implementationDiff.files
						.map( ( file ) => {
							const before =
								files.get(
									`${ movementBeforeTag.publishSha }:${ file.filePath }`
								) ?? null;
							const after =
								files.get(
									`${ row.evidence.destinationTag.publishSha }:${ file.filePath }`
								) ?? null;
							return before === after
								? {
										method: 'unchanged-file-blob-across-tag-transition',
										filePath: file.filePath,
										beforeHash:
											before === null
												? null
												: hashText( before ),
										afterHash:
											after === null
												? null
												: hashText( after ),
								  }
								: null;
						} )
						.filter( Boolean );
					if (
						unchangedPredicates.length ===
						implementationDiff.files.length
					) {
						nonShipmentCandidates.push(
							serializeCandidate( unchangedPredicates )
						);
					}
				}
				if ( isFrozenAttribution ) {
					const wrongArtifactAbsencePredicates = collectPredicates(
						row.evidence.wrongTag.publishSha,
						row.evidence.destinationTag.publishSha
					);
					if ( wrongArtifactAbsencePredicates.length > 0 ) {
						wrongArtifactAbsenceCandidates.push(
							serializeCandidate( wrongArtifactAbsencePredicates )
						);
					}
					const wrongArtifactPresencePredicates = collectPredicates(
						implementationDiff.parentSha,
						row.evidence.wrongTag.publishSha
					);
					if ( wrongArtifactPresencePredicates.length > 0 ) {
						wrongArtifactPresenceCandidates.push(
							serializeCandidate(
								wrongArtifactPresencePredicates
							)
						);
					}
				}
				if (
					! isFrozenAttribution &&
					row.evidence.precedingWrongTag &&
					wrongEvent &&
					Date.parse( commit.authorDate ) <=
						Date.parse( wrongEvent.authorDate )
				) {
					const restorationPredicates = collectPredicates(
						row.evidence.precedingWrongTag.publishSha,
						row.evidence.wrongTag.publishSha
					);
					if ( restorationPredicates.length > 0 ) {
						restorationCandidates.push(
							serializeCandidate( restorationPredicates )
						);
					}
				}
			}
			const movementProof = summarizeCandidateProofs(
				movementCandidates,
				spec.candidateSpecs.length
			);
			const restorationProof = summarizeCandidateProofs(
				restorationCandidates,
				spec.candidateSpecs.length
			);
			const wrongArtifactAbsenceProof = summarizeCandidateProofs(
				wrongArtifactAbsenceCandidates,
				spec.candidateSpecs.length
			);
			const wrongArtifactPresenceProof = summarizeCandidateProofs(
				wrongArtifactPresenceCandidates,
				spec.candidateSpecs.length
			);
			const nonShipmentProof = {
				status:
					spec.candidateSpecs.length > 0 &&
					nonShipmentCandidates.length === spec.candidateSpecs.length
						? 'proved'
						: 'not-proved',
				candidateCount: spec.candidateSpecs.length,
				provedCandidates: nonShipmentCandidates,
			};
			pullRequestProofs.push( {
				pullRequest: spec.pullRequest,
				attributionMethod: spec.attributionMethod,
				candidateCommits: spec.candidateSpecs.map(
					( candidateSpec ) => ( {
						commitSha: candidateSpec.commit.sha,
						authorDate: candidateSpec.commit.authorDate,
						subject: candidateSpec.commit.subject,
					} )
				),
				...( spec.attributionAnchorHash
					? { attributionAnchorHash: spec.attributionAnchorHash }
					: {} ),
				...movementProof,
				wrongArtifactAbsence: wrongArtifactAbsenceProof,
				wrongArtifactPresence: wrongArtifactPresenceProof,
				restoration: restorationProof,
				nonShipment: nonShipmentProof,
			} );
		}
		const destinationImplementationProved =
			specs.length > 0 &&
			pullRequestProofs.every( ( proof ) => proof.status === 'proved' );
		const destinationEvent = eventsBySha.get(
			row.evidence.destinationTag.publishSha
		);
		const destinationPrecedesWrongArtifact =
			isFrozenAttribution &&
			destinationEvent &&
			wrongEvent &&
			Date.parse( destinationEvent.authorDate ) <
				Date.parse( wrongEvent.authorDate );
		const wrongArtifactAbsenceProved =
			! isFrozenAttribution ||
			( specs.length > 0 &&
				pullRequestProofs.every(
					( proof ) => proof.wrongArtifactAbsence.status === 'proved'
				) );
		const implementationProved =
			destinationImplementationProved &&
			( destinationPrecedesWrongArtifact || wrongArtifactAbsenceProved );
		const currentVersionImplementationProved =
			isFrozenAttribution &&
			! implementationProved &&
			specs.length > 0 &&
			pullRequestProofs.every(
				( proof ) => proof.wrongArtifactPresence.status === 'proved'
			);
		const restorationProved =
			specs.length > 0 &&
			pullRequestProofs.every(
				( proof ) => proof.restoration.status === 'proved'
			);
		const nonShipmentProved =
			isUnreleasedShipment &&
			specs.length > 0 &&
			pullRequestProofs.every(
				( proof ) => proof.nonShipment.status === 'proved'
			);
		const entryProved = entryEvidence.destinationTagStatus !== 'absent';
		const movementOnly =
			implementationProved &&
			( isUnreleasedShipment || ! restorationProved );
		const restorationOnly =
			! isUnreleasedShipment &&
			restorationProved &&
			! implementationProved;
		let status = 'pending';
		let method = null;
		if ( nonShipmentProved ) {
			status = 'proved-nonshipment';
			method =
				'unchanged-implementation-blobs-across-stable-tag-transition';
		} else if ( currentVersionImplementationProved ) {
			status = 'proved-current-version';
			method = 'wrong-artifact-tree-predicate-confirms-current-version';
		} else if ( movementOnly && entryProved ) {
			status = 'proved';
			if ( isUnreleasedShipment ) {
				method = 'stable-tag-tree-transition-and-new-unreleased-entry';
			} else if ( isFrozenAttribution ) {
				method = destinationPrecedesWrongArtifact
					? 'first-shipping-tree-transition-and-tagged-changelog-identity'
					: 'wrong-artifact-absence-and-destination-tree-predicate-with-tagged-changelog-identity';
			} else {
				method = 'package-tree-predicate-and-tagged-changelog-identity';
			}
		} else if ( restorationOnly ) {
			status = 'proved-restoration';
			method = 'package-tree-predicate-before-wrong-tag';
		}
		row.evidence.shipmentProof = {
			status,
			method,
			entryEvidence,
			pullRequests: pullRequestProofs,
		};
	}
}

/**
 * Converts frozen-baseline tag attributions into provisional correction rows.
 * These rows are candidates only until package-tree shipment proof succeeds.
 *
 * @param {Object} inventory Frozen publish inventory.
 * @param {Object} frozen    Frozen released-section and attribution audit.
 * @return {Object} Candidate rows and explicit construction failures.
 */
function buildFrozenAttributionCandidates( inventory, frozen ) {
	invariant(
		frozen && Array.isArray( frozen.attributions ),
		'Frozen attribution findings are required'
	);
	invariant(
		frozen.attributions.length > 0,
		'Frozen attribution candidate builder received zero findings'
	);
	const tagsByPackageAndVersion = new Map();
	for ( const event of inventory.events ) {
		for ( const tag of event.tags ) {
			const key = JSON.stringify( [ tag.package, tag.version ] );
			if ( ! tagsByPackageAndVersion.has( key ) ) {
				tagsByPackageAndVersion.set( key, [] );
			}
			tagsByPackageAndVersion.get( key ).push( { event, tag } );
		}
	}
	const corrections = [];
	const unresolved = [];
	for ( const attribution of frozen.attributions ) {
		const wrongCandidates =
			tagsByPackageAndVersion.get(
				JSON.stringify( [
					attribution.package,
					attribution.wrongVersion,
				] )
			) || [];
		if ( wrongCandidates.length !== 1 ) {
			unresolved.push( {
				id: `unresolved-candidate:${ attribution.id }`,
				type:
					wrongCandidates.length === 0
						? 'wrong-version-has-no-stable-package-tag'
						: 'wrong-version-has-ambiguous-stable-package-tags',
				attributionId: attribution.id,
				package: attribution.package,
				filePath: attribution.filePath,
				wrongVersion: attribution.wrongVersion,
				intendedVersion: attribution.intendedVersion,
				candidateCount: wrongCandidates.length,
			} );
			continue;
		}
		const wrong = wrongCandidates[ 0 ];
		const destination = attribution.firstStableMatch;
		const lanePreceding = findPreviousPackageTag(
			inventory,
			destination.publishSha,
			attribution.package,
			destination.primaryLaneId
		);
		let releaseKind = 'historical-stable-lane-unresolved';
		if ( destination.primaryLaneId ) {
			if ( destination.primaryLaneId !== 'wp/latest' ) {
				releaseKind = 'wordpress-patch-line';
			} else if (
				destination.classification ===
				'stable-publish-without-changelog-finalization'
			) {
				releaseKind = 'standalone-or-optional-wp-latest';
			} else {
				releaseKind = 'regular-wp-latest';
			}
		}
		corrections.push( {
			id: `correction:${ attribution.id }`,
			disposition: 'proposed',
			operation: 'move-entry',
			package: attribution.package,
			filePath: attribution.filePath,
			fromVersion: attribution.wrongVersion,
			fromSubsection: attribution.wrongSubsection,
			toVersion: attribution.intendedVersion,
			toSubsection:
				destination.matchedBlock.subsection ||
				attribution.wrongSubsection,
			entry: {
				evidenceBlock: destination.matchedBlock,
				currentBlock: {
					identityMethod: 'exact-frozen-baseline-block',
					pullRequests: extractPullRequests( attribution.block.text ),
					tokenSimilarity: 1,
					block: attribution.block,
				},
			},
			evidence: {
				method: 'first-stable-whole-tag-entry-identity',
				immediateFindingIds: [],
				secondaryMutationIds: [],
				frozenAttributionIds: [ attribution.id ],
				wrongTag: {
					name: wrong.tag.name,
					publishSha: wrong.event.publishSha,
					version: wrong.tag.version,
					entryStatus: 'requires-tree-proof',
				},
				trunkNextReleaseCutSha: null,
				destinationTag: {
					name: destination.tag,
					publishSha: destination.publishSha,
					version: destination.tagVersion,
					entryStatus: destination.identityMethod,
					observedSection: destination.observedSection,
				},
				precedingDestinationTag: lanePreceding
					? {
							name: lanePreceding.tag.name,
							version: lanePreceding.tag.version,
							publishSha: lanePreceding.event.publishSha,
							primaryLaneId: destination.primaryLaneId,
					  }
					: attribution.precedingStableTag,
				attributionStableMatches: attribution.stableMatches,
				lane: destination.primaryLaneId,
				releaseKind,
				shipmentProof: { status: 'pending', method: null },
			},
			currentState: {
				wrongMatch: 'found',
				wrongExactCount: 1,
				intendedMatch: 'not-evaluated',
				allLocationVersions: [ attribution.wrongVersion ],
				intendedHeadingPresent: null,
			},
		} );
	}
	corrections.sort( ( left, right ) => left.id.localeCompare( right.id ) );
	unresolved.sort( ( left, right ) => left.id.localeCompare( right.id ) );
	return { corrections, unresolved };
}

/**
 * Searches stable package-tag transitions for the first tree that accepts the
 * exact implementation patch associated with a late changelog attribution.
 * This handles notes first written into a later tag after the code shipped.
 *
 * @param {Object}   options                Discovery options.
 * @param {string}   options.repositoryPath Repository working directory.
 * @param {Object}   options.inventory      Frozen publish inventory.
 * @param {Object[]} options.corrections    Provisional frozen-attribution rows.
 * @return {Object} Proved discoveries and explicit unresolved rows.
 */
function discoverFrozenAttributionShipments( {
	repositoryPath,
	inventory,
	corrections,
} ) {
	const pending = corrections.filter(
		( row ) =>
			row.evidence.method === 'first-stable-whole-tag-entry-identity' &&
			row.evidence.shipmentProof.status === 'pending'
	);
	invariant(
		pending.length > 0,
		'Frozen attribution discovery received zero pending rows'
	);
	const timelineByPackage = new Map();
	for ( const event of inventory.events ) {
		for ( const tag of event.tags ) {
			if ( ! timelineByPackage.has( tag.package ) ) {
				timelineByPackage.set( tag.package, [] );
			}
			timelineByPackage.get( tag.package ).push( { event, tag } );
		}
	}
	for ( const timeline of timelineByPackage.values() ) {
		timeline.sort(
			( left, right ) =>
				left.event.authorDate.localeCompare( right.event.authorDate ) ||
				left.event.publishSha.localeCompare( right.event.publishSha )
		);
	}
	const commitCache = new Map();
	const patchProofCache = new Map();
	const discoveries = [];
	const unresolved = [];
	for ( const row of pending ) {
		const proofCandidates = row.evidence.shipmentProof.pullRequests.flatMap(
			( proof ) => proof.candidateCommits || []
		);
		if ( proofCandidates.length === 0 ) {
			unresolved.push( {
				rowId: row.id,
				type: 'no-attributed-implementation-commit',
			} );
			continue;
		}
		const commits = [];
		for ( const candidate of proofCandidates ) {
			if ( ! commitCache.has( candidate.commitSha ) ) {
				const fields = runGit( repositoryPath, [
					'show',
					'-s',
					'--format=%H%x1f%P%x1f%aI%x1f%s',
					candidate.commitSha,
				] ).split( '\u001f' );
				invariant(
					fields.length === 4,
					`Implementation commit ${ candidate.commitSha } is malformed`
				);
				commitCache.set( candidate.commitSha, {
					sha: fields[ 0 ],
					parents: fields[ 1 ] ? fields[ 1 ].split( ' ' ) : [],
					authorDate: fields[ 2 ],
					subject: fields[ 3 ],
				} );
			}
			commits.push( commitCache.get( candidate.commitSha ) );
		}
		const earliestCommitTime = Math.min(
			...commits.map( ( commit ) => Date.parse( commit.authorDate ) )
		);
		const firstTextTime = Date.parse(
			row.evidence.attributionStableMatches[ 0 ].authorDate
		);
		const latestTime = firstTextTime + 90 * 24 * 60 * 60 * 1000;
		const timeline = timelineByPackage.get( row.package ) || [];
		const transitionCandidates = [];
		for ( let index = 0; index < timeline.length; index++ ) {
			const current = timeline[ index ];
			const currentTime = Date.parse( current.event.authorDate );
			if (
				currentTime < earliestCommitTime ||
				currentTime > latestTime
			) {
				continue;
			}
			const lanePreceding = findPreviousPackageTag(
				inventory,
				current.event.publishSha,
				row.package,
				current.event.primaryLaneId
			);
			const chronologicalPreceding =
				index > 0 ? timeline[ index - 1 ] : null;
			const preceding = lanePreceding
				? {
						event: lanePreceding.event,
						tag: lanePreceding.tag,
				  }
				: chronologicalPreceding;
			if ( ! preceding ) {
				continue;
			}
			for ( const commit of commits ) {
				const cacheKey = JSON.stringify( [
					commit.sha,
					row.filePath,
					preceding.event.publishSha,
					current.event.publishSha,
				] );
				if ( ! patchProofCache.has( cacheKey ) ) {
					patchProofCache.set(
						cacheKey,
						provePackagePatchTransition(
							repositoryPath,
							commit,
							row.filePath.replace( /\/CHANGELOG\.md$/, '' ),
							preceding.event.publishSha,
							current.event.publishSha
						)
					);
				}
				const proof = patchProofCache.get( cacheKey );
				if ( proof ) {
					transitionCandidates.push( {
						commitSha: commit.sha,
						commitSubject: commit.subject,
						precedingTag: preceding.tag.name,
						precedingVersion: preceding.tag.version,
						precedingPublishSha: preceding.event.publishSha,
						destinationTag: current.tag.name,
						destinationVersion: current.tag.version,
						destinationPublishSha: current.event.publishSha,
						destinationAuthorDate: current.event.authorDate,
						lane: current.event.primaryLaneId,
						proof,
					} );
				}
			}
		}
		transitionCandidates.sort(
			( left, right ) =>
				left.destinationAuthorDate.localeCompare(
					right.destinationAuthorDate
				) ||
				left.destinationPublishSha.localeCompare(
					right.destinationPublishSha
				) ||
				left.commitSha.localeCompare( right.commitSha )
		);
		if ( transitionCandidates.length === 0 ) {
			unresolved.push( {
				rowId: row.id,
				type: 'no-stable-package-tree-accepts-attributed-patch',
				candidateCommitShas: commits.map( ( commit ) => commit.sha ),
			} );
			continue;
		}
		const firstTime = transitionCandidates[ 0 ].destinationAuthorDate;
		const firstTransitions = transitionCandidates.filter(
			( candidate ) => candidate.destinationAuthorDate === firstTime
		);
		const destinationShas = new Set(
			firstTransitions.map(
				( candidate ) => candidate.destinationPublishSha
			)
		);
		if ( destinationShas.size !== 1 ) {
			unresolved.push( {
				rowId: row.id,
				type: 'ambiguous-first-stable-package-tree-transition',
				transitions: firstTransitions,
			} );
			continue;
		}
		discoveries.push( {
			rowId: row.id,
			type: 'first-stable-package-tree-transition',
			transition: firstTransitions[ 0 ],
			alternativeCommitShas: firstTransitions
				.slice( 1 )
				.map( ( candidate ) => candidate.commitSha ),
		} );
	}
	discoveries.sort( ( left, right ) =>
		left.rowId.localeCompare( right.rowId )
	);
	unresolved.sort( ( left, right ) =>
		left.rowId.localeCompare( right.rowId )
	);
	return { discoveries, unresolved };
}

/**
 * Uses exact file/line/token predicates to discover shipment transitions when
 * strict patch applicability cannot survive nearby context changes.
 *
 * @param {Object}   options                Discovery options.
 * @param {string}   options.repositoryPath Repository working directory.
 * @param {Object}   options.inventory      Frozen publish inventory.
 * @param {Object[]} options.corrections    Pending frozen-attribution rows.
 * @return {Object} Proved discoveries and explicit unresolved rows.
 */
function discoverFrozenAttributionShipmentsWithPredicates( {
	repositoryPath,
	inventory,
	corrections,
} ) {
	const pending = corrections.filter(
		( row ) =>
			row.evidence.method === 'first-stable-whole-tag-entry-identity' &&
			row.evidence.shipmentProof.status === 'pending'
	);
	invariant(
		pending.length > 0,
		'Predicate discovery received zero pending frozen attributions'
	);
	const timelineByPackage = new Map();
	for ( const event of inventory.events ) {
		for ( const tag of event.tags ) {
			if ( ! timelineByPackage.has( tag.package ) ) {
				timelineByPackage.set( tag.package, [] );
			}
			timelineByPackage.get( tag.package ).push( { event, tag } );
		}
	}
	for ( const timeline of timelineByPackage.values() ) {
		timeline.sort(
			( left, right ) =>
				left.event.authorDate.localeCompare( right.event.authorDate ) ||
				left.event.publishSha.localeCompare( right.event.publishSha )
		);
	}
	const variants = [];
	for ( const row of pending ) {
		const candidateCommits =
			row.evidence.shipmentProof.pullRequests.flatMap(
				( proof ) => proof.candidateCommits || []
			);
		if ( candidateCommits.length === 0 ) {
			continue;
		}
		const earliestCommitTime = Math.min(
			...candidateCommits.map( ( commit ) =>
				Date.parse( commit.authorDate )
			)
		);
		const firstTextTime = Date.parse(
			row.evidence.attributionStableMatches[ 0 ].authorDate
		);
		const latestTime = firstTextTime + 90 * 24 * 60 * 60 * 1000;
		const timeline = timelineByPackage.get( row.package ) || [];
		for ( let index = 0; index < timeline.length; index++ ) {
			const current = timeline[ index ];
			const currentTime = Date.parse( current.event.authorDate );
			if (
				currentTime < earliestCommitTime ||
				currentTime > latestTime
			) {
				continue;
			}
			const lanePreceding = findPreviousPackageTag(
				inventory,
				current.event.publishSha,
				row.package,
				current.event.primaryLaneId
			);
			const chronologicalPreceding =
				index > 0 ? timeline[ index - 1 ] : null;
			const preceding = lanePreceding
				? {
						event: lanePreceding.event,
						tag: lanePreceding.tag,
				  }
				: chronologicalPreceding;
			if ( ! preceding ) {
				continue;
			}
			const variant = structuredClone( row );
			variant.id = `${ row.id }:tree-candidate:${ current.event.publishSha }`;
			variant.toVersion = current.tag.version;
			variant.evidence.destinationTag = {
				name: current.tag.name,
				publishSha: current.event.publishSha,
				version: current.tag.version,
				entryStatus: 'tree-transition-discovery',
			};
			variant.evidence.precedingDestinationTag = {
				name: preceding.tag.name,
				publishSha: preceding.event.publishSha,
				version: preceding.tag.version,
				primaryLaneId: current.event.primaryLaneId,
			};
			variant.evidence.lane = current.event.primaryLaneId;
			variant.evidence.shipmentProof = {
				status: 'pending',
				method: null,
			};
			variants.push( {
				rowId: row.id,
				destinationAuthorDate: current.event.authorDate,
				variant,
			} );
		}
	}
	if ( variants.length === 0 ) {
		return {
			discoveries: [],
			unresolved: pending.map( ( row ) => ( {
				rowId: row.id,
				type: 'no-bounded-stable-tag-transitions',
			} ) ),
			variantCount: 0,
		};
	}
	proveCorrectionShipments( {
		repositoryPath,
		inventory,
		corrections: variants.map( ( item ) => item.variant ),
	} );
	const discoveries = [];
	const unresolved = [];
	for ( const row of pending ) {
		const proved = variants
			.filter(
				( item ) =>
					item.rowId === row.id &&
					item.variant.evidence.shipmentProof.pullRequests.length >
						0 &&
					item.variant.evidence.shipmentProof.pullRequests.every(
						( proof ) => proof.status === 'proved'
					)
			)
			.sort(
				( left, right ) =>
					left.destinationAuthorDate.localeCompare(
						right.destinationAuthorDate
					) ||
					left.variant.evidence.destinationTag.publishSha.localeCompare(
						right.variant.evidence.destinationTag.publishSha
					)
			);
		if ( proved.length === 0 ) {
			unresolved.push( {
				rowId: row.id,
				type: 'no-stable-package-tree-transition-proved-by-predicates',
			} );
			continue;
		}
		const firstDate = proved[ 0 ].destinationAuthorDate;
		const first = proved.filter(
			( item ) => item.destinationAuthorDate === firstDate
		);
		const destinationShas = new Set(
			first.map(
				( item ) => item.variant.evidence.destinationTag.publishSha
			)
		);
		if ( destinationShas.size !== 1 ) {
			unresolved.push( {
				rowId: row.id,
				type: 'ambiguous-first-predicate-proved-tree-transition',
				destinationTags: first.map(
					( item ) => item.variant.evidence.destinationTag
				),
			} );
			continue;
		}
		const selected = first[ 0 ].variant;
		discoveries.push( {
			rowId: row.id,
			type: 'first-stable-package-tree-transition',
			transition: {
				precedingTag: selected.evidence.precedingDestinationTag,
				destinationTag: selected.evidence.destinationTag,
				lane: selected.evidence.lane,
				shipmentProof: selected.evidence.shipmentProof,
			},
		} );
	}
	discoveries.sort( ( left, right ) =>
		left.rowId.localeCompare( right.rowId )
	);
	unresolved.sort( ( left, right ) =>
		left.rowId.localeCompare( right.rowId )
	);
	return { discoveries, unresolved, variantCount: variants.length };
}

/**
 * Reconciles proved frozen-baseline attributions with four-snapshot rows.
 * First-shipment tree evidence supersedes a conflicting next-cut destination.
 *
 * @param {Object}   options             Reconciliation options.
 * @param {Object[]} options.corrections Existing correction rows, mutated.
 * @param {Object[]} options.exceptions  Existing exception rows, mutated.
 * @param {Object[]} options.candidates  Provisional attribution rows.
 * @param {Object[]} options.discoveries Late-note tree discoveries.
 * @return {Object} Reconciliation counts and unresolved attribution rows.
 */
function reconcileFrozenAttributionEvidence( {
	corrections,
	exceptions,
	candidates,
	discoveries,
} ) {
	const discoveryByRow = new Map(
		discoveries.map( ( discovery ) => [ discovery.rowId, discovery ] )
	);
	const equivalent = ( left, right ) =>
		locateEquivalentBlock( { blocks: [ left ] }, right ).status === 'found';
	const sourceMatches = ( row ) => {
		const possible = corrections.filter(
			( correction ) =>
				correction.disposition === 'proposed' &&
				correction.filePath === row.filePath &&
				correction.fromVersion === row.fromVersion &&
				correction.entry?.currentBlock?.block
		);
		const exact = possible.filter(
			( correction ) =>
				correction.entry.currentBlock.block.hash ===
				row.entry.currentBlock.block.hash
		);
		return exact.length > 0
			? exact
			: possible.filter( ( correction ) =>
					equivalent(
						correction.entry.currentBlock.block,
						row.entry.currentBlock.block
					)
			  );
	};
	const removeCorrection = ( row ) => {
		const index = corrections.indexOf( row );
		invariant(
			index !== -1,
			`Cannot remove unknown correction ${ row.id }`
		);
		corrections.splice( index, 1 );
	};
	const mergeAccounting = ( destination, source ) => {
		for ( const key of [
			'immediateFindingIds',
			'secondaryMutationIds',
			'secondaryUnresolvedIds',
			'frozenAttributionIds',
		] ) {
			destination.evidence[ key ] = [
				...( destination.evidence[ key ] || [] ),
				...( source.evidence[ key ] || [] ),
			]
				.filter( ( id, index, ids ) => ids.indexOf( id ) === index )
				.sort();
		}
	};
	const unresolved = [];
	const counts = {
		provedCandidateCount: 0,
		provedCurrentVersionCount: 0,
		provedRestorationCount: 0,
		discoveredCorrectionCount: 0,
		discoveredAlreadyCorrectCount: 0,
		mergedExistingCount: 0,
		supersededExistingCount: 0,
		addedCorrectionCount: 0,
		coveredPendingCount: 0,
	};

	for ( const row of candidates ) {
		const discovery = discoveryByRow.get( row.id );
		if ( row.evidence.shipmentProof.status === 'proved-restoration' ) {
			counts.provedRestorationCount++;
			exceptions.push( {
				id: `accepted-frozen-reviewed-restoration:${ row.id }`,
				type: 'reviewed-postpublish-restoration-confirms-frozen-version',
				package: row.package,
				filePath: row.filePath,
				version: row.fromVersion,
				entry: row.entry,
				evidence: {
					method: 'reviewed-special-tree-evidence',
					frozenAttributionIds: row.evidence.frozenAttributionIds,
					wrongTag: row.evidence.wrongTag,
					shipmentProof: row.evidence.shipmentProof,
				},
			} );
			continue;
		}
		if ( row.evidence.shipmentProof.status === 'proved-current-version' ) {
			counts.provedCurrentVersionCount++;
			exceptions.push( {
				id: `accepted-frozen-current-version:${ row.id }`,
				type: 'wrong-artifact-tree-predicate-confirms-frozen-version',
				package: row.package,
				filePath: row.filePath,
				version: row.fromVersion,
				entry: row.entry,
				evidence: {
					method: 'wrong-artifact-tree-predicate-confirms-current-version',
					frozenAttributionIds: row.evidence.frozenAttributionIds,
					wrongTag: row.evidence.wrongTag,
					shipmentProof: row.evidence.shipmentProof,
				},
			} );
			continue;
		}
		if ( row.evidence.shipmentProof.status === 'proved' ) {
			counts.provedCandidateCount++;
		} else if ( discovery ) {
			const transition = discovery.transition;
			if ( transition.destinationTag.version === row.fromVersion ) {
				counts.discoveredAlreadyCorrectCount++;
				exceptions.push( {
					id: `accepted-frozen-tree-attribution:${ row.id }`,
					type: 'first-stable-tree-transition-confirms-frozen-version',
					package: row.package,
					filePath: row.filePath,
					version: row.fromVersion,
					entry: row.entry,
					evidence: transition,
				} );
				continue;
			}
			counts.discoveredCorrectionCount++;
			row.toVersion = transition.destinationTag.version;
			row.toSubsection = row.fromSubsection;
			row.evidence.destinationTag = transition.destinationTag;
			row.evidence.precedingDestinationTag = transition.precedingTag;
			row.evidence.lane = transition.lane;
			row.evidence.shipmentProof = transition.shipmentProof;
		} else {
			const matches = sourceMatches( row );
			const reviewed = matches.find(
				( correction ) =>
					correction.evidence.shipmentProof.method ===
					'reviewed-special-tree-evidence'
			);
			if ( reviewed ) {
				counts.coveredPendingCount++;
				mergeAccounting( reviewed, row );
				continue;
			}
			const covered = matches.find(
				( correction ) =>
					correction.toVersion === row.toVersion &&
					correction.evidence.shipmentProof.status !== 'pending'
			);
			if ( covered ) {
				counts.coveredPendingCount++;
				covered.evidence.frozenAttributionIds = [
					...( covered.evidence.frozenAttributionIds || [] ),
					...row.evidence.frozenAttributionIds,
				].sort();
				continue;
			}
			const destinationRestore = corrections.find(
				( correction ) =>
					correction.disposition === 'proposed' &&
					correction.filePath === row.filePath &&
					correction.toVersion === row.toVersion &&
					correction.operation === 'restore-entry' &&
					correction.evidence.shipmentProof.status !== 'pending' &&
					equivalent(
						correction.entry.evidenceBlock,
						row.entry.evidenceBlock
					)
			);
			if ( destinationRestore ) {
				counts.coveredPendingCount++;
				row.operation = 'remove-duplicate-entry';
				row.evidence.shipmentProof = {
					status: 'proved',
					method: 'published-destination-and-ledgered-restoration',
					destinationCorrectionId: destinationRestore.id,
				};
			} else {
				unresolved.push( row );
				continue;
			}
		}

		const matches = sourceMatches( row );
		const sameDestination = matches.find(
			( correction ) => correction.toVersion === row.toVersion
		);
		if ( sameDestination ) {
			counts.mergedExistingCount++;
			mergeAccounting( sameDestination, row );
			sameDestination.evidence.firstShipmentProof = {
				destinationTag: row.evidence.destinationTag,
				precedingDestinationTag: row.evidence.precedingDestinationTag,
				shipmentProof: row.evidence.shipmentProof,
			};
			for ( const duplicate of matches.filter(
				( correction ) => correction !== sameDestination
			) ) {
				mergeAccounting( sameDestination, duplicate );
				removeCorrection( duplicate );
				counts.supersededExistingCount++;
				exceptions.push( {
					id: `superseded-by-first-shipment:${ duplicate.id }`,
					type: 'next-cut-destination-superseded-by-first-shipment-tree-proof',
					correctionId: duplicate.id,
					replacementCorrectionId: sameDestination.id,
					fromVersion: duplicate.fromVersion,
					inferredVersion: duplicate.toVersion,
					provedVersion: sameDestination.toVersion,
				} );
			}
			continue;
		}

		for ( const conflict of matches ) {
			mergeAccounting( row, conflict );
			removeCorrection( conflict );
			counts.supersededExistingCount++;
			exceptions.push( {
				id: `superseded-by-first-shipment:${ conflict.id }`,
				type: 'next-cut-destination-superseded-by-first-shipment-tree-proof',
				correctionId: conflict.id,
				replacementCorrectionId: row.id,
				fromVersion: conflict.fromVersion,
				inferredVersion: conflict.toVersion,
				provedVersion: row.toVersion,
			} );
		}
		corrections.push( row );
		counts.addedCorrectionCount++;
	}
	corrections.sort( ( left, right ) => left.id.localeCompare( right.id ) );
	exceptions.sort( ( left, right ) => left.id.localeCompare( right.id ) );
	unresolved.sort( ( left, right ) => left.id.localeCompare( right.id ) );
	return { counts, unresolved };
}

/**
 * Returns the exact block a correction would insert into its destination.
 *
 * @param {Object} row Correction row.
 * @return {?Object} Destination block, or null for removal-only rows.
 */
function getCorrectionDestinationBlock( row ) {
	if ( row.operation === 'move-and-replace-entry' ) {
		return row.entry?.replacementBlock || null;
	}
	if ( row.operation === 'move-entry' ) {
		return row.entry?.currentBlock?.block || null;
	}
	if ( row.operation === 'restore-entry' ) {
		return row.entry?.evidenceBlock || null;
	}
	return null;
}

/**
 * Ensures multiple corrupt source occurrences produce one destination
 * insertion. Published restorations take precedence because they preserve the
 * immutable bytes; otherwise the lexically first move is the insertion.
 *
 * @param {Object[]} corrections Correction rows, mutated in place.
 * @return {Object} Consolidation counts and affected row IDs.
 */
function consolidateDuplicateDestinations( corrections ) {
	const groups = new Map();
	for ( const row of corrections ) {
		if ( row.disposition !== 'proposed' || ! row.toVersion ) {
			continue;
		}
		const block = getCorrectionDestinationBlock( row );
		if ( ! block ) {
			continue;
		}
		const key = JSON.stringify( [
			row.filePath,
			row.toVersion,
			block.hash,
			block.text,
		] );
		if ( ! groups.has( key ) ) {
			groups.set( key, [] );
		}
		groups.get( key ).push( row );
	}

	const consolidated = [];
	for ( const rows of groups.values() ) {
		if ( rows.length < 2 ) {
			continue;
		}
		rows.sort( ( left, right ) => {
			const leftRank = left.operation === 'restore-entry' ? 0 : 1;
			const rightRank = right.operation === 'restore-entry' ? 0 : 1;
			return leftRank - rightRank || left.id.localeCompare( right.id );
		} );
		const keeper = rows[ 0 ];
		invariant(
			rows.filter( ( row ) => ! row.fromVersion ).length <= 1,
			`Duplicate destination ${ keeper.filePath } ${ keeper.toVersion } has multiple insertion-only rows`
		);
		for ( const duplicate of rows.slice( 1 ) ) {
			invariant(
				duplicate.fromVersion && duplicate.entry?.currentBlock?.block,
				`Duplicate destination row ${ duplicate.id } cannot become a source removal`
			);
			const originalOperation = duplicate.operation;
			duplicate.operation = 'remove-duplicate-entry';
			duplicate.evidence.duplicateDestination = {
				insertionCorrectionId: keeper.id,
				originalOperation,
				filePath: duplicate.filePath,
				version: duplicate.toVersion,
				blockHash: getCorrectionDestinationBlock( keeper ).hash,
			};
			consolidated.push( {
				removalCorrectionId: duplicate.id,
				insertionCorrectionId: keeper.id,
			} );
		}
	}

	consolidated.sort( ( left, right ) =>
		left.removalCorrectionId.localeCompare( right.removalCorrectionId )
	);
	return {
		groupCount: new Set(
			consolidated.map( ( item ) => item.insertionCorrectionId )
		).size,
		removalOnlyCount: consolidated.length,
		consolidated,
	};
}

/**
 * Replaces the exhaustive whole-tag match list with the immutable endpoints
 * needed to reproduce and review the selected attribution.
 *
 * @param {Object[]} corrections Correction rows, mutated in place.
 */
function compactFrozenAttributionEvidence( corrections ) {
	for ( const row of corrections ) {
		const matches = row.evidence?.attributionStableMatches;
		if ( ! Array.isArray( matches ) ) {
			continue;
		}
		row.evidence.attributionStableMatchSummary = {
			count: matches.length,
			first:
				matches.length > 0
					? {
							publishSha: matches[ 0 ].publishSha,
							tag: matches[ 0 ].tag,
							tagVersion: matches[ 0 ].tagVersion,
							observedSection: matches[ 0 ].observedSection,
							identityMethod: matches[ 0 ].identityMethod,
					  }
					: null,
			last:
				matches.length > 0
					? {
							publishSha: matches.at( -1 ).publishSha,
							tag: matches.at( -1 ).tag,
							tagVersion: matches.at( -1 ).tagVersion,
							observedSection: matches.at( -1 ).observedSection,
							identityMethod: matches.at( -1 ).identityMethod,
					  }
					: null,
		};
		delete row.evidence.attributionStableMatches;
	}
}

/**
 * Scores whether an immediate finding is already represented by a correction.
 *
 * @param {Object} finding    Immediate finding.
 * @param {Object} correction Correction row.
 * @return {number} Match score, or negative one for no match.
 */
function scoreFindingCorrection( finding, correction ) {
	if (
		! finding.block ||
		! correction.entry ||
		finding.filePath !== correction.filePath ||
		finding.package !== correction.package
	) {
		return -1;
	}
	const evidenceBlock = correction.entry.evidenceBlock;
	if ( finding.block.hash === evidenceBlock.hash ) {
		return 3;
	}
	const shared = sharedPullRequests( finding.block, evidenceBlock );
	const similarity = tokenSimilarity(
		finding.block.text,
		evidenceBlock.text
	);
	if ( shared.length > 0 ) {
		return 2 + similarity;
	}
	return similarity >= 0.72 ? similarity : -1;
}

/**
 * Attaches an immediate finding to a unique existing correction when possible.
 *
 * @param {Object}   finding     Immediate finding.
 * @param {Object[]} corrections Correction rows.
 * @return {boolean} Whether a unique correction was updated.
 */
function attachImmediateFinding( finding, corrections ) {
	const candidates = corrections
		.map( ( correction ) => ( {
			correction,
			score: scoreFindingCorrection( finding, correction ),
		} ) )
		.filter( ( candidate ) => candidate.score >= 0 )
		.sort(
			( left, right ) =>
				right.score - left.score ||
				left.correction.id.localeCompare( right.correction.id )
		);
	if (
		candidates.length === 0 ||
		( candidates.length > 1 &&
			candidates[ 0 ].score === candidates[ 1 ].score )
	) {
		return false;
	}
	const ids = candidates[ 0 ].correction.evidence.immediateFindingIds;
	if ( ! ids.includes( finding.id ) ) {
		ids.push( finding.id );
		ids.sort();
	}
	return true;
}

/**
 * Resolves all immediate findings into correction or exception rows.
 *
 * @param {Object}   options              Ledger resolution options.
 * @param {Object}   options.inventory    Frozen publish inventory.
 * @param {Object}   options.immediate    Immediate audit report.
 * @param {Map}      options.parsedByPath Frozen changelogs by path.
 * @param {Object[]} options.corrections  Correction rows.
 * @param {Object[]} options.exceptions   Accepted exception rows.
 */
function resolveImmediateFindings( {
	inventory,
	immediate,
	parsedByPath,
	corrections,
	exceptions,
} ) {
	const pairedFindingIds = new Set();
	const pairable = immediate.findings
		.filter( ( finding ) => finding.block )
		.map( ( finding ) => ( {
			...finding,
			version: finding.wrongVersion,
			nextReleaseCutSha: finding.trunkPostSha,
			type: [
				'trunk-entry-misattributed-to-release',
				'unexplained-released-entry',
			].includes( finding.type )
				? 'block-added-before-next-release-cut'
				: 'block-removed-before-next-release-cut',
		} ) );
	const paired = pairHistoricalReplacements( pairable );
	for ( const replacement of paired.replacements ) {
		pairedFindingIds.add( replacement.addedMutationId );
		pairedFindingIds.add( replacement.removedMutationId );
		exceptions.push( {
			...replacement,
			id: `accepted-immediate-replacement:${ replacement.removedMutationId }`,
			type: 'accepted-immediate-entry-replacement',
			immediateFindingIds: [
				replacement.removedMutationId,
				replacement.addedMutationId,
			].sort(),
		} );
	}

	for ( const finding of immediate.findings ) {
		if ( pairedFindingIds.has( finding.id ) ) {
			continue;
		}
		if ( attachImmediateFinding( finding, corrections ) ) {
			continue;
		}
		if ( ! finding.block ) {
			exceptions.push( {
				id: `accepted-immediate-byte-drift:${ finding.id }`,
				type: 'accepted-immediate-section-byte-normalization',
				immediateFindingIds: [ finding.id ],
				package: finding.package,
				filePath: finding.filePath,
				version: finding.wrongVersion,
				publishSha: finding.publishSha,
				trunkPreSha: finding.trunkPreSha,
				trunkPostSha: finding.trunkPostSha,
				publishedSectionHash: finding.publishedSectionHash,
				trunkPostSectionHash: finding.trunkPostSectionHash,
			} );
			continue;
		}
		const parsed = parsedByPath.get( finding.filePath );
		if ( parsed === null ) {
			exceptions.push( {
				id: `excluded-immediate-removed-package:${ finding.id }`,
				type: 'package-changelog-absent-from-frozen-baseline',
				immediateFindingIds: [ finding.id ],
				package: finding.package,
				filePath: finding.filePath,
				version: finding.wrongVersion,
				publishSha: finding.publishSha,
				evidenceBlock: finding.block,
			} );
			continue;
		}
		const section = getOptionalSection( parsed, finding.wrongVersion );
		const match = locateEquivalentBlock( section, finding.block );
		const isMissing = [
			'published-entry-displaced-to-unreleased',
			'published-entry-missing-after-backport',
		].includes( finding.type );
		if ( isMissing ) {
			if ( match.status === 'found' ) {
				exceptions.push( {
					id: `accepted-immediate-restored:${ finding.id }`,
					type: 'published-entry-present-in-frozen-baseline',
					immediateFindingIds: [ finding.id ],
					package: finding.package,
					filePath: finding.filePath,
					version: finding.wrongVersion,
					publishSha: finding.publishSha,
					identityMethod: match.identityMethod,
					publishedBlock: finding.block,
					currentBlock: serializeBlock( {
						...match.block,
						occurrence: 1,
					} ),
				} );
				continue;
			}
			const event = inventory.events.find(
				( candidate ) => candidate.publishSha === finding.publishSha
			);
			const tag = event.tags.find(
				( candidate ) => candidate.package === finding.package
			);
			corrections.push( {
				id: `correction:${ finding.id }`,
				disposition: match.status.startsWith( 'ambiguous' )
					? 'unresolved'
					: 'proposed',
				operation: match.status.startsWith( 'ambiguous' )
					? null
					: 'restore-entry',
				package: finding.package,
				filePath: finding.filePath,
				fromVersion: null,
				fromSubsection: finding.block.subsection,
				toVersion: finding.wrongVersion,
				toSubsection: finding.block.subsection,
				entry: { evidenceBlock: finding.block, currentBlock: null },
				evidence: {
					method: 'published-tag-entry-missing-after-immediate-backport',
					immediateFindingIds: [ finding.id ],
					secondaryMutationIds: [],
					wrongTag: null,
					trunkNextReleaseCutSha: finding.trunkPostSha,
					destinationTag: {
						name: tag.name,
						publishSha: finding.publishSha,
						version: finding.wrongVersion,
						entryStatus: 'present-exact',
					},
					precedingDestinationTag: null,
					lane: event.primaryLaneId,
					releaseKind: null,
					shipmentProof: {
						status: 'proved-by-published-changelog',
						method: 'exact-tag-section-bytes',
					},
				},
				currentState: {
					wrongMatch: null,
					intendedMatch: match.status,
					allLocationVersions: [],
					intendedHeadingPresent: section !== null,
				},
			} );
			continue;
		}

		if ( match.status !== 'found' ) {
			exceptions.push( {
				id: `accepted-immediate-no-longer-misattributed:${ finding.id }`,
				type: 'misattributed-entry-absent-from-frozen-wrong-section',
				immediateFindingIds: [ finding.id ],
				package: finding.package,
				filePath: finding.filePath,
				version: finding.wrongVersion,
				publishSha: finding.publishSha,
				evidenceBlock: finding.block,
				currentLocations: locateAcrossChangelog(
					parsed,
					finding.block
				).map( ( location ) => location.version ),
			} );
			continue;
		}

		const next = findNextPackageTag(
			inventory,
			finding.publishSha,
			finding.package
		);
		if ( ! next ) {
			corrections.push( {
				id: `correction:${ finding.id }`,
				disposition: 'unresolved',
				operation: null,
				package: finding.package,
				filePath: finding.filePath,
				fromVersion: finding.wrongVersion,
				fromSubsection: match.block.subsection,
				toVersion: null,
				toSubsection: finding.block.subsection,
				entry: {
					evidenceBlock: finding.block,
					currentBlock: serializeCurrentMatch( match ),
				},
				evidence: {
					method: 'immediate-backport-diff-without-next-stable-tag',
					immediateFindingIds: [ finding.id ],
					secondaryMutationIds: [],
					wrongTag: null,
					trunkNextReleaseCutSha: finding.trunkPostSha,
					destinationTag: null,
					precedingDestinationTag: null,
					lane: null,
					releaseKind: null,
					shipmentProof: { status: 'pending', method: null },
				},
				currentState: {
					wrongMatch: 'found',
					intendedMatch: null,
					allLocationVersions: [ finding.wrongVersion ],
					intendedHeadingPresent: false,
				},
			} );
			continue;
		}
		const destinationReleaseCutSha =
			next.destinationEvent.releaseSourceSha ||
			next.destinationEvent.publishParentSha;
		corrections.push(
			buildAddedBlockRow(
				{
					id: `immediate-only:${ finding.id }`,
					package: finding.package,
					filePath: finding.filePath,
					version: finding.wrongVersion,
					intendedVersion: next.destinationTag.version,
					publishSha: finding.publishSha,
					nextEventSha: next.destinationEvent.publishSha,
					nextReleaseCutSha: destinationReleaseCutSha,
					lane: next.lane,
					releaseKind: next.releaseKind,
					precedingTag: next.precedingTag.name,
					destinationTag: next.destinationTag.name,
					block: finding.block,
				},
				parsed,
				[ finding.id ]
			)
		);
	}
}

/**
 * Builds a deterministic provisional correction ledger from audit evidence.
 * It remains read-only: pending shipment proofs prevent generation.
 *
 * @param {Object}  options                     Ledger options.
 * @param {string}  options.repositoryPath      Repository path.
 * @param {Object}  options.inventory           Frozen publish inventory.
 * @param {Object}  options.immediate           Immediate audit report.
 * @param {Object}  options.secondary           Pre-next-cut audit report.
 * @param {?Object} options.frozen              Frozen-baseline attribution report.
 * @param {boolean} options.proveShipments      Whether to inspect package trees.
 * @param {?Object} options.shipmentResolutions Reviewed shipment decisions.
 * @param {?Object} options.reviewResolutions   Independent review decisions.
 * @return {Object} Machine-readable correction ledger.
 */
function buildCorrectionLedger( {
	repositoryPath,
	inventory,
	immediate,
	secondary,
	frozen = null,
	proveShipments = false,
	shipmentResolutions = null,
	reviewResolutions = null,
} ) {
	let previousTiming = Date.now();
	const reportTiming = ( phase ) => {
		if ( process.env.HISTORICAL_CHANGELOG_AUDIT_TIMING !== '1' ) {
			return;
		}
		const now = Date.now();
		process.stderr.write(
			`historical-changelog-ledger ${ phase }: ${
				now - previousTiming
			}ms\n`
		);
		previousTiming = now;
	};
	invariant(
		inventory && inventory.baseline,
		'Ledger inventory is required'
	);
	invariant(
		immediate && Array.isArray( immediate.findings ),
		'Ledger immediate findings are required'
	);
	invariant(
		secondary && Array.isArray( secondary.mutations ),
		'Ledger secondary mutations are required'
	);
	invariant(
		immediate.unresolved.length === 0,
		'Ledger cannot consume unresolved immediate findings'
	);

	const { replacements, unpairedAdditions, unpairedRemovals } =
		pairHistoricalReplacements( secondary.mutations );
	const filePaths = [
		...immediate.findings.map( ( finding ) => finding.filePath ),
		...secondary.mutations.map( ( mutation ) => mutation.filePath ),
		...secondary.unresolved.map( ( unresolved ) => unresolved.filePath ),
		...( frozen?.attributions || [] ).map(
			( attribution ) => attribution.filePath
		),
		...( frozen?.unresolvedAttributions || [] ).map(
			( attribution ) => attribution.filePath
		),
		...( frozen?.mutations || [] ).map( ( mutation ) => mutation.filePath ),
		...( frozen?.unreleasedShipmentCandidates || [] ).map(
			( candidate ) => candidate.filePath
		),
	];
	const parsedByPath = readBaselineChangelogs( {
		repositoryPath,
		baselineSha: inventory.baseline.trunkSha,
		filePaths,
	} );
	const immediateByBlock = new Map();
	for ( const finding of immediate.findings ) {
		if ( ! finding.block ) {
			continue;
		}
		const key = JSON.stringify( [
			finding.filePath,
			finding.wrongVersion,
			finding.block.hash,
		] );
		if ( ! immediateByBlock.has( key ) ) {
			immediateByBlock.set( key, [] );
		}
		immediateByBlock.get( key ).push( finding.id );
	}

	const corrections = [];
	const exceptions = [ ...replacements ];
	const appliedShipmentResolutionIds = new Set();
	if ( shipmentResolutions ) {
		invariant(
			shipmentResolutions.schemaVersion === 1 &&
				shipmentResolutions.baselineSha ===
					inventory.baseline.trunkSha &&
				Array.isArray( shipmentResolutions.resolutions ) &&
				shipmentResolutions.resolutions.length > 0 &&
				new Set(
					shipmentResolutions.resolutions.map(
						( resolution ) => resolution.id
					)
				).size === shipmentResolutions.resolutions.length,
			'Reviewed shipment resolutions must be non-empty, uniquely identified, and bound to the frozen baseline'
		);
	}
	const applyMatchingShipmentResolutions = ( rows ) => {
		if ( ! shipmentResolutions ) {
			return;
		}
		const matchingResolutions = shipmentResolutions.resolutions.filter(
			( resolution ) =>
				rows.filter(
					( row ) =>
						row.evidence?.shipmentProof?.status === 'pending' &&
						row.package === resolution.package &&
						row.entry?.evidenceBlock?.hash ===
							resolution.entryHash &&
						row.evidence.wrongTag?.name === resolution.wrongTag
				).length === 1
		);
		if ( matchingResolutions.length === 0 ) {
			return;
		}
		for ( const resolution of matchingResolutions ) {
			appliedShipmentResolutionIds.add( resolution.id );
		}
		applyReviewedShipmentResolutions( {
			repositoryPath,
			inventory,
			corrections: rows,
			resolutions: {
				...shipmentResolutions,
				resolutions: matchingResolutions,
			},
		} );
	};
	for ( const mutation of unpairedAdditions ) {
		const parsed = parsedByPath.get( mutation.filePath );
		if ( parsed === null ) {
			exceptions.push( {
				id: `excluded-removed-package:${ mutation.id }`,
				type: 'package-changelog-absent-from-frozen-baseline',
				mutationId: mutation.id,
				package: mutation.package,
				filePath: mutation.filePath,
				version: mutation.version,
				publishSha: mutation.publishSha,
				evidenceBlock: mutation.block,
			} );
			continue;
		}
		const immediateFindingIds =
			immediateByBlock.get(
				JSON.stringify( [
					mutation.filePath,
					mutation.version,
					mutation.block.hash,
				] )
			) || [];
		corrections.push(
			buildAddedBlockRow( mutation, parsed, immediateFindingIds )
		);
	}

	for ( const mutation of unpairedRemovals ) {
		const parsed = parsedByPath.get( mutation.filePath );
		if ( parsed === null ) {
			exceptions.push( {
				id: `excluded-removed-package:${ mutation.id }`,
				type: 'package-changelog-absent-from-frozen-baseline',
				mutationId: mutation.id,
				package: mutation.package,
				filePath: mutation.filePath,
				version: mutation.version,
				publishSha: mutation.publishSha,
				evidenceBlock: mutation.block,
			} );
			continue;
		}
		const section = getOptionalSection( parsed, mutation.version );
		const match = locateEquivalentBlock( section, mutation.block );
		if ( match.status === 'found' ) {
			exceptions.push( {
				id: `accepted-restored:${ mutation.id }`,
				type: 'published-entry-present-in-frozen-baseline',
				mutationId: mutation.id,
				package: mutation.package,
				filePath: mutation.filePath,
				version: mutation.version,
				publishSha: mutation.publishSha,
				identityMethod: match.identityMethod,
				publishedBlock: mutation.block,
				currentBlock: serializeBlock( {
					...match.block,
					occurrence: 1,
				} ),
			} );
		} else {
			corrections.push( {
				id: `correction:${ mutation.id }`,
				disposition: match.status.startsWith( 'ambiguous' )
					? 'unresolved'
					: 'proposed',
				operation: match.status.startsWith( 'ambiguous' )
					? null
					: 'restore-entry',
				package: mutation.package,
				filePath: mutation.filePath,
				fromVersion: null,
				fromSubsection: mutation.block.subsection,
				toVersion: mutation.version,
				toSubsection: mutation.block.subsection,
				entry: {
					evidenceBlock: mutation.block,
					currentBlock: null,
				},
				evidence: {
					method: 'published-tag-entry-removed-before-next-cut',
					immediateFindingIds: [],
					secondaryMutationIds: [ mutation.id ],
					wrongTag: null,
					trunkNextReleaseCutSha: mutation.nextReleaseCutSha,
					destinationTag: {
						name: mutation.precedingTag,
						publishSha: mutation.publishSha,
						version: mutation.version,
						entryStatus: 'present-exact',
					},
					precedingDestinationTag: null,
					lane: mutation.lane,
					releaseKind: mutation.releaseKind,
					shipmentProof: {
						status: 'proved-by-published-changelog',
						method: 'exact-tag-section-bytes',
					},
				},
				currentState: {
					wrongMatch: null,
					intendedMatch: match.status,
					allLocationVersions: [],
					intendedHeadingPresent: section !== null,
				},
			} );
		}
	}

	for ( const mutation of secondary.mutations.filter(
		( item ) => item.type === 'released-section-byte-drift-before-next-cut'
	) ) {
		exceptions.push( {
			id: `accepted-byte-drift:${ mutation.id }`,
			type: 'accepted-released-section-byte-normalization',
			mutationId: mutation.id,
			package: mutation.package,
			filePath: mutation.filePath,
			version: mutation.version,
			publishSha: mutation.publishSha,
			nextReleaseCutSha: mutation.nextReleaseCutSha,
			publishedSectionHash: mutation.publishedSectionHash,
			nextSectionHash: mutation.nextSectionHash,
		} );
	}

	for ( const unresolved of secondary.unresolved ) {
		const parsed = parsedByPath.get( unresolved.filePath );
		if ( parsed === null ) {
			exceptions.push( {
				id: `excluded-removed-package:${ unresolved.id }`,
				type: 'package-changelog-absent-from-frozen-baseline',
				mutationId: unresolved.id,
				package: unresolved.package,
				filePath: unresolved.filePath,
				version: unresolved.version,
				publishSha: unresolved.publishSha,
			} );
			continue;
		}
		const section = getOptionalSection( parsed, unresolved.version );
		if ( section ) {
			exceptions.push( {
				id: `resolved-heading-timing:${ unresolved.id }`,
				type: 'heading-restored-after-next-release-cut',
				mutationId: unresolved.id,
				package: unresolved.package,
				filePath: unresolved.filePath,
				version: unresolved.version,
				publishSha: unresolved.publishSha,
				nextReleaseCutSha: unresolved.nextReleaseCutSha,
				frozenHeading: section.heading,
			} );
			continue;
		}
		const publishedFiles = readFilesAtCommits( repositoryPath, [
			{
				commitSha: unresolved.publishSha,
				filePath: unresolved.filePath,
			},
		] );
		const publishedContent =
			publishedFiles.get(
				`${ unresolved.publishSha }:${ unresolved.filePath }`
			) ?? null;
		invariant(
			publishedContent !== null,
			`Published heading evidence omits ${ unresolved.filePath } at ${ unresolved.publishSha }`
		);
		const published = parseChangelog(
			publishedContent,
			`${ unresolved.publishSha }:${ unresolved.filePath }`,
			{ allowDuplicateVersions: true }
		);
		const publishedLookup = findVersionSection(
			published,
			unresolved.version
		);
		invariant(
			publishedLookup.status === 'found',
			`Published heading ${ unresolved.version } is not unique in ${ unresolved.filePath }`
		);
		corrections.push( {
			id: `correction:${ unresolved.id }`,
			disposition: 'proposed',
			operation: 'restore-version-section',
			package: unresolved.package,
			filePath: unresolved.filePath,
			fromVersion: null,
			fromSubsection: null,
			toVersion: unresolved.version,
			toSubsection: null,
			entry: null,
			section: {
				heading: publishedLookup.section.heading,
				text: publishedLookup.section.text,
				hash: hashText( publishedLookup.section.text ),
				blocks: publishedLookup.section.blocks.map( ( block ) =>
					serializeBlock( { ...block, occurrence: 1 } )
				),
			},
			evidence: {
				method: 'published-version-section-missing-at-next-cut-and-baseline',
				immediateFindingIds: [],
				secondaryMutationIds: [],
				secondaryUnresolvedIds: [ unresolved.id ],
				wrongTag: null,
				trunkNextReleaseCutSha: unresolved.nextReleaseCutSha,
				destinationTag: {
					name: unresolved.precedingTag,
					publishSha: unresolved.publishSha,
					version: unresolved.version,
					entryStatus: 'section-present-exact',
				},
				precedingDestinationTag: null,
				lane: null,
				releaseKind: null,
				shipmentProof: {
					status: 'proved-by-published-changelog',
					method: 'exact-tag-section-bytes',
				},
			},
			currentState: {
				wrongMatch: null,
				intendedMatch: 'section-missing',
				allLocationVersions: [],
				intendedHeadingPresent: false,
			},
		} );
	}

	resolveImmediateFindings( {
		inventory,
		immediate,
		parsedByPath,
		corrections,
		exceptions,
	} );
	if ( proveShipments ) {
		proveCorrectionShipments( {
			repositoryPath,
			inventory,
			corrections,
		} );
		while ( true ) {
			const advanceable = corrections.filter(
				( row ) =>
					row.evidence.shipmentProof.status === 'pending' &&
					row.entry &&
					extractPullRequests( row.entry.evidenceBlock.text ).length >
						0 &&
					row.evidence.shipmentProof.entryEvidence &&
					row.evidence.shipmentProof.entryEvidence
						.destinationTagStatus === 'absent'
			);
			const advanced = advanceable.filter( ( row ) =>
				advanceDestinationTag( inventory, row )
			);
			if ( advanced.length === 0 ) {
				break;
			}
			proveCorrectionShipments( {
				repositoryPath,
				inventory,
				corrections: advanced,
			} );
		}
		applyMatchingShipmentResolutions( corrections );
		refreshCorrectionCurrentState( corrections, parsedByPath );
		classifyPostpublishRestorations( corrections, exceptions );
		classifyTransientDuplicateOccurrences( corrections, exceptions );
	}
	reportTiming( 'base-corrections' );

	let frozenAttribution = null;
	let unreleasedShipment = null;
	if ( frozen ) {
		invariant(
			Array.isArray( frozen.attributions ) &&
				Array.isArray( frozen.unresolvedAttributions ) &&
				Array.isArray( frozen.unreleasedShipmentCandidates ) &&
				frozen.coverage?.frozenReleasedBlockCount > 0,
			'Frozen ledger evidence is malformed or has zero released-block coverage'
		);
		const unreleasedShipmentRows = buildUnreleasedShipmentCandidates(
			frozen.unreleasedShipmentCandidates,
			parsedByPath
		);
		if ( proveShipments && unreleasedShipmentRows.length > 0 ) {
			proveCorrectionShipments( {
				repositoryPath,
				inventory,
				corrections: unreleasedShipmentRows,
			} );
			applyMatchingShipmentResolutions( unreleasedShipmentRows );
		}
		refreshCorrectionCurrentState( unreleasedShipmentRows, parsedByPath );
		const nonShipmentCount = classifyUnreleasedNonShipments(
			unreleasedShipmentRows,
			exceptions
		);
		corrections.push( ...unreleasedShipmentRows );
		unreleasedShipment = {
			candidateCount: frozen.unreleasedShipmentCandidates.length,
			provedCount: unreleasedShipmentRows.filter(
				( row ) => row.evidence.shipmentProof.status === 'proved'
			).length,
			pendingCount: unreleasedShipmentRows.filter(
				( row ) => row.evidence.shipmentProof.status === 'pending'
			).length,
			nonShipmentCount,
		};
		reportTiming( 'unreleased-shipment-proof' );
		const constructed = buildFrozenAttributionCandidates(
			inventory,
			frozen
		);
		let discovery = {
			discoveries: [],
			unresolved: constructed.corrections.map( ( row ) => ( {
				rowId: row.id,
				type: 'shipment-proof-not-requested',
			} ) ),
			variantCount: 0,
		};
		if ( proveShipments && constructed.corrections.length > 0 ) {
			proveCorrectionShipments( {
				repositoryPath,
				inventory,
				corrections: constructed.corrections,
			} );
			reportTiming( 'frozen-attribution-proof' );
			applyMatchingShipmentResolutions( constructed.corrections );
			const pending = constructed.corrections.filter(
				( row ) => row.evidence.shipmentProof.status === 'pending'
			);
			discovery =
				pending.length > 0
					? discoverFrozenAttributionShipmentsWithPredicates( {
							repositoryPath,
							inventory,
							corrections: pending,
					  } )
					: { discoveries: [], unresolved: [], variantCount: 0 };
			reportTiming( 'frozen-attribution-discovery' );
		}
		const reconciliation = reconcileFrozenAttributionEvidence( {
			corrections,
			exceptions,
			candidates: constructed.corrections,
			discoveries: discovery.discoveries,
		} );
		reportTiming( 'frozen-attribution-reconciliation' );
		for ( const row of reconciliation.unresolved ) {
			if (
				corrections.some( ( candidate ) => candidate.id === row.id )
			) {
				continue;
			}
			row.disposition = 'unresolved';
			row.operation = null;
			corrections.push( row );
		}

		const attributionById = new Map(
			frozen.attributions.map( ( attribution ) => [
				attribution.id,
				attribution,
			] )
		);
		for ( const item of constructed.unresolved ) {
			const attribution = attributionById.get( item.attributionId );
			invariant(
				attribution,
				`Frozen construction failure references unknown attribution ${ item.attributionId }`
			);
			exceptions.push( {
				...item,
				id: `excluded-frozen-attribution:${ attribution.id }`,
				type: item.type,
				entry: { evidenceBlock: attribution.block },
				evidence: {
					method: 'no-unique-immutable-tag-for-frozen-source-version',
					firstStableMatch: attribution.firstStableMatch,
					stableMatchCount: attribution.stableMatches.length,
					precedingStableTag: attribution.precedingStableTag,
				},
				structuralReview: {
					status: 'independent-review-required',
				},
			} );
		}

		const unresolvedAttributionRows = [];
		for ( const attribution of frozen.unresolvedAttributions ) {
			const wrongTagMatches = inventory.events.flatMap( ( event ) =>
				event.tags
					.filter(
						( tag ) =>
							tag.package === attribution.package &&
							tag.version === attribution.version
					)
					.map( ( tag ) => ( { event, tag } ) )
			);
			invariant(
				wrongTagMatches.length === 1,
				`Frozen unresolved attribution ${ attribution.id } matched ${ wrongTagMatches.length } source package tags`
			);
			const wrongTagMatch = wrongTagMatches[ 0 ];
			unresolvedAttributionRows.push( {
				id: `correction:${ attribution.id }`,
				disposition: 'unresolved',
				operation: null,
				package: attribution.package,
				filePath: attribution.filePath,
				fromVersion: attribution.version,
				fromSubsection: attribution.subsection,
				toVersion: null,
				toSubsection: attribution.subsection,
				entry: {
					evidenceBlock: attribution.block,
					currentBlock: {
						identityMethod: 'exact-frozen-baseline-block',
						pullRequests: extractPullRequests(
							attribution.block.text
						),
						tokenSimilarity: 1,
						block: attribution.block,
					},
				},
				evidence: {
					method: 'released-entry-absent-from-all-stable-package-tags',
					immediateFindingIds: [],
					secondaryMutationIds: [],
					frozenAttributionIds: [ attribution.id ],
					wrongTag: {
						name: wrongTagMatch.tag.name,
						publishSha: wrongTagMatch.event.publishSha,
						version: wrongTagMatch.tag.version,
					},
					trunkNextReleaseCutSha: null,
					destinationTag: null,
					precedingDestinationTag: null,
					lane: null,
					releaseKind: null,
					shipmentProof: {
						status: 'pending',
						method: null,
					},
				},
				currentState: {
					wrongMatch: 'found',
					wrongExactCount: 1,
					intendedMatch: null,
					allLocationVersions: [ attribution.version ],
					intendedHeadingPresent: false,
				},
			} );
		}
		applyMatchingShipmentResolutions( unresolvedAttributionRows );
		refreshCorrectionCurrentState(
			unresolvedAttributionRows,
			parsedByPath
		);
		corrections.push( ...unresolvedAttributionRows );

		const mutationIntegration = integrateFrozenMutationEvidence( {
			repositoryPath,
			inventory,
			frozen,
			parsedByPath,
			corrections,
			exceptions,
		} );
		reportTiming( 'frozen-mutation-integration' );
		invariant(
			mutationIntegration.unresolvedAdditions.length === 0,
			`Frozen mutation integration left ${
				mutationIntegration.unresolvedAdditions.length
			} baseline additions unexplained: ${ mutationIntegration.unresolvedAdditions
				.slice( 0, 10 )
				.map( ( mutation ) => mutation.id )
				.join( ', ' ) }`
		);

		for ( const diagnostic of frozen.structuralDiagnostics || [] ) {
			exceptions.push( {
				id: `accepted-published-structural-diagnostic:${ diagnostic.publishSha }:${ diagnostic.filePath }:${ diagnostic.line }`,
				type: 'immutable-published-changelog-structural-diagnostic',
				package: diagnostic.package,
				filePath: diagnostic.filePath,
				version: diagnostic.version,
				diagnostic,
				structuralReview: {
					status: 'independent-review-required',
				},
			} );
		}

		const consolidation = consolidateDuplicateDestinations( corrections );
		compactFrozenAttributionEvidence( corrections );
		reportTiming( 'frozen-consolidation' );
		frozenAttribution = {
			construction: {
				candidateCount: constructed.corrections.length,
				exclusionCount: constructed.unresolved.length,
			},
			discovery: {
				variantCount: discovery.variantCount,
				discoveredCount: discovery.discoveries.length,
				unresolvedCount: discovery.unresolved.length,
			},
			reconciliation: {
				...reconciliation.counts,
				unresolvedCount: reconciliation.unresolved.length,
			},
			consolidation,
			mutationIntegration: {
				restoredSectionCount: mutationIntegration.restoredSectionCount,
				replacementCount: mutationIntegration.replacementCount,
				chainedReplacementCount:
					mutationIntegration.chainedReplacementCount,
				restoredEntryCount: mutationIntegration.restoredEntryCount,
				removedDuplicateCount:
					mutationIntegration.removedDuplicateCount,
				normalizationCount: mutationIntegration.normalizationCount,
				unresolvedAdditionCount:
					mutationIntegration.unresolvedAdditions.length,
			},
		};
	}
	if ( shipmentResolutions ) {
		const unappliedResolutionIds = shipmentResolutions.resolutions
			.map( ( resolution ) => resolution.id )
			.filter( ( id ) => ! appliedShipmentResolutionIds.has( id ) );
		invariant(
			unappliedResolutionIds.length === 0,
			`Reviewed shipment resolutions did not match pending rows: ${ unappliedResolutionIds.join(
				', '
			) }`
		);
	}
	attachSectionNormalizationEvidence( repositoryPath, exceptions );
	reportTiming( 'section-normalization-evidence' );
	attachDestinationSectionEvidence( {
		repositoryPath,
		inventory,
		corrections,
		parsedByPath,
	} );
	reportTiming( 'destination-section-evidence' );
	const frozenMutationAccounting = accountFrozenMutations(
		frozen,
		corrections,
		exceptions
	);
	reportTiming( 'frozen-mutation-accounting' );
	if ( frozenMutationAccounting ) {
		invariant(
			frozenMutationAccounting.unexplainedCount === 0,
			`Frozen mutation accounting left ${ frozenMutationAccounting.unexplainedCount } of ${ frozenMutationAccounting.mutationCount } mutations unexplained`
		);
	}
	const reviewRequirements = buildIndependentReviewRequirements(
		corrections,
		exceptions
	);
	applyIndependentReviewResolutions(
		reviewRequirements,
		reviewResolutions,
		inventory.baseline.trunkSha
	);
	reportTiming( 'independent-review' );
	const reviewedSpecialRows = [ ...corrections, ...exceptions ].filter(
		hasReviewedSpecialEvidence
	);

	const countIds = ( ids ) => {
		const counts = new Map();
		for ( const id of ids ) {
			counts.set( id, ( counts.get( id ) || 0 ) + 1 );
		}
		return counts;
	};
	const immediateCounts = countIds( [
		...corrections.flatMap(
			( row ) => row.evidence.immediateFindingIds || []
		),
		...exceptions.flatMap( ( row ) => row.immediateFindingIds || [] ),
	] );
	for ( const finding of immediate.findings ) {
		invariant(
			immediateCounts.get( finding.id ) === 1,
			`Immediate finding ${ finding.id } is accounted for ${
				immediateCounts.get( finding.id ) || 0
			} times`
		);
	}
	const mutationCounts = countIds( [
		...corrections.flatMap(
			( row ) => row.evidence.secondaryMutationIds || []
		),
		...exceptions
			.flatMap( ( row ) => [
				row.mutationId,
				row.removedMutationId,
				row.addedMutationId,
			] )
			.filter( Boolean ),
	] );
	for ( const mutation of secondary.mutations ) {
		invariant(
			mutationCounts.get( mutation.id ) === 1,
			`Secondary mutation ${ mutation.id } is accounted for ${
				mutationCounts.get( mutation.id ) || 0
			} times`
		);
	}
	const secondaryUnresolvedCounts = countIds( [
		...corrections.flatMap(
			( row ) => row.evidence.secondaryUnresolvedIds || []
		),
		...exceptions.map( ( row ) => row.mutationId ).filter( Boolean ),
	] );
	for ( const unresolved of secondary.unresolved ) {
		invariant(
			secondaryUnresolvedCounts.get( unresolved.id ) === 1,
			`Secondary unresolved item ${ unresolved.id } is accounted for ${
				secondaryUnresolvedCounts.get( unresolved.id ) || 0
			} times`
		);
	}
	const unreleasedShipmentCounts = countIds( [
		...corrections.flatMap(
			( row ) => row.evidence.unreleasedShipmentCandidateIds || []
		),
		...exceptions.flatMap(
			( row ) => row.unreleasedShipmentCandidateIds || []
		),
	] );
	for ( const candidate of frozen?.unreleasedShipmentCandidates || [] ) {
		invariant(
			unreleasedShipmentCounts.get( candidate.id ) === 1,
			`Unreleased shipment candidate ${ candidate.id } is accounted for ${
				unreleasedShipmentCounts.get( candidate.id ) || 0
			} times`
		);
	}

	corrections.sort( ( left, right ) => left.id.localeCompare( right.id ) );
	exceptions.sort( ( left, right ) => left.id.localeCompare( right.id ) );
	invariant(
		new Set( corrections.map( ( row ) => row.id ) ).size ===
			corrections.length,
		'Correction ledger contains duplicate correction IDs'
	);
	invariant(
		corrections.length + exceptions.length > 0,
		'Correction ledger produced zero rows'
	);
	const unresolvedRows = corrections.filter(
		( row ) => row.disposition === 'unresolved'
	);
	const pendingProofRows = corrections.filter(
		( row ) => row.evidence.shipmentProof.status === 'pending'
	);
	const pendingReviewRows = reviewRequirements.filter(
		( row ) => row.status === 'pending'
	);
	return {
		schemaVersion: 1,
		baseline: {
			trunkSha: inventory.baseline.trunkSha,
			auditStart: inventory.baseline.auditStart,
			releaseLaneSchemaVersion:
				inventory.baseline.releaseLaneSchemaVersion,
		},
		coverage: {
			immediateFindingCount: immediate.findings.length,
			secondaryMutationCount: secondary.mutations.length,
			secondaryUnresolvedCount: secondary.unresolved.length,
			frozenReleasedBlockCount:
				frozen?.coverage?.frozenReleasedBlockCount || 0,
			frozenMutationCount: frozen?.mutations?.length || 0,
			frozenAttributionFindingCount: frozen?.attributions?.length || 0,
			frozenUnresolvedAttributionCount:
				frozen?.unresolvedAttributions?.length || 0,
			unreleasedShipmentCandidateCount:
				frozen?.unreleasedShipmentCandidates?.length || 0,
			changedFileCandidateCount: new Set(
				corrections
					.filter( ( row ) => row.disposition === 'proposed' )
					.map( ( row ) => row.filePath )
			).size,
		},
		summary: {
			correctionRowCount: corrections.length,
			proposedCorrectionCount: corrections.filter(
				( row ) => row.disposition === 'proposed'
			).length,
			alreadyCorrectedCount: corrections.filter(
				( row ) => row.disposition === 'already-corrected'
			).length,
			acceptedExceptionCount: exceptions.length,
			unresolvedCorrectionCount: unresolvedRows.length,
			pendingShipmentProofCount: pendingProofRows.length,
			independentReviewRequirementCount: reviewRequirements.length,
			pendingIndependentReviewCount: pendingReviewRows.length,
			reviewedSpecialEvidenceCount: reviewedSpecialRows.length,
		},
		corrections,
		exceptions,
		independentReview: {
			requirements: reviewRequirements,
			reviewedSpecialEvidenceRows: reviewedSpecialRows
				.map( ( row ) => ( {
					rowId: row.id,
					resolutionId:
						row.evidence?.shipmentProof?.resolutionId || null,
				} ) )
				.sort( ( left, right ) =>
					left.rowId.localeCompare( right.rowId )
				),
		},
		...( frozenMutationAccounting ? { frozenMutationAccounting } : {} ),
		...( frozenAttribution ? { frozenAttribution } : {} ),
		...( unreleasedShipment ? { unreleasedShipment } : {} ),
		integrityHash: hashText(
			JSON.stringify( {
				correctionIds: corrections.map( ( row ) => row.id ),
				exceptionIds: exceptions.map( ( row ) => row.id ),
				reviewRequirements: reviewRequirements.map( ( row ) => [
					row.id,
					row.evidenceHash,
					row.status,
				] ),
			} )
		),
	};
}

module.exports = {
	accountFrozenMutations,
	buildCorrectionLedger,
	buildFrozenAttributionCandidates,
	compactFrozenAttributionEvidence,
	consolidateDuplicateDestinations,
	discoverFrozenAttributionShipments,
	discoverFrozenAttributionShipmentsWithPredicates,
	integrateFrozenMutationEvidence,
	reconcileFrozenAttributionEvidence,
	applyIndependentReviewResolutions,
	applyReviewedShipmentResolutions,
	attachDestinationSectionEvidence,
	attachSectionNormalizationEvidence,
	buildIndependentReviewRequirements,
	classifySectionNormalization,
	classifyPostpublishRestorations,
	classifyUnreleasedNonShipments,
	classifyTransientDuplicateOccurrences,
	extractPullRequests,
	locateEquivalentBlock,
	pairHistoricalReplacements,
	proveCorrectionShipments,
	refreshCorrectionCurrentState,
	tokenSimilarity,
};
