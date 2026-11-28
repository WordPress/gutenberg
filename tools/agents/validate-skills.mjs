import { readdir, readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { load } from 'js-yaml';

// The SKILL.md frontmatter rules follow the Agent Skills specification:
// https://agentskills.io/specification
// The repository's conventions are stricter in places. See
// docs/contributors/code/agents-and-skills.md.

// The repository's own skill catalog, and the skills that packages ship.
const CATALOG_DIRECTORY = '.agents/skills';
const PACKAGES_DIRECTORY = 'packages';
const PACKAGE_SKILLS_DIRECTORY = 'skills';
const SKILL_FILE = 'SKILL.md';
const NAME_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const NAME_MAX_LENGTH = 64;
const DESCRIPTION_MAX_LENGTH = 1024;
const COMPATIBILITY_MAX_LENGTH = 500;

// The repository's skill conventions allow only these fields. See
// docs/contributors/code/agents-and-skills.md.
const ALLOWED_FIELDS = new Set( [ 'name', 'description', 'compatibility' ] );

/**
 * @typedef {Object} SkillError
 * @property {number} line    1-based line in SKILL.md the error points at.
 * @property {string} message What is wrong.
 */

/**
 * Finds comments that silently cut off a plain (unquoted) field value.
 *
 * In a plain scalar, a "#" after a space or tab starts a comment, so
 * `description: Use for #tags` loads as "Use for" and still parses.
 * Quoted values and `|` or `>` block scalars keep "#" as text.
 *
 * @param {string[]} frontmatterLines Lines between the "---" delimiters.
 * @return {Array<{field: string, index: number}>} Each field cut off, with the frontmatter line index of the comment.
 */
function findTrailingComments( frontmatterLines ) {
	const found = [];
	let plainField = null;

	frontmatterLines.forEach( ( line, index ) => {
		const fieldMatch = line.match( /^([^\s#][^:]*):(?:[ \t]+(.*))?$/ );

		if ( fieldMatch ) {
			const [ , field, value = '' ] = fieldMatch;
			plainField = value === '' || /^['"|>]/.test( value ) ? null : field;
			if ( plainField && /[ \t]#/.test( value ) ) {
				found.push( { field, index } );
				plainField = null;
			}
			return;
		}

		// A continuation line of a plain value, such as a folded description.
		if ( plainField && /^[ \t]/.test( line ) ) {
			if ( /(?:^|[ \t])#/.test( line.trim() ) ) {
				found.push( { field: plainField, index } );
				plainField = null;
			}
			return;
		}

		plainField = null;
	} );

	return found;
}

/**
 * Validates the frontmatter of one SKILL.md file.
 *
 * @param {Object} options               Validation options.
 * @param {string} options.directoryName Name of the skill's directory.
 * @param {string} options.source        Contents of SKILL.md.
 * @return {SkillError[]} The errors found, or an empty array.
 */
export function validateSkill( { directoryName, source } ) {
	const lines = source.replace( /^\uFEFF/, '' ).split( /\r?\n/ );

	if ( lines[ 0 ] !== '---' ) {
		return [
			{
				line: 1,
				message:
					'SKILL.md must start with YAML frontmatter: a "---" line, the fields, and a closing "---" line.',
			},
		];
	}

	const closingIndex = lines.indexOf( '---', 1 );
	if ( closingIndex === -1 ) {
		return [
			{
				line: 1,
				message: 'The frontmatter has no closing "---" line.',
			},
		];
	}

	const frontmatterLines = lines.slice( 1, closingIndex );
	// Frontmatter starts on line 2 of the file.
	const toFileLine = ( frontmatterIndex ) => frontmatterIndex + 2;
	const lineOf = ( field ) => {
		const index = frontmatterLines.findIndex( ( line ) =>
			line.startsWith( `${ field }:` )
		);
		return index === -1 ? 1 : toFileLine( index );
	};

	let frontmatter;
	try {
		frontmatter = load( frontmatterLines.join( '\n' ) );
	} catch ( error ) {
		const reason = error.reason ?? error.message;
		// An unquoted value that contains ": " is the usual cause, and the
		// parser's own wording does not point at it.
		const hint = reason.includes( 'bad indentation of a mapping entry' )
			? ' If the value contains ": ", wrap the whole value in quotes.'
			: '';
		return [
			{
				line: toFileLine( error.mark?.line ?? -1 ),
				message: `The frontmatter is not valid YAML: ${ reason }.${ hint }`,
			},
		];
	}

	if (
		! frontmatter ||
		typeof frontmatter !== 'object' ||
		Array.isArray( frontmatter )
	) {
		return [
			{
				line: 1,
				message:
					'The frontmatter must be a set of "key: value" fields.',
			},
		];
	}

	const errors = findTrailingComments( frontmatterLines ).map(
		( { field, index } ) => ( {
			line: toFileLine( index ),
			message: `The "${ field }" value is cut off at " #", which starts a YAML comment. Wrap the whole value in quotes to keep the text after it.`,
		} )
	);

	for ( const field of Object.keys( frontmatter ) ) {
		if ( ! ALLOWED_FIELDS.has( field ) ) {
			errors.push( {
				line: lineOf( field ),
				message: `Unknown field "${ field }". Allowed fields: ${ [
					...ALLOWED_FIELDS,
				].join( ', ' ) }.`,
			} );
		}
	}

	const { name, description, compatibility } = frontmatter;

	if ( typeof name !== 'string' || name === '' ) {
		errors.push( {
			line: lineOf( 'name' ),
			message: 'The "name" field is required and must be a string.',
		} );
	} else {
		if ( ! NAME_PATTERN.test( name ) ) {
			errors.push( {
				line: lineOf( 'name' ),
				message: `"name" must use lowercase letters, numbers, and single hyphens, such as "my-skill". Found "${ name }".`,
			} );
		}
		if ( name.length > NAME_MAX_LENGTH ) {
			errors.push( {
				line: lineOf( 'name' ),
				message: `"name" must be ${ NAME_MAX_LENGTH } characters or fewer. Found ${ name.length }.`,
			} );
		}
		if ( name !== directoryName ) {
			errors.push( {
				line: lineOf( 'name' ),
				message: `"name" must match the skill's directory name. Found "${ name }" in "${ directoryName }".`,
			} );
		}
	}

	if ( typeof description !== 'string' || description.trim() === '' ) {
		errors.push( {
			line: lineOf( 'description' ),
			message:
				'The "description" field is required and must be a string.',
		} );
	} else {
		if ( /[\r\n]/.test( description.trim() ) ) {
			errors.push( {
				line: lineOf( 'description' ),
				message:
					'"description" must be a single line. Agents match skills against it as one sentence or two.',
			} );
		}
		if ( description.length > DESCRIPTION_MAX_LENGTH ) {
			errors.push( {
				line: lineOf( 'description' ),
				message: `"description" must be ${ DESCRIPTION_MAX_LENGTH } characters or fewer. Found ${ description.length }.`,
			} );
		}
	}

	if ( compatibility !== undefined ) {
		if (
			typeof compatibility !== 'string' ||
			compatibility.trim() === ''
		) {
			errors.push( {
				line: lineOf( 'compatibility' ),
				message:
					'The "compatibility" field must be a non-empty string that describes the environment the skill needs.',
			} );
		} else if ( compatibility.length > COMPATIBILITY_MAX_LENGTH ) {
			errors.push( {
				line: lineOf( 'compatibility' ),
				message: `"compatibility" must be ${ COMPATIBILITY_MAX_LENGTH } characters or fewer. Found ${ compatibility.length }.`,
			} );
		}
	}

	return errors;
}

/**
 * Validates every skill in one directory of skills.
 *
 * @param {Object}  options                 Validation options.
 * @param {string}  options.repositoryRoot  Repository root directory.
 * @param {string}  options.skillsDirectory Directory of skills, relative to the root.
 * @param {boolean} options.optional        Whether the directory may not exist.
 * @return {Promise<Array<SkillError & {file: string}>>} The errors found, with the file each is in.
 */
async function validateSkillsDirectory( {
	repositoryRoot,
	skillsDirectory,
	optional = false,
} ) {
	let entries;
	try {
		entries = await readdir( path.join( repositoryRoot, skillsDirectory ), {
			withFileTypes: true,
		} );
	} catch ( error ) {
		if ( optional && error.code === 'ENOENT' ) {
			return [];
		}
		throw error;
	}
	const errors = [];

	for ( const entry of entries ) {
		if ( entry.name.startsWith( '.' ) ) {
			continue;
		}

		const relativeDirectory = path.posix.join(
			skillsDirectory,
			entry.name
		);

		if ( ! entry.isDirectory() ) {
			errors.push( {
				file: relativeDirectory,
				line: 1,
				message: `Each skill must be a directory with a ${ SKILL_FILE } file.`,
			} );
			continue;
		}

		const file = path.posix.join( relativeDirectory, SKILL_FILE );
		let source;
		try {
			source = await readFile(
				path.join( repositoryRoot, file ),
				'utf8'
			);
		} catch ( error ) {
			if ( error.code !== 'ENOENT' ) {
				throw error;
			}
			errors.push( {
				file,
				line: 1,
				message: `Missing ${ SKILL_FILE }.`,
			} );
			continue;
		}

		for ( const skillError of validateSkill( {
			directoryName: entry.name,
			source,
		} ) ) {
			errors.push( { file, ...skillError } );
		}
	}

	return errors;
}

/**
 * Validates every skill in the repository: the `.agents/skills` catalog, and
 * the skills that packages ship in `packages/<package>/skills`.
 *
 * @param {Object} options                Validation options.
 * @param {string} options.repositoryRoot Repository root directory.
 * @return {Promise<Array<SkillError & {file: string}>>} The errors found, with the file each is in.
 */
export async function validateSkills( { repositoryRoot } ) {
	const packages = await readdir(
		path.join( repositoryRoot, PACKAGES_DIRECTORY ),
		{ withFileTypes: true }
	).catch( ( error ) => {
		if ( error.code === 'ENOENT' ) {
			return [];
		}
		throw error;
	} );

	const errors = [
		...( await validateSkillsDirectory( {
			repositoryRoot,
			skillsDirectory: CATALOG_DIRECTORY,
		} ) ),
	];

	for ( const entry of packages ) {
		if ( ! entry.isDirectory() ) {
			continue;
		}
		errors.push(
			...( await validateSkillsDirectory( {
				repositoryRoot,
				skillsDirectory: path.posix.join(
					PACKAGES_DIRECTORY,
					entry.name,
					PACKAGE_SKILLS_DIRECTORY
				),
				optional: true,
			} ) )
		);
	}

	return errors.sort(
		( a, b ) => a.file.localeCompare( b.file ) || a.line - b.line
	);
}

async function runValidateSkills() {
	const errors = await validateSkills( {
		repositoryRoot: path.resolve(
			path.dirname( fileURLToPath( import.meta.url ) ),
			'../..'
		),
	} );

	if ( errors.length ) {
		for ( const { file, line, message } of errors ) {
			console.error( `${ file }:${ line }: ${ message }` );
		}
		console.error(
			`\nFound ${ errors.length } problem(s) in the skill directories.`
		);
		process.exitCode = 1;
		return;
	}

	console.log( 'All skills are valid.' );
}

if (
	process.argv[ 1 ] &&
	import.meta.url === pathToFileURL( process.argv[ 1 ] ).href
) {
	runValidateSkills().catch( ( error ) => {
		console.error( error.message );
		process.exitCode = 1;
	} );
}
