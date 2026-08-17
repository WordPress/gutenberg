const crypto = require( 'crypto' );
const { execFileSync } = require( 'child_process' );
const { TextDecoder } = require( 'util' );
const semver = require( 'semver' );

const FIELD_SEPARATOR = '\u001f';
const RECORD_SEPARATOR = '\u001e';
const DEFAULT_AUDIT_START = '2019-03-06';
const DEFAULT_TRUNK_REF = 'origin/trunk';

const PREPUBLISH_CHANGELOG_SUBJECTS = new Set( [
	'Update changelog files',
	'Update changelogs',
] );

const LEGACY_CHANGELOG_SUBJECTS = new Set( [
	'Add missing release date and version to CHANGELOG files',
	'Add release date and version to CHANGELOG file',
	'Add release date and version to CHANGELOG files',
	'Packages: Add release date to changelog files',
	'Update the package changelogs after the npm release',
	'chore(release): update additional changelog file',
	'chore(release): update changelog files',
] );

const PACKAGE_TAG_PATTERN = /^@wordpress\/(.+)@([^@]+)$/;
const VERSION_HEADING_PATTERN =
	/^(#{1,3})\s+(Unreleased|master|v?\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?(?:\+[0-9A-Za-z.-]+)?)(?:\s+\(([^)]+)\))?\s*$/i;
const MARKDOWN_HEADING_PATTERN = /^(#{2,6})\s+(.+?)\s*$/;
const LIST_ITEM_PATTERN = /^(\s*)([-+*])\s+/;
const SHA_PATTERN = /^[0-9a-f]{40}$/;

/**
 * Fails the audit with a message that identifies the invalid boundary data.
 *
 * @param {boolean} condition Whether the condition is satisfied.
 * @param {string}  message   Failure message.
 */
function invariant( condition, message ) {
	if ( ! condition ) {
		throw new Error( message );
	}
}

/**
 * Runs Git without invoking a shell.
 *
 * @param {string}   repositoryPath Repository working directory.
 * @param {string[]} args           Git arguments.
 * @param {Object}   [options]      Execution options.
 * @return {string} Standard output.
 */
function runGit( repositoryPath, args, options = {} ) {
	try {
		return execFileSync( 'git', args, {
			cwd: repositoryPath,
			encoding: 'utf8',
			maxBuffer: 256 * 1024 * 1024,
			...options,
		} );
	} catch ( error ) {
		const stderr = error.stderr ? String( error.stderr ).trim() : '';
		const detail = stderr ? `: ${ stderr }` : '';
		throw new Error( `git ${ args.join( ' ' ) } failed${ detail }` );
	}
}

/**
 * Parses records emitted with ASCII unit and record separators.
 *
 * @param {string} output     Git output.
 * @param {number} fieldCount Expected fields per record.
 * @param {string} label      Record label for failures.
 * @return {string[][]} Parsed records.
 */
function parseSeparatedRecords( output, fieldCount, label ) {
	return output
		.split( RECORD_SEPARATOR )
		.map( ( record ) => record.replace( /^\n+|\n+$/g, '' ) )
		.filter( Boolean )
		.map( ( record, index ) => {
			const fields = record.split( FIELD_SEPARATOR );
			invariant(
				fields.length === fieldCount,
				`${ label } record ${ index + 1 } has ${
					fields.length
				} fields; expected ${ fieldCount }`
			);
			return fields;
		} );
}

/**
 * Returns commit metadata for an exact set of SHAs.
 *
 * @param {string}   repositoryPath Repository working directory.
 * @param {string[]} commitShas     Commit SHAs.
 * @return {Map<string,Object>} Metadata keyed by SHA.
 */
function getCommitMetadata( repositoryPath, commitShas ) {
	if ( commitShas.length === 0 ) {
		return new Map();
	}

	for ( const sha of commitShas ) {
		invariant( SHA_PATTERN.test( sha ), `Invalid commit SHA: ${ sha }` );
	}

	const format = [ '%H', '%P', '%aI', '%cI', '%s' ].join(
		`%x${ FIELD_SEPARATOR.codePointAt( 0 ).toString( 16 ) }`
	);
	const output = runGit( repositoryPath, [
		'show',
		'--no-patch',
		`--format=${ format }%x${ RECORD_SEPARATOR.codePointAt( 0 ).toString(
			16
		) }`,
		...commitShas,
	] );
	const records = parseSeparatedRecords( output, 5, 'commit metadata' );
	const metadata = new Map();

	for ( const [
		sha,
		parentsText,
		authorDate,
		commitDate,
		subject,
	] of records ) {
		invariant(
			SHA_PATTERN.test( sha ),
			`Git returned an invalid SHA: ${ sha }`
		);
		invariant(
			! metadata.has( sha ),
			`Duplicate commit metadata for ${ sha }`
		);
		const parents = parentsText ? parentsText.split( ' ' ) : [];
		for ( const parent of parents ) {
			invariant(
				SHA_PATTERN.test( parent ),
				`Commit ${ sha } has an invalid parent SHA: ${ parent }`
			);
		}
		metadata.set( sha, {
			sha,
			parents,
			authorDate,
			commitDate,
			subject,
		} );
	}

	for ( const sha of commitShas ) {
		invariant(
			metadata.has( sha ),
			`Missing commit metadata for ${ sha }`
		);
	}

	return metadata;
}

/**
 * Parses and validates a package tag.
 *
 * @param {string} tagName Full package tag name.
 * @return {Object} Parsed tag fields.
 */
function parsePackageTag( tagName ) {
	const match = tagName.match( PACKAGE_TAG_PATTERN );
	invariant( match, `Malformed WordPress package tag: ${ tagName }` );
	const [ , packageSlug, version ] = match;
	const parsedVersion = semver.parse( version, { includePrerelease: true } );
	invariant( parsedVersion, `Invalid semantic version in tag: ${ tagName }` );

	return {
		name: tagName,
		package: `@wordpress/${ packageSlug }`,
		packageSlug,
		version,
		stable: parsedVersion.prerelease.length === 0,
	};
}

/**
 * Reads package tags and groups stable tags by their peeled commit.
 *
 * @param {string} repositoryPath Repository working directory.
 * @return {Object} Stable groups and excluded prerelease tags.
 */
function readPackageTagGroups( repositoryPath ) {
	const format = [
		'%(objecttype)',
		'%(objectname)',
		'%(*objectname)',
		'%(refname:strip=2)',
	].join( '%09' );
	const output = runGit( repositoryPath, [
		'for-each-ref',
		`--format=${ format }`,
		'refs/tags/@wordpress',
	] );
	const groups = new Map();
	const excludedPrereleases = [];
	let tagRecordCount = 0;

	for ( const line of output.split( '\n' ) ) {
		if ( ! line ) {
			continue;
		}
		tagRecordCount++;
		const fields = line.split( '\t' );
		invariant(
			fields.length === 4,
			`Package tag record ${ tagRecordCount } has ${ fields.length } fields; expected 4`
		);
		const [ objectType, objectSha, peeledSha, tagName ] = fields;
		invariant(
			objectType === 'tag' || objectType === 'commit',
			`Unsupported package tag object type ${ objectType } for ${ tagName }`
		);
		const targetSha = objectType === 'tag' ? peeledSha : objectSha;
		invariant(
			SHA_PATTERN.test( targetSha ),
			`Package tag ${ tagName } does not peel to a commit`
		);
		const tag = {
			...parsePackageTag( tagName ),
			objectSha,
			targetSha,
		};

		if ( ! tag.stable ) {
			excludedPrereleases.push( tag );
			continue;
		}

		if ( ! groups.has( targetSha ) ) {
			groups.set( targetSha, [] );
		}
		groups.get( targetSha ).push( tag );
	}

	invariant( tagRecordCount > 0, 'Package tag scan returned zero records' );
	invariant(
		groups.size > 0,
		'Package tag scan returned zero stable publish groups'
	);

	for ( const tags of groups.values() ) {
		tags.sort( ( left, right ) => left.name.localeCompare( right.name ) );
		const packages = new Set();
		for ( const tag of tags ) {
			invariant(
				! packages.has( tag.package ),
				`Publish commit ${ tag.targetSha } has multiple stable tags for ${ tag.package }`
			);
			packages.add( tag.package );
		}
	}

	excludedPrereleases.sort( ( left, right ) =>
		left.name.localeCompare( right.name )
	);

	return { groups, excludedPrereleases, tagRecordCount };
}

/**
 * Lists changelog paths changed by a commit.
 *
 * @param {string} repositoryPath Repository working directory.
 * @param {string} commitSha      Commit SHA.
 * @return {string[]} Changed changelog paths.
 */
function listChangedChangelogs( repositoryPath, commitSha ) {
	const output = runGit( repositoryPath, [
		'diff-tree',
		'--no-commit-id',
		'--name-only',
		'-r',
		commitSha,
		'--',
		'packages/*/CHANGELOG.md',
	] );
	return output.split( '\n' ).filter( Boolean ).sort();
}

/**
 * Finds direct legacy changelog-finalization children of publish commits.
 *
 * @param {string}      repositoryPath Repository working directory.
 * @param {Set<string>} publishShas    Stable publish SHAs.
 * @return {Map<string,Object[]>} Children keyed by publish parent SHA.
 */
function findLegacyChangelogChildren( repositoryPath, publishShas ) {
	const output = runGit( repositoryPath, [
		'log',
		'--all',
		`--format=%H%x1f%P%x1f%aI%x1f%cI%x1f%s%x1e`,
		'--regexp-ignore-case',
		'--grep=changelog',
	] );
	const records = parseSeparatedRecords( output, 5, 'changelog commit' );
	const children = new Map();

	for ( const [
		sha,
		parentsText,
		authorDate,
		commitDate,
		subject,
	] of records ) {
		if ( ! LEGACY_CHANGELOG_SUBJECTS.has( subject ) ) {
			continue;
		}
		const parents = parentsText ? parentsText.split( ' ' ) : [];
		if ( parents.length !== 1 || ! publishShas.has( parents[ 0 ] ) ) {
			continue;
		}
		const child = { sha, parents, authorDate, commitDate, subject };
		if ( ! children.has( parents[ 0 ] ) ) {
			children.set( parents[ 0 ], [] );
		}
		children.get( parents[ 0 ] ).push( child );
	}

	for ( const [ parent, matches ] of children ) {
		matches.sort( ( left, right ) => left.sha.localeCompare( right.sha ) );
		invariant(
			matches.length === 1,
			`Publish commit ${ parent } has ${ matches.length } legacy changelog children`
		);
	}

	return children;
}

/**
 * Builds a signature index for commits on the frozen trunk first-parent path.
 *
 * @param {string} repositoryPath Repository working directory.
 * @param {string} trunkRef       Frozen trunk commit or ref.
 * @return {Map<string,Object[]>} Commits keyed by author date and subject.
 */
function indexTrunkCommits( repositoryPath, trunkRef ) {
	const output = runGit( repositoryPath, [
		'log',
		'--first-parent',
		`--format=%H%x1f%P%x1f%aI%x1f%cI%x1f%s%x1e`,
		trunkRef,
	] );
	const records = parseSeparatedRecords( output, 5, 'trunk commit' );
	const index = new Map();

	for ( const [
		sha,
		parentsText,
		authorDate,
		commitDate,
		subject,
	] of records ) {
		const parents = parentsText ? parentsText.split( ' ' ) : [];
		const commit = { sha, parents, authorDate, commitDate, subject };
		const key = `${ authorDate }\u0000${ subject }`;
		if ( ! index.has( key ) ) {
			index.set( key, [] );
		}
		index.get( key ).push( commit );
	}

	return index;
}

/**
 * Matches a release-side commit to the frozen trunk first-parent path.
 *
 * @param {Object}               commit     Release commit metadata.
 * @param {Map<string,Object[]>} trunkIndex Trunk signature index.
 * @return {Object} Match result.
 */
function matchTrunkCommit( commit, trunkIndex ) {
	const key = `${ commit.authorDate }\u0000${ commit.subject }`;
	const candidates = ( trunkIndex.get( key ) || [] ).map(
		( candidate ) => candidate.sha
	);

	if ( candidates.length === 1 ) {
		return {
			status: 'matched',
			method: 'author-date-and-subject',
			sha: candidates[ 0 ],
		};
	}

	return {
		status: candidates.length === 0 ? 'unpaired' : 'ambiguous',
		method: 'author-date-and-subject',
		candidates,
	};
}

/**
 * Returns first-parent commits strictly between two commits when the first is
 * an ancestor of the second, or null when they do not share that ordering.
 *
 * @param {string} repositoryPath Repository working directory.
 * @param {string} ancestorSha    Expected ancestor.
 * @param {string} descendantSha  Expected descendant.
 * @return {?string[]} Intervening commits in chronological order.
 */
function getInterveningFirstParentCommits(
	repositoryPath,
	ancestorSha,
	descendantSha
) {
	const mergeBase = runGit( repositoryPath, [
		'merge-base',
		ancestorSha,
		descendantSha,
	] ).trim();
	if ( mergeBase !== ancestorSha ) {
		return null;
	}

	const chain = runGit( repositoryPath, [
		'rev-list',
		'--first-parent',
		'--reverse',
		`${ ancestorSha }..${ descendantSha }`,
	] )
		.split( '\n' )
		.filter( Boolean );
	invariant(
		chain.at( -1 ) === descendantSha,
		`${ ancestorSha } is not on the first-parent path to ${ descendantSha }`
	);
	return chain.slice( 0, -1 );
}

/**
 * Reads auditable release lane refs.
 *
 * @param {string}  repositoryPath Repository working directory.
 * @param {?Object} frozenLanes    Optional immutable lane snapshot.
 * @return {Object[]} Lane refs.
 */
function readReleaseLanes( repositoryPath, frozenLanes = null ) {
	if ( frozenLanes !== null ) {
		invariant(
			frozenLanes &&
				typeof frozenLanes === 'object' &&
				frozenLanes.schemaVersion === 1 &&
				Array.isArray( frozenLanes.lanes ) &&
				frozenLanes.lanes.length > 0,
			'Frozen release lanes must use schema version 1 and contain lanes'
		);
		const seen = new Set();
		const lanes = frozenLanes.lanes.map( ( lane, index ) => {
			invariant(
				lane &&
					typeof lane === 'object' &&
					( lane.id === 'wp/latest' ||
						/^wp\/\d+\.\d+$/.test( lane.id ) ) &&
					SHA_PATTERN.test( lane.sha ),
				`Frozen release lane ${ index + 1 } is invalid`
			);
			invariant(
				! seen.has( lane.id ),
				`Frozen release lane ${ lane.id } is duplicated`
			);
			seen.add( lane.id );
			const resolvedSha = runGit( repositoryPath, [
				'rev-parse',
				`${ lane.sha }^{commit}`,
			] ).trim();
			invariant(
				resolvedSha === lane.sha,
				`Frozen release lane ${ lane.id } does not resolve to ${ lane.sha }`
			);
			return { id: lane.id, ref: null, sha: lane.sha };
		} );
		lanes.sort( ( left, right ) => left.id.localeCompare( right.id ) );
		return lanes;
	}

	const output = runGit( repositoryPath, [
		'for-each-ref',
		'--format=%(refname:short)%09%(objectname)',
		'refs/remotes/origin/wp',
	] );
	const lanes = [];

	for ( const line of output.split( '\n' ) ) {
		if ( ! line ) {
			continue;
		}
		const fields = line.split( '\t' );
		invariant(
			fields.length === 2,
			`Malformed release lane record: ${ line }`
		);
		const [ ref, sha ] = fields;
		if ( ref === 'origin/wp/next' ) {
			continue;
		}
		if (
			ref !== 'origin/wp/latest' &&
			! /^origin\/wp\/\d+\.\d+$/.test( ref )
		) {
			continue;
		}
		invariant(
			SHA_PATTERN.test( sha ),
			`Release lane ${ ref } has invalid SHA ${ sha }`
		);
		lanes.push( { id: ref.replace( /^origin\//, '' ), ref, sha } );
	}

	invariant(
		lanes.length > 0,
		'Release lane scan returned zero stable lanes'
	);
	lanes.sort( ( left, right ) => left.id.localeCompare( right.id ) );
	return lanes;
}

/**
 * Adds immutable first-parent lane membership and exact successor events.
 *
 * @param {string}   repositoryPath Repository working directory.
 * @param {Object[]} events         Inventory events.
 * @param {Object[]} lanes          Release lanes.
 */
function addLaneMemberships( repositoryPath, events, lanes ) {
	const eventsBySha = new Map(
		events.map( ( event ) => [ event.publishSha, event ] )
	);
	for ( const event of events ) {
		event.lanes = [];
	}

	for ( const lane of lanes ) {
		const chain = runGit( repositoryPath, [
			'rev-list',
			'--first-parent',
			'--reverse',
			lane.sha,
		] )
			.split( '\n' )
			.filter( ( sha ) => eventsBySha.has( sha ) );

		for ( let index = 0; index < chain.length; index++ ) {
			const event = eventsBySha.get( chain[ index ] );
			event.lanes.push( {
				id: lane.id,
				previousEventSha: index > 0 ? chain[ index - 1 ] : null,
				nextEventSha:
					index + 1 < chain.length ? chain[ index + 1 ] : null,
			} );
		}
	}

	for ( const event of events ) {
		event.lanes.sort( ( left, right ) =>
			left.id.localeCompare( right.id )
		);
		const latestLane = event.lanes.find(
			( lane ) => lane.id === 'wp/latest'
		);
		if ( latestLane ) {
			event.primaryLaneId = latestLane.id;
		} else if ( event.lanes.length === 1 ) {
			event.primaryLaneId = event.lanes[ 0 ].id;
		} else {
			event.primaryLaneId = null;
		}
	}
}

/**
 * Builds the stable publish/backport inventory from immutable tags.
 *
 * @param {Object}  options                Inventory options.
 * @param {string}  options.repositoryPath Repository working directory.
 * @param {string}  [options.auditStart]   Inclusive audit date.
 * @param {string}  [options.trunkRef]     Frozen trunk ref or SHA.
 * @param {string}  [options.candidateRef] Optional candidate ref or SHA.
 * @param {?Object} [options.releaseLanes] Optional immutable lane snapshot.
 * @return {Object} Deterministic inventory.
 */
function buildPublishInventory( {
	repositoryPath,
	auditStart = DEFAULT_AUDIT_START,
	trunkRef = DEFAULT_TRUNK_REF,
	candidateRef = null,
	releaseLanes = null,
} ) {
	invariant(
		/^\d{4}-\d{2}-\d{2}$/.test( auditStart ),
		`Invalid audit start: ${ auditStart }`
	);
	const baselineSha = runGit( repositoryPath, [
		'rev-parse',
		trunkRef,
	] ).trim();
	invariant(
		SHA_PATTERN.test( baselineSha ),
		`Invalid trunk baseline SHA: ${ baselineSha }`
	);
	const candidateSha = candidateRef
		? runGit( repositoryPath, [ 'rev-parse', candidateRef ] ).trim()
		: null;
	const candidateMergeBaseSha = candidateRef
		? runGit( repositoryPath, [
				'merge-base',
				baselineSha,
				candidateSha,
		  ] ).trim()
		: null;
	if ( candidateRef ) {
		invariant(
			SHA_PATTERN.test( candidateSha ),
			`Invalid candidate SHA: ${ candidateSha }`
		);
		invariant(
			SHA_PATTERN.test( candidateMergeBaseSha ),
			`Candidate ${ candidateSha } has no valid merge base with ${ baselineSha }`
		);
	}

	const { groups, excludedPrereleases, tagRecordCount } =
		readPackageTagGroups( repositoryPath );
	const publishShas = [ ...groups.keys() ].sort();
	const publishMetadata = getCommitMetadata( repositoryPath, publishShas );
	const parentShas = [
		...new Set(
			[ ...publishMetadata.values() ]
				.flatMap( ( commit ) => commit.parents.slice( 0, 1 ) )
				.filter( Boolean )
		),
	].sort();
	const parentMetadata = getCommitMetadata( repositoryPath, parentShas );
	const legacyChildren = findLegacyChangelogChildren(
		repositoryPath,
		new Set( publishShas )
	);
	const trunkIndex = indexTrunkCommits( repositoryPath, baselineSha );
	const lanes = readReleaseLanes( repositoryPath, releaseLanes );
	const events = [];

	for ( const publishSha of publishShas ) {
		const commit = publishMetadata.get( publishSha );
		invariant(
			commit.parents.length > 0,
			`Publish commit ${ publishSha } has no parent`
		);
		const parent = parentMetadata.get( commit.parents[ 0 ] );
		const legacyMatches = legacyChildren.get( publishSha ) || [];
		let classification;
		let changelogCommit = null;
		let releaseSourceSha = null;
		let releasedChangelogSha = publishSha;

		if ( commit.authorDate.slice( 0, 10 ) < auditStart ) {
			classification = 'pre-audit-stable-publish';
		} else if ( commit.subject !== 'chore(release): publish' ) {
			classification = 'metadata-restoration-or-special-tag';
		} else if ( PREPUBLISH_CHANGELOG_SUBJECTS.has( parent.subject ) ) {
			classification = 'prepublish-changelog';
			changelogCommit = parent;
			releaseSourceSha = parent.parents[ 0 ] || null;
		} else if ( legacyMatches.length === 1 ) {
			classification = 'legacy-postpublish-changelog';
			changelogCommit = legacyMatches[ 0 ];
			releaseSourceSha = commit.parents[ 0 ];
			releasedChangelogSha = changelogCommit.sha;
		} else {
			classification = 'stable-publish-without-changelog-finalization';
		}

		const changedChangelogs = changelogCommit
			? listChangedChangelogs( repositoryPath, changelogCommit.sha )
			: [];
		if (
			classification === 'prepublish-changelog' ||
			classification === 'legacy-postpublish-changelog'
		) {
			invariant(
				changedChangelogs.length > 0,
				`${ classification } event ${ publishSha } changed zero changelog files`
			);
		}

		const publishTrunkMatch = matchTrunkCommit( commit, trunkIndex );
		const changelogTrunkMatch = changelogCommit
			? matchTrunkCommit( changelogCommit, trunkIndex )
			: null;
		let trunkPreSha = null;
		let trunkPostSha = null;
		let pairingStatus = 'not-applicable';
		let interveningCommits = [];
		let backportOrder = null;

		if (
			changelogCommit &&
			publishTrunkMatch.status === 'matched' &&
			changelogTrunkMatch.status === 'matched'
		) {
			const trunkPublish = getCommitMetadata( repositoryPath, [
				publishTrunkMatch.sha,
			] ).get( publishTrunkMatch.sha );
			const trunkChangelog = getCommitMetadata( repositoryPath, [
				changelogTrunkMatch.sha,
			] ).get( changelogTrunkMatch.sha );
			if ( classification === 'prepublish-changelog' ) {
				const intervening = getInterveningFirstParentCommits(
					repositoryPath,
					trunkChangelog.sha,
					trunkPublish.sha
				);
				if ( intervening ) {
					trunkPreSha = trunkChangelog.parents[ 0 ] || null;
					trunkPostSha = trunkPublish.sha;
					interveningCommits = intervening;
					backportOrder = 'changelog-then-publish';
					pairingStatus =
						intervening.length === 0
							? 'paired'
							: 'paired-with-intervening-commits';
				} else {
					const reversedIntervening =
						getInterveningFirstParentCommits(
							repositoryPath,
							trunkPublish.sha,
							trunkChangelog.sha
						);
					if ( reversedIntervening ) {
						trunkPreSha = trunkPublish.parents[ 0 ] || null;
						trunkPostSha = trunkChangelog.sha;
						interveningCommits = reversedIntervening;
						backportOrder = 'publish-then-changelog';
						pairingStatus =
							reversedIntervening.length === 0
								? 'paired-reversed-order'
								: 'paired-reversed-order-with-intervening-commits';
					} else {
						pairingStatus = 'misordered-backport';
					}
				}
			} else if ( classification === 'legacy-postpublish-changelog' ) {
				const intervening = getInterveningFirstParentCommits(
					repositoryPath,
					trunkPublish.sha,
					trunkChangelog.sha
				);
				if ( intervening ) {
					trunkPreSha = trunkPublish.parents[ 0 ] || null;
					trunkPostSha = trunkChangelog.sha;
					interveningCommits = intervening;
					backportOrder = 'publish-then-changelog';
					pairingStatus =
						intervening.length === 0
							? 'paired'
							: 'paired-with-intervening-commits';
				} else {
					pairingStatus = 'misordered-backport';
				}
			}
		} else if ( changelogCommit ) {
			pairingStatus = [
				publishTrunkMatch.status,
				changelogTrunkMatch.status,
			].includes( 'ambiguous' )
				? 'ambiguous'
				: 'unpaired';
		}

		events.push( {
			id: `publish:${ publishSha }`,
			publishSha,
			publishParentSha: commit.parents[ 0 ],
			authorDate: commit.authorDate,
			commitDate: commit.commitDate,
			subject: commit.subject,
			classification,
			inAuditScope: commit.authorDate.slice( 0, 10 ) >= auditStart,
			releaseSourceSha,
			changelogCommitSha: changelogCommit ? changelogCommit.sha : null,
			releasedChangelogSha,
			changedChangelogs,
			trunk: {
				pairingStatus,
				preSha: trunkPreSha,
				postSha: trunkPostSha,
				interveningCommits,
				backportOrder,
				publishMatch: publishTrunkMatch,
				changelogMatch: changelogTrunkMatch,
			},
			tags: groups.get( publishSha ).map( ( tag ) => ( {
				name: tag.name,
				package: tag.package,
				packageSlug: tag.packageSlug,
				version: tag.version,
				objectSha: tag.objectSha,
			} ) ),
		} );
	}

	events.sort(
		( left, right ) =>
			left.authorDate.localeCompare( right.authorDate ) ||
			left.publishSha.localeCompare( right.publishSha )
	);
	addLaneMemberships( repositoryPath, events, lanes );

	const classificationCounts = {};
	const pairingCounts = {};
	for ( const event of events ) {
		classificationCounts[ event.classification ] =
			( classificationCounts[ event.classification ] || 0 ) + 1;
		pairingCounts[ event.trunk.pairingStatus ] =
			( pairingCounts[ event.trunk.pairingStatus ] || 0 ) + 1;
	}

	return {
		schemaVersion: 1,
		baseline: {
			trunkRef,
			trunkSha: baselineSha,
			candidateRef,
			candidateSha,
			candidateMergeBaseSha,
			auditStart,
			releaseLaneSchemaVersion: releaseLanes
				? releaseLanes.schemaVersion
				: null,
		},
		summary: {
			tagRecordCount,
			stableTagCount: [ ...groups.values() ].reduce(
				( count, tags ) => count + tags.length,
				0
			),
			excludedPrereleaseTagCount: excludedPrereleases.length,
			stableEventCount: events.length,
			inScopeEventCount: events.filter( ( event ) => event.inAuditScope )
				.length,
			classificationCounts: Object.fromEntries(
				Object.entries( classificationCounts ).sort()
			),
			pairingCounts: Object.fromEntries(
				Object.entries( pairingCounts ).sort()
			),
		},
		lanes,
		exclusions: {
			prereleaseTags: excludedPrereleases.map( ( tag ) => tag.name ),
		},
		events,
	};
}

/**
 * Applies reviewed, baseline-bound resolutions to events that cannot be paired
 * by immutable author metadata alone.
 *
 * @param {Object} options                Resolution options.
 * @param {string} options.repositoryPath Repository working directory.
 * @param {Object} options.inventory      Publish inventory to update.
 * @param {Object} options.resolutions    Reviewed event resolutions.
 * @return {Object} The updated inventory.
 */
function applyEventResolutions( { repositoryPath, inventory, resolutions } ) {
	invariant(
		resolutions && typeof resolutions === 'object',
		'Event resolutions must be an object'
	);
	invariant(
		resolutions.schemaVersion === 1,
		'Event resolutions must use schema version 1'
	);
	invariant(
		resolutions.baselineSha === inventory.baseline.trunkSha,
		`Event resolutions target ${ resolutions.baselineSha }; regenerate them for baseline ${ inventory.baseline.trunkSha }`
	);
	invariant(
		resolutions.events &&
			typeof resolutions.events === 'object' &&
			! Array.isArray( resolutions.events ),
		'Event resolutions must contain an events object'
	);
	const eventsBySha = new Map(
		inventory.events.map( ( event ) => [ event.publishSha, event ] )
	);

	for ( const [ publishSha, resolution ] of Object.entries(
		resolutions.events
	).sort() ) {
		const event = eventsBySha.get( publishSha );
		invariant(
			event,
			`Event resolution references unknown publish commit ${ publishSha }`
		);
		invariant(
			event.trunk.pairingStatus === 'unpaired',
			`Event resolution for ${ publishSha } would replace ${ event.trunk.pairingStatus } pairing evidence`
		);
		invariant(
			resolution &&
				typeof resolution === 'object' &&
				typeof resolution.reason === 'string' &&
				resolution.reason.length > 0 &&
				typeof resolution.evidenceMethod === 'string' &&
				resolution.evidenceMethod.length > 0 &&
				Array.isArray( resolution.evidence ) &&
				resolution.evidence.length > 0 &&
				resolution.evidence.every(
					( item ) => typeof item === 'string' && item.length > 0
				),
			`Event resolution for ${ publishSha } lacks its reason or evidence`
		);

		if ( resolution.disposition === 'paired-backport-range' ) {
			invariant(
				SHA_PATTERN.test( resolution.trunkPreSha ) &&
					SHA_PATTERN.test( resolution.trunkPostSha ),
				`Paired event resolution for ${ publishSha } has invalid trunk SHAs`
			);
			const intervening = getInterveningFirstParentCommits(
				repositoryPath,
				resolution.trunkPreSha,
				resolution.trunkPostSha
			);
			invariant(
				intervening !== null,
				`Resolved trunk range for ${ publishSha } is not ordered on the first-parent path`
			);
			const baselineMergeBase = runGit( repositoryPath, [
				'merge-base',
				resolution.trunkPostSha,
				inventory.baseline.trunkSha,
			] ).trim();
			invariant(
				baselineMergeBase === resolution.trunkPostSha,
				`Resolved trunk post-snapshot for ${ publishSha } is outside the frozen baseline`
			);
			event.trunk.pairingStatus = 'paired-by-reviewed-resolution';
			event.trunk.preSha = resolution.trunkPreSha;
			event.trunk.postSha = resolution.trunkPostSha;
			event.trunk.backportOrder = 'reviewed-range';
			event.trunk.interveningCommits = intervening;
		} else {
			invariant(
				[
					'excluded-no-trunk-changelog-backport',
					'excluded-non-trunk-release-lane',
				].includes( resolution.disposition ),
				`Event resolution for ${ publishSha } has unknown disposition ${ resolution.disposition }`
			);
			event.auditDisposition = resolution.disposition;
		}
		event.resolution = resolution;
	}

	const unresolved = inventory.events.filter(
		( event ) =>
			event.inAuditScope &&
			[ 'prepublish-changelog', 'legacy-postpublish-changelog' ].includes(
				event.classification
			) &&
			event.trunk.pairingStatus === 'unpaired' &&
			! event.auditDisposition
	);
	invariant(
		unresolved.length === 0,
		`Event resolutions leave ${
			unresolved.length
		} changelog backport events unresolved: ${ unresolved
			.map( ( event ) => event.publishSha )
			.join( ', ' ) }`
	);

	const pairingCounts = {};
	for ( const event of inventory.events ) {
		const key = event.auditDisposition || event.trunk.pairingStatus;
		pairingCounts[ key ] = ( pairingCounts[ key ] || 0 ) + 1;
	}
	inventory.summary.pairingCounts = Object.fromEntries(
		Object.entries( pairingCounts ).sort()
	);
	inventory.eventResolutionSchemaVersion = resolutions.schemaVersion;
	return inventory;
}

/**
 * Returns a SHA-256 identity for exact Markdown bytes.
 *
 * @param {string} text Exact text.
 * @return {string} Hex digest.
 */
function hashText( text ) {
	return crypto.createHash( 'sha256' ).update( text, 'utf8' ).digest( 'hex' );
}

/**
 * Parses a changelog into version sections, subsection headings, and atomic blocks.
 * Unknown level-two headings remain subsection headings in the nearest version;
 * historical changelogs used them where modern files use level three.
 *
 * @param {string} content Changelog bytes.
 * @param {string} label   Source label for failures.
 * @param {Object} options Parser options.
 * @return {Object} Parsed changelog.
 */
function parseChangelog( content, label = 'changelog', options = {} ) {
	invariant(
		typeof content === 'string',
		`${ label } content must be a string`
	);
	invariant( content.length > 0, `${ label } is empty` );
	const lines = content.match( /.*(?:\n|$)/g ).filter( Boolean );
	const sections = [];
	const versionKeys = new Map();
	const diagnostics = [];
	let currentSection = null;
	let currentSubsection = null;

	for ( let index = 0; index < lines.length;  ) {
		const line = lines[ index ];
		const lineWithoutEnding = line.replace( /\r?\n$/, '' );
		const versionMatch = lineWithoutEnding.match( VERSION_HEADING_PATTERN );
		if ( versionMatch ) {
			const rawVersion = versionMatch[ 2 ];
			const version = [ 'unreleased', 'master' ].includes(
				rawVersion.toLowerCase()
			)
				? null
				: rawVersion.replace( /^v/, '' );
			const key = version || 'Unreleased';
			const occurrence = ( versionKeys.get( key ) || 0 ) + 1;
			versionKeys.set( key, occurrence );
			if ( occurrence > 1 ) {
				const message = `${ label } has duplicate version heading ${ key }`;
				if ( ! options.allowDuplicateVersions ) {
					throw new Error( message );
				}
				diagnostics.push( {
					type: 'duplicate-version-heading',
					version: key,
					line: index + 1,
					message,
				} );
			}
			currentSection = {
				key,
				occurrence,
				version,
				unreleased: version === null,
				headingLevel: versionMatch[ 1 ].length,
				annotation: versionMatch[ 3 ] || null,
				heading: lineWithoutEnding,
				headingLine: index + 1,
				startOffset: lines.slice( 0, index ).join( '' ).length,
				subsections: [],
				blocks: [],
			};
			sections.push( currentSection );
			currentSubsection = null;
			index++;
			continue;
		}

		const headingMatch = lineWithoutEnding.match(
			MARKDOWN_HEADING_PATTERN
		);
		if ( headingMatch && currentSection ) {
			currentSubsection = {
				level: headingMatch[ 1 ].length,
				title: headingMatch[ 2 ],
				heading: lineWithoutEnding,
				headingLine: index + 1,
			};
			currentSection.subsections.push( currentSubsection );
			index++;
			continue;
		}

		if ( ! currentSection || /^\s*$/.test( lineWithoutEnding ) ) {
			index++;
			continue;
		}

		const listMatch = lineWithoutEnding.match( LIST_ITEM_PATTERN );
		const blockStart = index;
		let blockType = 'paragraph';
		if ( listMatch ) {
			blockType = 'list-item';
			const baseIndent = listMatch[ 1 ].length;
			index++;
			while ( index < lines.length ) {
				const candidate = lines[ index ].replace( /\r?\n$/, '' );
				if (
					VERSION_HEADING_PATTERN.test( candidate ) ||
					MARKDOWN_HEADING_PATTERN.test( candidate )
				) {
					break;
				}
				const candidateList = candidate.match( LIST_ITEM_PATTERN );
				if (
					candidateList &&
					candidateList[ 1 ].length <= baseIndent
				) {
					break;
				}
				if ( /^\s*$/.test( candidate ) ) {
					let lookAhead = index + 1;
					while (
						lookAhead < lines.length &&
						/^\s*$/.test(
							lines[ lookAhead ].replace( /\r?\n$/, '' )
						)
					) {
						lookAhead++;
					}
					if ( lookAhead >= lines.length ) {
						break;
					}
					const next = lines[ lookAhead ].replace( /\r?\n$/, '' );
					const nextList = next.match( LIST_ITEM_PATTERN );
					if (
						VERSION_HEADING_PATTERN.test( next ) ||
						MARKDOWN_HEADING_PATTERN.test( next ) ||
						( nextList && nextList[ 1 ].length <= baseIndent )
					) {
						break;
					}
				}
				index++;
			}
		} else {
			index++;
			while ( index < lines.length ) {
				const candidate = lines[ index ].replace( /\r?\n$/, '' );
				if (
					/^\s*$/.test( candidate ) ||
					VERSION_HEADING_PATTERN.test( candidate ) ||
					MARKDOWN_HEADING_PATTERN.test( candidate ) ||
					LIST_ITEM_PATTERN.test( candidate )
				) {
					break;
				}
				index++;
			}
		}

		const text = lines
			.slice( blockStart, index )
			.join( '' )
			.replace( /\r?\n$/, '' );
		invariant(
			text.length > 0,
			`${ label } produced an empty block at line ${ blockStart + 1 }`
		);
		currentSection.blocks.push( {
			type: blockType,
			text,
			hash: hashText( text ),
			startLine: blockStart + 1,
			subsection: currentSubsection ? currentSubsection.title : null,
		} );
	}

	invariant(
		sections.length > 0,
		`${ label } has no recognized version headings`
	);
	for ( let index = 0; index < sections.length; index++ ) {
		sections[ index ].endOffset =
			index + 1 < sections.length
				? sections[ index + 1 ].startOffset
				: content.length;
		sections[ index ].text = content.slice(
			sections[ index ].startOffset,
			sections[ index ].endOffset
		);
	}

	return { label, hash: hashText( content ), diagnostics, sections };
}

/**
 * Reads text files from exact commits in one validated Git batch.
 *
 * @param {string}   repositoryPath Repository working directory.
 * @param {Object[]} queries        Commit and path pairs.
 * @return {Map<string,?string>} Contents keyed by `<commit>:<path>`.
 */
function readFilesAtCommits( repositoryPath, queries ) {
	const uniqueQueries = [];
	const seen = new Set();
	for ( const query of queries ) {
		invariant(
			SHA_PATTERN.test( query.commitSha ),
			`Invalid file snapshot SHA: ${ query.commitSha }`
		);
		invariant(
			typeof query.filePath === 'string' &&
				query.filePath.length > 0 &&
				! /[\r\n]/.test( query.filePath ),
			`Invalid file snapshot path: ${ query.filePath }`
		);
		const key = `${ query.commitSha }:${ query.filePath }`;
		if ( ! seen.has( key ) ) {
			seen.add( key );
			uniqueQueries.push( { ...query, key } );
		}
	}

	if ( uniqueQueries.length === 0 ) {
		return new Map();
	}

	const output = execFileSync( 'git', [ 'cat-file', '--batch' ], {
		cwd: repositoryPath,
		input: `${ uniqueQueries
			.map( ( query ) => query.key )
			.join( '\n' ) }\n`,
		maxBuffer: 512 * 1024 * 1024,
	} );
	const decoder = new TextDecoder( 'utf-8', { fatal: true } );
	const files = new Map();
	let offset = 0;

	for ( const query of uniqueQueries ) {
		const headerEnd = output.indexOf( 0x0a, offset );
		invariant(
			headerEnd !== -1,
			`Git returned a truncated blob header for ${ query.key }`
		);
		const header = output.subarray( offset, headerEnd ).toString( 'utf8' );
		offset = headerEnd + 1;
		if ( header === `${ query.key } missing` ) {
			files.set( query.key, null );
			continue;
		}

		const fields = header.split( ' ' );
		invariant(
			fields.length === 3 &&
				SHA_PATTERN.test( fields[ 0 ] ) &&
				fields[ 1 ] === 'blob' &&
				/^\d+$/.test( fields[ 2 ] ),
			`Git returned an invalid blob header for ${ query.key }: ${ header }`
		);
		const size = Number( fields[ 2 ] );
		invariant(
			Number.isSafeInteger( size ) && offset + size < output.length,
			`Git returned an invalid blob size for ${ query.key }: ${ fields[ 2 ] }`
		);
		let content;
		try {
			content = decoder.decode(
				output.subarray( offset, offset + size )
			);
		} catch {
			throw new Error( `${ query.key } is not valid UTF-8` );
		}
		offset += size;
		invariant(
			output[ offset ] === 0x0a,
			`Git returned a malformed blob terminator for ${ query.key }`
		);
		offset++;
		files.set( query.key, content );
	}

	invariant(
		offset === output.length,
		`Git returned ${
			output.length - offset
		} unexpected bytes after the blob batch`
	);
	return files;
}

/**
 * Returns exactly one version section or a structured unresolved reason.
 *
 * @param {Object} parsed  Parsed changelog.
 * @param {string} version Version to find.
 * @return {Object} Lookup result.
 */
function findVersionSection( parsed, version ) {
	const matches = parsed.sections.filter( ( section ) =>
		version === 'Unreleased'
			? section.unreleased
			: section.version === version
	);
	if ( matches.length === 1 ) {
		return { status: 'found', section: matches[ 0 ] };
	}
	return {
		status: matches.length === 0 ? 'missing' : 'ambiguous',
		count: matches.length,
	};
}

/**
 * Expands block occurrences so duplicate equal entries remain countable.
 *
 * @param {Object[]} blocks Parsed blocks.
 * @return {Object[]} Blocks with occurrence numbers.
 */
function enumerateBlocks( blocks ) {
	const counts = new Map();
	return blocks.map( ( block ) => {
		const occurrence = ( counts.get( block.hash ) || 0 ) + 1;
		counts.set( block.hash, occurrence );
		return { ...block, occurrence };
	} );
}

/**
 * Subtracts a block multiset while retaining exact duplicate occurrences.
 *
 * @param {Object[]} minuend    Blocks to inspect.
 * @param {Object[]} subtrahend Blocks to subtract.
 * @return {Object[]} Remaining block occurrences.
 */
function subtractBlocks( minuend, subtrahend ) {
	const available = new Map();
	for ( const block of subtrahend ) {
		available.set( block.hash, ( available.get( block.hash ) || 0 ) + 1 );
	}

	return enumerateBlocks( minuend ).filter( ( block ) => {
		const count = available.get( block.hash ) || 0;
		if ( count === 0 ) {
			return true;
		}
		available.set( block.hash, count - 1 );
		return false;
	} );
}

/**
 * Normalizes insignificant list-marker and whitespace differences for
 * conservative historical block identity.
 *
 * @param {string} text Atomic Markdown block.
 * @return {string} Normalized block text.
 */
function normalizeBlockText( text ) {
	return text
		.trim()
		.replace( /^(\s*[-*+]\s+)\s*/, '- ' )
		.replace( /\s+/g, ' ' );
}

/**
 * Extracts linked Gutenberg pull request numbers.
 *
 * @param {string} text Markdown text.
 * @return {string[]} Unique pull request numbers.
 */
function extractPullRequests( text ) {
	return [
		...new Set(
			[
				...text.matchAll(
					/github\.com\/WordPress\/gutenberg\/pull\/(\d+)/g
				),
			].map( ( match ) => match[ 1 ] )
		),
	];
}

/**
 * Computes token-set similarity without treating formatting as identity.
 *
 * @param {string} left  First block.
 * @param {string} right Second block.
 * @return {number} Jaccard similarity from zero through one.
 */
function tokenSimilarity( left, right ) {
	const tokenize = ( text ) =>
		new Set(
			text
				.toLowerCase()
				.replace( /https?:\/\/[^\s)]+/g, ' ' )
				.replace( /[^a-z0-9_]+/g, ' ' )
				.trim()
				.split( /\s+/ )
				.filter( Boolean )
		);
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
 * Subtracts normalized or high-confidence same-PR block occurrences. This
 * prevents carried-forward formatting variants from becoming false shipment
 * candidates while retaining distinct entries from the same pull request.
 *
 * @param {Object[]} minuend    Blocks to inspect.
 * @param {Object[]} subtrahend Blocks to subtract.
 * @return {Object[]} Remaining block occurrences.
 */
function subtractSemanticallyEquivalentBlocks( minuend, subtrahend ) {
	const available = enumerateBlocks( subtrahend ).map( ( block ) => ( {
		block,
		used: false,
	} ) );
	return enumerateBlocks( minuend ).filter( ( block ) => {
		const pullRequests = new Set( extractPullRequests( block.text ) );
		const matching = available.find( ( candidate ) => {
			if ( candidate.used ) {
				return false;
			}
			if (
				normalizeBlockText( candidate.block.text ) ===
				normalizeBlockText( block.text )
			) {
				return true;
			}
			const sharedPullRequest = extractPullRequests(
				candidate.block.text
			).some( ( pullRequest ) => pullRequests.has( pullRequest ) );
			return (
				sharedPullRequest &&
				tokenSimilarity( candidate.block.text, block.text ) >= 0.8
			);
		} );
		if ( ! matching ) {
			return true;
		}
		matching.used = true;
		return false;
	} );
}

/**
 * Returns whether a block hash occurs in a parsed section.
 *
 * @param {?Object} section Parsed section.
 * @param {string}  hash    Block hash.
 * @return {boolean} Whether it occurs.
 */
function sectionHasBlock( section, hash ) {
	return Boolean(
		section && section.blocks.some( ( block ) => block.hash === hash )
	);
}

/**
 * Creates a compact immutable reference to an atomic changelog block.
 *
 * @param {Object} block Parsed block.
 * @return {Object} Serializable block evidence.
 */
function serializeBlock( block ) {
	return {
		hash: block.hash,
		occurrence: block.occurrence,
		type: block.type,
		subsection: block.subsection,
		text: block.text,
	};
}

/**
 * Audits immediate publish/backport snapshots for every paired changelog
 * event. The function never writes files or refs.
 *
 * @param {Object} options                Audit options.
 * @param {string} options.repositoryPath Repository working directory.
 * @param {Object} options.inventory      Publish inventory.
 * @return {Object} Deterministic immediate-backport report.
 */
function auditImmediateBackports( { repositoryPath, inventory } ) {
	invariant(
		inventory && Array.isArray( inventory.events ),
		'Inventory events are required'
	);
	invariant(
		inventory.events.length > 0,
		'Immediate audit received zero events'
	);
	const findings = [];
	const unresolved = [];
	const exclusions = [];
	const preexistingDrift = [];
	const structuralDiagnostics = [];
	let eventCount = 0;
	let fileCount = 0;

	for ( const event of inventory.events ) {
		if (
			! event.inAuditScope ||
			! [
				'prepublish-changelog',
				'legacy-postpublish-changelog',
			].includes( event.classification )
		) {
			continue;
		}
		eventCount++;
		if ( event.auditDisposition ) {
			exclusions.push( {
				id: `excluded-event:${ event.publishSha }`,
				type: event.auditDisposition,
				publishSha: event.publishSha,
				reason: event.resolution.reason,
				evidenceMethod: event.resolution.evidenceMethod,
				evidence: event.resolution.evidence,
			} );
			continue;
		}

		if ( ! event.trunk.pairingStatus.startsWith( 'paired' ) ) {
			unresolved.push( {
				id: `unresolved-pairing:${ event.publishSha }`,
				type: 'unresolved-backport-pairing',
				publishSha: event.publishSha,
				pairingStatus: event.trunk.pairingStatus,
				publishMatch: event.trunk.publishMatch,
				changelogMatch: event.trunk.changelogMatch,
			} );
			continue;
		}

		const snapshotRefs = [
			event.releaseSourceSha,
			event.releasedChangelogSha,
			event.trunk.preSha,
			event.trunk.postSha,
		].filter( Boolean );
		const packageJsonPaths = event.changedChangelogs.map( ( filePath ) =>
			filePath.replace( /CHANGELOG\.md$/, 'package.json' )
		);
		const snapshotFiles = readFilesAtCommits( repositoryPath, [
			...snapshotRefs.flatMap( ( commitSha ) =>
				event.changedChangelogs.map( ( filePath ) => ( {
					commitSha,
					filePath,
				} ) )
			),
			...packageJsonPaths.map( ( filePath ) => ( {
				commitSha: event.publishSha,
				filePath,
			} ) ),
		] );
		const getSnapshot = ( commitSha, filePath ) =>
			commitSha
				? snapshotFiles.get( `${ commitSha }:${ filePath }` ) ?? null
				: null;
		const tagsByPackage = new Map(
			event.tags.map( ( tag ) => [ tag.package, tag ] )
		);
		const tagsByPath = new Map();
		const matchedTagNames = new Set();
		for ( const filePath of event.changedChangelogs ) {
			const packageJsonPath = filePath.replace(
				/CHANGELOG\.md$/,
				'package.json'
			);
			const packageJson = getSnapshot(
				event.publishSha,
				packageJsonPath
			);
			if ( packageJson === null ) {
				unresolved.push( {
					id: `unresolved-package:${ event.publishSha }:${ filePath }`,
					type: 'changed-changelog-without-package-metadata',
					publishSha: event.publishSha,
					filePath,
					packageJsonPath,
				} );
				continue;
			}
			let metadata;
			try {
				metadata = JSON.parse( packageJson );
			} catch {
				throw new Error(
					`${ packageJsonPath } at ${ event.publishSha } is not valid JSON`
				);
			}
			invariant(
				metadata &&
					typeof metadata === 'object' &&
					typeof metadata.name === 'string' &&
					metadata.name.startsWith( '@wordpress/' ),
				`${ packageJsonPath } at ${ event.publishSha } has no WordPress package name`
			);
			const tag = tagsByPackage.get( metadata.name );
			if ( tag ) {
				invariant(
					! matchedTagNames.has( tag.name ),
					`Stable tag ${ tag.name } maps to multiple changelog paths at ${ event.publishSha }`
				);
				tagsByPath.set( filePath, tag );
				matchedTagNames.add( tag.name );
			}
		}
		for ( const tag of event.tags ) {
			if ( ! matchedTagNames.has( tag.name ) ) {
				exclusions.push( {
					id: `excluded-no-finalization:${ event.publishSha }:${ tag.packageSlug }`,
					type: 'stable-tag-without-changelog-finalization',
					publishSha: event.publishSha,
					changelogCommitSha: event.changelogCommitSha,
					tag: tag.name,
					reason: 'The changelog-finalization commit did not change this tagged package changelog.',
				} );
			}
		}
		for ( const filePath of event.changedChangelogs ) {
			const tag = tagsByPath.get( filePath );
			if ( ! tag ) {
				exclusions.push( {
					id: `excluded-unpublished-changelog:${ event.publishSha }:${ filePath }`,
					type: 'changed-changelog-without-stable-tag',
					publishSha: event.publishSha,
					filePath,
					reason: 'The release-finalization commit changed this changelog, but the publish commit has no stable tag for its package.',
				} );
				continue;
			}
			fileCount++;
			const snapshots = {
				releaseSource: getSnapshot( event.releaseSourceSha, filePath ),
				published: getSnapshot( event.releasedChangelogSha, filePath ),
				trunkPre: getSnapshot( event.trunk.preSha, filePath ),
				trunkPost: getSnapshot( event.trunk.postSha, filePath ),
			};
			const missingSnapshots = Object.entries( snapshots )
				.filter( ( [ , content ] ) => content === null )
				.map( ( [ snapshotName ] ) => snapshotName );
			if ( missingSnapshots.length > 0 ) {
				if (
					missingSnapshots.length === 2 &&
					missingSnapshots.includes( 'trunkPre' ) &&
					missingSnapshots.includes( 'trunkPost' )
				) {
					exclusions.push( {
						id: `excluded-absent-package:${ event.publishSha }:${ tag.packageSlug }`,
						type: 'published-package-absent-from-trunk-backport-range',
						publishSha: event.publishSha,
						filePath,
						missingSnapshots,
						reason: 'The package changelog exists in the published tree but is absent from both trunk snapshots.',
					} );
				} else {
					unresolved.push( {
						id: `unresolved-blob:${ event.publishSha }:${ tag.packageSlug }`,
						type: 'missing-required-changelog-blob',
						publishSha: event.publishSha,
						filePath,
						missingSnapshots,
					} );
				}
				continue;
			}

			const parsed = {};
			for ( const [ snapshotName, content ] of Object.entries(
				snapshots
			) ) {
				if ( content === null ) {
					parsed[ snapshotName ] = null;
					continue;
				}
				const label = `${ event.publishSha }:${ snapshotName }:${ filePath }`;
				parsed[ snapshotName ] = parseChangelog( content, label, {
					allowDuplicateVersions: true,
				} );
				for ( const diagnostic of parsed[ snapshotName ].diagnostics ) {
					structuralDiagnostics.push( {
						...diagnostic,
						publishSha: event.publishSha,
						filePath,
						snapshot: snapshotName,
					} );
				}
			}

			const publishedLookup = findVersionSection(
				parsed.published,
				tag.version
			);
			const postLookup = findVersionSection(
				parsed.trunkPost,
				tag.version
			);
			if (
				publishedLookup.status !== 'found' ||
				postLookup.status !== 'found'
			) {
				if (
					publishedLookup.status === 'found' &&
					publishedLookup.section.blocks.length === 0 &&
					postLookup.status === 'missing'
				) {
					exclusions.push( {
						id: `excluded-empty-heading:${ event.publishSha }:${ tag.packageSlug }:${ tag.version }`,
						type: 'empty-published-heading-not-backported',
						publishSha: event.publishSha,
						filePath,
						version: tag.version,
						reason: 'The published version section is empty and the trunk backport omitted its heading.',
					} );
					continue;
				}
				if (
					publishedLookup.status === 'missing' &&
					postLookup.status === 'missing'
				) {
					exclusions.push( {
						id: `excluded-missing-heading:${ event.publishSha }:${ tag.packageSlug }:${ tag.version }`,
						type: 'tag-version-heading-absent-from-publish-and-trunk',
						publishSha: event.publishSha,
						filePath,
						version: tag.version,
						reason: 'The stable tag and the paired trunk snapshot both omit a section for the tagged version.',
					} );
					continue;
				}
				unresolved.push( {
					id: `unresolved-section:${ event.publishSha }:${ tag.packageSlug }:${ tag.version }`,
					type: 'missing-or-ambiguous-version-section',
					publishSha: event.publishSha,
					filePath,
					version: tag.version,
					publishedStatus: publishedLookup,
					trunkPostStatus: postLookup,
				} );
				continue;
			}

			const publishedSection = publishedLookup.section;
			const postSection = postLookup.section;
			if ( publishedSection.text === postSection.text ) {
				continue;
			}

			const preUnreleased = parsed.trunkPre
				? parsed.trunkPre.sections.find(
						( section ) => section.unreleased
				  ) || null
				: null;
			const postUnreleased =
				parsed.trunkPost.sections.find(
					( section ) => section.unreleased
				) || null;
			const preLookup = findVersionSection(
				parsed.trunkPre,
				tag.version
			);
			if ( preLookup.status === 'ambiguous' ) {
				unresolved.push( {
					id: `unresolved-pre-section:${ event.publishSha }:${ tag.packageSlug }:${ tag.version }`,
					type: 'ambiguous-pre-backport-version-section',
					publishSha: event.publishSha,
					filePath,
					version: tag.version,
					preStatus: preLookup,
				} );
				continue;
			}
			const preSection =
				preLookup.status === 'found' ? preLookup.section : null;
			const rawExtraBlocks = subtractBlocks(
				postSection.blocks,
				publishedSection.blocks
			);
			const rawMissingBlocks = subtractBlocks(
				publishedSection.blocks,
				postSection.blocks
			);
			const preexistingExtraBlocks = preSection
				? subtractBlocks( preSection.blocks, publishedSection.blocks )
				: [];
			const preexistingMissingBlocks = preSection
				? subtractBlocks( publishedSection.blocks, preSection.blocks )
				: [];
			const extraBlocks = subtractBlocks(
				rawExtraBlocks,
				preexistingExtraBlocks
			);
			const missingBlocks = subtractBlocks(
				rawMissingBlocks,
				preexistingMissingBlocks
			);
			for ( const block of subtractBlocks(
				rawExtraBlocks,
				extraBlocks
			) ) {
				preexistingDrift.push( {
					id: `preexisting:${ event.publishSha }:${ tag.packageSlug }:${ tag.version }:extra:${ block.hash }:${ block.occurrence }`,
					type: 'preexisting-extra-released-entry',
					package: tag.package,
					filePath,
					version: tag.version,
					publishSha: event.publishSha,
					trunkPreSha: event.trunk.preSha,
					block: serializeBlock( block ),
				} );
			}
			for ( const block of subtractBlocks(
				rawMissingBlocks,
				missingBlocks
			) ) {
				preexistingDrift.push( {
					id: `preexisting:${ event.publishSha }:${ tag.packageSlug }:${ tag.version }:missing:${ block.hash }:${ block.occurrence }`,
					type: 'preexisting-missing-released-entry',
					package: tag.package,
					filePath,
					version: tag.version,
					publishSha: event.publishSha,
					trunkPreSha: event.trunk.preSha,
					block: serializeBlock( block ),
				} );
			}

			for ( const block of extraBlocks ) {
				const source = sectionHasBlock( preUnreleased, block.hash )
					? 'trunk-pre-unreleased'
					: 'unknown';
				findings.push( {
					id: `immediate:${ event.publishSha }:${ tag.packageSlug }:${ tag.version }:extra:${ block.hash }:${ block.occurrence }`,
					type:
						source === 'trunk-pre-unreleased'
							? 'trunk-entry-misattributed-to-release'
							: 'unexplained-released-entry',
					package: tag.package,
					filePath,
					wrongVersion: tag.version,
					publishSha: event.publishSha,
					trunkPreSha: event.trunk.preSha,
					trunkPostSha: event.trunk.postSha,
					source,
					block: serializeBlock( block ),
				} );
			}

			for ( const block of missingBlocks ) {
				const destination = sectionHasBlock(
					postUnreleased,
					block.hash
				)
					? 'trunk-post-unreleased'
					: 'unknown';
				findings.push( {
					id: `immediate:${ event.publishSha }:${ tag.packageSlug }:${ tag.version }:missing:${ block.hash }:${ block.occurrence }`,
					type:
						destination === 'trunk-post-unreleased'
							? 'published-entry-displaced-to-unreleased'
							: 'published-entry-missing-after-backport',
					package: tag.package,
					filePath,
					wrongVersion: tag.version,
					publishSha: event.publishSha,
					trunkPreSha: event.trunk.preSha,
					trunkPostSha: event.trunk.postSha,
					destination,
					block: serializeBlock( block ),
				} );
			}

			if (
				rawExtraBlocks.length === 0 &&
				rawMissingBlocks.length === 0 &&
				( ! preSection || preSection.text !== postSection.text )
			) {
				findings.push( {
					id: `immediate:${ event.publishSha }:${ tag.packageSlug }:${ tag.version }:structure`,
					type: 'released-section-byte-drift',
					package: tag.package,
					filePath,
					wrongVersion: tag.version,
					publishSha: event.publishSha,
					trunkPreSha: event.trunk.preSha,
					trunkPostSha: event.trunk.postSha,
					publishedSectionHash: hashText( publishedSection.text ),
					trunkPostSectionHash: hashText( postSection.text ),
				} );
			}
		}
	}

	invariant(
		eventCount > 0,
		'Immediate audit covered zero changelog events'
	);
	invariant( fileCount > 0, 'Immediate audit covered zero changelog files' );
	findings.sort( ( left, right ) => left.id.localeCompare( right.id ) );
	unresolved.sort( ( left, right ) => left.id.localeCompare( right.id ) );
	exclusions.sort( ( left, right ) => left.id.localeCompare( right.id ) );
	preexistingDrift.sort( ( left, right ) =>
		left.id.localeCompare( right.id )
	);
	structuralDiagnostics.sort( ( left, right ) =>
		`${ left.publishSha }:${ left.filePath }:${ left.snapshot }:${ left.line }`.localeCompare(
			`${ right.publishSha }:${ right.filePath }:${ right.snapshot }:${ right.line }`
		)
	);

	return {
		schemaVersion: 1,
		coverage: { eventCount, fileCount },
		summary: {
			findingCount: findings.length,
			unresolvedCount: unresolved.length,
			exclusionCount: exclusions.length,
			preexistingDriftCount: preexistingDrift.length,
			structuralDiagnosticCount: structuralDiagnostics.length,
		},
		findings,
		unresolved,
		exclusions,
		preexistingDrift,
		structuralDiagnostics,
	};
}

/**
 * Finds the exact next event on a release lane that tags one package.
 *
 * @param {Map<string,Object>} eventsBySha Events keyed by publish SHA.
 * @param {Object}             event       Current event.
 * @param {string}             laneId      Stable release lane.
 * @param {string}             packageName Package name.
 * @return {?Object} Next event that tags the package.
 */
function findNextTaggedEvent( eventsBySha, event, laneId, packageName ) {
	const visited = new Set( [ event.publishSha ] );
	let current = event;
	while ( true ) {
		const lane = current.lanes.find( ( item ) => item.id === laneId );
		if ( ! lane || ! lane.nextEventSha ) {
			return null;
		}
		invariant(
			! visited.has( lane.nextEventSha ),
			`Release lane ${ laneId } contains an event cycle at ${ lane.nextEventSha }`
		);
		visited.add( lane.nextEventSha );
		current = eventsBySha.get( lane.nextEventSha );
		invariant(
			current,
			`Release lane ${ laneId } references unknown event ${ lane.nextEventSha }`
		);
		if ( current.tags.some( ( tag ) => tag.package === packageName ) ) {
			return current;
		}
	}
}

/**
 * Classifies the stable publication lane without flattening standalone package
 * releases into the regular wp/latest batch sequence.
 *
 * @param {Object} event Stable publish event.
 * @return {string} Release kind.
 */
function getReleaseKind( event ) {
	if ( event.primaryLaneId !== 'wp/latest' ) {
		return 'wordpress-patch-line';
	}
	return event.tags.length === 1
		? 'standalone-wp-latest'
		: 'regular-wp-latest';
}

/**
 * Audits each published version section against the exact next release-cut
 * snapshot on the event's primary stable release lane.
 *
 * @param {Object} options                Audit options.
 * @param {string} options.repositoryPath Repository working directory.
 * @param {Object} options.inventory      Resolved publish inventory.
 * @return {Object} Deterministic pre-next-release report.
 */
function auditPreNextReleaseCuts( { repositoryPath, inventory } ) {
	invariant(
		inventory && Array.isArray( inventory.events ),
		'Inventory events are required'
	);
	invariant(
		inventory.events.length > 0,
		'Pre-next-release audit received zero events'
	);
	const eventsBySha = new Map(
		inventory.events.map( ( event ) => [ event.publishSha, event ] )
	);
	const mutations = [];
	const unresolved = [];
	const exclusions = [];
	const structuralDiagnostics = [];
	let eventCount = 0;
	let fileCount = 0;

	for ( const event of inventory.events ) {
		if (
			! event.inAuditScope ||
			! [
				'prepublish-changelog',
				'legacy-postpublish-changelog',
			].includes( event.classification )
		) {
			continue;
		}
		eventCount++;
		if (
			event.auditDisposition === 'excluded-no-trunk-changelog-backport'
		) {
			exclusions.push( {
				id: `excluded-event:${ event.publishSha }`,
				type: event.auditDisposition,
				publishSha: event.publishSha,
				reason: event.resolution.reason,
				evidenceMethod: event.resolution.evidenceMethod,
				evidence: event.resolution.evidence,
			} );
			continue;
		}
		if ( ! event.primaryLaneId ) {
			exclusions.push( {
				id: `excluded-no-primary-lane:${ event.publishSha }`,
				type: 'no-unambiguous-primary-release-lane',
				publishSha: event.publishSha,
				lanes: event.lanes.map( ( lane ) => lane.id ),
				reason: 'The tagged commit is not on one unambiguous current stable release lane.',
			} );
			continue;
		}
		const primaryLane = event.lanes.find(
			( lane ) => lane.id === event.primaryLaneId
		);
		invariant(
			primaryLane,
			`Event ${ event.publishSha } is missing its primary lane ${ event.primaryLaneId }`
		);
		const packageJsonPaths = event.changedChangelogs.map( ( filePath ) =>
			filePath.replace( /CHANGELOG\.md$/, 'package.json' )
		);
		const packageFiles = readFilesAtCommits(
			repositoryPath,
			packageJsonPaths.map( ( filePath ) => ( {
				commitSha: event.publishSha,
				filePath,
			} ) )
		);
		const tagsByPackage = new Map(
			event.tags.map( ( tag ) => [ tag.package, tag ] )
		);
		const auditableFiles = [];

		for ( const filePath of event.changedChangelogs ) {
			const packageJsonPath = filePath.replace(
				/CHANGELOG\.md$/,
				'package.json'
			);
			const packageJson =
				packageFiles.get(
					`${ event.publishSha }:${ packageJsonPath }`
				) ?? null;
			if ( packageJson === null ) {
				unresolved.push( {
					id: `unresolved-package:${ event.publishSha }:${ filePath }`,
					type: 'changed-changelog-without-package-metadata',
					publishSha: event.publishSha,
					filePath,
				} );
				continue;
			}
			let metadata;
			try {
				metadata = JSON.parse( packageJson );
			} catch {
				throw new Error(
					`${ packageJsonPath } at ${ event.publishSha } is not valid JSON`
				);
			}
			const tag = tagsByPackage.get( metadata.name );
			if ( ! tag ) {
				exclusions.push( {
					id: `excluded-unpublished-changelog:${ event.publishSha }:${ filePath }`,
					type: 'changed-changelog-without-stable-tag',
					publishSha: event.publishSha,
					filePath,
					reason: 'The release-finalization commit changed this changelog, but the publish commit has no stable tag for its package.',
				} );
				continue;
			}
			const nextEvent = findNextTaggedEvent(
				eventsBySha,
				event,
				event.primaryLaneId,
				tag.package
			);
			if ( ! nextEvent ) {
				exclusions.push( {
					id: `excluded-no-next-cut:${ event.publishSha }:${ tag.packageSlug }`,
					type: 'no-next-stable-package-release-cut',
					publishSha: event.publishSha,
					filePath,
					package: tag.package,
					lane: event.primaryLaneId,
					reason: 'This is the last inventoried stable publication for the package on its release lane.',
				} );
				continue;
			}
			const nextTag = nextEvent.tags.find(
				( candidateTag ) => candidateTag.package === tag.package
			);
			invariant(
				nextTag,
				`Next event ${ nextEvent.publishSha } does not tag ${ tag.package }`
			);
			const nextReleaseCutSha =
				nextEvent.releaseSourceSha || nextEvent.publishParentSha;
			invariant(
				SHA_PATTERN.test( nextReleaseCutSha ),
				`Next release ${ nextEvent.publishSha } has no valid release-cut snapshot`
			);
			auditableFiles.push( {
				filePath,
				tag,
				nextEvent,
				nextTag,
				nextReleaseCutSha,
			} );
		}

		const files = readFilesAtCommits(
			repositoryPath,
			auditableFiles.flatMap( ( item ) => [
				{ commitSha: event.publishSha, filePath: item.filePath },
				{
					commitSha: item.nextReleaseCutSha,
					filePath: item.filePath,
				},
			] )
		);
		for ( const {
			filePath,
			tag,
			nextEvent,
			nextTag,
			nextReleaseCutSha,
		} of auditableFiles ) {
			fileCount++;
			const published =
				files.get( `${ event.publishSha }:${ filePath }` ) ?? null;
			const nextCut =
				files.get( `${ nextReleaseCutSha }:${ filePath }` ) ?? null;
			if ( published === null || nextCut === null ) {
				exclusions.push( {
					id: `excluded-missing-blob:${ event.publishSha }:${ tag.packageSlug }`,
					type: 'package-changelog-absent-from-release-cut',
					publishSha: event.publishSha,
					nextEventSha: nextEvent.publishSha,
					filePath,
					missingPublished: published === null,
					missingNextCut: nextCut === null,
					reason: 'The package changelog is absent from one of the release-lane snapshots.',
				} );
				continue;
			}

			const parsedPublished = parseChangelog(
				published,
				`${ event.publishSha }:published:${ filePath }`,
				{ allowDuplicateVersions: true }
			);
			const parsedNextCut = parseChangelog(
				nextCut,
				`${ nextReleaseCutSha }:nextCut:${ filePath }`,
				{ allowDuplicateVersions: true }
			);
			for ( const [ snapshot, parsed ] of [
				[ 'published', parsedPublished ],
				[ 'nextCut', parsedNextCut ],
			] ) {
				for ( const diagnostic of parsed.diagnostics ) {
					structuralDiagnostics.push( {
						...diagnostic,
						publishSha: event.publishSha,
						nextEventSha: nextEvent.publishSha,
						filePath,
						snapshot,
					} );
				}
			}
			const publishedLookup = findVersionSection(
				parsedPublished,
				tag.version
			);
			const nextLookup = findVersionSection( parsedNextCut, tag.version );
			if ( publishedLookup.status !== 'found' ) {
				exclusions.push( {
					id: `excluded-published-heading:${ event.publishSha }:${ tag.packageSlug }:${ tag.version }`,
					type: 'tag-version-heading-absent-from-published-snapshot',
					publishSha: event.publishSha,
					filePath,
					version: tag.version,
					reason: 'The stable tag does not contain a unique changelog section for its tagged version.',
				} );
				continue;
			}
			if ( nextLookup.status !== 'found' ) {
				unresolved.push( {
					id: `unresolved-next-heading:${ event.publishSha }:${ tag.packageSlug }:${ tag.version }`,
					type: 'published-version-heading-missing-at-next-cut',
					publishSha: event.publishSha,
					nextEventSha: nextEvent.publishSha,
					nextReleaseCutSha,
					filePath,
					package: tag.package,
					version: tag.version,
					intendedVersion: nextTag.version,
					precedingTag: tag.name,
					destinationTag: nextTag.name,
					nextStatus: nextLookup,
				} );
				continue;
			}
			const publishedSection = publishedLookup.section;
			const nextSection = nextLookup.section;
			if ( publishedSection.text === nextSection.text ) {
				continue;
			}
			const addedBlocks = subtractBlocks(
				nextSection.blocks,
				publishedSection.blocks
			);
			const removedBlocks = subtractBlocks(
				publishedSection.blocks,
				nextSection.blocks
			);
			for ( const block of addedBlocks ) {
				mutations.push( {
					id: `pre-next:${ event.publishSha }:${ tag.packageSlug }:${ tag.version }:added:${ block.hash }:${ block.occurrence }`,
					type: 'block-added-before-next-release-cut',
					package: tag.package,
					filePath,
					version: tag.version,
					intendedVersion: nextTag.version,
					publishSha: event.publishSha,
					nextEventSha: nextEvent.publishSha,
					nextReleaseCutSha,
					lane: event.primaryLaneId,
					releaseKind: getReleaseKind( event ),
					precedingTag: tag.name,
					destinationTag: nextTag.name,
					block: serializeBlock( block ),
				} );
			}
			for ( const block of removedBlocks ) {
				mutations.push( {
					id: `pre-next:${ event.publishSha }:${ tag.packageSlug }:${ tag.version }:removed:${ block.hash }:${ block.occurrence }`,
					type: 'block-removed-before-next-release-cut',
					package: tag.package,
					filePath,
					version: tag.version,
					intendedVersion: nextTag.version,
					publishSha: event.publishSha,
					nextEventSha: nextEvent.publishSha,
					nextReleaseCutSha,
					lane: event.primaryLaneId,
					releaseKind: getReleaseKind( event ),
					precedingTag: tag.name,
					destinationTag: nextTag.name,
					block: serializeBlock( block ),
				} );
			}
			if ( addedBlocks.length === 0 && removedBlocks.length === 0 ) {
				mutations.push( {
					id: `pre-next:${ event.publishSha }:${ tag.packageSlug }:${ tag.version }:structure`,
					type: 'released-section-byte-drift-before-next-cut',
					package: tag.package,
					filePath,
					version: tag.version,
					intendedVersion: nextTag.version,
					publishSha: event.publishSha,
					nextEventSha: nextEvent.publishSha,
					nextReleaseCutSha,
					lane: event.primaryLaneId,
					releaseKind: getReleaseKind( event ),
					precedingTag: tag.name,
					destinationTag: nextTag.name,
					publishedSectionHash: hashText( publishedSection.text ),
					nextSectionHash: hashText( nextSection.text ),
				} );
			}
		}
	}

	invariant(
		eventCount > 0,
		'Pre-next-release audit covered zero changelog events'
	);
	invariant(
		fileCount > 0,
		'Pre-next-release audit covered zero changelog files'
	);
	mutations.sort( ( left, right ) => left.id.localeCompare( right.id ) );
	unresolved.sort( ( left, right ) => left.id.localeCompare( right.id ) );
	exclusions.sort( ( left, right ) => left.id.localeCompare( right.id ) );
	structuralDiagnostics.sort( ( left, right ) =>
		left.message.localeCompare( right.message )
	);

	return {
		schemaVersion: 1,
		coverage: { eventCount, fileCount },
		summary: {
			mutationCount: mutations.length,
			unresolvedCount: unresolved.length,
			exclusionCount: exclusions.length,
			structuralDiagnosticCount: structuralDiagnostics.length,
		},
		mutations,
		unresolved,
		exclusions,
		structuralDiagnostics,
	};
}

/**
 * Audits every immutable stable package tag's own released section against the
 * same version section in the frozen trunk. Unlike the pre-next-cut sweep,
 * this catches released-section mutations introduced arbitrarily later.
 *
 * Stable tags whose own version heading is absent remain explicit exclusions;
 * historical optional patch updates require a separate whole-tag/tree adapter.
 *
 * @param {Object} options                Audit options.
 * @param {string} options.repositoryPath Repository working directory.
 * @param {Object} options.inventory      Frozen stable publish inventory.
 * @return {Object} Deterministic frozen-section audit.
 */
function auditFrozenReleasedSections( { repositoryPath, inventory } ) {
	invariant(
		inventory && inventory.baseline && Array.isArray( inventory.events ),
		'Frozen-section audit requires an inventory'
	);
	invariant(
		inventory.events.length > 0,
		'Frozen-section audit received zero events'
	);
	const filePaths = [
		...new Set(
			inventory.events.flatMap( ( event ) =>
				event.tags.map(
					( tag ) => `packages/${ tag.packageSlug }/CHANGELOG.md`
				)
			)
		),
	].sort();
	const packageByPath = new Map();
	for ( const event of inventory.events ) {
		for ( const tag of event.tags ) {
			packageByPath.set(
				`packages/${ tag.packageSlug }/CHANGELOG.md`,
				tag.package
			);
		}
	}
	invariant(
		filePaths.length > 0,
		'Frozen-section audit discovered zero package changelog paths'
	);
	const baselineFiles = readFilesAtCommits(
		repositoryPath,
		filePaths.map( ( filePath ) => ( {
			commitSha: inventory.baseline.trunkSha,
			filePath,
		} ) )
	);
	const parsedBaseline = new Map();
	for ( const filePath of filePaths ) {
		const content = baselineFiles.get(
			`${ inventory.baseline.trunkSha }:${ filePath }`
		);
		parsedBaseline.set(
			filePath,
			content === null || content === undefined
				? null
				: parseChangelog(
						content,
						`${ inventory.baseline.trunkSha }:${ filePath }`,
						{ allowDuplicateVersions: true }
				  )
		);
	}
	const currentRecords = [];
	const exactIndex = new Map();
	const normalizedIndex = new Map();
	const pullRequestIndex = new Map();
	const currentRecordsByFileVersion = new Map();
	const addToIndex = ( index, key, record ) => {
		if ( ! index.has( key ) ) {
			index.set( key, [] );
		}
		index.get( key ).push( record );
	};
	for ( const [ filePath, parsed ] of parsedBaseline ) {
		if ( parsed === null ) {
			continue;
		}
		for ( const section of parsed.sections.filter(
			( candidate ) => ! candidate.unreleased && candidate.version
		) ) {
			for ( const block of enumerateBlocks( section.blocks ) ) {
				const record = {
					id: `frozen-attribution:${ filePath }:${ section.version }:${ block.hash }:${ block.occurrence }`,
					filePath,
					version: section.version,
					subsection: block.subsection,
					block: serializeBlock( block ),
				};
				currentRecords.push( record );
				addToIndex(
					currentRecordsByFileVersion,
					`${ filePath }:${ section.version }`,
					record
				);
				addToIndex(
					exactIndex,
					`${ filePath }:${ block.hash }`,
					record
				);
				addToIndex(
					normalizedIndex,
					`${ filePath }:${ normalizeBlockText( block.text ) }`,
					record
				);
				for ( const pullRequest of extractPullRequests( block.text ) ) {
					addToIndex(
						pullRequestIndex,
						`${ filePath }:${ pullRequest }`,
						record
					);
				}
			}
		}
	}
	const tagMatchesByRecord = new Map();
	const tagTimelineByPackage = new Map();
	for ( const event of inventory.events ) {
		for ( const tag of event.tags ) {
			if ( ! tagTimelineByPackage.has( tag.package ) ) {
				tagTimelineByPackage.set( tag.package, [] );
			}
			tagTimelineByPackage.get( tag.package ).push( {
				publishSha: event.publishSha,
				authorDate: event.authorDate,
				primaryLaneId: event.primaryLaneId,
				classification: event.classification,
				tag,
			} );
		}
	}
	for ( const timeline of tagTimelineByPackage.values() ) {
		timeline.sort(
			( left, right ) =>
				left.authorDate.localeCompare( right.authorDate ) ||
				left.publishSha.localeCompare( right.publishSha )
		);
	}
	const recordTagMatch = (
		record,
		event,
		tag,
		section,
		block,
		score,
		method
	) => {
		if ( ! tagMatchesByRecord.has( record.id ) ) {
			tagMatchesByRecord.set( record.id, new Map() );
		}
		const matches = tagMatchesByRecord.get( record.id );
		const existing = matches.get( event.publishSha );
		const candidate = {
			publishSha: event.publishSha,
			authorDate: event.authorDate,
			primaryLaneId: event.primaryLaneId,
			classification: event.classification,
			tag: tag.name,
			tagVersion: tag.version,
			observedSection: section.key,
			identityMethod: method,
			tokenSimilarity: Number(
				tokenSimilarity( record.block.text, block.text ).toFixed( 6 )
			),
			score,
			matchedBlock: serializeBlock( { ...block, occurrence: 1 } ),
			ambiguousTagBlock: false,
		};
		if ( ! existing || candidate.score > existing.score ) {
			matches.set( event.publishSha, candidate );
		} else if (
			candidate.score === existing.score &&
			candidate.matchedBlock.hash !== existing.matchedBlock.hash
		) {
			existing.ambiguousTagBlock = true;
		}
	};

	const describeReleaseLane = ( event, tag ) => {
		if ( ! event.primaryLaneId ) {
			return {
				key: null,
				updateKeys: [],
				releaseKind: 'historical-stable-lane-unresolved',
			};
		}
		if ( event.primaryLaneId !== 'wp/latest' ) {
			const key = `${ tag.package }:${ event.primaryLaneId }`;
			return {
				key,
				updateKeys: [ key ],
				releaseKind: 'wordpress-patch-line',
			};
		}
		const parsedVersion = semver.parse( tag.version );
		if ( event.tags.length === 1 && parsedVersion ) {
			const key = `${ tag.package }:standalone:${ parsedVersion.major }.${ parsedVersion.minor }`;
			return {
				key,
				updateKeys: [ key ],
				releaseKind: 'standalone-wp-latest',
			};
		}
		const regularKey = `${ tag.package }:regular-wp-latest`;
		const updateKeys = [ regularKey ];
		if ( parsedVersion ) {
			updateKeys.push(
				`${ tag.package }:standalone:${ parsedVersion.major }.${ parsedVersion.minor }`
			);
		}
		return {
			key: regularKey,
			updateKeys,
			releaseKind: 'regular-wp-latest',
		};
	};
	const mutations = [];
	const unreleasedShipmentCandidates = [];
	const exclusions = [];
	const structuralDiagnostics = [];
	const lastPublishedByLane = new Map();
	let eventCount = 0;
	let fileCount = 0;
	const orderedEvents = [ ...inventory.events ].sort(
		( left, right ) =>
			left.authorDate.localeCompare( right.authorDate ) ||
			left.publishSha.localeCompare( right.publishSha )
	);
	for ( const event of orderedEvents ) {
		if ( event.tags.length === 0 ) {
			continue;
		}
		eventCount++;
		const queries = event.tags.map( ( tag ) => ( {
			commitSha: event.publishSha,
			filePath: `packages/${ tag.packageSlug }/CHANGELOG.md`,
		} ) );
		const publishedFiles = readFilesAtCommits( repositoryPath, queries );
		for ( const tag of event.tags ) {
			fileCount++;
			const filePath = `packages/${ tag.packageSlug }/CHANGELOG.md`;
			const baseline = parsedBaseline.get( filePath );
			if ( baseline === null ) {
				exclusions.push( {
					id: `frozen-excluded-removed-package:${ event.publishSha }:${ tag.packageSlug }:${ tag.version }`,
					type: 'package-changelog-absent-from-frozen-baseline',
					package: tag.package,
					filePath,
					version: tag.version,
					publishSha: event.publishSha,
					tag: tag.name,
				} );
				continue;
			}
			const publishedContent = publishedFiles.get(
				`${ event.publishSha }:${ filePath }`
			);
			if ( publishedContent === null || publishedContent === undefined ) {
				exclusions.push( {
					id: `frozen-excluded-missing-tag-changelog:${ event.publishSha }:${ tag.packageSlug }:${ tag.version }`,
					type: 'package-changelog-absent-from-published-tag',
					package: tag.package,
					filePath,
					version: tag.version,
					publishSha: event.publishSha,
					tag: tag.name,
				} );
				continue;
			}
			let published;
			try {
				published = parseChangelog(
					publishedContent,
					`${ event.publishSha }:${ filePath }`,
					{ allowDuplicateVersions: true }
				);
			} catch ( error ) {
				exclusions.push( {
					id: `frozen-excluded-unparseable-tag-changelog:${ event.publishSha }:${ tag.packageSlug }:${ tag.version }`,
					type: 'published-tag-changelog-has-no-recognized-version-sections',
					package: tag.package,
					filePath,
					version: tag.version,
					publishSha: event.publishSha,
					tag: tag.name,
					reason:
						error instanceof Error
							? error.message
							: String( error ),
				} );
				continue;
			}
			for ( const diagnostic of published.diagnostics ) {
				structuralDiagnostics.push( {
					...diagnostic,
					package: tag.package,
					filePath,
					version: tag.version,
					publishSha: event.publishSha,
					snapshot: 'published',
				} );
			}
			const lane = describeReleaseLane( event, tag );
			const precedingLaneSnapshot =
				lastPublishedByLane.get( lane.key ) || null;
			for ( const section of published.sections ) {
				for ( const block of enumerateBlocks( section.blocks ) ) {
					const candidateRecords = new Map();
					for ( const record of exactIndex.get(
						`${ filePath }:${ block.hash }`
					) || [] ) {
						if ( record.block.occurrence !== block.occurrence ) {
							continue;
						}
						candidateRecords.set( record.id, {
							record,
							score: 4,
							method: 'exact-block-bytes',
						} );
					}
					for ( const record of normalizedIndex.get(
						`${ filePath }:${ normalizeBlockText( block.text ) }`
					) || [] ) {
						if ( record.block.occurrence !== block.occurrence ) {
							continue;
						}
						if ( ! candidateRecords.has( record.id ) ) {
							candidateRecords.set( record.id, {
								record,
								score: 3,
								method: 'normalized-whitespace-bytes',
							} );
						}
					}
					for ( const pullRequest of extractPullRequests(
						block.text
					) ) {
						for ( const record of pullRequestIndex.get(
							`${ filePath }:${ pullRequest }`
						) || [] ) {
							if (
								record.block.hash === block.hash &&
								record.block.occurrence !== block.occurrence
							) {
								continue;
							}
							const similarity = tokenSimilarity(
								record.block.text,
								block.text
							);
							if ( similarity < 0.5 ) {
								continue;
							}
							const existing = candidateRecords.get( record.id );
							const score = 2 + similarity;
							if ( ! existing || score > existing.score ) {
								candidateRecords.set( record.id, {
									record,
									score,
									method: 'pull-request-and-token-similarity',
								} );
							}
						}
					}
					for ( const candidate of candidateRecords.values() ) {
						recordTagMatch(
							candidate.record,
							event,
							tag,
							section,
							block,
							candidate.score,
							candidate.method
						);
					}
				}
			}
			const publishedLookup = findVersionSection(
				published,
				tag.version
			);
			const publishedOwnContentSection =
				publishedLookup.status === 'found'
					? publishedLookup.section
					: null;
			if ( publishedOwnContentSection ) {
				for ( const record of currentRecordsByFileVersion.get(
					`${ filePath }:${ tag.version }`
				) || [] ) {
					if (
						tagMatchesByRecord
							.get( record.id )
							?.has( event.publishSha )
					) {
						continue;
					}
					const ranked = publishedOwnContentSection.blocks
						.map( ( block ) => ( {
							block,
							similarity: tokenSimilarity(
								record.block.text,
								block.text
							),
						} ) )
						.sort(
							( left, right ) =>
								right.similarity - left.similarity
						);
					const best = ranked[ 0 ];
					const runnerUp = ranked[ 1 ];
					if (
						best &&
						best.similarity >= 0.8 &&
						( ! runnerUp ||
							best.similarity - runnerUp.similarity >= 0.1 )
					) {
						recordTagMatch(
							record,
							event,
							tag,
							publishedOwnContentSection,
							best.block,
							1 + best.similarity,
							'own-version-unique-token-similarity'
						);
					}
				}
			}
			const publishedUnreleasedLookup = findVersionSection(
				published,
				'Unreleased'
			);
			if (
				publishedLookup.status !== 'found' &&
				lane.key &&
				lane.releaseKind !== 'regular-wp-latest' &&
				precedingLaneSnapshot &&
				publishedUnreleasedLookup.status === 'found'
			) {
				const precedingUnreleasedLookup = findVersionSection(
					precedingLaneSnapshot.parsed,
					'Unreleased'
				);
				if ( precedingUnreleasedLookup.status === 'found' ) {
					for ( const block of subtractSemanticallyEquivalentBlocks(
						publishedUnreleasedLookup.section.blocks,
						precedingUnreleasedLookup.section.blocks
					) ) {
						unreleasedShipmentCandidates.push( {
							id: `unreleased-shipment:${ event.publishSha }:${ tag.packageSlug }:${ tag.version }:${ block.hash }:${ block.occurrence }`,
							type: 'new-unreleased-entry-in-stable-tag-without-own-version-heading',
							package: tag.package,
							filePath,
							version: tag.version,
							publishSha: event.publishSha,
							tag: tag.name,
							primaryLaneId: event.primaryLaneId,
							lane: lane.key,
							releaseKind: lane.releaseKind,
							block: serializeBlock( block ),
							precedingTag: {
								name: precedingLaneSnapshot.tag.name,
								version: precedingLaneSnapshot.tag.version,
								publishSha:
									precedingLaneSnapshot.event.publishSha,
							},
						} );
					}
				}
			}
			for ( const key of lane.updateKeys ) {
				lastPublishedByLane.set( key, {
					event,
					tag,
					parsed: published,
				} );
			}
			if ( publishedLookup.status !== 'found' ) {
				exclusions.push( {
					id: `frozen-excluded-published-heading:${ event.publishSha }:${ tag.packageSlug }:${ tag.version }`,
					type: 'tag-version-heading-absent-from-published-snapshot',
					package: tag.package,
					filePath,
					version: tag.version,
					publishSha: event.publishSha,
					tag: tag.name,
					publishedStatus: publishedLookup.status,
					reason: 'The stable tag does not contain a unique section for its own version; historical format or optional patch handling is required.',
				} );
				continue;
			}
			const baselineLookup = findVersionSection( baseline, tag.version );
			const publishedSection = publishedLookup.section;
			const baselineSection =
				baselineLookup.status === 'found'
					? baselineLookup.section
					: null;
			const addedBlocks = baselineSection
				? subtractBlocks(
						baselineSection.blocks,
						publishedSection.blocks
				  )
				: [];
			const removedBlocks = subtractBlocks(
				publishedSection.blocks,
				baselineSection ? baselineSection.blocks : []
			);
			for ( const block of addedBlocks ) {
				mutations.push( {
					id: `frozen:${ event.publishSha }:${ tag.packageSlug }:${ tag.version }:added:${ block.hash }:${ block.occurrence }`,
					type: 'block-added-after-published-tag',
					package: tag.package,
					filePath,
					version: tag.version,
					publishSha: event.publishSha,
					tag: tag.name,
					block: serializeBlock( block ),
				} );
			}
			for ( const block of removedBlocks ) {
				mutations.push( {
					id: `frozen:${ event.publishSha }:${ tag.packageSlug }:${ tag.version }:removed:${ block.hash }:${ block.occurrence }`,
					type: 'block-removed-after-published-tag',
					package: tag.package,
					filePath,
					version: tag.version,
					publishSha: event.publishSha,
					tag: tag.name,
					block: serializeBlock( block ),
				} );
			}
			if ( baselineLookup.status !== 'found' ) {
				mutations.push( {
					id: `frozen:${ event.publishSha }:${ tag.packageSlug }:${ tag.version }:heading`,
					type: 'published-version-heading-missing-from-frozen-baseline',
					package: tag.package,
					filePath,
					version: tag.version,
					publishSha: event.publishSha,
					tag: tag.name,
					baselineStatus: baselineLookup.status,
					publishedHeading: publishedSection.heading,
					publishedSectionHash: hashText( publishedSection.text ),
				} );
			} else if (
				addedBlocks.length === 0 &&
				removedBlocks.length === 0 &&
				publishedSection.text !== baselineSection.text
			) {
				mutations.push( {
					id: `frozen:${ event.publishSha }:${ tag.packageSlug }:${ tag.version }:structure`,
					type: 'released-section-byte-drift-after-published-tag',
					package: tag.package,
					filePath,
					version: tag.version,
					publishSha: event.publishSha,
					tag: tag.name,
					publishedSectionHash: hashText( publishedSection.text ),
					baselineSectionHash: hashText( baselineSection.text ),
				} );
			}
		}
	}
	const attributions = [];
	const unresolvedAttributions = [];
	let correctlyAttributedCount = 0;
	for ( const record of currentRecords ) {
		const packageName = packageByPath.get( record.filePath );
		const timeline = tagTimelineByPackage.get( packageName ) || [];
		const hasOwnStableTag = timeline.some(
			( item ) => item.tag.version === record.version
		);
		const normalizedInitialText = record.block.text
			.replace( /^\s*[-*+]\s+/, '' )
			.trim()
			.toLowerCase();
		if (
			hasOwnStableTag &&
			/^initial release\b/.test( normalizedInitialText )
		) {
			correctlyAttributedCount++;
			continue;
		}
		const matches = [
			...( tagMatchesByRecord.get( record.id )?.values() || [] ),
		].sort(
			( left, right ) =>
				left.authorDate.localeCompare( right.authorDate ) ||
				left.publishSha.localeCompare( right.publishSha )
		);
		if ( matches.length === 0 ) {
			unresolvedAttributions.push( {
				id: `unresolved:${ record.id }`,
				type: 'released-entry-absent-from-all-stable-package-tags',
				package: packageByPath.get( record.filePath ),
				...record,
			} );
			continue;
		}
		const first = matches[ 0 ];
		if ( first.ambiguousTagBlock ) {
			unresolvedAttributions.push( {
				id: `unresolved:${ record.id }`,
				type: 'first-stable-tag-has-ambiguous-entry-identity',
				package: packageByPath.get( record.filePath ),
				...record,
				firstMatch: first,
			} );
			continue;
		}
		const ownPublishedSectionMatch = matches.find(
			( match ) =>
				match.tagVersion === record.version &&
				match.observedSection === record.version &&
				! match.ambiguousTagBlock
		);
		if ( ownPublishedSectionMatch ) {
			correctlyAttributedCount++;
			continue;
		}
		const destinationIndex = timeline.findIndex(
			( item ) => item.publishSha === first.publishSha
		);
		const preceding =
			destinationIndex > 0 ? timeline[ destinationIndex - 1 ] : null;
		attributions.push( {
			id: record.id,
			type: 'released-entry-version-differs-from-first-stable-tag-identity',
			package: packageName,
			filePath: record.filePath,
			wrongVersion: record.version,
			wrongSubsection: record.subsection,
			intendedVersion: first.tagVersion,
			block: record.block,
			firstStableMatch: first,
			stableMatches: matches,
			precedingStableTag: preceding
				? {
						name: preceding.tag.name,
						version: preceding.tag.version,
						publishSha: preceding.publishSha,
						primaryLaneId: preceding.primaryLaneId,
				  }
				: null,
			matchCount: matches.length,
		} );
	}

	invariant( eventCount > 0, 'Frozen-section audit covered zero events' );
	invariant(
		fileCount > 0,
		'Frozen-section audit covered zero package tags'
	);
	mutations.sort( ( left, right ) => left.id.localeCompare( right.id ) );
	unreleasedShipmentCandidates.sort( ( left, right ) =>
		left.id.localeCompare( right.id )
	);
	attributions.sort( ( left, right ) => left.id.localeCompare( right.id ) );
	unresolvedAttributions.sort( ( left, right ) =>
		left.id.localeCompare( right.id )
	);
	exclusions.sort( ( left, right ) => left.id.localeCompare( right.id ) );
	structuralDiagnostics.sort( ( left, right ) =>
		`${ left.publishSha }:${ left.filePath }:${ left.line }`.localeCompare(
			`${ right.publishSha }:${ right.filePath }:${ right.line }`
		)
	);
	return {
		schemaVersion: 1,
		coverage: {
			eventCount,
			fileCount,
			packagePathCount: filePaths.length,
			frozenReleasedBlockCount: currentRecords.length,
		},
		summary: {
			mutationCount: mutations.length,
			unreleasedShipmentCandidateCount:
				unreleasedShipmentCandidates.length,
			attributionFindingCount: attributions.length,
			correctlyAttributedCount,
			unresolvedAttributionCount: unresolvedAttributions.length,
			exclusionCount: exclusions.length,
			structuralDiagnosticCount: structuralDiagnostics.length,
		},
		mutations,
		unreleasedShipmentCandidates,
		attributions,
		unresolvedAttributions,
		exclusions,
		structuralDiagnostics,
	};
}

/**
 * Flattens parsed blocks into exact locations within a changelog.
 *
 * @param {Object} parsed Parsed changelog.
 * @return {Object[]} Located block occurrences.
 */
function flattenLocatedBlocks( parsed ) {
	return parsed.sections.flatMap( ( section ) =>
		enumerateBlocks( section.blocks ).map( ( block ) => ( {
			version: section.key,
			versionOccurrence: section.occurrence,
			subsection: block.subsection,
			block,
		} ) )
	);
}

/**
 * Subtracts located block occurrences using their exact destination identity.
 *
 * @param {Object[]} minuend    Located blocks to inspect.
 * @param {Object[]} subtrahend Located blocks to subtract.
 * @return {Object[]} Remaining located blocks.
 */
function subtractLocatedBlocks( minuend, subtrahend ) {
	const getKey = ( item ) =>
		JSON.stringify( [
			item.version,
			item.versionOccurrence,
			item.subsection,
			item.block.hash,
		] );
	const available = new Map();
	for ( const item of subtrahend ) {
		const key = getKey( item );
		available.set( key, ( available.get( key ) || 0 ) + 1 );
	}
	return minuend.filter( ( item ) => {
		const key = getKey( item );
		const count = available.get( key ) || 0;
		if ( count === 0 ) {
			return true;
		}
		available.set( key, count - 1 );
		return false;
	} );
}

/**
 * Describes the candidate changelog diff structurally without trusting it as
 * evidence for correctness.
 *
 * @param {Object} options                Diff options.
 * @param {string} options.repositoryPath Repository working directory.
 * @param {Object} options.inventory      Inventory with frozen refs.
 * @return {Object} Structural candidate diff.
 */
function auditCandidateDiff( { repositoryPath, inventory } ) {
	const { trunkSha, candidateSha, candidateMergeBaseSha } =
		inventory.baseline;
	invariant(
		SHA_PATTERN.test( trunkSha ),
		'Candidate audit requires a frozen trunk SHA'
	);
	invariant(
		SHA_PATTERN.test( candidateSha ),
		'Candidate audit requires a candidate SHA'
	);
	invariant(
		SHA_PATTERN.test( candidateMergeBaseSha ),
		'Candidate audit requires the candidate merge-base SHA'
	);
	const changedFiles = runGit( repositoryPath, [
		'diff',
		'--name-only',
		candidateMergeBaseSha,
		candidateSha,
		'--',
		'packages/*/CHANGELOG.md',
	] )
		.split( '\n' )
		.filter( Boolean )
		.sort();
	invariant(
		changedFiles.length > 0,
		'Candidate audit found zero changed changelog files'
	);
	const files = readFilesAtCommits(
		repositoryPath,
		changedFiles.flatMap( ( filePath ) => [
			{ commitSha: candidateMergeBaseSha, filePath },
			{ commitSha: candidateSha, filePath },
		] )
	);
	const moves = [];
	const additions = [];
	const removals = [];
	const headingChanges = [];
	const byteOnlyFiles = [];
	const structuralDiagnostics = [];

	for ( const filePath of changedFiles ) {
		const baselineContent =
			files.get( `${ candidateMergeBaseSha }:${ filePath }` ) ?? null;
		const candidateContent =
			files.get( `${ candidateSha }:${ filePath }` ) ?? null;
		invariant(
			baselineContent !== null && candidateContent !== null,
			`Candidate changelog ${ filePath } is absent from one compared tree`
		);
		const baseline = parseChangelog(
			baselineContent,
			`${ candidateMergeBaseSha }:${ filePath }`,
			{ allowDuplicateVersions: true }
		);
		const candidate = parseChangelog(
			candidateContent,
			`${ candidateSha }:${ filePath }`,
			{ allowDuplicateVersions: true }
		);
		for ( const [ snapshot, parsed ] of [
			[ 'baseline', baseline ],
			[ 'candidate', candidate ],
		] ) {
			for ( const diagnostic of parsed.diagnostics ) {
				structuralDiagnostics.push( {
					...diagnostic,
					filePath,
					snapshot,
				} );
			}
		}
		const baselineBlocks = flattenLocatedBlocks( baseline );
		const candidateBlocks = flattenLocatedBlocks( candidate );
		const removed = subtractLocatedBlocks(
			baselineBlocks,
			candidateBlocks
		);
		const added = subtractLocatedBlocks( candidateBlocks, baselineBlocks );
		const consumedAdditions = new Set();

		for ( const removedItem of removed ) {
			const addedIndex = added.findIndex(
				( addedItem, index ) =>
					! consumedAdditions.has( index ) &&
					addedItem.block.hash === removedItem.block.hash
			);
			if ( addedIndex === -1 ) {
				removals.push( {
					id: `candidate-remove:${ filePath }:${ removedItem.version }:${ removedItem.block.hash }:${ removedItem.block.occurrence }`,
					filePath,
					fromVersion: removedItem.version,
					fromSubsection: removedItem.subsection,
					block: serializeBlock( removedItem.block ),
				} );
				continue;
			}
			consumedAdditions.add( addedIndex );
			const addedItem = added[ addedIndex ];
			moves.push( {
				id: `candidate-move:${ filePath }:${ removedItem.block.hash }:${ removedItem.block.occurrence }`,
				filePath,
				fromVersion: removedItem.version,
				fromSubsection: removedItem.subsection,
				toVersion: addedItem.version,
				toSubsection: addedItem.subsection,
				block: serializeBlock( removedItem.block ),
			} );
		}
		for ( let index = 0; index < added.length; index++ ) {
			if ( consumedAdditions.has( index ) ) {
				continue;
			}
			const item = added[ index ];
			additions.push( {
				id: `candidate-add:${ filePath }:${ item.version }:${ item.block.hash }:${ item.block.occurrence }`,
				filePath,
				toVersion: item.version,
				toSubsection: item.subsection,
				block: serializeBlock( item.block ),
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
			const [ version, occurrenceText ] = key.split( ':' );
			const occurrence = Number( occurrenceText );
			const before = baseline.sections.find(
				( section ) =>
					section.key === version && section.occurrence === occurrence
			);
			const after = candidate.sections.find(
				( section ) =>
					section.key === version && section.occurrence === occurrence
			);
			if (
				( before ? before.heading : null ) !==
				( after ? after.heading : null )
			) {
				headingChanges.push( {
					id: `candidate-heading:${ filePath }:${ version }:${ occurrence }`,
					filePath,
					version,
					occurrence,
					before: before ? before.heading : null,
					after: after ? after.heading : null,
				} );
			}
		}
		if (
			baselineContent !== candidateContent &&
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
		frozenTrunkSha: trunkSha,
		candidateMergeBaseSha,
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

module.exports = {
	DEFAULT_AUDIT_START,
	DEFAULT_TRUNK_REF,
	auditImmediateBackports,
	auditPreNextReleaseCuts,
	auditCandidateDiff,
	auditFrozenReleasedSections,
	applyEventResolutions,
	buildPublishInventory,
	findVersionSection,
	hashText,
	parseChangelog,
	parsePackageTag,
	readFilesAtCommits,
	readPackageTagGroups,
	readReleaseLanes,
	runGit,
	serializeBlock,
	subtractSemanticallyEquivalentBlocks,
};
