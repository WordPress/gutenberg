import type {
	Component,
	ComponentDetail,
	ComponentProp,
	ManifestComponent,
} from './types';

/**
 * Map from directory name (in the story file path) to npm package name. The
 * manifest `path` field uses relative paths from the Storybook configuration.
 * For example, `../packages/ui/src/button/stories/index.story.tsx`.
 *
 * This also serves a dual purpose of filtering components to only include those
 * from allowed packages, since alternative ways of implementing a mapping would
 * be to respect the `package.json` package name (slow), or simply prepend the
 * `@wordpress/` npm namespace (not always accurate, see `packages/wp-build`).
 */
const PACKAGE_DIR_TO_NAME: Record< string, string > = {
	ui: '@wordpress/ui',
};

/**
 * Derive the npm package name from the story file path.
 *
 * Manifest paths look like `../packages/<dir>/src/.../index.story.tsx`.
 * We extract `<dir>` and map it through PACKAGE_DIR_TO_NAME.
 *
 * @param storyPath - The story file path from the manifest.
 * @return The npm package name, or null if not an allowed package.
 */
export function packageNameFromPath( storyPath: string ): string | null {
	const match = storyPath.match( /\.\.\/packages\/([^/]+)\// );
	return ( match && PACKAGE_DIR_TO_NAME[ match[ 1 ] ] ) ?? null;
}

/**
 * Parse props from a component's reactDocgen data, filtering out
 * deprecated and ignored props.
 *
 * @param rawProps - The reactDocgen props record.
 * @return Parsed props with deprecated entries removed.
 */
export function parseProps(
	rawProps: Record<
		string,
		{
			required?: boolean;
			tsType?: { name: string; raw?: string };
			description?: string;
			defaultValue?: { value: string };
		}
	>
): ComponentProp[] {
	return Object.entries( rawProps )
		.filter( ( [ , propInfo ] ) => {
			const description = ( propInfo.description || '' ).toLowerCase();
			return (
				! description.includes( '@deprecated' ) &&
				! description.includes( '@ignore' )
			);
		} )
		.map( ( [ propName, propInfo ] ) => ( {
			name: propName,
			type: propInfo.tsType?.name || 'unknown',
			required: propInfo.required || false,
			description: propInfo.description || '',
			defaultValue: propInfo.defaultValue?.value ?? null,
		} ) );
}

/**
 * Parse manifest components into a flat list from allowed packages.
 *
 * @param components - The manifest components record.
 * @return Components from allowed packages.
 */
export function parseComponents(
	components: Record< string, ManifestComponent >
): Component[] {
	return Object.values( components )
		.map( ( component ) => ( {
			name: component.name,
			description: component.description || '',
			packageName: packageNameFromPath( component.path ),
		} ) )
		.filter(
			( component ): component is Component =>
				component.packageName !== null
		);
}

/**
 * Find a single component by name (case-insensitive) and return its
 * full detail including props and stories.
 *
 * @param components - The manifest components record.
 * @param name       - The component name to look up.
 * @return The component detail, or null if not found.
 */
export function parseComponentDetail(
	components: Record< string, ManifestComponent >,
	name: string
): ComponentDetail | null {
	for ( const component of Object.values( components ) ) {
		if ( component.name.toLowerCase() !== name.toLowerCase() ) {
			continue;
		}

		const pkg = packageNameFromPath( component.path );
		if ( pkg ) {
			return {
				name: component.name,
				description: component.description || '',
				packageName: pkg,
				importStatement: component.import ?? null,
				props: parseProps( component.reactDocgen?.props || {} ),
				stories: component.stories || [],
			};
		}
	}

	return null;
}
