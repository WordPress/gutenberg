/**
 * Storybook preset that merges `notes` from the component-status registry
 * onto each entry in the components manifest.
 */
import type { ComponentManifest, Manifests } from 'storybook/internal/types';
import { COMPONENT_STATUS } from '../component-status';

type ComponentManifestWithNotes = ComponentManifest & { notes?: string };

const REGISTRY = COMPONENT_STATUS as Record<
	string,
	Record< string, { notes?: string } >
>;

/**
 * Derive the npm package name from a manifest entry's story file path.
 *
 * @param storyPath - The story file path recorded on the manifest entry.
 * @return The npm package name, or `null` for paths outside `packages/*`.
 */
function packageNameFromPath( storyPath: string ): string | null {
	const match = storyPath.match( /\.\.\/packages\/([^/]+)\// );
	return match ? `@wordpress/${ match[ 1 ] }` : null;
}

/**
 * Reduce a namespace component name (e.g. `AlertDialog.Root`) to the
 * top-level importable identifier used as the registry key.
 *
 * @param name - The component name from the manifest.
 * @return The top-level importable identifier.
 */
function canonicalComponentName( name: string ): string {
	return name.split( '.', 1 )[ 0 ];
}

// Disable reason: This is the name that Storybook expects to use for overriding
// experimental manifests behavior.
// eslint-disable-next-line camelcase
export const experimental_manifests = async (
	existing: Manifests | undefined
): Promise< Manifests > => {
	const components = existing?.components;
	if ( ! components ) {
		return existing ?? {};
	}

	const next: Record< string, ComponentManifestWithNotes > = {};
	for ( const [ id, entry ] of Object.entries( components.components ) ) {
		const packageName = packageNameFromPath( entry.path );
		const componentName = canonicalComponentName( entry.name );
		const status = packageName
			? REGISTRY[ packageName ]?.[ componentName ]
			: undefined;

		next[ id ] = status?.notes ? { ...entry, notes: status.notes } : entry;
	}

	return {
		...existing,
		components: { ...components, components: next },
	};
};
