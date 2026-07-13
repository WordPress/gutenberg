/**
 * External dependencies
 */
const path = require( 'path' );
const fs = require( 'fs' );
const readline = require( 'readline' );
const { randomUUID } = require( 'crypto' );
const { join } = require( 'path' );
const { command } = require( 'execa' );
const glob = require( 'fast-glob' );
const { inc: semverInc } = require( 'semver' );
const { rimraf } = require( 'rimraf' );
const SimpleGit = require( 'simple-git' );

/**
 * Internal dependencies
 */
const { log, formats } = require( '../lib/logger' );
const {
	askForConfirmation,
	runStep,
	readJSONFile,
	getRandomTemporaryPath,
} = require( '../lib/utils' );
const {
	calculateVersionBumpFromChangelog,
	findPluginReleaseBranchName,
} = require( './common' );
const pluginConfig = require( '../config' );

const NPM_RELEASE_PHASE_ATTEMPTS = 3;
// Keep tag pushes small enough that GitHub ruleset validation handles each phase predictably.
const NPM_RELEASE_TAG_PUSH_BATCH_SIZE = 25;

/**
 * Release type names.
 *
 * @typedef {('latest'|'bugfix'|'wp'|'next')} ReleaseType
 */

/**
 * Npm release phases.
 *
 * @typedef {('prepare'|'publish'|'finalize'|'all')} ReleasePhase
 */

/**
 * Semantic Versioning labels.
 *
 * @typedef {('major'|'minor'|'patch')} SemVer
 */

/**
 * @typedef WPPackagesCommandOptions
 *
 * @property {boolean}      [ci]             Disables interactive mode when executed in CI mode.
 * @property {ReleasePhase} [phase]          The release phase. Defaults to `all`.
 * @property {string}       [releaseId]      Stable identifier used to resume the same release.
 * @property {string}       [repositoryPath] Relative path to the git repository.
 * @property {SemVer}       [semver]         The selected semantic versioning. Defaults to `patch`.
 * @property {string}       [wpVersion]      The major WordPress version number, example: `6.0`.
 */

/**
 * @typedef WPPackagesConfig
 *
 * @property {string}       abortMessage            Abort Message.
 * @property {string}       distTag                 The dist-tag used for npm publishing.
 * @property {string}       gitWorkingDirectoryPath Git working directory path.
 * @property {boolean}      interactive             Whether to run in interactive mode.
 * @property {SemVer}       minimumVersionBump      The selected minimum version bump.
 * @property {string}       npmReleaseBranch        The selected branch for npm release.
 * @property {ReleasePhase} phase                   The release phase.
 * @property {string}       releaseId               Stable identifier for this release invocation.
 * @property {ReleaseType}  releaseType             The selected release type.
 */

/**
 * Parses an npm release marker commit subject.
 *
 * @param {string} subject Commit subject.
 *
 * @return {?Object} Parsed marker fields.
 */
function parseNpmReleaseMarkerSubject( subject ) {
	const match = subject.match(
		/^chore\(release\): (prepare|finalize) npm (latest|bugfix|wp|next)(?: from (.+?))? \[release-id: ([A-Za-z0-9._-]+)\]$/
	);
	if ( ! match ) {
		return null;
	}
	return {
		phase: match[ 1 ],
		pluginReleaseBranch: match[ 3 ] || null,
		releaseId: match[ 4 ],
		releaseType: match[ 2 ],
	};
}

/**
 * Checks out the npm release branch.
 *
 * @param {WPPackagesConfig} options  The config object.
 * @param {Object}           deps     Dependencies.
 * @param {Object}           deps.git Git client.
 */
async function checkoutNpmReleaseBranch(
	{ gitWorkingDirectoryPath, npmReleaseBranch },
	deps = {}
) {
	const { git = SimpleGit( gitWorkingDirectoryPath ) } = deps;
	/*
	 * Create the release branch.
	 *
	 * Note that we are grabbing an arbitrary depth of commits (999) during the fetch.
	 * When Lerna attempts to determine if a package needs an update, it looks at
	 * `git` history to find the commit created during the previous npm publishing.
	 * Lerna assumes that all packages need publishing if it can't access
	 * the necessary information.
	 */
	await git.fetch( 'origin', npmReleaseBranch, [ '--depth=999' ] );
	await git.raw( 'checkout', '-B', npmReleaseBranch, 'FETCH_HEAD' );
	log(
		'>> The local npm release branch ' +
			formats.success( npmReleaseBranch ) +
			' has been successfully checked out.'
	);
}

/**
 * Syncs the checked-out npm release branch with the last plugin release.
 *
 * @param {string}           pluginReleaseBranch The plugin release branch name.
 * @param {WPPackagesConfig} config              The config object.
 *
 * @return {?string}   The optional commit's hash when branch synced.
 */
async function runNpmReleaseBranchSyncStep( pluginReleaseBranch, config ) {
	const {
		abortMessage,
		interactive,
		gitWorkingDirectoryPath,
		npmReleaseBranch,
	} = config;
	await runStep( 'Syncing the npm release branch', abortMessage, async () => {
		if ( interactive ) {
			await askForConfirmation(
				`The branch is ready for sync with the latest plugin release changes applied to "${ pluginReleaseBranch }". Proceed?`,
				true,
				abortMessage
			);
		}

		log(
			`>> Syncing the latest plugin release to "${ pluginReleaseBranch }".`
		);

		const repo = SimpleGit( gitWorkingDirectoryPath );

		/*
		 * Replace content from remote branch.
		 *
		 * @todo What is our goal here? Could `git reset --hard origin/${pluginReleaseBranch}` work?
		 *        Why are we manually removing and then adding files back in?
		 */
		await repo
			.raw( 'rm', '-r', '.' )
			.fetch( 'origin', pluginReleaseBranch, [ '--depth=1' ] )
			.raw( 'checkout', `origin/${ pluginReleaseBranch }`, '--', '.' );

		await repo.commit(
			`Merge changes published in the Gutenberg plugin "${ pluginReleaseBranch }" branch`
		);

		log(
			'>> The local npm release branch ' +
				formats.success( npmReleaseBranch ) +
				' has been successfully synced.'
		);
	} );
}

/**
 * Update CHANGELOG files with the new version number for those packages that
 * contain new entries.
 *
 * @param {WPPackagesConfig} config Command config.
 *
 * @return {?string}   The optional commit's hash when changelog files updated.
 */
async function updatePackages( config ) {
	const {
		abortMessage,
		gitWorkingDirectoryPath,
		interactive,
		minimumVersionBump,
		releaseType,
	} = config;

	if ( releaseType === 'wp' ) {
		log(
			'>> Skipping CHANGELOG files processing when targeting WordPress core.'
		);
		return;
	}

	const changelogFiles = await glob(
		path.resolve( gitWorkingDirectoryPath, 'packages/*/CHANGELOG.md' )
	);
	const changelogFilesPublicPackages = changelogFiles.filter(
		( changelogPath ) => {
			const pkg = require(
				path.join( path.dirname( changelogPath ), 'package.json' )
			);
			return pkg.private !== true;
		}
	);

	const processedPackages = await Promise.all(
		changelogFilesPublicPackages.map( async ( changelogPath ) => {
			const fileStream = fs.createReadStream( changelogPath );

			const rl = readline.createInterface( {
				input: fileStream,
			} );
			const lines = [];
			for await ( const line of rl ) {
				lines.push( line );
			}

			const packageJSONPath = changelogPath.replace(
				'CHANGELOG.md',
				'package.json'
			);
			const { version } = readJSONFile( packageJSONPath );
			let versionBump = calculateVersionBumpFromChangelog(
				lines,
				minimumVersionBump,
				version
			);
			const packageName = `@wordpress/${
				changelogPath.split( '/' ).reverse()[ 1 ]
			}`;
			// Enforce version bump for all packages when
			// the stable minor or major version bump requested.
			if (
				! versionBump &&
				releaseType !== 'next' &&
				minimumVersionBump !== 'patch'
			) {
				versionBump = minimumVersionBump;
			}
			const nextVersion =
				versionBump !== null ? semverInc( version, versionBump ) : null;

			return {
				changelogPath,
				packageJSONPath,
				packageName,
				nextVersion,
				version,
			};
		} )
	);

	const packagesToUpdate = processedPackages.filter(
		( { nextVersion } ) => nextVersion
	);

	if ( packagesToUpdate.length === 0 ) {
		log( '>> No changes in CHANGELOG files detected.' );
		return;
	}

	log(
		'>> Recommended version bumps based on the changes detected in CHANGELOG files:'
	);

	// e.g. "2022-11-01T00:13:26.102Z" -> "2022-11-01"
	const publishDate = new Date().toISOString().split( 'T' )[ 0 ];
	await Promise.all(
		packagesToUpdate.map(
			async ( {
				changelogPath,
				packageJSONPath,
				packageName,
				nextVersion,
				version,
			} ) => {
				// Update changelog.
				const content = fs.readFileSync( changelogPath, 'utf8' );
				fs.writeFileSync(
					changelogPath,
					content.replace(
						'## Unreleased',
						`## Unreleased\n\n## ${
							releaseType === 'next'
								? nextVersion + '-next.0'
								: nextVersion
						} (${ publishDate })`
					)
				);

				// Update package.json.
				const packageJson = readJSONFile( packageJSONPath );
				const newPackageJson = {
					...packageJson,
					version: nextVersion + '-prerelease',
				};
				fs.writeFileSync(
					packageJSONPath,
					JSON.stringify( newPackageJson, null, '\t' ) + '\n'
				);

				log(
					`   - ${ packageName }: ${ version } -> ${
						releaseType === 'next'
							? nextVersion + '-next.0'
							: nextVersion
					}`
				);
			}
		)
	);

	if ( interactive ) {
		await askForConfirmation(
			`All corresponding files were updated. Commit the changes?`,
			true,
			abortMessage
		);
	}

	const { commit: commitHash } = await SimpleGit( gitWorkingDirectoryPath )
		.add( [ './*' ] )
		.commit( 'Update changelog files' );

	log( '>> Changelog files have been updated successfully.' );

	return commitHash;
}

/**
 * Records the release route immediately before changelog and version commits.
 *
 * @param {?string}          pluginReleaseBranch Plugin release branch, when synced.
 * @param {WPPackagesConfig} config              Command config.
 * @param {Object}           deps                Dependencies.
 * @param {Object}           deps.git            Git client.
 */
async function createNpmReleaseMarker(
	pluginReleaseBranch,
	config,
	deps = {}
) {
	const { gitWorkingDirectoryPath, releaseId, releaseType } = config;
	const { git = SimpleGit( gitWorkingDirectoryPath ) } = deps;
	const source = pluginReleaseBranch ? ` from ${ pluginReleaseBranch }` : '';
	await git.raw(
		'commit',
		'--allow-empty',
		'-m',
		`chore(release): prepare npm ${ releaseType }${ source } [release-id: ${ releaseId }]`
	);
}

/**
 * Checks whether a commit is the exact finalization marker for a prepared release.
 *
 * @param {string}      markerCommit                    Marker commit SHA.
 * @param {Object}      options                         Options.
 * @param {string}      options.gitWorkingDirectoryPath Git working directory path.
 * @param {string}      options.publishCommit           Prepared release commit SHA.
 * @param {string}      options.releaseId               Stable release identifier.
 * @param {ReleaseType} options.releaseType             Release type.
 * @param {Object}      deps                            Dependencies.
 * @param {Object}      deps.git                        Git client.
 *
 * @return {Promise<boolean>} Whether the commit is the expected marker.
 */
async function isNpmReleaseFinalizationMarker(
	markerCommit,
	{ gitWorkingDirectoryPath, publishCommit, releaseId, releaseType },
	deps = {}
) {
	const { git = SimpleGit( gitWorkingDirectoryPath ) } = deps;
	const description = (
		await git.raw( 'show', '-s', '--format=%P%x00%T%x00%s', markerCommit )
	).trim();
	const [ parents, markerTree, markerSubject ] = description.split( '\0' );
	const publishTree = (
		await git.revparse( [ `${ publishCommit }^{tree}` ] )
	).trim();
	const marker = parseNpmReleaseMarkerSubject( markerSubject );
	return (
		parents === publishCommit &&
		markerTree === publishTree &&
		marker?.phase === 'finalize' &&
		marker.pluginReleaseBranch === null &&
		marker.releaseId === releaseId &&
		marker.releaseType === releaseType
	);
}

/**
 * Advances the release branch only after finalization has completed.
 *
 * @param {Object}           releaseState                  Prepared release state.
 * @param {string}           releaseState.npmReleaseBranch Npm release branch.
 * @param {string}           releaseState.publishCommit    Prepared release commit SHA.
 * @param {ReleaseType}      releaseState.releaseType      Release type.
 * @param {WPPackagesConfig} config                        Command config.
 * @param {Object}           deps                          Dependencies.
 * @param {Function}         deps.getRemoteBranchShaFn     Gets the remote branch SHA.
 * @param {Object}           deps.git                      Git client.
 * @param {Function}         deps.isFinalizationMarkerFn   Checks finalization markers.
 * @param {Function}         deps.runPhase                 Runs a retryable phase.
 */
async function createNpmReleaseFinalizationMarker(
	releaseState,
	config,
	deps = {}
) {
	const { gitWorkingDirectoryPath } = config;
	const { npmReleaseBranch, publishCommit, releaseId, releaseType } =
		releaseState;
	const {
		getRemoteBranchShaFn = getRemoteBranchSha,
		git = SimpleGit( gitWorkingDirectoryPath ),
		isFinalizationMarkerFn = isNpmReleaseFinalizationMarker,
		runPhase = runNpmReleasePhase,
	} = deps;
	const finalizationCommit = (
		await git.raw(
			'commit-tree',
			`${ publishCommit }^{tree}`,
			'-p',
			publishCommit,
			'-m',
			`chore(release): finalize npm ${ releaseType } [release-id: ${ releaseId }]`
		)
	).trim();

	await runPhase( 'Finalization marker push', async () => {
		const remoteSha = await getRemoteBranchShaFn(
			gitWorkingDirectoryPath,
			npmReleaseBranch
		);
		if ( remoteSha !== publishCommit ) {
			if ( ! remoteSha ) {
				throw new Error(
					`Expected origin/${ npmReleaseBranch } to point to ${ publishCommit } or its finalization marker, got nothing.`
				);
			}
			if ( remoteSha !== finalizationCommit ) {
				await git.fetch( 'origin', npmReleaseBranch, [
					'--depth=999',
				] );
				if (
					! ( await isFinalizationMarkerFn(
						remoteSha,
						{
							gitWorkingDirectoryPath,
							publishCommit,
							releaseId,
							releaseType,
						},
						{ git }
					) )
				) {
					throw new Error(
						`Expected origin/${ npmReleaseBranch } to point to ${ publishCommit } or its finalization marker, got ${
							remoteSha || 'nothing'
						}.`
					);
				}
			}
			log( '>> The npm release is already marked as finalized.' );
			return;
		}
		log( '>> Recording completed npm release.' );
		await git.raw(
			'push',
			'origin',
			`${ finalizationCommit }:refs/heads/${ npmReleaseBranch }`
		);
	} );
}

/**
 * Returns package metadata for public packages that Lerna tagged at HEAD.
 *
 * @param {string}   gitWorkingDirectoryPath Git working directory path.
 * @param {Object}   deps                    Dependencies.
 * @param {Object}   deps.git                Git client.
 * @param {Function} deps.globFn             Glob function.
 * @param {Function} deps.readJSON           JSON reader.
 *
 * @return {Promise<Array<{ name: string, version: string, tagName: string }>>} Package metadata.
 */
async function getNpmReleasePackages( gitWorkingDirectoryPath, deps = {} ) {
	const {
		git = SimpleGit( gitWorkingDirectoryPath ),
		globFn = glob,
		readJSON = readJSONFile,
	} = deps;
	const localTagsAtHead = new Set(
		( await git.raw( 'tag', '--points-at', 'HEAD' ) )
			.split( '\n' )
			.filter( Boolean )
	);

	const packageJSONPaths = await globFn(
		path.resolve( gitWorkingDirectoryPath, 'packages/*/package.json' )
	);

	return packageJSONPaths
		.map( ( packageJSONPath ) => {
			const {
				name,
				private: isPrivate,
				version,
			} = readJSON( packageJSONPath );
			return {
				isPrivate,
				name,
				tagName: `${ name }@${ version }`,
				version,
			};
		} )
		.filter(
			( { isPrivate, tagName } ) =>
				isPrivate !== true && localTagsAtHead.has( tagName )
		)
		.map( ( { name, tagName, version } ) => ( {
			name,
			tagName,
			version,
		} ) )
		.sort( ( a, b ) => a.tagName.localeCompare( b.tagName ) );
}

/**
 * Returns public packages versioned by an exact prepared release commit.
 *
 * @param {string} gitWorkingDirectoryPath Git working directory path.
 * @param {string} publishCommit           Prepared release commit SHA.
 * @param {Object} deps                    Dependencies.
 * @param {Object} deps.git                Git client.
 *
 * @return {Promise<Array<{ name: string, version: string, tagName: string }>>} Package metadata.
 */
async function getPreparedNpmReleasePackages(
	gitWorkingDirectoryPath,
	publishCommit,
	deps = {}
) {
	const { git = SimpleGit( gitWorkingDirectoryPath ) } = deps;
	const changedPaths = (
		await git.raw(
			'diff-tree',
			'--no-commit-id',
			'--name-only',
			'-r',
			`${ publishCommit }^`,
			publishCommit,
			'--',
			'packages/*/package.json'
		)
	)
		.split( '\n' )
		.filter( Boolean );

	const packages = await Promise.all(
		changedPaths.map( async ( packageJSONPath ) => {
			const packageJson = JSON.parse(
				await git.raw(
					'show',
					`${ publishCommit }:${ packageJSONPath }`
				)
			);
			const previousPackageJson = JSON.parse(
				await git.raw(
					'show',
					`${ publishCommit }^:${ packageJSONPath }`
				)
			);
			return { packageJson, previousPackageJson };
		} )
	);

	return packages
		.filter(
			( { packageJson, previousPackageJson } ) =>
				packageJson.private !== true &&
				packageJson.version !== previousPackageJson.version
		)
		.map( ( { packageJson: { name, version } } ) => ( {
			name,
			tagName: `${ name }@${ version }`,
			version,
		} ) )
		.sort( ( a, b ) => a.tagName.localeCompare( b.tagName ) );
}

/**
 * Reconstructs prepared release state from the exact checked-out commit.
 *
 * @param {WPPackagesConfig} config Command config.
 * @param {Object}           deps   Dependencies.
 *
 * @return {Promise<Object>} Prepared release state.
 */
async function getPreparedNpmReleaseState( config, deps = {} ) {
	const { distTag, gitWorkingDirectoryPath, npmReleaseBranch, releaseType } =
		config;
	const {
		getPreparedNpmReleasePackagesFn = getPreparedNpmReleasePackages,
		getRemoteBranchShaFn = getRemoteBranchSha,
		git = SimpleGit( gitWorkingDirectoryPath ),
		isFinalizationMarkerFn = isNpmReleaseFinalizationMarker,
		publishCommit: preparedPublishCommit,
	} = deps;
	const publishCommit =
		preparedPublishCommit || ( await git.revparse( [ 'HEAD' ] ) );
	const publishSubject = (
		await git.raw( 'show', '-s', '--format=%s', publishCommit )
	).trim();
	if ( publishSubject !== 'chore(release): publish' ) {
		throw new Error(
			`Expected ${ publishCommit } to be an npm version commit.`
		);
	}

	const releasePackages = await getPreparedNpmReleasePackagesFn(
		gitWorkingDirectoryPath,
		publishCommit
	);
	if ( releasePackages.length === 0 ) {
		throw new Error(
			`Prepared npm release commit ${ publishCommit } contains no versioned public packages.`
		);
	}

	const parentDescription = (
		await git.raw(
			'show',
			'-s',
			'--format=%H%x00%s',
			`${ publishCommit }^`
		)
	).trim();
	const [ parentCommit, parentSubject ] = parentDescription.split( '\0' );
	const changelogCommit =
		parentSubject === 'Update changelog files' ? parentCommit : null;
	const markerCommit = `${ publishCommit }${ changelogCommit ? '^^' : '^' }`;
	const markerSubject = (
		await git.raw( 'show', '-s', '--format=%s', markerCommit )
	).trim();
	const marker = parseNpmReleaseMarkerSubject( markerSubject );
	const markerReleaseType = marker?.releaseType;
	const pluginReleaseBranch = marker?.pluginReleaseBranch || null;
	const releaseId = marker?.releaseId;
	const hasExpectedSource =
		( releaseType === 'latest' &&
			pluginReleaseBranch?.startsWith( 'release/' ) ) ||
		( releaseType === 'next' && pluginReleaseBranch === 'trunk' ) ||
		( [ 'bugfix', 'wp' ].includes( releaseType ) &&
			pluginReleaseBranch === null );
	if (
		marker?.phase !== 'prepare' ||
		markerReleaseType !== releaseType ||
		! hasExpectedSource
	) {
		throw new Error(
			`Prepared npm release commit ${ publishCommit } does not match the ${ releaseType } release route.`
		);
	}

	const remoteSha = await getRemoteBranchShaFn(
		gitWorkingDirectoryPath,
		npmReleaseBranch
	);
	let isFinalized = false;
	if ( remoteSha !== publishCommit ) {
		if ( ! remoteSha ) {
			throw new Error(
				`Expected origin/${ npmReleaseBranch } to point to ${ publishCommit } or its finalization marker, got nothing.`
			);
		}
		await git.fetch( 'origin', npmReleaseBranch, [ '--depth=999' ] );
		isFinalized = await isFinalizationMarkerFn(
			remoteSha,
			{
				gitWorkingDirectoryPath,
				publishCommit,
				releaseId,
				releaseType,
			},
			{ git }
		);
		if ( ! isFinalized ) {
			throw new Error(
				`Expected origin/${ npmReleaseBranch } to point to ${ publishCommit } or its finalization marker, got ${ remoteSha }.`
			);
		}
	}

	return {
		changelogCommit,
		distTag,
		isFinalized,
		npmReleaseBranch,
		pluginReleaseBranch,
		publishCommit,
		releasePackages,
		releaseId,
		releaseType,
	};
}

/**
 * Returns package tags that have not been pushed after validating that every
 * existing remote tag belongs to the prepared release commit.
 *
 * @param {Map<string, string>} remoteTagShas Remote tag SHAs.
 * @param {string[]}            packageTags   Package tag names.
 * @param {string}              publishCommit Prepared release commit SHA.
 *
 * @return {string[]} Missing package tag names.
 */
function getMissingRemotePackageTags(
	remoteTagShas,
	packageTags,
	publishCommit
) {
	const conflictingTag = packageTags.find( ( tagName ) => {
		const remoteSha = remoteTagShas.get( tagName );
		return remoteSha && remoteSha !== publishCommit;
	} );
	if ( conflictingTag ) {
		throw new Error(
			`Package tag ${ conflictingTag } points to ${ remoteTagShas.get(
				conflictingTag
			) }, expected ${ publishCommit }.`
		);
	}

	return packageTags.filter( ( tagName ) => ! remoteTagShas.has( tagName ) );
}

/**
 * Returns prepared state when the checked-out release branch still needs to be
 * published or finalized, or identifies the finalization marker at HEAD.
 *
 * @param {WPPackagesConfig} config Command config.
 * @param {Object}           deps   Dependencies.
 *
 * @return {Promise<?Object>} Pending prepared release state.
 */
async function getPendingPreparedNpmReleaseState( config, deps = {} ) {
	const { gitWorkingDirectoryPath } = config;
	const {
		getPreparedNpmReleasePackagesFn = getPreparedNpmReleasePackages,
		getPreparedNpmReleaseStateFn = getPreparedNpmReleaseState,
		getRemoteTagShasFn = getRemoteTagShas,
		git = SimpleGit( gitWorkingDirectoryPath ),
	} = deps;
	const headCommit = await git.revparse( [ 'HEAD' ] );
	const headSubject = (
		await git.raw( 'show', '-s', '--format=%s', headCommit )
	).trim();
	if ( headSubject !== 'chore(release): publish' ) {
		const marker = parseNpmReleaseMarkerSubject( headSubject );
		if ( marker?.phase !== 'finalize' ) {
			return null;
		}
		const publishCommit = await git.revparse( [ `${ headCommit }^` ] );
		const releaseState = await getPreparedNpmReleaseStateFn(
			{ ...config, releaseType: marker.releaseType },
			{ ...deps, git, publishCommit }
		);
		if (
			! releaseState.isFinalized ||
			releaseState.publishCommit !== publishCommit ||
			releaseState.releaseId !== marker.releaseId ||
			releaseState.releaseType !== marker.releaseType
		) {
			throw new Error(
				`Invalid npm release finalization marker ${ headCommit }.`
			);
		}
		return releaseState;
	}
	const publishCommit = headCommit;

	const releasePackages = await getPreparedNpmReleasePackagesFn(
		gitWorkingDirectoryPath,
		publishCommit
	);
	if ( releasePackages.length === 0 ) {
		return null;
	}
	const packageTags = releasePackages.map( ( { tagName } ) => tagName );
	const remoteTagShas = await getRemoteTagShasFn(
		gitWorkingDirectoryPath,
		packageTags
	);
	getMissingRemotePackageTags( remoteTagShas, packageTags, publishCommit );

	const releaseState = await getPreparedNpmReleaseStateFn( config );
	log(
		`>> Reusing pending npm release prepared at ${ releaseState.publishCommit }.`
	);
	return releaseState;
}

/**
 * Returns a fully qualified tag refspec.
 *
 * @param {string} tagName Tag name.
 *
 * @return {string} Tag refspec.
 */
function getTagRefspec( tagName ) {
	return `refs/tags/${ tagName }:refs/tags/${ tagName }`;
}

/**
 * Splits an array into chunks.
 *
 * @param {Array}  items     Items to chunk.
 * @param {number} chunkSize Chunk size.
 *
 * @return {Array[]} Chunks.
 */
function chunk( items, chunkSize ) {
	const chunks = [];
	for ( let index = 0; index < items.length; index += chunkSize ) {
		chunks.push( items.slice( index, index + chunkSize ) );
	}
	return chunks;
}

/**
 * Formats one or more tag push commands.
 *
 * @param {string[]} tagNames Tag names.
 *
 * @return {string[]} Git push commands.
 */
function getTagPushCommands( tagNames ) {
	return chunk( tagNames, NPM_RELEASE_TAG_PUSH_BATCH_SIZE ).map(
		( tagNameChunk ) =>
			[
				'git push origin \\',
				...tagNameChunk.map(
					( tagName, index ) =>
						`  "${ getTagRefspec( tagName ) }"${
							index === tagNameChunk.length - 1 ? '' : ' \\'
						}`
				),
			].join( '\n' )
	);
}

/**
 * Formats recovery commands for release Git metadata.
 *
 * @param {Object}   options                  Options.
 * @param {string}   options.npmReleaseBranch Npm release branch.
 * @param {string[]} options.packageTags      Package tag names.
 * @param {string}   options.publishCommit    Publish commit SHA.
 *
 * @return {string} Recovery commands.
 */
function getNpmReleaseGitRecoveryCommands( {
	npmReleaseBranch,
	packageTags,
	publishCommit,
} ) {
	return [
		'Push and verify the release branch:',
		`git push origin "${ publishCommit }:refs/heads/${ npmReleaseBranch }"`,
		`git ls-remote --heads origin "refs/heads/${ npmReleaseBranch }"`,
		...( packageTags.length
			? [
					'',
					'Push the package tags:',
					...getTagPushCommands( packageTags ),
					'',
					'Verify the package tags:',
					...packageTags.map(
						( tagName ) =>
							`git ls-remote --tags origin "refs/tags/${ tagName }" "refs/tags/${ tagName }^{}"`
					),
			  ]
			: [] ),
	].join( '\n' );
}

/**
 * Runs a release phase with retry.
 *
 * @param {string}   label     Phase label.
 * @param {Function} task      Task to retry.
 * @param {Object}   deps      Dependencies.
 * @param {Function} deps.wait Wait function.
 */
async function runNpmReleasePhase( label, task, deps = {} ) {
	const {
		wait = ( delay ) =>
			new Promise( ( resolve ) => setTimeout( resolve, delay ) ),
	} = deps;
	for ( let attempt = 1; ; attempt++ ) {
		try {
			await task();
			return;
		} catch ( err ) {
			if ( attempt >= NPM_RELEASE_PHASE_ATTEMPTS ) {
				throw err;
			}
			log(
				`>> ${ label } failed (attempt ${ attempt }/${ NPM_RELEASE_PHASE_ATTEMPTS }): ${
					err.message
				}, retrying in ${ attempt * 5 }s...`
			);
			await wait( attempt * 5000 );
		}
	}
}

/**
 * Gets the remote SHA for a branch.
 *
 * @param {string} gitWorkingDirectoryPath Git working directory path.
 * @param {string} branchName              Branch name.
 * @param {Object} deps                    Dependencies.
 * @param {Object} deps.git                Git client.
 *
 * @return {Promise<?string>} Remote branch SHA.
 */
async function getRemoteBranchSha(
	gitWorkingDirectoryPath,
	branchName,
	deps = {}
) {
	const { git = SimpleGit( gitWorkingDirectoryPath ) } = deps;
	const branchRef = `refs/heads/${ branchName }`;
	const output = await git.raw( 'ls-remote', '--heads', 'origin', branchRef );
	const matchingLine = output
		.trim()
		.split( '\n' )
		.find( ( line ) => line.split( /\s+/ )[ 1 ] === branchRef );
	const [ sha ] = ( matchingLine || '' ).split( /\s+/ );
	return sha || null;
}

/**
 * Gets the peeled remote SHA for each tag.
 *
 * @param {string}   gitWorkingDirectoryPath Git working directory path.
 * @param {string[]} tagNames                Tag names.
 * @param {Object}   deps                    Dependencies.
 * @param {Object}   deps.git                Git client.
 *
 * @return {Promise<Map<string, string>>} Remote tag SHAs.
 */
async function getRemoteTagShas(
	gitWorkingDirectoryPath,
	tagNames,
	{ git = SimpleGit( gitWorkingDirectoryPath ) } = {}
) {
	if ( tagNames.length === 0 ) {
		return new Map();
	}

	const output = await git.raw(
		'ls-remote',
		'--tags',
		'origin',
		...tagNames.flatMap( ( tagName ) => [
			`refs/tags/${ tagName }`,
			`refs/tags/${ tagName }^{}`,
		] )
	);
	const remoteTagShas = new Map();
	output
		.trim()
		.split( '\n' )
		.filter( Boolean )
		.forEach( ( line ) => {
			const [ sha, ref = '' ] = line.split( /\s+/ );
			const match = ref.match( /^refs\/tags\/(.+?)(\^\{\})?$/ );
			if ( match ) {
				const [ , tagName, isPeeled ] = match;
				if ( isPeeled || ! remoteTagShas.has( tagName ) ) {
					remoteTagShas.set( tagName, sha );
				}
			}
		} );
	return remoteTagShas;
}

/**
 * Verifies that a remote branch points to the expected SHA.
 *
 * @param {Object}   options                         Options.
 * @param {string}   options.gitWorkingDirectoryPath Git working directory path.
 * @param {string}   options.npmReleaseBranch        Npm release branch.
 * @param {string}   options.publishCommit           Expected commit SHA.
 * @param {Object}   deps                            Dependencies.
 * @param {Function} deps.getRemoteBranchShaFn       Gets the remote branch SHA.
 */
async function verifyRemoteNpmReleaseBranch(
	{ gitWorkingDirectoryPath, npmReleaseBranch, publishCommit },
	deps = {}
) {
	const { getRemoteBranchShaFn = getRemoteBranchSha } = deps;
	const remoteSha = await getRemoteBranchShaFn(
		gitWorkingDirectoryPath,
		npmReleaseBranch
	);
	if ( remoteSha !== publishCommit ) {
		throw new Error(
			`Expected origin/${ npmReleaseBranch } to point to ${ publishCommit }, got ${
				remoteSha || 'nothing'
			}.`
		);
	}
}

/**
 * Verifies that remote tags peel to the expected SHA.
 *
 * @param {Object}   options                         Options.
 * @param {string}   options.gitWorkingDirectoryPath Git working directory path.
 * @param {string[]} options.packageTags             Package tag names.
 * @param {string}   options.publishCommit           Expected commit SHA.
 * @param {Object}   deps                            Dependencies.
 * @param {Function} deps.getRemoteTagShasFn         Gets remote tag SHAs.
 */
async function verifyRemotePackageTags(
	{ gitWorkingDirectoryPath, packageTags, publishCommit },
	deps = {}
) {
	const { getRemoteTagShasFn = getRemoteTagShas } = deps;
	const mismatches = [];
	const remoteTagShas = await getRemoteTagShasFn(
		gitWorkingDirectoryPath,
		packageTags
	);
	for ( const tagName of packageTags ) {
		const remoteSha = remoteTagShas.get( tagName );
		if ( remoteSha !== publishCommit ) {
			mismatches.push(
				`${ tagName }: expected ${ publishCommit }, got ${
					remoteSha || 'nothing'
				}`
			);
		}
	}
	if ( mismatches.length ) {
		throw new Error(
			`Package tag verification failed:\n${ mismatches.join( '\n' ) }`
		);
	}
}

/**
 * Checks whether an npm command failed because the target package version is absent.
 *
 * @param {Error} error Command error.
 *
 * @return {boolean} Whether the package version is absent.
 */
function isNpmPackageVersionMissing( error ) {
	const output = `${ error.stdout || '' }\n${ error.stderr || '' }`;
	return output.includes( 'E404' );
}

/**
 * Parses npm JSON command output.
 *
 * @param {string} output      Command stdout.
 * @param {string} description Output description for error messages.
 *
 * @return {*} Parsed JSON output.
 */
function parseNpmJsonOutput( output, description ) {
	try {
		return JSON.parse( output );
	} catch {
		throw new Error(
			`Unable to parse npm registry ${ description }: ${ output }`
		);
	}
}

/**
 * Runs a pragmatic npm preflight before publishing.
 *
 * @param {Object}   options                         Options.
 * @param {boolean}  [options.checkAccess]           Whether to validate npm package access.
 * @param {string}   options.distTag                 The dist-tag used for npm publishing.
 * @param {string}   options.gitWorkingDirectoryPath Git working directory path.
 * @param {string}   options.publishCommit           Release commit SHA.
 * @param {Array}    options.releasePackages         Packages to publish.
 * @param {Object}   deps                            Dependencies.
 * @param {Function} deps.commandFn                  Command runner.
 *
 * @return {Promise<string[]>} Correctly published package names.
 */
async function runNpmPublishPreflight(
	{
		checkAccess = true,
		distTag,
		gitWorkingDirectoryPath,
		publishCommit,
		releasePackages,
	},
	deps = {}
) {
	const { commandFn = command } = deps;
	if ( checkAccess ) {
		log( '>> Checking npm package access.' );
		await commandFn( 'npm access list packages @wordpress --json', {
			cwd: gitWorkingDirectoryPath,
			stdio: 'pipe',
		} );
	}

	log( '>> Verifying target package versions and dist-tags.' );
	const publishedPackageNames = [];
	// TODO: Consider bounded concurrency here if this preflight becomes too slow.
	// Keep registry checks sequential so errors stay easy to read.
	for ( const { name, version } of releasePackages ) {
		let registryPackage;
		try {
			const { stdout } = await commandFn(
				`npm view ${ name }@${ version } version gitHead dist-tags --json`,
				{
					cwd: gitWorkingDirectoryPath,
					stdio: 'pipe',
				}
			);
			registryPackage = parseNpmJsonOutput(
				stdout,
				`${ name }@${ version } metadata`
			);
		} catch ( error ) {
			if ( isNpmPackageVersionMissing( error ) ) {
				continue;
			}
			throw error;
		}

		const {
			version: registryVersion,
			gitHead: registryGitHead,
			'dist-tags': distTags = {},
		} = registryPackage;
		if ( registryVersion !== version ) {
			throw new Error(
				`Expected npm registry lookup for ${ name }@${ version } to return version ${ version }, got ${ registryVersion }.`
			);
		}

		if ( registryGitHead !== publishCommit ) {
			throw new Error(
				`${ name }@${ version } exists in the npm registry with gitHead ${
					registryGitHead || 'nothing'
				}, expected ${ publishCommit }.`
			);
		}

		if ( distTags[ distTag ] !== version ) {
			throw new Error(
				`${ name }@${ version } exists in the npm registry, but dist-tag "${ distTag }" points to ${
					distTags[ distTag ] || 'nothing'
				}. If another release moved the dist-tag, this prepared release is not safe to resume.`
			);
		}
		publishedPackageNames.push( name );
	}
	return publishedPackageNames;
}

/**
 * Pushes and verifies Git metadata for an npm release.
 *
 * @param {Object}   options                             Options.
 * @param {string}   options.gitWorkingDirectoryPath     Git working directory path.
 * @param {string}   options.npmReleaseBranch            Npm release branch.
 * @param {string[]} options.packageTags                 Package tag names.
 * @param {string}   options.publishCommit               Publish commit SHA.
 * @param {Object}   deps                                Dependencies.
 * @param {Object}   deps.git                            Git client.
 * @param {Function} deps.runPhase                       Runs a retryable phase.
 * @param {Function} deps.verifyRemoteNpmReleaseBranchFn Verifies the remote branch.
 * @param {Function} deps.verifyRemotePackageTagsFn      Verifies remote package tags.
 */
async function pushNpmReleaseGitMetadata(
	{ gitWorkingDirectoryPath, npmReleaseBranch, packageTags, publishCommit },
	deps = {}
) {
	const {
		git = SimpleGit( gitWorkingDirectoryPath ),
		runPhase = runNpmReleasePhase,
		verifyRemoteNpmReleaseBranchFn = verifyRemoteNpmReleaseBranch,
		verifyRemotePackageTagsFn = verifyRemotePackageTags,
	} = deps;
	try {
		await runPhase( 'Release branch push', async () => {
			log( '>> Pushing release branch to remote.' );
			await git.raw(
				'push',
				'origin',
				`${ publishCommit }:refs/heads/${ npmReleaseBranch }`
			);
		} );
		await runPhase( 'Release branch verification', async () =>
			verifyRemoteNpmReleaseBranchFn( {
				gitWorkingDirectoryPath,
				npmReleaseBranch,
				publishCommit,
			} )
		);

		if ( packageTags.length ) {
			for ( const packageTagChunk of chunk(
				packageTags,
				NPM_RELEASE_TAG_PUSH_BATCH_SIZE
			) ) {
				await runPhase( 'Package tag push', async () => {
					log( '>> Pushing package tags to remote.' );
					await git.raw(
						'push',
						'origin',
						...packageTagChunk.map( getTagRefspec )
					);
				} );
			}
			await runPhase( 'Package tag verification', async () =>
				verifyRemotePackageTagsFn( {
					gitWorkingDirectoryPath,
					packageTags,
					publishCommit,
				} )
			);
		}
	} catch ( error ) {
		log(
			'>> npm release Git metadata did not finish. Use these recovery commands after checking the remote state:\n\n' +
				getNpmReleaseGitRecoveryCommands( {
					npmReleaseBranch,
					packageTags,
					publishCommit,
				} )
		);
		throw error;
	}
}

/**
 * Publishes packages from an exact prepared release commit.
 *
 * @param {Object}   options                         Options.
 * @param {string}   options.distTag                 The dist-tag used for npm publishing.
 * @param {string}   options.gitWorkingDirectoryPath Git working directory path.
 * @param {string}   options.noVerifyAccessFlag      Lerna no-verify-access flag.
 * @param {string}   options.publishCommit           Prepared release commit SHA.
 * @param {Array}    options.releasePackages         Packages to publish.
 * @param {string}   options.yesFlag                 Lerna yes flag.
 * @param {Object}   deps                            Dependencies.
 * @param {Function} deps.commandFn                  Command runner.
 * @param {Object}   deps.git                        Git client.
 * @param {Function} deps.runNpmPublishPreflightFn   Runs npm preflight.
 * @param {Function} deps.runPhase                   Runs a retryable phase.
 */
async function publishVersionedPackagesToNpm(
	{
		distTag,
		gitWorkingDirectoryPath,
		noVerifyAccessFlag,
		publishCommit,
		releasePackages,
		yesFlag,
	},
	deps = {}
) {
	const {
		commandFn = command,
		git = SimpleGit( gitWorkingDirectoryPath ),
		runNpmPublishPreflightFn = runNpmPublishPreflight,
		runPhase = runNpmReleasePhase,
	} = deps;
	const checkedOutCommit = await git.revparse( [ 'HEAD' ] );
	if ( checkedOutCommit !== publishCommit ) {
		throw new Error(
			`Expected prepared npm release commit ${ publishCommit }, found ${ checkedOutCommit }.`
		);
	}
	if ( ( await git.raw( 'status', '--porcelain' ) ).trim() ) {
		throw new Error(
			`Prepared npm release checkout ${ publishCommit } has uncommitted changes.`
		);
	}
	const publishCommand = `npx lerna publish from-package --dist-tag ${ distTag } --git-head ${ publishCommit } ${ yesFlag } ${ noVerifyAccessFlag }`;
	const getPublishedPackageNames = () =>
		runNpmPublishPreflightFn( {
			distTag,
			gitWorkingDirectoryPath,
			publishCommit,
			releasePackages,
		} );
	const publishRemainingPackages = async ( publishedPackageNames ) => {
		if ( publishedPackageNames.length === releasePackages.length ) {
			log( '>> All target package versions are already published.' );
			return;
		}
		log( '>> Publishing modified packages to npm.' );
		await commandFn( publishCommand, {
			cwd: gitWorkingDirectoryPath,
			stdio: 'inherit',
		} );
	};

	const publishedPackageNames = await getPublishedPackageNames();
	try {
		await publishRemainingPackages( publishedPackageNames );
	} catch {
		log(
			'>> Trying to finish failed publishing of modified npm packages.'
		);
		// A failed Lerna publish can leave temporary `gitHead` manifest changes.
		// Reset to the version commit so `from-package` sees a clean tree on retry.
		await git.raw( 'reset', '--hard', publishCommit );
		try {
			await publishRemainingPackages( await getPublishedPackageNames() );
		} catch ( error ) {
			await git.raw( 'reset', '--hard', publishCommit );
			log(
				`>> Rerun the publish phase for prepared commit ${ publishCommit }; registry validation will accept packages that finished publishing.`
			);
			throw error;
		}
	}

	// Lerna treats publish conflicts as successful "already published" results,
	// so verify registry identity again before finishing the publish phase.
	await runPhase( 'npm publication verification', async () => {
		const finalPublishedPackageNames = new Set(
			await getPublishedPackageNames()
		);
		const unpublishedPackageVersions = releasePackages
			.filter( ( { name } ) => ! finalPublishedPackageNames.has( name ) )
			.map( ( { name, version } ) => `${ name }@${ version }` );
		if ( unpublishedPackageVersions.length ) {
			throw new Error(
				`npm publication verification failed for ${ unpublishedPackageVersions.join(
					', '
				) }.`
			);
		}
	} );
}

/**
 * Prepares npm release Git metadata, or reuses the exact pending prepared
 * commit when an earlier preparation run already pushed it.
 *
 * @param {WPPackagesConfig} config Command config.
 * @param {Object}           deps   Dependencies.
 *
 * @return {Promise<?Object>} Prepared release state.
 */
async function prepareNpmRelease( config, deps = {} ) {
	const {
		askForConfirmationFn = askForConfirmation,
		checkoutNpmReleaseBranchFn = checkoutNpmReleaseBranch,
		createNpmReleaseMarkerFn = createNpmReleaseMarker,
		findPluginReleaseBranchNameFn = findPluginReleaseBranchName,
		getPendingPreparedNpmReleaseStateFn = getPendingPreparedNpmReleaseState,
		preparePackagesForNpmFn = preparePackagesForNpm,
		runNpmReleaseBranchSyncStepFn = runNpmReleaseBranchSyncStep,
		updatePackagesFn = updatePackages,
	} = deps;

	await checkoutNpmReleaseBranchFn( config );
	const pendingReleaseState =
		await getPendingPreparedNpmReleaseStateFn( config );
	if ( pendingReleaseState && ! pendingReleaseState.isFinalized ) {
		if (
			pendingReleaseState.releaseId !== config.releaseId ||
			pendingReleaseState.releaseType !== config.releaseType
		) {
			throw new Error(
				`NpmRelease: A ${ pendingReleaseState.releaseType } release from invocation ${ pendingReleaseState.releaseId } is still pending. Resume it with --release-id ${ pendingReleaseState.releaseId } before starting another release.`
			);
		}
		return pendingReleaseState;
	}
	if (
		pendingReleaseState?.isFinalized &&
		pendingReleaseState.releaseId === config.releaseId &&
		pendingReleaseState.releaseType === config.releaseType
	) {
		return pendingReleaseState;
	}
	if ( pendingReleaseState?.isFinalized ) {
		if ( config.interactive ) {
			await askForConfirmationFn(
				`The previous npm release (${ pendingReleaseState.releaseId }) is finalized. Start a new ${ config.releaseType } release?`,
				false,
				config.abortMessage
			);
		}
		log(
			`>> Starting release ${ config.releaseId } after finalized release ${ pendingReleaseState.releaseId }.`
		);
	}

	let pluginReleaseBranch = null;
	if ( [ 'latest', 'next' ].includes( config.releaseType ) ) {
		pluginReleaseBranch =
			config.releaseType === 'next'
				? 'trunk'
				: await findPluginReleaseBranchNameFn(
						config.gitWorkingDirectoryPath
				  );
	}
	if ( pluginReleaseBranch ) {
		await runNpmReleaseBranchSyncStepFn( pluginReleaseBranch, config );
	}
	await createNpmReleaseMarkerFn( pluginReleaseBranch, config );
	await updatePackagesFn( config );
	return preparePackagesForNpmFn( config );
}

/**
 * Versions packages and pushes the exact prepared release commit.
 * Package tags remain local until npm publication succeeds.
 *
 * @param {WPPackagesConfig} config Command config.
 * @param {Object}           deps   Dependencies.
 *
 * @return {Promise<?Object>} Prepared commit and package metadata.
 */
async function preparePackagesForNpm(
	{
		gitWorkingDirectoryPath,
		interactive,
		minimumVersionBump,
		npmReleaseBranch,
		releaseType,
	},
	deps = {}
) {
	const {
		commandFn = command,
		getNpmReleasePackagesFn = getNpmReleasePackages,
		git = SimpleGit( gitWorkingDirectoryPath ),
		pushNpmReleaseGitMetadataFn = pushNpmReleaseGitMetadata,
	} = deps;
	log( '>> Installing npm packages.' );
	await commandFn( 'npm ci', {
		cwd: gitWorkingDirectoryPath,
	} );

	// Timestamp is the current time in `YYYYMMDDHHMM` format.
	const timestamp = new Date()
		.toISOString()
		.substring( 0, 16 )
		.replace( /[-:T]/g, '' );

	const yesFlag = interactive ? '' : '--yes';
	if ( releaseType === 'next' ) {
		log(
			'>> Bumping version of public packages changed since the last release.'
		);

		await commandFn(
			`npx lerna version pre${ minimumVersionBump } --preid next.v.${ timestamp } --no-private --no-push ${ yesFlag }`,
			{
				cwd: gitWorkingDirectoryPath,
				stdio: 'inherit',
			}
		);
	} else {
		log(
			'>> Bumping version of public packages changed since the last release.'
		);
		await commandFn(
			`npx lerna version ${ minimumVersionBump } --no-private --no-push ${ yesFlag }`,
			{
				cwd: gitWorkingDirectoryPath,
				stdio: 'inherit',
			}
		);
	}

	const releasePackages = await getNpmReleasePackagesFn(
		gitWorkingDirectoryPath
	);
	if ( releasePackages.length === 0 ) {
		log( '>> No package versions were prepared.' );
		return;
	}
	const publishCommit = await git.revparse( [ 'HEAD' ] );
	await pushNpmReleaseGitMetadataFn( {
		gitWorkingDirectoryPath,
		npmReleaseBranch,
		packageTags: [],
		publishCommit,
	} );

	return { publishCommit, releasePackages };
}

/**
 * Validates and publishes an exact prepared release checkout.
 *
 * @param {WPPackagesConfig} config Command config.
 * @param {Object}           deps   Dependencies.
 */
async function publishPreparedPackagesToNpm( config, deps = {} ) {
	const { gitWorkingDirectoryPath, interactive } = config;
	const {
		commandFn = command,
		getPreparedNpmReleaseStateFn = getPreparedNpmReleaseState,
		publishVersionedPackagesToNpmFn = publishVersionedPackagesToNpm,
	} = deps;
	const releaseState = await getPreparedNpmReleaseStateFn( config );
	if ( releaseState.isFinalized ) {
		log( '>> The prepared npm release is already finalized.' );
		return;
	}

	log( '>> Installing npm packages.' );
	await commandFn( 'npm ci', { cwd: gitWorkingDirectoryPath } );
	log( '>> Current npm user:' );
	await commandFn( 'npm whoami', {
		cwd: gitWorkingDirectoryPath,
		stdio: 'inherit',
	} );

	await publishVersionedPackagesToNpmFn(
		{
			distTag: releaseState.distTag,
			gitWorkingDirectoryPath,
			noVerifyAccessFlag: interactive ? '' : '--no-verify-access',
			publishCommit: releaseState.publishCommit,
			releasePackages: releaseState.releasePackages,
			yesFlag: interactive ? '' : '--yes',
		},
		{ commandFn }
	);
}

/**
 * Backports release commits and pushes package tags after npm publication.
 *
 * @param {WPPackagesConfig} config Command config.
 * @param {Object}           deps   Dependencies.
 */
async function finalizePreparedNpmRelease( config, deps = {} ) {
	const { gitWorkingDirectoryPath, releaseType } = config;
	const {
		backportCommitsToBranchFn = backportCommitsToBranch,
		createNpmReleaseFinalizationMarkerFn = createNpmReleaseFinalizationMarker,
		getPreparedNpmReleaseStateFn = getPreparedNpmReleaseState,
		getRemoteTagShasFn = getRemoteTagShas,
		git = SimpleGit( gitWorkingDirectoryPath ),
		pushNpmReleaseGitMetadataFn = pushNpmReleaseGitMetadata,
		runNpmPublishPreflightFn = runNpmPublishPreflight,
	} = deps;
	const releaseState = await getPreparedNpmReleaseStateFn( config );
	if ( releaseState.isFinalized ) {
		log( '>> The prepared npm release is already finalized.' );
		return;
	}
	const packageTags = releaseState.releasePackages.map(
		( { tagName } ) => tagName
	);
	const remoteTagShas = await getRemoteTagShasFn(
		gitWorkingDirectoryPath,
		packageTags
	);
	const missingPackageTags = getMissingRemotePackageTags(
		remoteTagShas,
		packageTags,
		releaseState.publishCommit
	);
	const publishedPackageNames = await runNpmPublishPreflightFn( {
		checkAccess: false,
		distTag: releaseState.distTag,
		gitWorkingDirectoryPath,
		publishCommit: releaseState.publishCommit,
		releasePackages: releaseState.releasePackages,
	} );
	if (
		publishedPackageNames.length !== releaseState.releasePackages.length
	) {
		throw new Error(
			`Prepared npm release commit ${ releaseState.publishCommit } is not fully published.`
		);
	}
	if ( missingPackageTags.length === 0 ) {
		log( '>> Package tags are already pushed; recording finalization.' );
		await createNpmReleaseFinalizationMarkerFn( releaseState, config );
		return;
	}

	if ( [ 'latest', 'bugfix' ].includes( releaseType ) ) {
		const commits = [
			releaseState.changelogCommit,
			releaseState.publishCommit,
		].filter( Boolean );
		await backportCommitsToBranchFn( 'trunk', commits, config );
		if ( releaseType === 'latest' ) {
			await backportCommitsToBranchFn(
				releaseState.pluginReleaseBranch,
				commits,
				config
			);
		}
	}

	for ( const tagName of missingPackageTags ) {
		let localTagCommit;
		try {
			localTagCommit = (
				( await git.raw( 'rev-list', '-n', '1', tagName ) ) || ''
			).trim();
		} catch {
			// The tag has not been created in this checkout yet.
		}
		if ( localTagCommit && localTagCommit !== releaseState.publishCommit ) {
			throw new Error(
				`Package tag ${ tagName } points to ${ localTagCommit }, expected ${ releaseState.publishCommit }.`
			);
		}
		if ( ! localTagCommit ) {
			await git.raw(
				'tag',
				'-a',
				tagName,
				releaseState.publishCommit,
				'-m',
				tagName
			);
		}
	}
	await pushNpmReleaseGitMetadataFn( {
		gitWorkingDirectoryPath,
		npmReleaseBranch: releaseState.npmReleaseBranch,
		packageTags: missingPackageTags,
		publishCommit: releaseState.publishCommit,
	} );
	await createNpmReleaseFinalizationMarkerFn( releaseState, config );
}

/**
 * Backports commits from the release branch to the selected branch.
 *
 * @param {string}           branchName Selected branch name.
 * @param {string[]}         commits    The list of commits to backport.
 * @param {WPPackagesConfig} config     Command config.
 * @param {Object}           deps       Dependencies.
 * @param {Object}           deps.repo  Git client.
 */
async function backportCommitsToBranch(
	branchName,
	commits,
	{ abortMessage, gitWorkingDirectoryPath, interactive },
	deps = {}
) {
	if ( commits.length === 0 ) {
		return;
	}

	if ( interactive ) {
		await askForConfirmation(
			`Commits are going to be backported to "${ branchName }". Continue?`,
			true,
			abortMessage
		);
	}

	log( `>> Backporting commits to "${ branchName }".` );

	const { repo = SimpleGit( gitWorkingDirectoryPath ) } = deps;

	/*
	 * Reset any local changes and replace them with the origin branch's copy.
	 *
	 * Perform an additional fetch to ensure that when we push our changes that
	 * it's very unlikely that new commits could have appeared at the origin
	 * HEAD between when we started running this script and now when we're
	 * pushing our changes back upstream.
	 */
	await repo.fetch().checkout( branchName ).pull( 'origin', branchName );

	for ( const commitHash of commits ) {
		const cherryStatus = (
			await repo.raw( 'cherry', 'HEAD', commitHash, `${ commitHash }^` )
		).trim();
		if ( ! cherryStatus.startsWith( '+' ) ) {
			log( `>> Commit ${ commitHash } is already backported.` );
			continue;
		}
		await repo.raw( 'cherry-pick', commitHash );
	}

	await repo.push( 'origin', branchName );

	log( `>> Backporting successfully finished.` );
}

/**
 * Runs WordPress packages release.
 *
 * @param {WPPackagesConfig} config         Command config.
 * @param {string[]}         customMessages Custom messages to print in the terminal.
 * @param {Object}           deps           Dependencies.
 *
 * @return {Promise<void>}
 */
async function runPackagesRelease( config, customMessages, deps = {} ) {
	const {
		finalizePreparedNpmReleaseFn = finalizePreparedNpmRelease,
		prepareNpmReleaseFn = prepareNpmRelease,
		publishPreparedPackagesToNpmFn = publishPreparedPackagesToNpm,
	} = deps;
	log(
		formats.title(
			'\n💃 Time to publish WordPress packages to npm 🕺\n\n'
		),
		"To perform a release you'll have to be a member of the WordPress Team on npm.\n",
		...customMessages
	);

	if ( config.interactive ) {
		await askForConfirmation( 'Ready to go?' );
	}

	const temporaryFolders = [];
	if (
		[ 'publish', 'finalize' ].includes( config.phase ) &&
		! config.gitWorkingDirectoryPath
	) {
		throw new Error(
			`The ${ config.phase } phase requires --repository-path pointing to the prepared release checkout.`
		);
	}
	if ( ! config.gitWorkingDirectoryPath ) {
		const gitPath = getRandomTemporaryPath();
		config.gitWorkingDirectoryPath = gitPath;
		fs.mkdirSync( gitPath, { recursive: true } );
		temporaryFolders.push( gitPath );

		await runStep(
			'Cloning the Git repository',
			config.abortMessage,
			async () => {
				log( '>> Cloning the Git repository' );
				await SimpleGit().clone(
					pluginConfig.gitRepositoryURL,
					gitPath,
					[ '--depth=1', '--no-single-branch' ]
				);
				log( `   >> successfully clone into: ${ gitPath }` );
			}
		);
	}

	let hasPreparedRelease = true;
	if ( [ 'prepare', 'all' ].includes( config.phase ) ) {
		const releaseState = await prepareNpmReleaseFn( config );
		hasPreparedRelease = Boolean(
			releaseState && ! releaseState.isFinalized
		);
		if ( releaseState?.isFinalized ) {
			log( '>> This npm release invocation is already finalized.' );
		}
		if ( config.phase === 'prepare' && hasPreparedRelease ) {
			log( '>> npm release preparation finished.' );
		}
	}

	if ( hasPreparedRelease && [ 'publish', 'all' ].includes( config.phase ) ) {
		await publishPreparedPackagesToNpmFn( config );
	}
	if (
		hasPreparedRelease &&
		[ 'finalize', 'all' ].includes( config.phase )
	) {
		await finalizePreparedNpmReleaseFn( config );
	}

	await runStep(
		'Cleaning the temporary folders',
		'Cleaning failed',
		async () =>
			await Promise.all(
				temporaryFolders
					.filter( ( tempDir ) => fs.existsSync( tempDir ) )
					.map( ( tempDir ) => rimraf( tempDir ) )
			)
	);

	if (
		hasPreparedRelease &&
		[ 'finalize', 'all' ].includes( config.phase )
	) {
		log(
			'\n>> 🎉 WordPress packages are now published!\n\n',
			'Let also people know on WordPress Slack and celebrate together.'
		);
	}
}

/**
 * Gets config object.
 *
 * @param {ReleaseType}              releaseType            The selected release type.
 * @param {WPPackagesCommandOptions} options                Command options.
 * @param {Object}                   deps                   Dependencies.
 * @param {Function}                 deps.createReleaseIdFn Creates a release ID.
 * @param {?string}                  deps.githubRunId       GitHub Actions run ID.
 *
 * @return {WPPackagesConfig} The config object.
 */
function getConfig(
	releaseType,
	{
		ci,
		phase = 'all',
		releaseId,
		repositoryPath,
		semver = 'patch',
		wpVersion,
	},
	deps = {}
) {
	if ( ! [ 'prepare', 'publish', 'finalize', 'all' ].includes( phase ) ) {
		throw new Error(
			`Unknown npm release phase "${ phase }". Expected prepare, publish, finalize, or all.`
		);
	}
	const {
		createReleaseIdFn = randomUUID,
		githubRunId = process.env.GITHUB_RUN_ID,
	} = deps;
	const stableReleaseId =
		releaseId ?? githubRunId ?? ( ci ? null : createReleaseIdFn() );
	if ( ! stableReleaseId ) {
		throw new Error(
			'NpmRelease: A stable release ID is required in non-interactive mode. Pass --release-id or run in GitHub Actions.'
		);
	}
	if ( ! /^[A-Za-z0-9._-]+$/.test( stableReleaseId ) ) {
		throw new Error(
			'NpmRelease: The release ID may contain only letters, numbers, dots, underscores, and hyphens.'
		);
	}
	let distTag = 'latest';
	let npmReleaseBranch = 'wp/latest';
	if ( releaseType === 'next' ) {
		distTag = 'next';
		npmReleaseBranch = 'wp/next';
	} else if ( releaseType === 'wp' ) {
		distTag = `wp-${ wpVersion }`;
		npmReleaseBranch = `wp/${ wpVersion }`;
	}

	return {
		abortMessage: 'Aborting!',
		distTag,
		gitWorkingDirectoryPath:
			repositoryPath && join( process.cwd(), repositoryPath ),
		interactive: ! ci,
		minimumVersionBump: semver,
		npmReleaseBranch,
		phase,
		releaseId: stableReleaseId,
		releaseType,
	};
}

/**
 * Publishes to npm packages synced from the Gutenberg plugin (latest dist-tag, production version).
 *
 * @param {WPPackagesCommandOptions} options Command options.
 */
async function publishNpmGutenbergPlugin( options ) {
	await runPackagesRelease( getConfig( 'latest', options ), [
		'Welcome! This tool helps with npm publishing a new latest version of WordPress packages synced from the Gutenberg plugin.\n',
	] );
}

/**
 * Publishes to npm bugfixes for packages (latest dist-tag, production version).
 *
 * @param {WPPackagesCommandOptions} options Command options.
 */
async function publishNpmBugfixLatest( options ) {
	await runPackagesRelease( getConfig( 'bugfix', options ), [
		'Welcome! This tool helps with npm publishing a new bugfix version of WordPress packages.\n',
		'Make sure that all required changes have been already cherry-picked to the `wp/latest` release branch.\n',
	] );
}

/**
 * Publishes to npm bugfixes targeting WordPress core (wp-X.Y dist-tag, production version).
 *
 * @param {WPPackagesCommandOptions} options Command options.
 */
async function publishNpmBugfixWordPressCore( options ) {
	await runPackagesRelease( getConfig( 'wp', options ), [
		'Welcome! This tool helps with npm publishing a new bugfix version of WordPress packages targeting WordPress core.\n',
		'Make sure that all required changes have been already cherry-picked to the `wp/X.Y` release branch.\n',
	] );
}

/**
 * Publishes to npm development version of packages (next dist-tag, prerelease version).
 *
 * @param {WPPackagesCommandOptions} options Command options.
 */
async function publishNpmNext( options ) {
	await runPackagesRelease( getConfig( 'next', options ), [
		'Welcome! This tool helps with npm publishing a development version of WordPress packages.\n',
	] );
}

module.exports = {
	backportCommitsToBranch,
	checkoutNpmReleaseBranch,
	createNpmReleaseFinalizationMarker,
	createNpmReleaseMarker,
	finalizePreparedNpmRelease,
	getConfig,
	getNpmReleasePackages,
	getNpmReleaseGitRecoveryCommands,
	getPendingPreparedNpmReleaseState,
	getPreparedNpmReleasePackages,
	getPreparedNpmReleaseState,
	getRemoteBranchSha,
	getRemoteTagShas,
	getTagPushCommands,
	getTagRefspec,
	isNpmReleaseFinalizationMarker,
	parseNpmReleaseMarkerSubject,
	prepareNpmRelease,
	preparePackagesForNpm,
	publishPreparedPackagesToNpm,
	publishVersionedPackagesToNpm,
	pushNpmReleaseGitMetadata,
	publishNpmGutenbergPlugin,
	publishNpmBugfixLatest,
	publishNpmBugfixWordPressCore,
	publishNpmNext,
	runPackagesRelease,
	runNpmPublishPreflight,
	runNpmReleasePhase,
	verifyRemotePackageTags,
};
