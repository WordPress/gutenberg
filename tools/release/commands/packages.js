const path = require( 'path' );
const fs = require( 'fs' );
const readline = require( 'readline' );
const { join } = require( 'path' );
const { command } = require( 'execa' );
const glob = require( 'fast-glob' );
const { inc: semverInc, parse: semverParse } = require( 'semver' );
const { rimraf } = require( 'rimraf' );
const SimpleGit = require( 'simple-git' );
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
/*
 * Registry propagation after a large publish is unbounded in practice: a 121
 * package release has been observed taking ~25 minutes for the last package to
 * become visible. Verification retries are cheap because each attempt only
 * re-checks the packages still missing, so the budget is sized for the tail
 * rather than the common case.
 */
const NPM_RELEASE_VERIFICATION_ATTEMPTS = 18;
const NPM_RELEASE_PHASE_MAX_DELAY_MS = 120000;
// Keep tag pushes small enough that GitHub ruleset validation handles each phase predictably.
const NPM_RELEASE_TAG_PUSH_BATCH_SIZE = 25;
/*
 * `lerna version --no-push` leaves the prepared release commit only on the
 * runner, so any failure before Git metadata is pushed destroys the commit that
 * every published package records as its `gitHead`. Persist it to a scratch ref
 * first: it survives the runner, it lets a re-run resume from the same commit,
 * and unlike pushing the release branch it never advertises versions that are
 * not on npm yet.
 */
const NPM_RELEASE_PREPARED_REF_PREFIX = 'refs/npm-release';

class NpmReleaseVerificationPendingError extends Error {}

/**
 * Release type names.
 *
 * @typedef {('latest'|'bugfix'|'patch'|'next')} ReleaseType
 */

/**
 * Semantic Versioning labels.
 *
 * @typedef {('major'|'minor'|'patch')} SemVer
 */

/**
 * @typedef WPPackagesCommandOptions
 *
 * @property {boolean} [ci]             Disables interactive mode when executed in CI mode.
 * @property {string}  [repositoryPath] Relative path to the git repository.
 * @property {SemVer}  [semver]         The selected semantic versioning. Defaults to `patch`.
 * @property {string}  [wpVersion]      The major WordPress version number, example: `6.0`.
 */

/**
 * @typedef WPPackagesConfig
 *
 * @property {string}      abortMessage            Abort Message.
 * @property {string}      distTag                 The dist-tag used for npm publishing.
 * @property {string}      gitWorkingDirectoryPath Git working directory path.
 * @property {boolean}     interactive             Whether to run in interactive mode.
 * @property {SemVer}      minimumVersionBump      The selected minimum version bump.
 * @property {string}      npmReleaseBranch        The selected branch for npm release.
 * @property {ReleaseType} releaseType             The selected release type.
 */

/**
 * Checks out the npm release branch.
 *
 * @param {WPPackagesConfig} options The config object.
 */
async function checkoutNpmReleaseBranch( {
	gitWorkingDirectoryPath,
	npmReleaseBranch,
} ) {
	/*
	 * Create the release branch.
	 *
	 * Note that we are grabbing an arbitrary depth of commits (999) during the fetch.
	 * When Lerna attempts to determine if a package needs an update, it looks at
	 * `git` history to find the commit created during the previous npm publishing.
	 * Lerna assumes that all packages need publishing if it can't access
	 * the necessary information.
	 */
	await SimpleGit( gitWorkingDirectoryPath )
		.fetch( 'origin', npmReleaseBranch, [ '--depth=999' ] )
		.checkout( npmReleaseBranch );
	log(
		'>> The local npm release branch ' +
			formats.success( npmReleaseBranch ) +
			' has been successfully checked out.'
	);
}

/**
 * Checks out the npm release branch and syncs it with the changes from
 * the last plugin release.
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
		await checkoutNpmReleaseBranch( config );

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

		const { commit: commitHash } = await repo.commit(
			`Merge changes published in the Gutenberg plugin "${ pluginReleaseBranch }" branch`
		);

		if ( commitHash ) {
			await runPushGitChangesStep( config );
		}

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

	if ( commitHash ) {
		await runPushGitChangesStep( config );
	}

	log( '>> Changelog files have been updated successfully.' );

	return commitHash;
}

/**
 * Push the local Git Changes the remote repository.
 *
 * @param {WPPackagesConfig} config Command config.
 */
async function runPushGitChangesStep( {
	gitWorkingDirectoryPath,
	interactive,
	npmReleaseBranch,
} ) {
	const abortMessage = `Aborting! Make sure to push changes applied to npm release branch "${ npmReleaseBranch }" manually.`;
	await runStep( 'Pushing the release branch', abortMessage, async () => {
		if ( interactive ) {
			await askForConfirmation(
				'The release branch is going to be pushed to the remote repository. Continue?',
				true,
				abortMessage
			);
		}
		await SimpleGit( gitWorkingDirectoryPath ).push(
			'origin',
			npmReleaseBranch
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
 * @param {string}   label            Phase label.
 * @param {Function} task             Task to retry.
 * @param {Object}   deps             Dependencies.
 * @param {Function} deps.shouldRetry Whether an error is safe to retry.
 * @param {Function} deps.wait        Wait function.
 */
async function runNpmReleasePhase( label, task, deps = {} ) {
	const {
		attempts = NPM_RELEASE_PHASE_ATTEMPTS,
		shouldRetry = () => true,
		wait = ( delay ) =>
			new Promise( ( resolve ) => setTimeout( resolve, delay ) ),
	} = deps;
	for ( let attempt = 1; ; attempt++ ) {
		try {
			await task();
			return;
		} catch ( err ) {
			if ( attempt >= attempts || ! shouldRetry( err ) ) {
				throw err;
			}
			/*
			 * Back off exponentially rather than linearly. A linear `attempt * 5s`
			 * schedule spends almost all of a retry budget on the first few
			 * attempts, which is the wrong shape for registry propagation.
			 */
			const delay = Math.min(
				2 ** ( attempt - 1 ) * 5000,
				NPM_RELEASE_PHASE_MAX_DELAY_MS
			);
			log(
				`>> ${ label } failed (attempt ${ attempt }/${ attempts }): ${
					err.message
				}, retrying in ${ delay / 1000 }s...`
			);
			await wait( delay );
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
 * Reports whether a remote branch contains a commit.
 *
 * @param {Object}   options                         Options.
 * @param {string}   options.gitWorkingDirectoryPath Git working directory path.
 * @param {string}   options.branchName              Remote branch name.
 * @param {string}   options.commit                  Commit SHA.
 * @param {Object}   deps                            Dependencies.
 * @param {Function} deps.getRemoteBranchShaFn       Gets the remote branch SHA.
 * @param {Object}   deps.git                        Git client.
 *
 * @return {Promise<boolean>} Whether the remote branch contains the commit.
 */
async function isCommitOnRemoteBranch(
	{ gitWorkingDirectoryPath, branchName, commit },
	deps = {}
) {
	const {
		getRemoteBranchShaFn = getRemoteBranchSha,
		git = SimpleGit( gitWorkingDirectoryPath ),
	} = deps;
	const remoteSha = await getRemoteBranchShaFn(
		gitWorkingDirectoryPath,
		branchName,
		{ git }
	);
	if ( ! remoteSha ) {
		return false;
	}
	if ( remoteSha === commit ) {
		return true;
	}
	// `ls-remote` can report a branch tip that this checkout has not fetched yet.
	await git.raw( 'fetch', 'origin', branchName );
	const mergeBase = await git.raw( 'merge-base', commit, remoteSha );
	return mergeBase.trim() === commit;
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
 * @param {Function} deps.isCommitOnRemoteBranchFn   Checks remote branch ancestry.
 */
async function verifyRemoteNpmReleaseBranch(
	{ gitWorkingDirectoryPath, npmReleaseBranch, publishCommit },
	deps = {}
) {
	const { isCommitOnRemoteBranchFn = isCommitOnRemoteBranch } = deps;
	if (
		! ( await isCommitOnRemoteBranchFn( {
			gitWorkingDirectoryPath,
			branchName: npmReleaseBranch,
			commit: publishCommit,
		} ) )
	) {
		throw new Error(
			`Expected origin/${ npmReleaseBranch } to contain ${ publishCommit }.`
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
	{ distTag, gitWorkingDirectoryPath, publishCommit, releasePackages },
	deps = {}
) {
	const { commandFn = command } = deps;
	/*
	 * `npm whoami` fails for every credential problem that happens in practice:
	 * a missing, expired, or revoked auth token, or an unreachable registry.
	 */
	log( '>> Checking npm authentication.' );
	const { stdout: whoamiOutput } = await commandFn( 'npm whoami', {
		cwd: gitWorkingDirectoryPath,
		stdio: 'pipe',
	} );
	log( `>> Authenticated as "${ whoamiOutput.trim() }".` );

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
 * @param {Function} deps.isCommitOnRemoteBranchFn       Checks remote branch ancestry.
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
		isCommitOnRemoteBranchFn = isCommitOnRemoteBranch,
		runPhase = runNpmReleasePhase,
		verifyRemoteNpmReleaseBranchFn = verifyRemoteNpmReleaseBranch,
		verifyRemotePackageTagsFn = verifyRemotePackageTags,
	} = deps;
	try {
		await runPhase( 'Release branch push', async () => {
			if (
				await isCommitOnRemoteBranchFn(
					{
						gitWorkingDirectoryPath,
						branchName: npmReleaseBranch,
						commit: publishCommit,
					},
					{ git }
				)
			) {
				log(
					`>> The release branch already contains ${ publishCommit }; leaving its newer tip unchanged.`
				);
				return;
			}
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
			'>> npm publication completed, but Git metadata did not finish. Use these recovery commands after checking the remote state:\n\n' +
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
 * Builds the prepared-release ref names for a release target.
 *
 * Each release target gets its own namespace so a `latest` release cannot
 * overwrite or delete the recovery data of a concurrent `next` or `wp-X.Y` one.
 *
 * @param {string} npmReleaseBranch Npm release branch.
 *
 * @return {{base: string, commit: string, pluginReleaseBranch: string, releaseType: string, tags: string}} Prepared ref names.
 */
function getNpmReleasePreparedRefs( npmReleaseBranch ) {
	const slug = npmReleaseBranch.replace( /\//g, '-' );
	const base = `${ NPM_RELEASE_PREPARED_REF_PREFIX }/${ slug }`;
	return {
		base,
		commit: `${ base }/commit`,
		pluginReleaseBranch: `${ base }/plugin-release-branch`,
		releaseType: `${ base }/release-type`,
		tags: `${ base }/tags`,
	};
}

/**
 * Returns safe inspection and cleanup guidance for a prepared release.
 *
 * @param {string} npmReleaseBranch Npm release branch.
 *
 * @return {string} Recovery guidance.
 */
function getNpmReleasePreparedStateRecoveryInstructions( npmReleaseBranch ) {
	const { base } = getNpmReleasePreparedRefs( npmReleaseBranch );
	return `Inspect it with \`git ls-remote --refs origin "${ base }/*"\`. Resume with the same release type, or, after verifying that the prepared release is no longer needed, delete each listed ref with \`git push origin --delete "<exact-ref>"\`.`;
}

/**
 * Pushes the prepared release commit and its package tags to scratch refs.
 *
 * The tags matter as much as the commit. `getNpmReleasePackages` derives the
 * release set from the tags Lerna left at `HEAD`, so a resumed runner without
 * them sees an empty release, skips publishing, pushes no tags, and reports
 * success.
 *
 * @param {Object}   options                         Options.
 * @param {string}   options.gitWorkingDirectoryPath Git working directory path.
 * @param {string}   options.npmReleaseBranch        Npm release branch.
 * @param {string[]} options.packageTags             Package tag names.
 * @param {?string}  options.pluginReleaseBranch     Plugin release branch.
 * @param {string}   options.publishCommit           Publish commit SHA.
 * @param {string}   options.releaseType             Release route.
 * @param {Object}   deps                            Dependencies.
 * @param {Object}   deps.git                        Git client.
 */
async function pushNpmReleasePreparedCommit(
	{
		gitWorkingDirectoryPath,
		npmReleaseBranch,
		packageTags,
		pluginReleaseBranch,
		publishCommit,
		releaseType,
	},
	deps = {}
) {
	const { git = SimpleGit( gitWorkingDirectoryPath ) } = deps;
	const refs = getNpmReleasePreparedRefs( npmReleaseBranch );
	log( '>> Persisting the prepared release state before publishing.' );
	for ( const packageTagChunk of chunk(
		packageTags,
		NPM_RELEASE_TAG_PUSH_BATCH_SIZE
	) ) {
		await git.raw(
			'push',
			'--no-follow-tags',
			'--force',
			'origin',
			...packageTagChunk.map(
				( tagName ) =>
					`refs/tags/${ tagName }:${ refs.tags }/${ tagName }`
			)
		);
	}
	const releaseRouteRefspecs = [
		`${ publishCommit }:${ refs.releaseType }/${ releaseType }`,
	];
	if ( pluginReleaseBranch ) {
		releaseRouteRefspecs.push(
			`${ publishCommit }:${ refs.pluginReleaseBranch }/${ pluginReleaseBranch }`
		);
	}
	await git.raw(
		'push',
		'--no-follow-tags',
		'--force',
		'origin',
		...releaseRouteRefspecs
	);
	/*
	 * Publish the commit ref last. Its presence is the completeness marker for
	 * the prepared state, so a failed tag batch cannot expose a partial release
	 * as resumable.
	 */
	await git.raw(
		'push',
		'--no-follow-tags',
		'--force',
		'origin',
		`${ publishCommit }:${ refs.commit }`
	);
}

/**
 * Reads and validates the route persisted for a prepared release.
 *
 * @param {string} gitWorkingDirectoryPath Git working directory path.
 * @param {string} npmReleaseBranch        Npm release branch.
 * @param {string} preparedCommit          Prepared commit SHA.
 * @param {Object} deps                    Dependencies.
 * @param {Object} deps.git                Git client.
 *
 * @return {Promise<{pluginReleaseBranch: ?string, releaseType: string}>} Prepared release route.
 */
async function getNpmReleasePreparedState(
	gitWorkingDirectoryPath,
	npmReleaseBranch,
	preparedCommit,
	deps = {}
) {
	const { git = SimpleGit( gitWorkingDirectoryPath ) } = deps;
	const refs = getNpmReleasePreparedRefs( npmReleaseBranch );
	const output = await git.raw(
		'ls-remote',
		'--refs',
		'origin',
		`${ refs.releaseType }/*`,
		`${ refs.pluginReleaseBranch }/*`
	);
	const entries = output
		.split( '\n' )
		.map( ( line ) => line.trim().split( /\s+/ ) )
		.filter( ( [ sha, ref ] ) => sha && ref );
	if ( entries.some( ( [ sha ] ) => sha !== preparedCommit ) ) {
		throw new Error(
			'Prepared release route does not point to the prepared commit.'
		);
	}
	const releaseTypes = entries
		.map( ( [ , ref ] ) => ref )
		.filter( ( ref ) => ref.startsWith( `${ refs.releaseType }/` ) )
		.map( ( ref ) => ref.slice( `${ refs.releaseType }/`.length ) );
	const pluginReleaseBranches = entries
		.map( ( [ , ref ] ) => ref )
		.filter( ( ref ) => ref.startsWith( `${ refs.pluginReleaseBranch }/` ) )
		.map( ( ref ) => ref.slice( `${ refs.pluginReleaseBranch }/`.length ) );
	if ( releaseTypes.length !== 1 || pluginReleaseBranches.length > 1 ) {
		throw new Error( 'Prepared release route metadata is incomplete.' );
	}
	return {
		pluginReleaseBranch: pluginReleaseBranches[ 0 ] || null,
		releaseType: releaseTypes[ 0 ],
	};
}

/**
 * Reads the prepared release commit from the scratch ref, if one exists.
 *
 * @param {string} gitWorkingDirectoryPath Git working directory path.
 * @param {string} npmReleaseBranch        Npm release branch.
 * @param {Object} deps                    Dependencies.
 * @param {Object} deps.git                Git client.
 *
 * @return {Promise<?string>} The prepared commit SHA, or null when absent.
 */
async function getNpmReleasePreparedCommit(
	gitWorkingDirectoryPath,
	npmReleaseBranch,
	deps = {}
) {
	const { git = SimpleGit( gitWorkingDirectoryPath ) } = deps;
	const refs = getNpmReleasePreparedRefs( npmReleaseBranch );
	const output = await git.raw( 'ls-remote', 'origin', refs.commit );
	const [ sha ] = output.trim().split( /\s+/ );
	return sha || null;
}

/**
 * Reads the package tag names persisted alongside a prepared commit.
 *
 * @param {string} gitWorkingDirectoryPath Git working directory path.
 * @param {string} npmReleaseBranch        Npm release branch.
 * @param {Object} deps                    Dependencies.
 * @param {Object} deps.git                Git client.
 *
 * @return {Promise<string[]>} Persisted package tag names.
 */
async function getNpmReleasePreparedTagNames(
	gitWorkingDirectoryPath,
	npmReleaseBranch,
	deps = {}
) {
	const { git = SimpleGit( gitWorkingDirectoryPath ) } = deps;
	const refs = getNpmReleasePreparedRefs( npmReleaseBranch );
	const output = await git.raw(
		'ls-remote',
		'--refs',
		'origin',
		`${ refs.tags }/*`
	);
	return output
		.split( '\n' )
		.map( ( line ) => line.trim().split( /\s+/ )[ 1 ] )
		.filter( Boolean )
		.map( ( ref ) => ref.slice( `${ refs.tags }/`.length ) );
}

/**
 * Restores the persisted package tags into the local repository.
 *
 * @param {string} gitWorkingDirectoryPath Git working directory path.
 * @param {string} npmReleaseBranch        Npm release branch.
 * @param {Object} deps                    Dependencies.
 * @param {Object} deps.git                Git client.
 */
async function restoreNpmReleasePreparedTags(
	gitWorkingDirectoryPath,
	npmReleaseBranch,
	deps = {}
) {
	const { git = SimpleGit( gitWorkingDirectoryPath ) } = deps;
	const refs = getNpmReleasePreparedRefs( npmReleaseBranch );
	log( '>> Restoring the package tags prepared by the previous run.' );
	await git.raw(
		'fetch',
		'--force',
		'origin',
		`${ refs.tags }/*:refs/tags/*`
	);
}

/**
 * Deletes the prepared release scratch refs.
 *
 * @param {string} gitWorkingDirectoryPath Git working directory path.
 * @param {string} npmReleaseBranch        Npm release branch.
 * @param {Object} deps                    Dependencies.
 * @param {Object} deps.git                Git client.
 */
async function deleteNpmReleasePreparedCommit(
	gitWorkingDirectoryPath,
	npmReleaseBranch,
	deps = {}
) {
	const { git = SimpleGit( gitWorkingDirectoryPath ) } = deps;
	const refs = getNpmReleasePreparedRefs( npmReleaseBranch );
	const output = await git.raw(
		'ls-remote',
		'--refs',
		'origin',
		`${ refs.base }/*`
	);
	const preparedRefs = output
		.split( '\n' )
		.map( ( line ) => line.trim().split( /\s+/ )[ 1 ] )
		.filter( Boolean );
	const tagRefs = preparedRefs.filter( ( ref ) =>
		ref.startsWith( `${ refs.tags }/` )
	);
	const preparedCommitRef = preparedRefs.find(
		( ref ) => ref === refs.commit
	);
	const refsDeletedWithTags = new Set( tagRefs );
	const tagRefChunks = chunk(
		tagRefs,
		NPM_RELEASE_TAG_PUSH_BATCH_SIZE - ( preparedCommitRef ? 1 : 0 )
	);
	for ( const [ index, tagRefChunk ] of tagRefChunks.entries() ) {
		const refChunk =
			index === 0 && preparedCommitRef
				? [ preparedCommitRef, ...tagRefChunk ]
				: tagRefChunk;
		await git.raw(
			'push',
			'--atomic',
			'--no-follow-tags',
			'origin',
			'--delete',
			...refChunk
		);
		if ( index === 0 && preparedCommitRef ) {
			refsDeletedWithTags.add( preparedCommitRef );
		}
	}
	const stateRefs = preparedRefs.filter(
		( ref ) => ! refsDeletedWithTags.has( ref )
	);
	if ( stateRefs.length ) {
		await git.raw(
			'push',
			'--atomic',
			'--no-follow-tags',
			'origin',
			'--delete',
			...stateRefs
		);
	}
}

/**
 * Reports whether the release branch and package tags contain the prepared commit.
 *
 * Containment in the release branch is not sufficient. Git metadata pushes the
 * branch before the package tags, so a run that lost the tag push leaves the
 * commit on the branch with tags still outstanding. Treating that metadata as
 * complete would skip the outstanding package tag publication.
 *
 * @param {Object}   options                         Options.
 * @param {string}   options.gitWorkingDirectoryPath Git working directory path.
 * @param {string}   options.npmReleaseBranch        Npm release branch.
 * @param {string}   options.preparedCommit          Prepared commit SHA.
 * @param {Object}   deps                            Dependencies.
 * @param {Function} deps.getPreparedTagNamesFn      Reads persisted tag names.
 * @param {Function} deps.getRemoteBranchShaFn       Reads the remote branch SHA.
 * @param {Object}   deps.git                        Git client.
 * @param {Function} deps.isCommitOnRemoteBranchFn   Checks remote branch ancestry.
 * @param {Function} deps.verifyRemotePackageTagsFn  Verifies remote package tags.
 *
 * @return {Promise<boolean>} True when the release Git metadata is published.
 */
async function isNpmReleaseGitMetadataPublished(
	{ gitWorkingDirectoryPath, npmReleaseBranch, preparedCommit },
	deps = {}
) {
	const {
		getPreparedTagNamesFn = getNpmReleasePreparedTagNames,
		getRemoteBranchShaFn = getRemoteBranchSha,
		git = SimpleGit( gitWorkingDirectoryPath ),
		isCommitOnRemoteBranchFn = isCommitOnRemoteBranch,
		verifyRemotePackageTagsFn = verifyRemotePackageTags,
	} = deps;
	if (
		! ( await isCommitOnRemoteBranchFn(
			{
				gitWorkingDirectoryPath,
				branchName: npmReleaseBranch,
				commit: preparedCommit,
			},
			{ getRemoteBranchShaFn, git }
		) )
	) {
		return false;
	}
	const packageTags = await getPreparedTagNamesFn(
		gitWorkingDirectoryPath,
		npmReleaseBranch,
		{ git }
	);
	if ( packageTags.length === 0 ) {
		const { base } = getNpmReleasePreparedRefs( npmReleaseBranch );
		throw new Error(
			`Prepared release state "${ base }" contains no package tags. ${ getNpmReleasePreparedStateRecoveryInstructions(
				npmReleaseBranch
			) }`
		);
	}
	try {
		await verifyRemotePackageTagsFn(
			{
				gitWorkingDirectoryPath,
				packageTags,
				publishCommit: preparedCommit,
			},
			{ git }
		);
		return true;
	} catch {
		return false;
	}
}

/**
 * Installs the dependencies for an npm release and verifies npm access.
 *
 * @param {Object}   options                         Options.
 * @param {string}   options.gitWorkingDirectoryPath Git working directory path.
 * @param {Object}   deps                            Dependencies.
 * @param {Function} deps.commandFn                  Command runner.
 */
async function installNpmReleaseDependencies(
	{ gitWorkingDirectoryPath },
	deps = {}
) {
	const { commandFn = command } = deps;
	log( '>> Installing npm packages.' );
	await commandFn( 'npm ci', {
		cwd: gitWorkingDirectoryPath,
	} );

	log( '>> Current npm user:' );
	await commandFn( 'npm whoami', {
		cwd: gitWorkingDirectoryPath,
		stdio: 'inherit',
	} );
}

/**
 * Gets the changelog commit that immediately precedes a prepared version
 * commit, if that release created one.
 *
 * @param {string} gitWorkingDirectoryPath Git working directory path.
 * @param {string} preparedCommit          Prepared version commit SHA.
 * @param {Object} deps                    Dependencies.
 * @param {Object} deps.git                Git client.
 *
 * @return {Promise<?string>} Changelog commit SHA, or null when absent.
 */
async function getNpmReleasePreparedChangelogCommit(
	gitWorkingDirectoryPath,
	preparedCommit,
	deps = {}
) {
	const { git = SimpleGit( gitWorkingDirectoryPath ) } = deps;
	const output = await git.raw(
		'show',
		'--no-patch',
		'--format=%H%x00%s',
		`${ preparedCommit }^`
	);
	const [ commitHash, subject ] = output.trim().split( '\0' );
	return subject === 'Update changelog files' ? commitHash : null;
}

/**
 * Gets the plugin release branch represented by a prepared release checkout.
 *
 * @param {string}   gitWorkingDirectoryPath Git working directory path.
 * @param {Object}   deps                    Dependencies.
 * @param {Function} deps.readJSON           JSON reader.
 *
 * @return {string} Plugin release branch name.
 */
function getNpmReleasePreparedPluginBranch(
	gitWorkingDirectoryPath,
	deps = {}
) {
	const { readJSON = readJSONFile } = deps;
	const { version } = readJSON(
		path.join( gitWorkingDirectoryPath, 'package.json' )
	);
	const parsedVersion = semverParse( version );
	return `release/${ parsedVersion.major }.${ parsedVersion.minor }`;
}

/**
 * Resumes a prepared release before the release branch is changed again.
 *
 * @param {WPPackagesConfig} config Command config.
 * @param {Object}           deps   Dependencies.
 *
 * @return {Promise<?Object>} Release state needed by finalization, or null.
 */
async function resumePreparedNpmRelease( config, deps = {} ) {
	const {
		commandFn = command,
		deletePreparedCommitFn = deleteNpmReleasePreparedCommit,
		getPreparedChangelogCommitFn = getNpmReleasePreparedChangelogCommit,
		getPreparedCommitFn = getNpmReleasePreparedCommit,
		getPreparedPluginReleaseBranchFn = getNpmReleasePreparedPluginBranch,
		getPreparedStateFn = getNpmReleasePreparedState,
		git = SimpleGit( config.gitWorkingDirectoryPath ),
		isGitMetadataPublishedFn = isNpmReleaseGitMetadataPublished,
		publishVersionedPackagesToNpmFn = publishVersionedPackagesToNpm,
		restorePreparedTagsFn = restoreNpmReleasePreparedTags,
	} = deps;
	const {
		distTag,
		gitWorkingDirectoryPath,
		interactive,
		npmReleaseBranch,
		releaseType,
	} = config;
	const preparedCommit = await getPreparedCommitFn(
		gitWorkingDirectoryPath,
		npmReleaseBranch,
		{ git }
	);
	if ( ! preparedCommit ) {
		await deletePreparedCommitFn(
			gitWorkingDirectoryPath,
			npmReleaseBranch,
			{ git }
		);
		return null;
	}

	const refs = getNpmReleasePreparedRefs( npmReleaseBranch );
	await git.fetch( 'origin', refs.commit );
	const preparedState = await getPreparedStateFn(
		gitWorkingDirectoryPath,
		npmReleaseBranch,
		preparedCommit,
		{ git }
	);
	if ( preparedState.releaseType !== releaseType ) {
		const { base } = getNpmReleasePreparedRefs( npmReleaseBranch );
		throw new Error(
			`Prepared release state "${ base }" was created for "${
				preparedState.releaseType
			}", but this run requested "${ releaseType }". ${ getNpmReleasePreparedStateRecoveryInstructions(
				npmReleaseBranch
			) }`
		);
	}
	log(
		`>> Resuming the prepared release commit ${ preparedCommit } from a previous run.`
	);
	await git.checkout( preparedCommit );
	let expectedPluginReleaseBranch = null;
	if ( releaseType === 'latest' ) {
		expectedPluginReleaseBranch = getPreparedPluginReleaseBranchFn(
			gitWorkingDirectoryPath
		);
	} else if ( releaseType === 'next' ) {
		expectedPluginReleaseBranch = 'trunk';
	}
	if ( preparedState.pluginReleaseBranch !== expectedPluginReleaseBranch ) {
		throw new Error(
			`Prepared plugin release branch is "${
				preparedState.pluginReleaseBranch || 'none'
			}", but the prepared commit requires "${
				expectedPluginReleaseBranch || 'none'
			}".`
		);
	}
	await git.fetch( 'origin', npmReleaseBranch );
	const gitMetadataPublished = await isGitMetadataPublishedFn(
		{ gitWorkingDirectoryPath, npmReleaseBranch, preparedCommit },
		{ git }
	);
	const changelogCommit = await getPreparedChangelogCommitFn(
		gitWorkingDirectoryPath,
		preparedCommit,
		{ git }
	);
	/*
	 * Lerna's tags never left the original runner, and the release set is
	 * derived from the tags at HEAD. Restore them or this run computes an empty
	 * release and completes without pushing any of them.
	 */
	if ( ! gitMetadataPublished ) {
		await restorePreparedTagsFn(
			gitWorkingDirectoryPath,
			npmReleaseBranch,
			{
				git,
			}
		);
		await installNpmReleaseDependencies( config, { commandFn } );
		await publishVersionedPackagesToNpmFn( {
			distTag,
			gitWorkingDirectoryPath,
			noVerifyAccessFlag: interactive ? '' : '--no-verify-access',
			npmReleaseBranch,
			pluginReleaseBranch: preparedState.pluginReleaseBranch,
			releaseType,
			yesFlag: interactive ? '' : '--yes',
		} );
	} else {
		log(
			`>> Git metadata is already published on ${ npmReleaseBranch }; continuing finalization.`
		);
	}

	return {
		changelogCommit,
		pluginReleaseBranch: preparedState.pluginReleaseBranch,
		publishCommit: preparedCommit,
	};
}

/**
 * Publishes locally versioned packages, then pushes and verifies Git metadata.
 *
 * @param {Object}   options                          Options.
 * @param {string}   options.distTag                  The dist-tag used for npm publishing.
 * @param {string}   options.gitWorkingDirectoryPath  Git working directory path.
 * @param {string}   options.noVerifyAccessFlag       Lerna no-verify-access flag.
 * @param {string}   options.npmReleaseBranch         Npm release branch.
 * @param {?string}  options.pluginReleaseBranch      Plugin release branch.
 * @param {string}   options.releaseType              Release route.
 * @param {string}   options.yesFlag                  Lerna yes flag.
 * @param {Object}   deps                             Dependencies.
 * @param {Function} deps.commandFn                   Command runner.
 * @param {Object}   deps.git                         Git client.
 * @param {Function} deps.getNpmReleasePackagesFn     Gets release package metadata.
 * @param {Function} deps.pushNpmReleaseGitMetadataFn Pushes Git metadata.
 * @param {Function} deps.runNpmPublishPreflightFn    Runs npm preflight.
 * @param {Function} deps.runPhase                    Runs a retryable phase.
 */
async function publishVersionedPackagesToNpm(
	{
		distTag,
		gitWorkingDirectoryPath,
		noVerifyAccessFlag,
		npmReleaseBranch,
		pluginReleaseBranch,
		releaseType,
		yesFlag,
	},
	deps = {}
) {
	const {
		commandFn = command,
		git = SimpleGit( gitWorkingDirectoryPath ),
		getNpmReleasePackagesFn = getNpmReleasePackages,
		pushNpmReleaseGitMetadataFn = pushNpmReleaseGitMetadata,
		pushPreparedCommitFn = pushNpmReleasePreparedCommit,
		runNpmPublishPreflightFn = runNpmPublishPreflight,
		runPhase = runNpmReleasePhase,
		wait,
	} = deps;
	const releasePackages = await getNpmReleasePackagesFn(
		gitWorkingDirectoryPath
	);
	const publishCommit = await git.revparse( [ 'HEAD' ] );
	const publishCommand = `npm exec --no -- lerna publish from-package --dist-tag ${ distTag } --git-head ${ publishCommit } ${ yesFlag } ${ noVerifyAccessFlag }`;
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
	/*
	 * Persist the prepared commit before anything irreversible. Publishing
	 * stamps this SHA into every package's `gitHead`, so it must outlive the
	 * runner even if a later phase fails.
	 */
	await pushPreparedCommitFn(
		{
			gitWorkingDirectoryPath,
			npmReleaseBranch,
			packageTags: releasePackages.map( ( { tagName } ) => tagName ),
			pluginReleaseBranch,
			publishCommit,
			releaseType,
		},
		{ git }
	);
	try {
		await publishRemainingPackages( publishedPackageNames );
	} catch {
		log(
			'>> Trying to finish failed publishing of modified npm packages.'
		);
		// A failed Lerna publish can leave temporary `gitHead` manifest changes.
		// Reset to the version commit so `from-package` sees a clean tree on retry.
		await git.reset( 'hard' );
		await publishRemainingPackages( await getPublishedPackageNames() );
	}

	/*
	 * Lerna treats publish conflicts as successful "already published" results,
	 * so verify registry identity again before attaching Git metadata.
	 *
	 * Retry attempts focus on the packages still missing. After they pass, one
	 * full sweep confirms that every package still has the expected identity
	 * before Git metadata is attached.
	 */
	let pendingPackages = releasePackages;
	await runPhase(
		'npm publication verification',
		async () => {
			const packagesToCheck = pendingPackages;
			const confirmedPackageNames = new Set(
				await runNpmPublishPreflightFn( {
					distTag,
					gitWorkingDirectoryPath,
					publishCommit,
					releasePackages: packagesToCheck,
				} )
			);
			pendingPackages = packagesToCheck.filter(
				( { name } ) => ! confirmedPackageNames.has( name )
			);
			if ( pendingPackages.length ) {
				throw new NpmReleaseVerificationPendingError(
					`npm publication verification failed for ${ pendingPackages
						.map(
							( { name, version } ) => `${ name }@${ version }`
						)
						.join( ', ' ) }.`
				);
			}
			if ( packagesToCheck.length !== releasePackages.length ) {
				const finalConfirmedPackageNames = new Set(
					await runNpmPublishPreflightFn( {
						distTag,
						gitWorkingDirectoryPath,
						publishCommit,
						releasePackages,
					} )
				);
				pendingPackages = releasePackages.filter(
					( { name } ) => ! finalConfirmedPackageNames.has( name )
				);
				if ( pendingPackages.length ) {
					throw new NpmReleaseVerificationPendingError(
						`npm publication verification failed for ${ pendingPackages
							.map(
								( { name, version } ) =>
									`${ name }@${ version }`
							)
							.join( ', ' ) }.`
					);
				}
			}
		},
		{
			attempts: NPM_RELEASE_VERIFICATION_ATTEMPTS,
			shouldRetry: ( error ) =>
				error instanceof NpmReleaseVerificationPendingError,
			wait,
		}
	);

	await pushNpmReleaseGitMetadataFn( {
		gitWorkingDirectoryPath,
		npmReleaseBranch,
		packageTags: releasePackages.map( ( { tagName } ) => tagName ),
		publishCommit,
	} );
}

/**
 * Publishes all changed packages to npm.
 *
 * @param {WPPackagesConfig} config Command config.
 * @param {Object}           deps   Dependencies.
 *
 * @return {?string} The optional commit's hash when packages published to npm.
 */
async function publishPackagesToNpm(
	{
		distTag,
		gitWorkingDirectoryPath,
		interactive,
		minimumVersionBump,
		npmReleaseBranch,
		pluginReleaseBranch,
		releaseType,
	},
	deps = {}
) {
	const {
		commandFn = command,
		git = SimpleGit( gitWorkingDirectoryPath ),
		publishVersionedPackagesToNpmFn = publishVersionedPackagesToNpm,
	} = deps;
	await installNpmReleaseDependencies(
		{ gitWorkingDirectoryPath },
		{ commandFn }
	);

	const beforeCommitHash = await git.revparse( [ '--short', 'HEAD' ] );

	const yesFlag = interactive ? '' : '--yes';
	const noVerifyAccessFlag = interactive ? '' : '--no-verify-access';

	// Timestamp is the current time in `YYYYMMDDHHMM` format.
	const timestamp = new Date()
		.toISOString()
		.substring( 0, 16 )
		.replace( /[-:T]/g, '' );

	// Keep version commits and package tags local until npm publishing succeeds,
	// then push and verify Git metadata explicitly.
	if ( releaseType === 'next' ) {
		log(
			'>> Bumping version of public packages changed since the last release.'
		);

		await commandFn(
			`npm exec --no -- lerna version pre${ minimumVersionBump } --preid next.v.${ timestamp } --no-private --no-push ${ yesFlag }`,
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
			`npm exec --no -- lerna version ${ minimumVersionBump } --no-private --no-push ${ yesFlag }`,
			{
				cwd: gitWorkingDirectoryPath,
				stdio: 'inherit',
			}
		);
	}

	await publishVersionedPackagesToNpmFn( {
		distTag,
		gitWorkingDirectoryPath,
		noVerifyAccessFlag,
		npmReleaseBranch,
		pluginReleaseBranch,
		releaseType,
		yesFlag,
	} );

	const afterCommitHash = await git.revparse( [ '--short', 'HEAD' ] );
	if ( afterCommitHash === beforeCommitHash ) {
		return;
	}

	return afterCommitHash;
}

/**
 * Prepares the npm release branch and changelog updates.
 *
 * @param {WPPackagesConfig} config Command config.
 * @param {Object}           deps   Dependencies.
 *
 * @return {Promise<Object>} Release state needed by finalization.
 */
async function prepareNpmRelease( config, deps = {} ) {
	const {
		checkoutNpmReleaseBranchFn = checkoutNpmReleaseBranch,
		findPluginReleaseBranchNameFn = findPluginReleaseBranchName,
		runNpmReleaseBranchSyncStepFn = runNpmReleaseBranchSyncStep,
		updatePackagesFn = updatePackages,
	} = deps;
	let pluginReleaseBranch;
	if ( [ 'latest', 'next' ].includes( config.releaseType ) ) {
		pluginReleaseBranch =
			config.releaseType === 'next'
				? 'trunk'
				: await findPluginReleaseBranchNameFn(
						config.gitWorkingDirectoryPath
					);
		await runNpmReleaseBranchSyncStepFn( pluginReleaseBranch, config );
	} else {
		await checkoutNpmReleaseBranchFn( config );
	}

	return {
		changelogCommit: await updatePackagesFn( config ),
		pluginReleaseBranch,
	};
}

/**
 * Publishes the packages prepared in the current checkout.
 *
 * @param {WPPackagesConfig} config                           Command config.
 * @param {Object}           releaseState                     Prepared release state.
 * @param {?string}          releaseState.pluginReleaseBranch Plugin release branch.
 * @param {Object}           deps                             Dependencies.
 *
 * @return {Promise<?string>} The npm version commit hash.
 */
async function publishPreparedPackagesToNpm(
	config,
	{ pluginReleaseBranch },
	deps = {}
) {
	const { publishPackagesToNpmFn = publishPackagesToNpm } = deps;
	return publishPackagesToNpmFn( { ...config, pluginReleaseBranch } );
}

/**
 * Backports the prepared release commits after publication.
 *
 * @param {WPPackagesConfig} config                           Command config.
 * @param {Object}           releaseState                     Prepared release state.
 * @param {?string}          releaseState.changelogCommit     Changelog commit.
 * @param {?string}          releaseState.pluginReleaseBranch Plugin release branch.
 * @param {?string}          releaseState.publishCommit       Version commit.
 * @param {Object}           deps                             Dependencies.
 */
async function finalizePreparedNpmRelease(
	config,
	{ changelogCommit, pluginReleaseBranch, publishCommit },
	deps = {}
) {
	const { backportCommitsToBranchFn = backportCommitsToBranch } = deps;
	if ( ! [ 'latest', 'bugfix' ].includes( config.releaseType ) ) {
		return;
	}

	const commits = [ changelogCommit, publishCommit ].filter( Boolean );
	await backportCommitsToBranchFn( 'trunk', commits, config );
	if ( config.releaseType === 'latest' && pluginReleaseBranch ) {
		await backportCommitsToBranchFn( pluginReleaseBranch, commits, config );
	}
}

/**
 * Reports whether a failed cherry-pick has no changes to commit.
 *
 * @param {Object} repo Git client.
 *
 * @return {Promise<boolean>} Whether Git is waiting on an empty cherry-pick.
 */
async function isEmptyCherryPick( repo ) {
	let cherryPickHead;
	try {
		cherryPickHead = await repo.raw(
			'rev-parse',
			'--verify',
			'--quiet',
			'CHERRY_PICK_HEAD'
		);
	} catch {
		return false;
	}
	if ( ! cherryPickHead.trim() ) {
		return false;
	}
	const conflicts = await repo.raw(
		'diff',
		'--name-only',
		'--diff-filter=U'
	);
	if ( conflicts.trim() ) {
		return false;
	}
	const stagedChanges = await repo.raw( 'diff', '--cached', '--name-only' );
	return ! stagedChanges.trim();
}

/**
 * Backports commits from the release branch to the selected branch.
 *
 * @param {string}           branchName Selected branch name.
 * @param {string[]}         commits    The list of commits to backport.
 * @param {WPPackagesConfig} config     Command config.
 */
async function backportCommitsToBranch(
	branchName,
	commits,
	{ abortMessage, gitWorkingDirectoryPath, interactive }
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

	const repo = SimpleGit( gitWorkingDirectoryPath );

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
		try {
			await repo.raw( 'cherry-pick', commitHash );
		} catch ( error ) {
			if ( ! ( await isEmptyCherryPick( repo ) ) ) {
				throw error;
			}
			await repo.raw( 'cherry-pick', '--skip' );
			log(
				`>> Commit ${ commitHash } is already backported to "${ branchName }".`
			);
		}
	}

	const backportTip = await repo.revparse( [ 'HEAD' ] );
	await repo.push( 'origin', branchName );
	await repo.fetch( 'origin', branchName );
	if (
		! ( await isCommitOnRemoteBranch(
			{
				gitWorkingDirectoryPath,
				branchName,
				commit: backportTip,
			},
			{ git: repo }
		) )
	) {
		throw new Error(
			`Backport verification failed because origin/${ branchName } does not contain ${ backportTip }.`
		);
	}

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
		deletePreparedCommitFn = deleteNpmReleasePreparedCommit,
		finalizePreparedNpmReleaseFn = finalizePreparedNpmRelease,
		prepareNpmReleaseFn = prepareNpmRelease,
		publishPreparedPackagesToNpmFn = publishPreparedPackagesToNpm,
		resumePreparedNpmReleaseFn = resumePreparedNpmRelease,
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

	let releaseState = await resumePreparedNpmReleaseFn( config );
	if ( ! releaseState ) {
		releaseState = await prepareNpmReleaseFn( config );
		releaseState.publishCommit = await publishPreparedPackagesToNpmFn(
			config,
			releaseState
		);
	}
	await finalizePreparedNpmReleaseFn( config, releaseState );
	await deletePreparedCommitFn(
		config.gitWorkingDirectoryPath,
		config.npmReleaseBranch
	);

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

	log(
		'\n>> 🎉 WordPress packages are now published!\n\n',
		'Let also people know on WordPress Slack and celebrate together.'
	);
}

/**
 * Gets config object.
 *
 * @param {ReleaseType}              releaseType The selected release type.
 * @param {WPPackagesCommandOptions} options     Command options.
 *
 * @return {WPPackagesConfig} The config object.
 */
function getConfig(
	releaseType,
	{ ci, repositoryPath, semver = 'patch', wpVersion }
) {
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
	deleteNpmReleasePreparedCommit,
	finalizePreparedNpmRelease,
	getNpmReleasePreparedCommit,
	getNpmReleasePreparedPluginBranch,
	getNpmReleasePreparedRefs,
	getNpmReleasePreparedTagNames,
	getNpmReleasePreparedState,
	getNpmReleasePackages,
	getNpmReleaseGitRecoveryCommands,
	getRemoteBranchSha,
	getRemoteTagShas,
	getTagPushCommands,
	getTagRefspec,
	prepareNpmRelease,
	publishPackagesToNpm,
	publishPreparedPackagesToNpm,
	publishVersionedPackagesToNpm,
	pushNpmReleaseGitMetadata,
	isNpmReleaseGitMetadataPublished,
	pushNpmReleasePreparedCommit,
	restoreNpmReleasePreparedTags,
	publishNpmGutenbergPlugin,
	publishNpmBugfixLatest,
	publishNpmBugfixWordPressCore,
	publishNpmNext,
	runNpmPublishPreflight,
	runNpmReleasePhase,
	runPackagesRelease,
	resumePreparedNpmRelease,
	verifyRemotePackageTags,
};
