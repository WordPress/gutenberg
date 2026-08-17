const semver = require( 'semver' );
const {
	findVersionSection,
	hashText,
	parseChangelog,
	readFilesAtCommits,
} = require( './historical-changelog-audit' );
const { locateEquivalentBlock } = require( './historical-changelog-ledger' );

/**
 * Fails closed when generation would proceed without complete evidence.
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
 * Validates that a ledger is complete enough to authorize writes.
 *
 * @param {Object} ledger Correction ledger.
 */
function assertGeneratorReadyLedger( ledger ) {
	invariant(
		ledger &&
			ledger.schemaVersion === 1 &&
			ledger.baseline &&
			/^[0-9a-f]{40}$/.test( ledger.baseline.trunkSha ) &&
			Array.isArray( ledger.corrections ) &&
			ledger.corrections.length > 0,
		'Generator requires a non-empty schema-version-1 correction ledger'
	);
	const proposed = ledger.corrections.filter(
		( row ) => row.disposition === 'proposed'
	);
	invariant(
		proposed.length > 0,
		'Generator ledger authorizes zero corrections'
	);
	invariant(
		new Set( proposed.map( ( row ) => row.filePath ) ).size > 0,
		'Generator ledger authorizes zero files'
	);
	invariant(
		ledger.summary.unresolvedCorrectionCount === 0,
		'Generator cannot consume unresolved corrections'
	);
	invariant(
		ledger.summary.pendingShipmentProofCount === 0,
		'Generator cannot consume pending shipment proofs'
	);
	invariant(
		ledger.summary.pendingIndependentReviewCount === 0,
		'Generator cannot consume pending independent reviews'
	);
	for ( const row of proposed ) {
		invariant(
			[
				'move-entry',
				'move-and-replace-entry',
				'remove-duplicate-entry',
				'restore-entry',
				'restore-version-section',
			].includes( row.operation ),
			`Generator does not support operation ${ row.operation } in ${ row.id }`
		);
	}
}

/**
 * Returns byte offsets for every one-based line number.
 *
 * @param {string} content File content.
 * @return {number[]} Zero-based offsets by zero-based line index.
 */
function getLineOffsets( content ) {
	const offsets = [ 0 ];
	for ( let index = 0; index < content.length; index++ ) {
		if ( content[ index ] === '\n' ) {
			offsets.push( index + 1 );
		}
	}
	return offsets;
}

/**
 * Locates one exact block in one unique version section.
 *
 * @param {string} content  Changelog content.
 * @param {string} filePath Changelog path.
 * @param {string} version  Version section.
 * @param {Object} block    Serialized exact block.
 * @return {Object} Parsed section, block, and offsets.
 */
function locateExactBlock( content, filePath, version, block ) {
	const parsed = parseChangelog( content, filePath, {
		allowDuplicateVersions: true,
	} );
	const lookup = findVersionSection( parsed, version );
	invariant(
		lookup.status === 'found',
		`Generator cannot uniquely locate ${ filePath } ${ version }`
	);
	const matches = lookup.section.blocks.filter(
		( candidate ) =>
			candidate.hash === block.hash && candidate.text === block.text
	);
	const requestedOccurrence = block.occurrence || 1;
	invariant(
		matches.length >= requestedOccurrence,
		`Generator found ${ matches.length } exact source blocks but requires occurrence ${ requestedOccurrence } in ${ filePath } ${ version }`
	);
	const match = matches[ requestedOccurrence - 1 ];
	const startOffset = getLineOffsets( content )[ match.startLine - 1 ];
	const endOffset = startOffset + match.text.length;
	invariant(
		content.slice( startOffset, endOffset ) === match.text,
		`Generator source offsets do not match ${ filePath } ${ version }`
	);
	return {
		parsed,
		section: lookup.section,
		block: match,
		startOffset,
		endOffset,
	};
}

/**
 * Removes exactly one source block and one line ending, preserving surrounding
 * headings and all unrelated bytes.
 *
 * @param {string} content Changelog content.
 * @param {Object} row     Ledger row.
 * @return {string} Updated content.
 */
function removeLedgerBlock( content, row ) {
	const source = row.entry?.currentBlock?.block;
	invariant(
		source,
		`Generator row ${ row.id } omits its current source block`
	);
	const located = locateExactBlock(
		content,
		row.filePath,
		row.fromVersion,
		source
	);
	let endOffset = located.endOffset;
	if ( content.startsWith( '\r\n', endOffset ) ) {
		endOffset += 2;
	} else if ( content[ endOffset ] === '\n' ) {
		endOffset++;
	}
	return content.slice( 0, located.startOffset ) + content.slice( endOffset );
}

/**
 * Returns the bytes that must occur in the destination section.
 *
 * @param {Object} row Ledger row.
 * @return {Object} Canonical destination block.
 */
function getDestinationBlock( row ) {
	if ( row.operation === 'move-and-replace-entry' ) {
		invariant(
			row.entry?.replacementBlock,
			`Replacement row ${ row.id } omits replacement bytes`
		);
		return row.entry.replacementBlock;
	}
	if ( row.operation === 'move-entry' ) {
		invariant(
			row.entry?.currentBlock?.block,
			`Move row ${ row.id } omits current bytes`
		);
		return row.entry.currentBlock.block;
	}
	invariant(
		row.entry?.evidenceBlock,
		`Restore row ${ row.id } omits published bytes`
	);
	return row.entry.evidenceBlock;
}

/**
 * Normalizes historically variable subsection labels for insertion only.
 * Exact headings and entry bytes remain untouched.
 *
 * @param {?string} title Subsection title.
 * @return {?string} Comparable category.
 */
function normalizeSubsection( title ) {
	if ( title === null || title === undefined ) {
		return null;
	}
	return title
		.toLowerCase()
		.trim()
		.replace(
			/^(bug fix|breaking change|new feature|enhancement|improvement|deprecation)s$/,
			'$1'
		);
}

/**
 * Inserts a deterministic group of entry blocks into one destination section.
 *
 * @param {string}   content             Changelog content.
 * @param {string}   filePath            Changelog path.
 * @param {string}   version             Destination version.
 * @param {?string}  requestedSubsection Evidence subsection.
 * @param {Object[]} blocks              Ordered destination blocks.
 * @return {string} Updated content.
 */
function insertBlockGroup(
	content,
	filePath,
	version,
	requestedSubsection,
	blocks
) {
	const parsed = parseChangelog( content, filePath, {
		allowDuplicateVersions: true,
	} );
	const lookup = findVersionSection( parsed, version );
	invariant(
		lookup.status === 'found',
		`Generator cannot uniquely locate destination ${ filePath } ${ version }`
	);
	const section = lookup.section;
	for ( const block of blocks ) {
		invariant(
			section.blocks.every(
				( candidate ) => candidate.hash !== block.hash
			),
			`Generator destination already contains ${ block.hash } in ${ filePath } ${ version }`
		);
	}
	const entries = blocks.map( ( block ) => block.text ).join( '\n' );
	const category = normalizeSubsection( requestedSubsection );
	const classifiedBlocks = section.blocks.filter(
		( block ) => normalizeSubsection( block.subsection ) === category
	);
	if ( classifiedBlocks.length > 0 ) {
		const lastBlock = classifiedBlocks.at( -1 );
		const startOffset =
			getLineOffsets( content )[ lastBlock.startLine - 1 ];
		const insertOffset = startOffset + lastBlock.text.length;
		return (
			content.slice( 0, insertOffset ) +
			`\n${ entries }` +
			content.slice( insertOffset )
		);
	}

	const matchingSubsections = section.subsections.filter(
		( subsection ) => normalizeSubsection( subsection.title ) === category
	);
	if ( matchingSubsections.length > 0 ) {
		const subsection = matchingSubsections.at( -1 );
		const startOffset =
			getLineOffsets( content )[ subsection.headingLine - 1 ];
		const insertOffset = startOffset + subsection.heading.length;
		return (
			content.slice( 0, insertOffset ) +
			`\n\n${ entries }` +
			content.slice( insertOffset )
		);
	}

	if ( requestedSubsection === null ) {
		const startOffset =
			getLineOffsets( content )[ section.headingLine - 1 ];
		const insertOffset = startOffset + section.heading.length;
		return (
			content.slice( 0, insertOffset ) +
			`\n\n${ entries }` +
			content.slice( insertOffset )
		);
	}

	const headingLevel =
		section.subsections[ 0 ]?.level ||
		Math.min( section.headingLevel + 1, 6 );
	let prefix = '\n\n';
	if (
		content
			.slice( section.startOffset, section.endOffset )
			.endsWith( '\n\n' )
	) {
		prefix = '';
	} else if ( content[ section.endOffset - 1 ] === '\n' ) {
		prefix = '\n';
	}
	const inserted = `${ prefix }${ '#'.repeat(
		headingLevel
	) } ${ requestedSubsection }\n\n${ entries }\n\n`;
	return (
		content.slice( 0, section.endOffset ) +
		inserted +
		content.slice( section.endOffset )
	);
}

/**
 * Restores one exact published version section in semantic-version order.
 *
 * @param {string} content Changelog content.
 * @param {Object} row     Restore-section ledger row.
 * @return {string} Updated content.
 */
function insertVersionSection( content, row ) {
	const parsed = parseChangelog( content, row.filePath, {
		allowDuplicateVersions: true,
	} );
	const existing = findVersionSection( parsed, row.toVersion );
	invariant(
		existing.status === 'missing',
		`Generator destination section ${ row.filePath } ${ row.toVersion } already exists`
	);
	invariant(
		semver.valid( row.toVersion ),
		`Generator cannot order invalid version ${ row.toVersion }`
	);
	const following = parsed.sections.find(
		( section ) =>
			section.version &&
			semver.valid( section.version ) &&
			semver.lt( section.version, row.toVersion )
	);
	const insertOffset = following ? following.startOffset : content.length;
	let inserted = row.section.text;
	if (
		insertOffset > 0 &&
		! content.slice( 0, insertOffset ).endsWith( '\n\n' )
	) {
		const separation = content[ insertOffset - 1 ] === '\n' ? '\n' : '\n\n';
		inserted = separation + inserted;
	}
	if ( insertOffset < content.length && ! inserted.endsWith( '\n\n' ) ) {
		inserted += inserted.endsWith( '\n' ) ? '\n' : '\n\n';
	}
	return (
		content.slice( 0, insertOffset ) +
		inserted +
		content.slice( insertOffset )
	);
}

/**
 * Reads destination tags and returns stable ordering indices for inserted
 * entries. Missing exact entries are allowed only for reviewed special rows.
 *
 * @param {string}   repositoryPath Repository path.
 * @param {Object[]} rows           Insertion rows.
 * @return {Object} Destination order and evidence by correction ID.
 */
function readDestinationOrder( repositoryPath, rows ) {
	const queries = rows.map( ( row ) => ( {
		commitSha: row.evidence.destinationTag.publishSha,
		filePath: row.filePath,
	} ) );
	const files = readFilesAtCommits( repositoryPath, queries );
	const cache = new Map();
	const order = new Map();
	const evidence = new Map();
	for ( const row of rows ) {
		const key = `${ row.evidence.destinationTag.publishSha }:${ row.filePath }`;
		const content = files.get( key );
		invariant( content !== null, `Destination tag omits ${ key }` );
		if ( ! cache.has( key ) ) {
			cache.set(
				key,
				parseChangelog( content, key, { allowDuplicateVersions: true } )
			);
		}
		const parsed = cache.get( key );
		const lookup = findVersionSection( parsed, row.toVersion );
		invariant(
			lookup.status !== 'ambiguous',
			`Destination tag has ambiguous ${ row.filePath } ${ row.toVersion }`
		);
		const evidenceBlock =
			row.entry.replacementBlock || row.entry.evidenceBlock;
		let orderedBlock =
			lookup.status === 'found'
				? lookup.section.blocks.find(
						( block ) => block.hash === evidenceBlock.hash
				  ) || null
				: null;
		let orderingMethod = 'immutable-destination-tag-section-order';
		if ( ! orderedBlock && lookup.status === 'found' ) {
			const equivalent = locateEquivalentBlock(
				lookup.section,
				evidenceBlock
			);
			if ( equivalent.status === 'found' ) {
				orderedBlock = equivalent.block;
			}
		}
		if ( ! orderedBlock ) {
			const carriedMatches = parsed.sections.flatMap( ( section ) =>
				section.blocks.filter(
					( block ) => block.hash === evidenceBlock.hash
				)
			);
			if ( carriedMatches.length === 1 ) {
				orderedBlock = carriedMatches[ 0 ];
				orderingMethod =
					'immutable-destination-tag-file-order-from-carried-section';
			}
		}
		invariant(
			orderedBlock ||
				row.evidence.shipmentProof.status === 'proved' ||
				row.evidence.shipmentProof.status ===
					'proved-by-published-changelog',
			`Destination tag omits ordering and shipment evidence for ${ row.id }`
		);
		const index = orderedBlock ? orderedBlock.startLine : null;
		order.set( row.id, index ?? Number.MAX_SAFE_INTEGER );
		let method = orderingMethod;
		if ( index === null ) {
			method =
				row.evidence.shipmentProof.method ===
				'reviewed-special-tree-evidence'
					? 'reviewed-special-stable-row-id-fallback'
					: 'stable-row-id-fallback-destination-section-omits-entry';
		}
		evidence.set( row.id, {
			method,
			destinationTag: row.evidence.destinationTag.name,
			destinationIndex: index === -1 ? null : index,
		} );
	}
	return { order, evidence };
}

/**
 * Counts one exact block in a version section, returning zero when absent.
 *
 * @param {Object} parsed  Parsed changelog.
 * @param {string} version Version.
 * @param {Object} block   Exact block.
 * @return {number} Exact occurrence count.
 */
function countExactBlock( parsed, version, block ) {
	const lookup = findVersionSection( parsed, version );
	if ( lookup.status === 'missing' ) {
		return 0;
	}
	invariant(
		lookup.status === 'found',
		`Verifier cannot uniquely locate version ${ version }`
	);
	return lookup.section.blocks.filter(
		( candidate ) =>
			candidate.hash === block.hash && candidate.text === block.text
	).length;
}

/**
 * Preserves the frozen file's exact terminal-newline convention after moving
 * an entry at the end of a changelog. Entry and section bytes remain intact.
 *
 * @param {string} content  Generated changelog bytes.
 * @param {string} baseline Frozen changelog bytes.
 * @return {string} Generated bytes with the baseline terminal newline suffix.
 */
function preserveTerminalNewlines( content, baseline ) {
	const baselineSuffix = baseline.match( /(?:\r?\n)*$/ )[ 0 ];
	return content.replace( /(?:\r?\n)*$/, baselineSuffix );
}

/**
 * Partitions destination rows after full-section restorations have run. A
 * group must be wholly satisfied by the restored section or wholly missing;
 * mixing the two would make deterministic historical ordering ambiguous.
 *
 * @param {Object}   parsed Parsed generated changelog.
 * @param {Object[]} rows   Destination correction rows.
 * @return {Object} Satisfied and missing rows.
 */
function partitionDestinationRows( parsed, rows ) {
	const satisfiedRows = [];
	const missingRows = [];
	for ( const row of rows ) {
		const destination = getDestinationBlock( row );
		const existingCount = countExactBlock(
			parsed,
			row.toVersion,
			destination
		);
		invariant(
			existingCount <= 1,
			`Generator found duplicate restored destination entries for ${ row.id }`
		);
		( existingCount === 1 ? satisfiedRows : missingRows ).push( row );
	}
	invariant(
		missingRows.length === 0 || missingRows.length === rows.length,
		`Generator cannot safely order a mixture of restored and missing destination entries in ${ rows[ 0 ].filePath } ${ rows[ 0 ].toVersion }`
	);
	return { satisfiedRows, missingRows };
}

/**
 * Verifies every proposed correction against the generated tree.
 *
 * @param {Object}             ledger Correction ledger.
 * @param {Map<string,string>} files  Generated file contents.
 * @param {Map<string,Object>} traces Operation traces.
 * @return {Object} Verification summary.
 */
function verifyGeneratedTree( ledger, files, traces ) {
	const parsedByPath = new Map();
	for ( const [ filePath, content ] of files ) {
		parsedByPath.set( filePath, parseChangelog( content, filePath ) );
	}
	const proposed = ledger.corrections.filter(
		( row ) => row.disposition === 'proposed'
	);
	for ( const row of proposed ) {
		const parsed = parsedByPath.get( row.filePath );
		invariant( parsed, `Verifier omits changed file ${ row.filePath }` );
		const trace = traces.get( row.id );
		invariant( trace, `Verifier omits operation trace for ${ row.id }` );
		if ( row.destinationSection ) {
			const destinationLookup = findVersionSection(
				parsed,
				row.toVersion
			);
			invariant(
				destinationLookup.status === 'found' &&
					destinationLookup.section.heading ===
						row.destinationSection.heading,
				`Verifier did not create destination heading for ${ row.id }`
			);
		}
		if ( row.operation === 'restore-version-section' ) {
			const lookup = findVersionSection( parsed, row.toVersion );
			invariant(
				lookup.status === 'found' &&
					lookup.section.heading === row.section.heading,
				`Verifier did not restore section ${ row.id }`
			);
			for ( const block of row.section.blocks ) {
				invariant(
					countExactBlock( parsed, row.toVersion, block ) === 1,
					`Verifier did not restore section block ${ block.hash } for ${ row.id }`
				);
			}
			continue;
		}

		if (
			row.fromVersion &&
			! (
				row.operation === 'remove-duplicate-entry' &&
				row.fromVersion === row.toVersion
			)
		) {
			invariant(
				countExactBlock(
					parsed,
					row.fromVersion,
					row.entry.currentBlock.block
				) === 0,
				`Verifier left source block for ${ row.id }`
			);
		}
		if ( row.operation === 'remove-duplicate-entry' ) {
			const survivingCount = countExactBlock(
				parsed,
				row.toVersion,
				row.entry.evidenceBlock
			);
			invariant(
				row.fromVersion === row.toVersion
					? survivingCount ===
							( row.currentState.wrongExactCount || 2 ) - 1
					: survivingCount >= 1,
				`Verifier found an invalid surviving duplicate count for ${ row.id }`
			);
			continue;
		}
		const destination = getDestinationBlock( row );
		invariant(
			countExactBlock( parsed, row.toVersion, destination ) === 1,
			`Verifier found an invalid destination count for ${ row.id }`
		);
	}

	return {
		verifiedCorrectionCount: proposed.length,
		verifiedFileCount: files.size,
		malformedOrDuplicateHeadingCount: 0,
	};
}

/**
 * Generates the authorized final changelog tree entirely from the frozen
 * baseline and the correction ledger. It never reads mutable worktree bytes.
 *
 * @param {Object} options                Generation options.
 * @param {string} options.repositoryPath Repository path.
 * @param {Object} options.ledger         Correction ledger.
 * @return {Object} Generated contents, traces, and verification report.
 */
function generateHistoricalChangelogTree( { repositoryPath, ledger } ) {
	assertGeneratorReadyLedger( ledger );
	const proposed = ledger.corrections
		.filter( ( row ) => row.disposition === 'proposed' )
		.sort( ( left, right ) => left.id.localeCompare( right.id ) );
	const filePaths = [
		...new Set( proposed.map( ( row ) => row.filePath ) ),
	].sort();
	const baselineFiles = readFilesAtCommits(
		repositoryPath,
		filePaths.map( ( filePath ) => ( {
			commitSha: ledger.baseline.trunkSha,
			filePath,
		} ) )
	);
	const baselineByPath = new Map();
	const generatedByPath = new Map();
	for ( const filePath of filePaths ) {
		const key = `${ ledger.baseline.trunkSha }:${ filePath }`;
		const content = baselineFiles.get( key );
		invariant( content !== null, `Frozen baseline omits ${ filePath }` );
		baselineByPath.set( filePath, content );
		generatedByPath.set( filePath, content );
	}
	const traces = new Map(
		proposed.map( ( row ) => [ row.id, { rowId: row.id, actions: [] } ] )
	);

	const removals = proposed.filter( ( row ) =>
		[
			'move-entry',
			'move-and-replace-entry',
			'remove-duplicate-entry',
		].includes( row.operation )
	);
	for ( const row of removals ) {
		generatedByPath.set(
			row.filePath,
			removeLedgerBlock( generatedByPath.get( row.filePath ), row )
		);
		traces.get( row.id ).actions.push( {
			type: 'remove-entry',
			version: row.fromVersion,
			blockHash: row.entry.currentBlock.block.hash,
		} );
	}

	for ( const row of proposed.filter(
		( candidate ) => candidate.operation === 'restore-version-section'
	) ) {
		generatedByPath.set(
			row.filePath,
			insertVersionSection( generatedByPath.get( row.filePath ), row )
		);
		traces.get( row.id ).actions.push( {
			type: 'restore-version-section',
			version: row.toVersion,
			sectionHash: row.section.hash,
		} );
	}
	const destinationSectionGroups = new Map();
	for ( const row of proposed.filter(
		( candidate ) => candidate.destinationSection
	) ) {
		const key = JSON.stringify( [ row.filePath, row.toVersion ] );
		if ( ! destinationSectionGroups.has( key ) ) {
			destinationSectionGroups.set( key, [] );
		}
		destinationSectionGroups.get( key ).push( row );
	}
	const destinationSectionCreations = [];
	for ( const rows of [ ...destinationSectionGroups.values() ].sort(
		( left, right ) => left[ 0 ].id.localeCompare( right[ 0 ].id )
	) ) {
		const row = rows[ 0 ];
		const current = generatedByPath.get( row.filePath );
		const existing = findVersionSection(
			parseChangelog( current, row.filePath ),
			row.toVersion
		);
		let status = 'created';
		if ( existing.status === 'found' ) {
			invariant(
				existing.section.heading === row.destinationSection.heading,
				`Generator found a conflicting restored destination heading for ${ row.id }`
			);
			status = 'satisfied-by-restored-version-section';
		} else {
			const sectionText = `${ row.destinationSection.heading }\n\n`;
			generatedByPath.set(
				row.filePath,
				insertVersionSection( current, {
					filePath: row.filePath,
					toVersion: row.toVersion,
					section: { text: sectionText },
				} )
			);
		}
		destinationSectionCreations.push( {
			filePath: row.filePath,
			version: row.toVersion,
			heading: row.destinationSection.heading,
			headingHash: row.destinationSection.headingHash,
			evidenceMethod: row.destinationSection.method,
			status,
			authorizedByCorrectionIds: rows.map( ( item ) => item.id ).sort(),
		} );
	}

	const insertions = proposed.filter( ( row ) =>
		[ 'move-entry', 'move-and-replace-entry', 'restore-entry' ].includes(
			row.operation
		)
	);
	const destinationOrdering = readDestinationOrder(
		repositoryPath,
		insertions
	);
	const groups = new Map();
	for ( const row of insertions ) {
		const key = JSON.stringify( [
			row.filePath,
			row.toVersion,
			normalizeSubsection( row.toSubsection ),
		] );
		if ( ! groups.has( key ) ) {
			groups.set( key, [] );
		}
		groups.get( key ).push( row );
	}
	for ( const rows of [ ...groups.values() ].sort( ( left, right ) =>
		left[ 0 ].id.localeCompare( right[ 0 ].id )
	) ) {
		rows.sort(
			( left, right ) =>
				destinationOrdering.order.get( left.id ) -
					destinationOrdering.order.get( right.id ) ||
				left.id.localeCompare( right.id )
		);
		const first = rows[ 0 ];
		const current = generatedByPath.get( first.filePath );
		const parsed = parseChangelog( current, first.filePath );
		const { satisfiedRows, missingRows } = partitionDestinationRows(
			parsed,
			rows
		);
		for ( const row of satisfiedRows ) {
			const destination = getDestinationBlock( row );
			traces.get( row.id ).actions.push( {
				type: 'destination-entry-satisfied-by-restored-section',
				version: row.toVersion,
				blockHash: destination.hash,
			} );
		}
		if ( missingRows.length > 0 ) {
			generatedByPath.set(
				first.filePath,
				insertBlockGroup(
					current,
					first.filePath,
					first.toVersion,
					first.toSubsection,
					missingRows.map( getDestinationBlock )
				)
			);
		}
		for ( const row of missingRows ) {
			traces.get( row.id ).actions.push( {
				type: 'insert-entry',
				version: row.toVersion,
				blockHash: getDestinationBlock( row ).hash,
				orderingEvidence: destinationOrdering.evidence.get( row.id ),
			} );
		}
	}

	for ( const row of proposed ) {
		const expectedActionCount = [
			'move-entry',
			'move-and-replace-entry',
		].includes( row.operation )
			? 2
			: 1;
		invariant(
			traces.get( row.id ).actions.length === expectedActionCount,
			`Generator traced ${
				traces.get( row.id ).actions.length
			} actions for ${ row.id }; expected ${ expectedActionCount }`
		);
	}
	for ( const filePath of filePaths ) {
		generatedByPath.set(
			filePath,
			preserveTerminalNewlines(
				generatedByPath.get( filePath ),
				baselineByPath.get( filePath )
			)
		);
	}

	const changedFiles = filePaths.filter(
		( filePath ) =>
			generatedByPath.get( filePath ) !== baselineByPath.get( filePath )
	);
	invariant(
		changedFiles.length === filePaths.length,
		`Generator changed ${ changedFiles.length } of ${ filePaths.length } authorized files`
	);
	const verification = verifyGeneratedTree( ledger, generatedByPath, traces );
	const fileRecords = filePaths.map( ( filePath ) => ( {
		filePath,
		baselineHash: hashText( baselineByPath.get( filePath ) ),
		generatedHash: hashText( generatedByPath.get( filePath ) ),
		operationIds: proposed
			.filter( ( row ) => row.filePath === filePath )
			.map( ( row ) => row.id ),
	} ) );
	return {
		baselineSha: ledger.baseline.trunkSha,
		ledgerIntegrityHash: ledger.integrityHash,
		baselineByPath,
		generatedByPath,
		traces,
		verification,
		fileRecords,
		destinationSectionCreations,
		integrityHash: hashText(
			JSON.stringify( {
				baselineSha: ledger.baseline.trunkSha,
				ledgerIntegrityHash: ledger.integrityHash,
				files: fileRecords,
				traces: [ ...traces.values() ],
				destinationSectionCreations,
			} )
		),
	};
}

module.exports = {
	assertGeneratorReadyLedger,
	generateHistoricalChangelogTree,
	getDestinationBlock,
	insertBlockGroup,
	insertVersionSection,
	normalizeSubsection,
	partitionDestinationRows,
	preserveTerminalNewlines,
	removeLedgerBlock,
	verifyGeneratedTree,
};
