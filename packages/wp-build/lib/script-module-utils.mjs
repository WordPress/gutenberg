/**
 * Helpers for the script modules a package declares in `wpScriptModuleExports`.
 */

/**
 * @typedef {Object} ScriptModuleExportConfig
 *
 * @property {string} path Path of the entry point, relative to the package.
 * @property {string} [id] Script module ID to register instead of the one
 *                         generated from the package name and export key.
 */

/**
 * @typedef {string | ScriptModuleExportConfig} ScriptModuleExportValue
 */

/**
 * @typedef {Object} ScriptModuleExport
 *
 * @property {string}           exportName Export key, such as `.` or `./sub`.
 * @property {string}           fileName   Output file name, from the key.
 * @property {string}           entryPath  Entry point, relative to the package.
 * @property {string|undefined} id         Script module ID override, if any.
 */

/**
 * Normalize the `wpScriptModuleExports` field of a package.json into a list.
 *
 * The field is either a path (the root export), or an object whose keys are
 * export names (`.` or `./sub/path`) and whose values are either a path or an
 * object `{ path, id }`, where `id` replaces the generated script module ID.
 *
 * @param {string|Record<string, ScriptModuleExportValue>|undefined} wpScriptModuleExports The field value.
 * @param {string}                                                   [packageName]         Package name, for error messages.
 * @return {ScriptModuleExport[]} The exports.
 */
export function getScriptModuleExports( wpScriptModuleExports, packageName ) {
	if ( ! wpScriptModuleExports ) {
		return [];
	}

	const exports =
		typeof wpScriptModuleExports === 'string'
			? { '.': wpScriptModuleExports }
			: wpScriptModuleExports;

	return Object.entries( exports ).map( ( [ exportName, value ] ) => {
		const fileName =
			exportName === '.' ? 'index' : exportName.replace( /^\.\//, '' );

		if ( typeof value === 'string' ) {
			return { exportName, fileName, entryPath: value, id: undefined };
		}

		const where = `"wpScriptModuleExports" entry "${ exportName }"${
			packageName ? ` of ${ packageName }` : ''
		}`;

		if (
			! value ||
			typeof value !== 'object' ||
			typeof value.path !== 'string' ||
			! value.path
		) {
			throw new Error(
				`The ${ where } must be a path or an object with a "path".`
			);
		}

		if (
			value.id !== undefined &&
			( typeof value.id !== 'string' || ! value.id )
		) {
			throw new Error(
				`The "id" of the ${ where } must be a non-empty string.`
			);
		}

		return {
			exportName,
			fileName,
			entryPath: value.path,
			id: value.id,
		};
	} );
}

/**
 * Get the script module ID an export registers.
 *
 * @param {ScriptModuleExport} scriptModuleExport The export.
 * @param {string}             packageNamespace   Package namespace, e.g. `wordpress`.
 * @param {string}             packageName        Short package name, e.g. `fields`.
 * @return {string} The script module ID.
 */
export function getScriptModuleId(
	scriptModuleExport,
	packageNamespace,
	packageName
) {
	if ( scriptModuleExport.id ) {
		return scriptModuleExport.id;
	}

	return scriptModuleExport.exportName === '.'
		? `@${ packageNamespace }/${ packageName }`
		: `@${ packageNamespace }/${ packageName }/${ scriptModuleExport.fileName }`;
}

/**
 * Throw when two built script modules register the same ID.
 *
 * @param {Array<{id: string, path: string}>} modules The built modules.
 */
export function assertUniqueScriptModuleIds( modules ) {
	/** @type {Map<string, string[]>} */
	const pathsById = new Map();
	for ( const { id, path } of modules ) {
		if ( ! pathsById.has( id ) ) {
			pathsById.set( id, [] );
		}
		pathsById.get( id )?.push( path );
	}

	const duplicates = [ ...pathsById ].filter(
		( [ , paths ] ) => paths.length > 1
	);

	if ( duplicates.length ) {
		throw new Error(
			'Several script modules register the same ID:\n' +
				duplicates
					.map(
						( [ id, paths ] ) =>
							`  ${ id }: ${ paths
								.map( ( p ) => `build/modules/${ p }` )
								.join( ', ' ) }`
					)
					.join( '\n' )
		);
	}
}
