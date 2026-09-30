import path from 'node:path';

/**
 * Resolve the directories holding the given `@types` packages.
 *
 * @param {string[]} typeNames      Package names without the `@types/` scope.
 * @param {Function} resolvePackage Resolver scoped to the owning workspace.
 * @return {string[]} Absolute `@types` directories, without duplicates.
 */
export function resolveTypeRoots( typeNames, resolvePackage ) {
	const typeRoots = new Set();

	for ( const typeName of typeNames ) {
		try {
			const packageJsonPath = resolvePackage(
				`@types/${ typeName }/package.json`
			);
			typeRoots.add( path.dirname( path.dirname( packageJsonPath ) ) );
		} catch {
			// Declared under `typings` rather than by an `@types` package.
		}
	}

	return [ ...typeRoots ];
}
