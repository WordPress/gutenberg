/**
 * Infer style dependencies from script dependencies.
 *
 * A script dependency becomes a style dependency when the same handle is
 * registered as a style by this build. Matching on the handles the build
 * registers, not on files on disk or on the dependency's `package.json`, keeps
 * the result independent of the order packages finish bundling in and of
 * whether the dependency can be resolved from the dependent package (it can
 * reach the script only transitively, through a bundled package).
 *
 * @param {string[]}    scriptDependencies Array of script handles from asset file.
 * @param {Set<string>} styleHandles       Handles of the styles this build registers.
 * @return {string[]} Array of style handles to depend on.
 */
export function inferStyleDependencies( scriptDependencies, styleHandles ) {
	if ( ! scriptDependencies ) {
		return [];
	}

	return scriptDependencies.filter( ( handle ) =>
		styleHandles.has( handle )
	);
}
