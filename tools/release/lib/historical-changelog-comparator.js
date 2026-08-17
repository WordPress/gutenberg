const fs = require( 'fs' );
const os = require( 'os' );
const path = require( 'path' );
const { spawnSync } = require( 'child_process' );
const {
	auditCandidateDiff,
	findVersionSection,
	hashText,
	parseChangelog,
	readFilesAtCommits,
} = require( './historical-changelog-audit' );
const { locateEquivalentBlock } = require( './historical-changelog-ledger' );
const {
	generateHistoricalChangelogTree,
	getDestinationBlock,
} = require( './historical-changelog-generator' );

/**
 * Fails closed when comparison input or output violates an invariant.
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
 * Applies one candidate file's changes to the frozen baseline in memory.
 *
 * @param {string} frozenContent    Frozen trunk bytes.
 * @param {string} mergeBaseContent Candidate merge-base bytes.
 * @param {string} candidateContent Candidate head bytes.
 * @param {string} label            Diagnostic label.
 * @return {string} Three-way merged bytes.
 */
function mergeCandidateFile(
	frozenContent,
	mergeBaseContent,
	candidateContent,
	label
) {
	if ( frozenContent === mergeBaseContent ) {
		return candidateContent;
	}
	if ( mergeBaseContent === candidateContent ) {
		return frozenContent;
	}

	const temporaryDirectory = fs.mkdtempSync(
		path.join( os.tmpdir(), 'gutenberg-changelog-comparison-' )
	);
	const frozenPath = path.join( temporaryDirectory, 'frozen' );
	const basePath = path.join( temporaryDirectory, 'base' );
	const candidatePath = path.join( temporaryDirectory, 'candidate' );
	try {
		fs.writeFileSync( frozenPath, frozenContent, 'utf8' );
		fs.writeFileSync( basePath, mergeBaseContent, 'utf8' );
		fs.writeFileSync( candidatePath, candidateContent, 'utf8' );
		const result = spawnSync(
			'git',
			[ 'merge-file', '-p', frozenPath, basePath, candidatePath ],
			{
				encoding: 'utf8',
				maxBuffer: 128 * 1024 * 1024,
			}
		);
		invariant(
			result.error === undefined,
			`Could not apply candidate file ${ label }: ${ result.error?.message }`
		);
		invariant(
			result.status === 0,
			`Candidate patch conflicts with frozen baseline in ${ label }`
		);
		return result.stdout;
	} finally {
		fs.rmSync( temporaryDirectory, { recursive: true, force: true } );
	}
}

/**
 * Applies the candidate changelog patch to a frozen baseline without touching
 * either the Git index or the working tree.
 *
 * @param {Object}   options                       Comparison options.
 * @param {string}   options.repositoryPath        Repository working directory.
 * @param {string}   options.frozenTrunkSha        Frozen trunk SHA.
 * @param {string}   options.candidateMergeBaseSha Candidate merge-base SHA.
 * @param {string}   options.candidateSha          Candidate head SHA.
 * @param {string[]} options.changedFiles          Candidate changelog paths.
 * @param {string[]} options.allFiles              Union of compared paths.
 * @return {Map<string,string>} Candidate patch applied to frozen bytes.
 */
function applyCandidatePatchToFrozenBaseline( {
	repositoryPath,
	frozenTrunkSha,
	candidateMergeBaseSha,
	candidateSha,
	changedFiles,
	allFiles,
} ) {
	invariant( changedFiles.length > 0, 'Candidate patch covers zero files' );
	invariant( allFiles.length > 0, 'Candidate comparison covers zero files' );
	const changed = new Set( changedFiles );
	const snapshots = readFilesAtCommits( repositoryPath, [
		...allFiles.map( ( filePath ) => ( {
			commitSha: frozenTrunkSha,
			filePath,
		} ) ),
		...changedFiles.flatMap( ( filePath ) => [
			{ commitSha: candidateMergeBaseSha, filePath },
			{ commitSha: candidateSha, filePath },
		] ),
	] );
	const result = new Map();
	for ( const filePath of allFiles ) {
		const frozen = snapshots.get( `${ frozenTrunkSha }:${ filePath }` );
		invariant(
			frozen !== null && frozen !== undefined,
			`Frozen baseline omits ${ filePath }`
		);
		if ( ! changed.has( filePath ) ) {
			result.set( filePath, frozen );
			continue;
		}
		const base = snapshots.get(
			`${ candidateMergeBaseSha }:${ filePath }`
		);
		const candidate = snapshots.get( `${ candidateSha }:${ filePath }` );
		invariant(
			base !== null &&
				base !== undefined &&
				candidate !== null &&
				candidate !== undefined,
			`Candidate comparison omits ${ filePath } from one tree`
		);
		result.set(
			filePath,
			mergeCandidateFile( frozen, base, candidate, filePath )
		);
	}
	return result;
}

/**
 * Returns a unique version section or null.
 *
 * @param {Object}  parsed  Parsed changelog.
 * @param {?string} version Version identifier.
 * @return {?Object} Unique section.
 */
function getSection( parsed, version ) {
	if ( ! version ) {
		return null;
	}
	const lookup = findVersionSection( parsed, version );
	return lookup.status === 'found' ? lookup.section : null;
}

/**
 * Reduces one block match to stable comparison evidence.
 *
 * @param {Object} match Match returned by locateEquivalentBlock.
 * @return {Object} Serializable match summary.
 */
function summarizeBlockMatch( match ) {
	return {
		status: match.status,
		identityMethod: match.identityMethod || null,
		matchedHash: match.block?.hash || null,
	};
}

/**
 * Evaluates whether one candidate-applied changelog satisfies a correction.
 *
 * @param {Object} row    Proposed ledger row.
 * @param {Object} parsed Parsed candidate-applied changelog.
 * @return {Object} Per-correction satisfaction.
 */
function evaluateCandidateCorrection( row, parsed ) {
	if ( row.operation === 'restore-version-section' ) {
		const section = getSection( parsed, row.toVersion );
		const headingExact = section?.heading === row.section.heading;
		const blockHashes = section
			? section.blocks.map( ( block ) => block.hash )
			: [];
		const expectedBlockHashes = row.section.blocks.map(
			( block ) => block.hash
		);
		const blocksExact =
			JSON.stringify( blockHashes ) ===
			JSON.stringify( expectedBlockHashes );
		const exact = Boolean(
			section &&
				headingExact &&
				blocksExact &&
				section.text === row.section.text
		);
		let status = 'unsatisfied';
		if ( exact ) {
			status = 'satisfied-exact';
		} else if ( section && headingExact && blocksExact ) {
			status = 'satisfied-structural';
		}
		return {
			rowId: row.id,
			filePath: row.filePath,
			operation: row.operation,
			status,
			sectionPresent: Boolean( section ),
			headingExact,
			blocksExact,
			sectionHash: section ? hashText( section.text ) : null,
			expectedSectionHash: row.section.hash,
		};
	}

	const sourceBlock = row.entry?.currentBlock?.block || null;
	const sourceMatch = sourceBlock
		? locateEquivalentBlock(
				getSection( parsed, row.fromVersion ),
				sourceBlock
		  )
		: { status: 'not-applicable' };
	const sourceAbsent =
		! sourceBlock ||
		[ 'not-found', 'section-missing' ].includes( sourceMatch.status );
	const destinationBlock = getDestinationBlock( row );
	const destinationSection = getSection( parsed, row.toVersion );
	const destinationMatch = locateEquivalentBlock(
		destinationSection,
		destinationBlock
	);
	const destinationFound = destinationMatch.status === 'found';
	const destinationExact =
		destinationFound && destinationMatch.identityMethod === 'exact-bytes';
	const headingExact = row.destinationSection
		? destinationSection?.heading === row.destinationSection.heading
		: true;
	let status = 'unsatisfied';
	if ( sourceAbsent && destinationFound && headingExact ) {
		status = destinationExact
			? 'satisfied-exact'
			: 'satisfied-equivalent-bytes-differ';
	}
	return {
		rowId: row.id,
		filePath: row.filePath,
		operation: row.operation,
		status,
		sourceAbsent,
		source: summarizeBlockMatch( sourceMatch ),
		destination: summarizeBlockMatch( destinationMatch ),
		destinationHeadingExact: headingExact,
	};
}

/**
 * Expands parsed blocks into exact structural identities.
 *
 * @param {Object} parsed Parsed changelog.
 * @return {Object[]} Located blocks.
 */
function flattenBlocks( parsed ) {
	const occurrences = new Map();
	return parsed.sections.flatMap( ( section ) =>
		section.blocks.map( ( block ) => {
			const key = JSON.stringify( [ section.key, block.hash ] );
			const occurrence = ( occurrences.get( key ) || 0 ) + 1;
			occurrences.set( key, occurrence );
			return {
				version: section.key,
				subsection: block.subsection,
				block: { ...block, occurrence },
			};
		} )
	);
}

/**
 * Subtracts exact structural block occurrences.
 *
 * @param {Object[]} minuend    Blocks being inspected.
 * @param {Object[]} subtrahend Blocks to subtract.
 * @return {Object[]} Remaining blocks.
 */
function subtractExactBlocks( minuend, subtrahend ) {
	const available = new Map();
	for ( const item of subtrahend ) {
		const key = JSON.stringify( [
			item.version,
			item.subsection,
			item.block.hash,
		] );
		available.set( key, ( available.get( key ) || 0 ) + 1 );
	}
	return minuend.filter( ( item ) => {
		const key = JSON.stringify( [
			item.version,
			item.subsection,
			item.block.hash,
		] );
		const count = available.get( key ) || 0;
		if ( count === 0 ) {
			return true;
		}
		available.set( key, count - 1 );
		return false;
	} );
}

/**
 * Describes exact structural differences between two changelog files.
 *
 * @param {string} filePath         Changelog path.
 * @param {string} generatedContent Evidence-generated bytes.
 * @param {string} candidateContent Candidate-applied bytes.
 * @return {Object} Difference explanation.
 */
function explainFileDifference( filePath, generatedContent, candidateContent ) {
	const generated = parseChangelog(
		generatedContent,
		`generated:${ filePath }`,
		{
			allowDuplicateVersions: true,
		}
	);
	const candidate = parseChangelog(
		candidateContent,
		`candidate:${ filePath }`,
		{
			allowDuplicateVersions: true,
		}
	);
	const generatedBlocks = flattenBlocks( generated );
	const candidateBlocks = flattenBlocks( candidate );
	const serialize = ( item ) => ( {
		version: item.version,
		subsection: item.subsection,
		block: {
			hash: item.block.hash,
			text: item.block.text,
		},
	} );
	const generatedHeadings = new Map(
		generated.sections.map( ( section ) => [
			`${ section.key }:${ section.occurrence }`,
			section.heading,
		] )
	);
	const candidateHeadings = new Map(
		candidate.sections.map( ( section ) => [
			`${ section.key }:${ section.occurrence }`,
			section.heading,
		] )
	);
	const headingKeys = new Set( [
		...generatedHeadings.keys(),
		...candidateHeadings.keys(),
	] );
	const headingDifferences = [ ...headingKeys ]
		.filter(
			( key ) =>
				generatedHeadings.get( key ) !== candidateHeadings.get( key )
		)
		.sort()
		.map( ( key ) => ( {
			key,
			generated: generatedHeadings.get( key ) || null,
			candidate: candidateHeadings.get( key ) || null,
		} ) );
	return {
		missingFromCandidate: subtractExactBlocks(
			generatedBlocks,
			candidateBlocks
		).map( serialize ),
		extraInCandidate: subtractExactBlocks(
			candidateBlocks,
			generatedBlocks
		).map( serialize ),
		headingDifferences,
		generatedDiagnostics: generated.diagnostics,
		candidateDiagnostics: candidate.diagnostics,
	};
}

/**
 * Audits the effective candidate patch after applying it to frozen trunk.
 *
 * @param {string}             baselineSha     Frozen trunk SHA.
 * @param {string}             candidateSha    Candidate head SHA.
 * @param {Map<string,string>} baselineByPath  Frozen file bytes.
 * @param {Map<string,string>} candidateByPath Candidate-applied file bytes.
 * @param {string[]}           filePaths       Candidate patch paths.
 * @return {Object} Structural patch description.
 */
function auditCandidateAppliedDiff(
	baselineSha,
	candidateSha,
	baselineByPath,
	candidateByPath,
	filePaths
) {
	const moves = [];
	const additions = [];
	const removals = [];
	const headingChanges = [];
	const byteOnlyFiles = [];
	const structuralDiagnostics = [];
	const changedFiles = filePaths.filter(
		( filePath ) =>
			baselineByPath.get( filePath ) !== candidateByPath.get( filePath )
	);
	for ( const filePath of changedFiles ) {
		const baseline = parseChangelog(
			baselineByPath.get( filePath ),
			`${ baselineSha }:${ filePath }`,
			{ allowDuplicateVersions: true }
		);
		const candidate = parseChangelog(
			candidateByPath.get( filePath ),
			`candidate-applied:${ filePath }`,
			{ allowDuplicateVersions: true }
		);
		for ( const [ snapshot, parsed ] of [
			[ 'baseline', baseline ],
			[ 'candidate-applied', candidate ],
		] ) {
			for ( const diagnostic of parsed.diagnostics ) {
				structuralDiagnostics.push( {
					...diagnostic,
					filePath,
					snapshot,
				} );
			}
		}
		const baselineBlocks = flattenBlocks( baseline );
		const candidateBlocks = flattenBlocks( candidate );
		const removed = subtractExactBlocks( baselineBlocks, candidateBlocks );
		const added = subtractExactBlocks( candidateBlocks, baselineBlocks );
		const consumedAdditions = new Set();
		for ( const removedItem of removed ) {
			const addedIndex = added.findIndex(
				( addedItem, index ) =>
					! consumedAdditions.has( index ) &&
					addedItem.block.hash === removedItem.block.hash
			);
			if ( addedIndex === -1 ) {
				removals.push( {
					id: `candidate-applied-remove:${ filePath }:${ removedItem.version }:${ removedItem.block.hash }:${ removedItem.block.occurrence }`,
					filePath,
					fromVersion: removedItem.version,
					fromSubsection: removedItem.subsection,
					block: removedItem.block,
				} );
				continue;
			}
			consumedAdditions.add( addedIndex );
			const addedItem = added[ addedIndex ];
			moves.push( {
				id: `candidate-applied-move:${ filePath }:${ removedItem.block.hash }:${ removedItem.block.occurrence }`,
				filePath,
				fromVersion: removedItem.version,
				fromSubsection: removedItem.subsection,
				toVersion: addedItem.version,
				toSubsection: addedItem.subsection,
				block: removedItem.block,
			} );
		}
		for ( let index = 0; index < added.length; index++ ) {
			if ( consumedAdditions.has( index ) ) {
				continue;
			}
			const item = added[ index ];
			additions.push( {
				id: `candidate-applied-add:${ filePath }:${ item.version }:${ item.block.hash }:${ item.block.occurrence }`,
				filePath,
				toVersion: item.version,
				toSubsection: item.subsection,
				block: item.block,
			} );
		}
		const sectionKeys = new Set( [
			...baseline.sections.map(
				( section ) => `${ section.key }:${ section.occurrence }`
			),
			...candidate.sections.map(
				( section ) => `${ section.key }:${ section.occurrence }`
			),
		] );
		for ( const key of sectionKeys ) {
			const separator = key.lastIndexOf( ':' );
			const version = key.slice( 0, separator );
			const occurrence = Number( key.slice( separator + 1 ) );
			const before = baseline.sections.find(
				( section ) =>
					section.key === version && section.occurrence === occurrence
			);
			const after = candidate.sections.find(
				( section ) =>
					section.key === version && section.occurrence === occurrence
			);
			if ( ( before?.heading || null ) !== ( after?.heading || null ) ) {
				headingChanges.push( {
					id: `candidate-applied-heading:${ filePath }:${ version }:${ occurrence }`,
					filePath,
					version,
					occurrence,
					before: before?.heading || null,
					after: after?.heading || null,
				} );
			}
		}
		if (
			removed.length === 0 &&
			added.length === 0 &&
			! headingChanges.some( ( item ) => item.filePath === filePath )
		) {
			byteOnlyFiles.push( {
				filePath,
				baselineHash: baseline.hash,
				candidateHash: candidate.hash,
			} );
		}
	}
	for ( const collection of [ moves, additions, removals, headingChanges ] ) {
		collection.sort( ( left, right ) => left.id.localeCompare( right.id ) );
	}
	byteOnlyFiles.sort( ( left, right ) =>
		left.filePath.localeCompare( right.filePath )
	);
	return {
		schemaVersion: 1,
		frozenTrunkSha: baselineSha,
		candidateSha,
		changedFiles,
		summary: {
			changedFileCount: changedFiles.length,
			moveCount: moves.length,
			additionCount: additions.length,
			removalCount: removals.length,
			headingChangeCount: headingChanges.length,
			byteOnlyFileCount: byteOnlyFiles.length,
		},
		moves,
		additions,
		removals,
		headingChanges,
		byteOnlyFiles,
		structuralDiagnostics,
	};
}

/**
 * Returns whether two serialized blocks are conservatively equivalent.
 *
 * @param {?Object} left  First block.
 * @param {?Object} right Second block.
 * @return {boolean} Whether the identity rules find one match.
 */
function blocksEquivalent( left, right ) {
	if ( ! left || ! right ) {
		return false;
	}
	return (
		locateEquivalentBlock( { blocks: [ left ] }, right ).status === 'found'
	);
}

/**
 * Scores a block identity, preferring exact bytes over conservative rewrites.
 *
 * @param {?Object} left  First block.
 * @param {?Object} right Second block.
 * @return {number} Zero for no match, one for equivalent, two for exact.
 */
function blockMatchScore( left, right ) {
	if ( ! left || ! right ) {
		return 0;
	}
	if ( left.hash === right.hash && left.text === right.text ) {
		return 2;
	}
	return blocksEquivalent( left, right ) ? 1 : 0;
}

/**
 * Maps every direct candidate structural change to ledger operations.
 *
 * @param {Object}   candidateAudit Structural diff of the original candidate.
 * @param {Object[]} corrections    Proposed ledger rows.
 * @return {Object} Mapped, unlisted, and ambiguous candidate changes.
 */
function mapCandidateChangesToLedger( candidateAudit, corrections ) {
	const mappings = [];
	const mapItem = ( type, item, scoreRow, options = {} ) => {
		const scored = corrections
			.map( ( row ) => ( { row, score: scoreRow( row ) } ) )
			.filter( ( candidate ) => candidate.score > 0 );
		const bestScore = Math.max(
			0,
			...scored.map( ( scoredItem ) => scoredItem.score )
		);
		const correctionIds = scored
			.filter( ( candidate ) => candidate.score === bestScore )
			.map( ( candidate ) => candidate.row.id )
			.sort();
		let status = 'unlisted';
		let explanation =
			'No ledger-authorized operation maps to this candidate change.';
		if ( correctionIds.length === 1 ) {
			status = 'mapped';
			explanation =
				'The candidate change maps to one ledger-authorized operation.';
		} else if ( correctionIds.length > 1 && options.allowShared ) {
			status = 'mapped-shared-destination';
			explanation =
				'Multiple ledger operations intentionally share this exact destination heading.';
		} else if ( correctionIds.length > 1 ) {
			status = 'ambiguous';
			explanation =
				'Multiple ledger operations match and do not represent one shared destination.';
		}
		let mappedCorrectionIds = correctionIds;
		if ( type === 'move' && correctionIds.length === 0 ) {
			const destinationCorrectionIds = corrections
				.filter(
					( row ) =>
						row.filePath === item.filePath &&
						row.toVersion === item.toVersion &&
						[
							'move-entry',
							'move-and-replace-entry',
							'restore-entry',
						].includes( row.operation ) &&
						blockMatchScore(
							getDestinationBlock( row ),
							item.block
						) > 0
				)
				.map( ( row ) => row.id )
				.sort();
			const sourceCorrectionIds = corrections
				.filter(
					( row ) =>
						row.filePath === item.filePath &&
						row.fromVersion === item.fromVersion &&
						[
							'move-entry',
							'move-and-replace-entry',
							'remove-duplicate-entry',
						].includes( row.operation ) &&
						blockMatchScore(
							row.entry.currentBlock.block,
							item.block
						) > 0
				)
				.map( ( row ) => row.id )
				.sort();
			mappedCorrectionIds = [
				...new Set( [
					...destinationCorrectionIds,
					...sourceCorrectionIds,
				] ),
			].sort();
			if (
				destinationCorrectionIds.length > 0 &&
				sourceCorrectionIds.length === 0
			) {
				status = 'mapped-destination-unauthorized-source-removal';
				explanation =
					'The ledger authorizes a parallel destination restoration, but immutable lane evidence does not authorize removing the source entry.';
			} else if (
				sourceCorrectionIds.length > 0 &&
				destinationCorrectionIds.length === 0
			) {
				status = 'mapped-source-unauthorized-destination-addition';
				explanation =
					'The ledger authorizes the source removal, but not this candidate destination.';
			} else if (
				destinationCorrectionIds.length > 0 &&
				sourceCorrectionIds.length > 0
			) {
				status = 'mapped-by-separate-operations';
				explanation =
					'Separate ledger rows authorize the candidate source removal and destination insertion.';
			}
		}
		mappings.push( {
			candidateChangeId: item.id,
			type,
			change: item,
			correctionIds: mappedCorrectionIds,
			status,
			explanation,
		} );
	};
	for ( const item of candidateAudit.moves ) {
		mapItem( 'move', item, ( row ) => {
			if (
				row.filePath !== item.filePath ||
				row.fromVersion !== item.fromVersion ||
				row.toVersion !== item.toVersion ||
				! [ 'move-entry', 'move-and-replace-entry' ].includes(
					row.operation
				)
			) {
				return 0;
			}
			const sourceScore = blockMatchScore(
				row.entry.currentBlock.block,
				item.block
			);
			const destinationScore = blockMatchScore(
				getDestinationBlock( row ),
				item.block
			);
			return sourceScore > 0 && destinationScore > 0
				? sourceScore + destinationScore
				: 0;
		} );
	}
	for ( const item of candidateAudit.additions ) {
		mapItem( 'addition', item, ( row ) => {
			if (
				row.filePath !== item.filePath ||
				row.toVersion !== item.toVersion
			) {
				return 0;
			}
			if (
				[
					'move-entry',
					'move-and-replace-entry',
					'restore-entry',
				].includes( row.operation )
			) {
				return blockMatchScore(
					getDestinationBlock( row ),
					item.block
				);
			}
			if ( row.operation === 'restore-version-section' ) {
				return Math.max(
					0,
					...row.section.blocks.map( ( block ) =>
						blockMatchScore( block, item.block )
					)
				);
			}
			return 0;
		} );
	}
	for ( const item of candidateAudit.removals ) {
		mapItem( 'removal', item, ( row ) => {
			if (
				row.filePath !== item.filePath ||
				row.fromVersion !== item.fromVersion ||
				! [
					'move-entry',
					'move-and-replace-entry',
					'remove-duplicate-entry',
				].includes( row.operation )
			) {
				return 0;
			}
			return blockMatchScore( row.entry.currentBlock.block, item.block );
		} );
	}
	for ( const item of candidateAudit.headingChanges ) {
		mapItem(
			'heading',
			item,
			( row ) =>
				Number(
					row.filePath === item.filePath &&
						row.toVersion === item.version &&
						( ( row.destinationSection &&
							row.destinationSection.heading === item.after ) ||
							( row.operation === 'restore-version-section' &&
								row.section.heading === item.after ) )
				),
			{ allowShared: true }
		);
	}
	for ( const item of candidateAudit.byteOnlyFiles ) {
		mappings.push( {
			candidateChangeId: `candidate-byte-only:${ item.filePath }`,
			type: 'byte-only-file',
			change: item,
			correctionIds: [],
			status: 'unlisted',
			explanation:
				'No ledger-authorized structural operation maps to this byte-only candidate change.',
		} );
	}
	return {
		mappings,
		unlisted: mappings.filter( ( item ) => item.status === 'unlisted' ),
		ambiguous: mappings.filter( ( item ) => item.status === 'ambiguous' ),
		unauthorized: mappings.filter( ( item ) =>
			item.status.includes( 'unauthorized' )
		),
	};
}

/**
 * Compares the evidence-generated tree with a candidate PR patch.
 *
 * @param {Object} options                       Comparison options.
 * @param {string} options.repositoryPath        Repository working directory.
 * @param {Object} options.ledger                Ready correction ledger.
 * @param {string} options.candidateMergeBaseSha Candidate merge-base SHA.
 * @param {string} options.candidateSha          Candidate head SHA.
 * @return {Object} Deterministic comparison report.
 */
function compareCandidateWithGenerated( {
	repositoryPath,
	ledger,
	candidateMergeBaseSha,
	candidateSha,
} ) {
	const generated = generateHistoricalChangelogTree( {
		repositoryPath,
		ledger,
	} );
	const candidateAudit = auditCandidateDiff( {
		repositoryPath,
		inventory: {
			baseline: {
				trunkSha: ledger.baseline.trunkSha,
				candidateMergeBaseSha,
				candidateSha,
			},
		},
	} );
	const generatedFiles = generated.fileRecords.map(
		( record ) => record.filePath
	);
	const allFiles = [
		...new Set( [ ...generatedFiles, ...candidateAudit.changedFiles ] ),
	].sort();
	const candidateByPath = applyCandidatePatchToFrozenBaseline( {
		repositoryPath,
		frozenTrunkSha: ledger.baseline.trunkSha,
		candidateMergeBaseSha,
		candidateSha,
		changedFiles: candidateAudit.changedFiles,
		allFiles,
	} );
	const generatedSet = new Set( generatedFiles );
	const baselineSnapshots = readFilesAtCommits(
		repositoryPath,
		allFiles.map( ( filePath ) => ( {
			commitSha: ledger.baseline.trunkSha,
			filePath,
		} ) )
	);
	const baselineByPath = new Map(
		allFiles.map( ( filePath ) => [
			filePath,
			baselineSnapshots.get(
				`${ ledger.baseline.trunkSha }:${ filePath }`
			),
		] )
	);
	const candidateAppliedAudit = auditCandidateAppliedDiff(
		ledger.baseline.trunkSha,
		candidateSha,
		baselineByPath,
		candidateByPath,
		candidateAudit.changedFiles
	);
	const fileComparisons = allFiles.map( ( filePath ) => {
		const generatedContent = generatedSet.has( filePath )
			? generated.generatedByPath.get( filePath )
			: baselineSnapshots.get(
					`${ ledger.baseline.trunkSha }:${ filePath }`
			  );
		const candidateContent = candidateByPath.get( filePath );
		const exact = generatedContent === candidateContent;
		let status = 'candidate-omits-generated-change';
		if ( exact ) {
			status = 'exact-match';
		} else if ( candidateAudit.changedFiles.includes( filePath ) ) {
			status = 'divergent';
		}
		return {
			filePath,
			status,
			generatedHash: hashText( generatedContent ),
			candidateAppliedHash: hashText( candidateContent ),
			difference: exact
				? null
				: explainFileDifference(
						filePath,
						generatedContent,
						candidateContent
				  ),
		};
	} );
	const parsedCandidateFiles = new Map(
		generatedFiles.map( ( filePath ) => [
			filePath,
			parseChangelog(
				candidateByPath.get( filePath ),
				`candidate-applied:${ filePath }`,
				{ allowDuplicateVersions: true }
			),
		] )
	);
	const proposed = ledger.corrections.filter(
		( row ) => row.disposition === 'proposed'
	);
	const correctionComparisons = proposed.map( ( row ) =>
		evaluateCandidateCorrection(
			row,
			parsedCandidateFiles.get( row.filePath )
		)
	);
	const candidateChangeMappings = mapCandidateChangesToLedger(
		candidateAppliedAudit,
		proposed
	);
	const countStatus = ( items, status ) =>
		items.filter( ( item ) => item.status === status ).length;
	const exactFileCount = countStatus( fileComparisons, 'exact-match' );
	const exactCorrectionCount = countStatus(
		correctionComparisons,
		'satisfied-exact'
	);
	const equivalentCorrectionCount =
		countStatus(
			correctionComparisons,
			'satisfied-equivalent-bytes-differ'
		) + countStatus( correctionComparisons, 'satisfied-structural' );
	const unsatisfiedCorrectionCount = countStatus(
		correctionComparisons,
		'unsatisfied'
	);
	const equivalent =
		exactFileCount === fileComparisons.length &&
		unsatisfiedCorrectionCount === 0 &&
		candidateChangeMappings.unlisted.length === 0 &&
		candidateChangeMappings.ambiguous.length === 0 &&
		candidateChangeMappings.unauthorized.length === 0;
	const reportCore = {
		schemaVersion: 1,
		baselineSha: ledger.baseline.trunkSha,
		ledgerIntegrityHash: ledger.integrityHash,
		generatorIntegrityHash: generated.integrityHash,
		candidateMergeBaseSha,
		candidateSha,
		status: equivalent
			? 'candidate-exactly-matches-generated'
			: 'candidate-differs',
		summary: {
			generatedFileCount: generatedFiles.length,
			candidateChangedFileCount: candidateAudit.changedFiles.length,
			comparedFileCount: fileComparisons.length,
			exactFileCount,
			divergentFileCount: fileComparisons.length - exactFileCount,
			proposedCorrectionCount: proposed.length,
			exactCorrectionCount,
			equivalentCorrectionCount,
			unsatisfiedCorrectionCount,
			candidateStructuralChangeCount:
				candidateChangeMappings.mappings.length,
			unlistedCandidateChangeCount:
				candidateChangeMappings.unlisted.length,
			ambiguousCandidateChangeCount:
				candidateChangeMappings.ambiguous.length,
			unauthorizedCandidateChangeCount:
				candidateChangeMappings.unauthorized.length,
		},
		candidateAudit,
		candidateAppliedAudit,
		fileComparisons,
		correctionComparisons,
		candidateChangeMappings,
	};
	return {
		...reportCore,
		integrityHash: hashText( JSON.stringify( reportCore ) ),
	};
}

module.exports = {
	applyCandidatePatchToFrozenBaseline,
	auditCandidateAppliedDiff,
	blockMatchScore,
	blocksEquivalent,
	compareCandidateWithGenerated,
	evaluateCandidateCorrection,
	explainFileDifference,
	mapCandidateChangesToLedger,
	mergeCandidateFile,
};
