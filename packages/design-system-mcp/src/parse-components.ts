import type {
	Component,
	ComponentDetail,
	ComponentProp,
	ManifestComponent,
} from './types';

/**
 * Mapping of canonical name to actual exported identifier, keyed by
 * `package:name`. A package's actual exported identifier may be different from
 * the canonical name in the internal implementation that's known to Storybook.
 *
 * Ideally we could derive this from the package's source code, but MCP
 * consumers aren't guaranteed to have these packages installed. Since this
 * is a legacy convention, we expect this list will only ever shrink over time
 * and can eventually be removed.
 */
const EXPORT_ALIASES: Record< string, string > = {
	'@wordpress/components:ConfirmDialog': '__experimentalConfirmDialog',
	'@wordpress/components:InputControl': '__experimentalInputControl',
	'@wordpress/components:ItemGroup': '__experimentalItemGroup',
	'@wordpress/components:ToggleGroupControl':
		'__experimentalToggleGroupControl',
	'@wordpress/components:TreeGrid': '__experimentalTreeGrid',
	'@wordpress/components:Truncate': '__experimentalTruncate',
};

/**
 * Build the import statement a consumer should use to bring a component into
 * scope under its canonical name. For aliased components, emit an `as` rename
 * so that subsequent code samples (which reference the canonical name) resolve
 * against the actual export.
 *
 * @param name        - The canonical component name.
 * @param packageName - The npm package name.
 * @return The import statement as a single-line string.
 */
function buildImportStatement( name: string, packageName: string ): string {
	const exported = EXPORT_ALIASES[ `${ packageName }:${ name }` ];
	return exported
		? `import { ${ exported } as ${ name } } from '${ packageName }';`
		: `import { ${ name } } from '${ packageName }';`;
}

/**
 * Derive the npm package name from the story file path.
 *
 * Manifest paths look like `../packages/<dir>/src/.../index.story.tsx`. We
 * extract `<dir>` and prepend the `@wordpress/` npm namespace. Curation of
 * which components appear in the manifest is handled upstream via Storybook
 * tags, so this only needs to recognize package-shaped paths.
 *
 * @param storyPath - The story file path from the manifest.
 * @return The npm package name, or null for paths outside `packages/*`.
 */
export function packageNameFromPath( storyPath: string ): string | null {
	const match = storyPath.match( /\.\.\/packages\/([^/]+)\// );
	return match ? `@wordpress/${ match[ 1 ] }` : null;
}

/**
 * For components exported as a namespace (e.g. `AlertDialog`, with members
 * `AlertDialog.Root`, `AlertDialog.Trigger`, etc.), the manifest lists the
 * primary entry under a dotted name like `AlertDialog.Root`. The canonical
 * name we expose is the top-level identifier a consumer actually imports,
 * which is the portion before the first dot. For simple components (e.g.
 * `Button`), this is a no-op.
 *
 * @param name - The component name from the manifest.
 * @return The top-level importable identifier.
 */
function canonicalComponentName( name: string ): string {
	return name.split( '.', 1 )[ 0 ];
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
			// Prefer `raw` when present, as it carries the source-authored type
			// expression a consumer could use directly. Primitives emit only
			// `name`, so fall back if `raw` is not present.
			type: propInfo.tsType?.raw || propInfo.tsType?.name || 'unknown',
			required: propInfo.required || false,
			description: propInfo.description || '',
			defaultValue: propInfo.defaultValue?.value ?? null,
		} ) );
}

/**
 * Parse manifest components into a flat list sorted alphabetically by name.
 * When a component is defined across multiple story files (e.g. a companion
 * file documenting a specific aspect), it is collapsed to a single entry keyed
 * by its canonical name and package.
 *
 * @param components - The manifest components record.
 * @return Flat list of components derived from the manifest.
 */
export function parseComponents(
	components: Record< string, ManifestComponent >
): Component[] {
	const byKey = new Map< string, Component >();

	for ( const component of Object.values( components ) ) {
		const packageName = packageNameFromPath( component.path );
		if ( ! packageName ) {
			continue;
		}

		const name = canonicalComponentName( component.name );
		const key = `${ packageName }:${ name }`;
		const existing = byKey.get( key );
		const description = component.description || '';

		if ( ! existing ) {
			byKey.set( key, { name, description, packageName } );
		} else {
			// Prefer a non-empty description from a later entry over an
			// empty one from the first.
			existing.description ||= description;
		}
	}

	return Array.from( byKey.values() ).sort( ( a, b ) =>
		a.name.localeCompare( b.name )
	);
}

/**
 * Find a single component by name (case-insensitive) and return its full
 * detail including props and stories. When a component is spread across
 * multiple story files, stories from every contributing file are collected
 * in manifest order. Descriptions and props are also authored on the component
 * itself, so in principle they should be identical across story files; in
 * practice one file may omit them, so we prefer any non-empty value found.
 *
 * @param components - The manifest components record.
 * @param name       - The component name to look up.
 * @return The component detail, or null if not found.
 */
export function parseComponentDetail(
	components: Record< string, ManifestComponent >,
	name: string
): ComponentDetail | null {
	let detail: ComponentDetail | null = null;

	for ( const component of Object.values( components ) ) {
		const canonicalName = canonicalComponentName( component.name );
		if ( canonicalName.toLowerCase() !== name.toLowerCase() ) {
			continue;
		}

		const pkg = packageNameFromPath( component.path );
		if ( ! pkg ) {
			continue;
		}

		const description = component.description || '';
		const props = parseProps( component.reactDocgen?.props || {} );
		const stories = component.stories || [];

		if ( ! detail ) {
			detail = {
				name: canonicalName,
				description,
				packageName: pkg,
				importStatement: buildImportStatement( canonicalName, pkg ),
				props,
				stories: [ ...stories ],
			};
		} else if ( detail.packageName === pkg ) {
			detail.description ||= description;
			if ( detail.props.length === 0 ) {
				detail.props = props;
			}
			detail.stories.push( ...stories );
		}
	}

	return detail;
}
