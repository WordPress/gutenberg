import {
	cp,
	lstat,
	mkdir,
	readdir,
	readFile,
	readlink,
	realpath,
	rm,
	symlink,
	writeFile,
} from 'node:fs/promises';
import path from 'node:path';

const MANAGED_COPY_MARKER = '.gutenberg-agent-skills-source';
const SOURCE_SKILLS_DIRECTORY = '.agents/skills';
const TARGET_SKILLS_DIRECTORIES = [ '.claude/skills' ];

/**
 * Sets up agent-native views of the repository's skills.
 *
 * @param {Object}   options                Setup options.
 * @param {string}   options.repositoryRoot Repository root directory.
 * @param {string}   [options.platform]     Platform used to choose link type.
 * @param {Function} [options.createLink]   Function used to create directory links.
 * @return {Promise<{ conflicts: string[], copied: string[], linked: string[] }>} Setup result.
 */
export async function setupSkills( {
	repositoryRoot,
	platform = process.platform,
	createLink = symlink,
} ) {
	const sourceSkillsDirectory = path.join(
		repositoryRoot,
		SOURCE_SKILLS_DIRECTORY
	);
	const result = {
		conflicts: [],
		copied: [],
		linked: [],
	};
	const skillNames = await getSkillNames( sourceSkillsDirectory );

	for ( const targetSkillsDirectory of TARGET_SKILLS_DIRECTORIES ) {
		for ( const skillName of skillNames ) {
			const source = path.join( sourceSkillsDirectory, skillName );
			const target = path.join(
				repositoryRoot,
				targetSkillsDirectory,
				skillName
			);

			const status = await installSkill( {
				source,
				target,
				skillName,
				platform,
				createLink,
			} );

			result[ status ].push( path.relative( repositoryRoot, target ) );
		}
	}

	return result;
}

async function getSkillNames( sourceSkillsDirectory ) {
	const entries = await readdir( sourceSkillsDirectory, {
		withFileTypes: true,
	} );
	const skillNames = [];

	for ( const entry of entries ) {
		if ( ! entry.isDirectory() ) {
			continue;
		}

		try {
			const skillFile = await lstat(
				path.join( sourceSkillsDirectory, entry.name, 'SKILL.md' )
			);
			if ( skillFile.isFile() ) {
				skillNames.push( entry.name );
			}
		} catch ( error ) {
			if ( error.code !== 'ENOENT' ) {
				throw error;
			}
		}
	}

	return skillNames.sort();
}

async function installSkill( {
	source,
	target,
	skillName,
	platform,
	createLink,
} ) {
	const existingTarget = await getExistingTargetType(
		target,
		source,
		skillName
	);

	if ( existingTarget === 'linked' ) {
		return 'linked';
	}

	if ( existingTarget === 'managed-copy' ) {
		await copySkill( source, target, skillName );
		return 'copied';
	}

	if ( existingTarget === 'stale-managed-link' ) {
		await rm( target, { force: true } );
	}

	if ( existingTarget === 'conflict' ) {
		return 'conflicts';
	}

	await mkdir( path.dirname( target ), { recursive: true } );

	try {
		await createLink(
			path.resolve( source ),
			target,
			platform === 'win32' ? 'junction' : 'dir'
		);
		return 'linked';
	} catch ( error ) {
		if ( ! isLinkCapabilityError( error ) ) {
			throw error;
		}
	}

	await copySkill( source, target, skillName );
	return 'copied';
}

function isLinkCapabilityError( error ) {
	return [ 'EACCES', 'EINVAL', 'ENOSYS', 'ENOTSUP', 'EPERM' ].includes(
		error.code
	);
}

async function getExistingTargetType( target, source, skillName ) {
	try {
		const targetStats = await lstat( target );

		if ( targetStats.isSymbolicLink() ) {
			try {
				return ( await realpath( target ) ) ===
					( await realpath( source ) )
					? 'linked'
					: 'conflict';
			} catch ( error ) {
				if ( error.code !== 'ENOENT' ) {
					throw error;
				}

				const oldSource = path.resolve(
					path.dirname( target ),
					await readlink( target )
				);
				const legacySource = path.resolve(
					source,
					'../../../skills',
					skillName
				);

				return oldSource === legacySource
					? 'stale-managed-link'
					: 'conflict';
			}
		}

		try {
			const marker = await readFile(
				path.join( target, MANAGED_COPY_MARKER ),
				'utf8'
			);
			return marker === `${ skillName }\n` ? 'managed-copy' : 'conflict';
		} catch {
			return 'conflict';
		}
	} catch ( error ) {
		if ( error.code === 'ENOENT' ) {
			return 'missing';
		}
		throw error;
	}
}

async function copySkill( source, target, skillName ) {
	await rm( target, { recursive: true, force: true } );
	await cp( source, target, { recursive: true } );
	await writeFile(
		path.join( target, MANAGED_COPY_MARKER ),
		`${ skillName }\n`
	);
}

function formatResult( result ) {
	const lines = [];

	if ( result.linked.length ) {
		lines.push( `Linked: ${ result.linked.join( ', ' ) }` );
	}
	if ( result.copied.length ) {
		lines.push( `Copied: ${ result.copied.join( ', ' ) }` );
	}
	if ( result.conflicts.length ) {
		lines.push(
			`Skipped existing unmanaged paths: ${ result.conflicts.join(
				', '
			) }`
		);
	}

	return lines.join( '\n' );
}

if ( import.meta.url === `file://${ process.argv[ 1 ] }` ) {
	const result = await setupSkills( {
		repositoryRoot: process.cwd(),
	} );

	console.log( formatResult( result ) );

	if ( result.conflicts.length ) {
		process.exitCode = 1;
	}
}
