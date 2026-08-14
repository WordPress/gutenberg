const path = require( 'path' );
const fs = require( 'fs' );
const readline = require( 'readline' );
const { join } = require( 'path' );
const { command } = require( 'execa' );
const glob = require( 'fast-glob' );
const { inc: semverInc } = require( 'semver' );
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
const {
	getReleasedChangelogSection,
	isPackageChangelogPath,
	recomputeBackportedChangelog,
} = require( '../lib/released-changelog' );
const pluginConfig = require( '../config' );

const NPM_RELEASE_PHASE_ATTEMPTS = 3;
// Keep tag pushes small enough that GitHub ruleset validation handles each phase predictably.
const NPM_RELEASE_TAG_PUSH_BATCH_SIZE = 25;

/**
 * Returns an actionable message for an unknown thrown value.
 *
 * @param {*} error Thrown value.
 *
 * @return {string} Error message, including an error code when available.
 */
function getErrorMessage( error ) {
	if ( typeof error === 'string' && error ) {
		return error;
	}
	if ( error && typeof error === 'object' ) {
		const message =
			typeof error.message === 'string' && error.message
				? error.message
				: 'Unknown error';
		return error.code ? `${ message } (${ error.code })` : message;
	}
	return 'Unknown error';
}

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
 * Publishes locally versioned packages, then pushes and verifies Git metadata.
 *
 * @param {Object}   options                          Options.
 * @param {string}   options.distTag                  The dist-tag used for npm publishing.
 * @param {string}   options.gitWorkingDirectoryPath  Git working directory path.
 * @param {string}   options.noVerifyAccessFlag       Lerna no-verify-access flag.
 * @param {string}   options.npmReleaseBranch         Npm release branch.
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
		yesFlag,
	},
	deps = {}
) {
	const {
		commandFn = command,
		git = SimpleGit( gitWorkingDirectoryPath ),
		getNpmReleasePackagesFn = getNpmReleasePackages,
		pushNpmReleaseGitMetadataFn = pushNpmReleaseGitMetadata,
		runNpmPublishPreflightFn = runNpmPublishPreflight,
		runPhase = runNpmReleasePhase,
	} = deps;
	const releasePackages = await getNpmReleasePackagesFn(
		gitWorkingDirectoryPath
	);
	const publishCommit = await git.revparse( [ 'HEAD' ] );
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
		await git.reset( 'hard' );
		await publishRemainingPackages( await getPublishedPackageNames() );
	}

	// Lerna treats publish conflicts as successful "already published" results,
	// so verify registry identity again before attaching Git metadata.
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
		releaseType,
	},
	deps = {}
) {
	const {
		commandFn = command,
		git = SimpleGit( gitWorkingDirectoryPath ),
		publishVersionedPackagesToNpmFn = publishVersionedPackagesToNpm,
	} = deps;
	log( '>> Installing npm packages.' );
	await commandFn( 'npm ci', {
		cwd: gitWorkingDirectoryPath,
	} );

	log( '>> Current npm user:' );
	await commandFn( 'npm whoami', {
		cwd: gitWorkingDirectoryPath,
		stdio: 'inherit',
	} );

	const beforeCommitHash = await git.revparse( [ '--short', 'HEAD' ] );

	// Timestamp is the current time in `YYYYMMDDHHMM` format.
	const timestamp = new Date()
		.toISOString()
		.substring( 0, 16 )
		.replace( /[-:T]/g, '' );

	const yesFlag = interactive ? '' : '--yes';
	const noVerifyAccessFlag = interactive ? '' : '--no-verify-access';
	// Keep version commits and package tags local until npm publishing succeeds,
	// then push and verify Git metadata explicitly.
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

	await publishVersionedPackagesToNpmFn( {
		distTag,
		gitWorkingDirectoryPath,
		noVerifyAccessFlag,
		npmReleaseBranch,
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
 * @param {WPPackagesConfig} config Command config.
 * @param {Object}           deps   Dependencies.
 *
 * @return {Promise<?string>} The npm version commit hash.
 */
async function publishPreparedPackagesToNpm( config, deps = {} ) {
	const { publishPackagesToNpmFn = publishPackagesToNpm } = deps;
	return publishPackagesToNpmFn( config );
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

	const branchNames = [ 'trunk' ];
	if ( config.releaseType === 'latest' && pluginReleaseBranch ) {
		branchNames.push( pluginReleaseBranch );
	}

	// The backports are independent: a failure on one branch must not cancel
	// the other branch's backport.
	const failures = [];
	for ( const branchName of branchNames ) {
		try {
			await backportCommitsToBranchFn(
				branchName,
				{ changelogCommit, publishCommit },
				config
			);
		} catch ( error ) {
			log(
				`>> Backporting to "${ branchName }" failed: ${ getErrorMessage(
					error
				) }`
			);
			failures.push( { branchName, error } );
		}
	}

	if ( failures.length ) {
		throw new Error(
			'Backporting failed for ' +
				failures
					.map(
						( { branchName, error } ) =>
							`"${ branchName }": ${ getErrorMessage( error ) }`
					)
					.join( '; ' )
		);
	}
}

/**
 * Applies the release's changelog rewrite to the currently checked out
 * branch.
 *
 * The changelog commit is replayed with `git cherry-pick --no-commit` for its
 * `package.json` changes, but the package changelogs it touched are not
 * trusted to git's textual merge: when the target branch gained changelog
 * entries during publication, that merge silently files them under the
 * just-published version heading (and only conflicts for packages whose
 * `## Unreleased` section was empty). Every touched changelog is instead
 * recomputed structurally from the release base, the released content, and
 * the target branch tip.
 *
 * @param {Object}   options                         Options.
 * @param {string}   options.changelogCommit         Changelog commit hash.
 * @param {string}   options.gitWorkingDirectoryPath Git working directory path.
 * @param {Object}   deps                            Dependencies.
 * @param {Object}   deps.git                        Git client.
 * @param {Function} deps.writeFileFn                File writer.
 */
async function applyReleaseChangelogCommit(
	{ changelogCommit, gitWorkingDirectoryPath },
	deps = {}
) {
	const {
		git = SimpleGit( gitWorkingDirectoryPath ),
		writeFileFn = fs.promises.writeFile,
	} = deps;

	const changelogPaths = (
		await git.raw(
			'diff',
			'--name-only',
			`${ changelogCommit }^`,
			changelogCommit
		)
	)
		.split( '\n' )
		.filter( isPackageChangelogPath );

	if ( changelogPaths.length === 0 ) {
		throw new Error(
			`Found no package changelogs modified by ${ changelogCommit }; refusing to backport it as a changelog commit.`
		);
	}

	let cherryPickError = null;
	try {
		// Disable `rerere` so a resolution recorded on this machine cannot be
		// replayed silently into a release backport.
		await git.raw(
			'-c',
			'rerere.enabled=false',
			'cherry-pick',
			'--no-commit',
			changelogCommit
		);
	} catch ( error ) {
		cherryPickError = error;
	}

	if ( cherryPickError ) {
		const unmergedPaths = (
			await git.raw( 'diff', '--name-only', '--diff-filter=U' )
		)
			.split( '\n' )
			.filter( Boolean );
		if ( unmergedPaths.length === 0 ) {
			throw cherryPickError;
		}
		const unexpectedPaths = unmergedPaths.filter(
			( filePath ) => ! isPackageChangelogPath( filePath )
		);
		if ( unexpectedPaths.length ) {
			throw new Error(
				`Cherry-picking ${ changelogCommit } conflicted outside package changelogs (${ unexpectedPaths.join(
					', '
				) }); resolve the backport manually.`
			);
		}
		// Conflicted package changelogs are recomputed below, together with
		// the ones git merged without complaint.
	}

	for ( const changelogPath of changelogPaths ) {
		const showFile = ( treeish ) =>
			git.raw( 'show', `${ treeish }:${ changelogPath }` );
		let branchContent;
		try {
			branchContent = await showFile( 'HEAD' );
		} catch {
			throw new Error(
				`${ changelogPath } was rewritten by the release but does not exist on the target branch; resolve the backport manually.`
			);
		}
		const recomputedContent = recomputeBackportedChangelog( {
			base: await showFile( `${ changelogCommit }^` ),
			branch: branchContent,
			filePath: changelogPath,
			published: await showFile( changelogCommit ),
		} );
		await writeFileFn(
			path.join( gitWorkingDirectoryPath, changelogPath ),
			recomputedContent
		);
	}

	await git.raw( 'add', '--', ...changelogPaths );
	// Reuse the changelog commit's message and authorship.
	await git.raw( 'commit', '-C', changelogCommit );
}

/**
 * Verifies that the backport did not move any changelog entry into or out of
 * a published version section: for every package changelog in the release,
 * the released portion at the branch tip must be byte-identical to the
 * released content. Changelogs with nothing published to protect are skipped:
 * those without a single version heading in the release, and those that no
 * longer exist on the target branch.
 *
 * @param {Object} options                         Options.
 * @param {string} options.branchName              Target branch name.
 * @param {string} options.gitWorkingDirectoryPath Git working directory path.
 * @param {string} options.releaseCommit           Release commit hash to
 *                                                 verify against.
 * @param {Object} deps                            Dependencies.
 * @param {Object} deps.git                        Git client.
 */
async function verifyBackportedChangelogs(
	{ branchName, gitWorkingDirectoryPath, releaseCommit },
	deps = {}
) {
	const { git = SimpleGit( gitWorkingDirectoryPath ) } = deps;
	const changelogPaths = (
		await git.raw(
			'ls-tree',
			'-r',
			'--name-only',
			releaseCommit,
			'--',
			'packages'
		)
	)
		.split( '\n' )
		.filter( isPackageChangelogPath );
	if ( changelogPaths.length === 0 ) {
		throw new Error(
			`Found no package changelogs in ${ releaseCommit } to verify; refusing to push the backport to "${ branchName }".`
		);
	}
	const branchChangelogPaths = new Set(
		(
			await git.raw(
				'ls-tree',
				'-r',
				'--name-only',
				'HEAD',
				'--',
				'packages'
			)
		)
			.split( '\n' )
			.filter( isPackageChangelogPath )
	);

	const mismatchedPaths = [];
	for ( const changelogPath of changelogPaths ) {
		const releasedSection = getReleasedChangelogSection(
			await git.raw( 'show', `${ releaseCommit }:${ changelogPath }` )
		);
		if ( releasedSection === '' ) {
			// Without a version heading the package has never published a
			// release, so there is no published section to protect.
			log(
				`>> Skipping released changelog verification for ${ changelogPath }: it has no released versions.`
			);
			continue;
		}
		if ( ! branchChangelogPaths.has( changelogPath ) ) {
			// A package removed on the target branch has no changelog to
			// corrupt.
			log(
				`>> Skipping released changelog verification for ${ changelogPath }: the file does not exist on "${ branchName }".`
			);
			continue;
		}
		const branchContent = await git.raw(
			'show',
			`HEAD:${ changelogPath }`
		);
		if (
			getReleasedChangelogSection( branchContent ) !== releasedSection
		) {
			mismatchedPaths.push( changelogPath );
		}
	}

	if ( mismatchedPaths.length ) {
		throw new Error(
			`Released changelog sections on "${ branchName }" do not match the published release for:\n` +
				mismatchedPaths
					.map( ( changelogPath ) => `  - ${ changelogPath }` )
					.join( '\n' ) +
				'\nAn entry moved into or out of a published version section. The backport was not pushed.'
		);
	}
}

/**
 * Backports the release commits from the release branch to the selected
 * branch, then verifies the released changelog sections before pushing.
 *
 * @param {string}           branchName              Selected branch name.
 * @param {Object}           commits                 Commits to backport.
 * @param {?string}          commits.changelogCommit Changelog commit hash.
 * @param {?string}          commits.publishCommit   Version commit hash.
 * @param {WPPackagesConfig} config                  Command config.
 * @param {Object}           deps                    Dependencies.
 */
async function backportCommitsToBranch(
	branchName,
	{ changelogCommit, publishCommit },
	{ abortMessage, gitWorkingDirectoryPath, interactive },
	deps = {}
) {
	const {
		applyReleaseChangelogCommitFn = applyReleaseChangelogCommit,
		git = SimpleGit( gitWorkingDirectoryPath ),
		verifyBackportedChangelogsFn = verifyBackportedChangelogs,
	} = deps;
	if ( ! changelogCommit && ! publishCommit ) {
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

	/*
	 * Force the local branch to exactly the remote tip instead of pulling, so
	 * that a diverged local branch or debris left by an interrupted earlier
	 * run can never be merged into the backport that gets pushed.
	 *
	 * Fetching immediately before the work also makes it very unlikely that
	 * new commits appear at the origin HEAD between when this script started
	 * and when the backport is pushed back upstream.
	 */
	await git.fetch( 'origin', branchName );

	try {
		await git.raw( 'checkout', '-B', branchName, `origin/${ branchName }` );
		await git.raw( 'reset', '--hard', `origin/${ branchName }` );
		if ( changelogCommit ) {
			await applyReleaseChangelogCommitFn(
				{ changelogCommit, gitWorkingDirectoryPath },
				{ git }
			);
		}
		if ( publishCommit ) {
			await git.raw(
				'-c',
				'rerere.enabled=false',
				'cherry-pick',
				publishCommit
			);
		}
		await verifyBackportedChangelogsFn(
			{
				branchName,
				gitWorkingDirectoryPath,
				releaseCommit: publishCommit || changelogCommit,
			},
			{ git }
		);
	} catch ( error ) {
		// Leave the working copy clean so this branch's failure cannot poison
		// the next backport target.
		await git.raw( 'cherry-pick', '--abort' ).catch( () => {} );
		try {
			/*
			 * Reset in place: the failure may predate `checkout -B`, leaving
			 * HEAD on another branch that a targeted reset would move. The
			 * next run's `checkout -B` re-syncs this branch ref anyway.
			 */
			await git.raw( 'reset', '--hard' );
		} catch ( cleanupError ) {
			throw new Error(
				`Backporting to "${ branchName }" failed, and cleaning the working copy also failed: ${ getErrorMessage(
					cleanupError
				) }. Original failure: ${ getErrorMessage( error ) }`
			);
		}
		throw error;
	}

	await git.push( 'origin', branchName );

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

	const releaseState = await prepareNpmReleaseFn( config );
	releaseState.publishCommit = await publishPreparedPackagesToNpmFn( config );
	await finalizePreparedNpmReleaseFn( config, releaseState );

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
	applyReleaseChangelogCommit,
	backportCommitsToBranch,
	finalizePreparedNpmRelease,
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
	publishNpmGutenbergPlugin,
	publishNpmBugfixLatest,
	publishNpmBugfixWordPressCore,
	publishNpmNext,
	runNpmPublishPreflight,
	runNpmReleasePhase,
	runPackagesRelease,
	verifyBackportedChangelogs,
	verifyRemotePackageTags,
};
