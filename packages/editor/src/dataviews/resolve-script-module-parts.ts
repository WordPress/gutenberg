/**
 * How to import a script module by id.
 */
export type ModuleImporter = ( id: string ) => Promise< unknown >;

/**
 * A script module registered on the server, with the ids of the items (fields
 * or actions) it provides the JavaScript parts of.
 */
export type ItemsModule = { id: string; ids: string[] };

function importModule( id: string ) {
	return import( /* webpackIgnore: true */ /* @vite-ignore */ id );
}

/**
 * Imports the script modules registered on the server along with items, such
 * as fields or actions, and merges their JavaScript parts into the items.
 *
 * The modules are imported in parallel, but applied in the order the server
 * lists them once all have settled, so a later module overrides an earlier
 * one no matter which finishes loading first. A module only contributes to
 * the items the server lists for it: a module can hold items that were never
 * registered, or were unregistered, and those must not show up.
 *
 * A module that fails to load is skipped: its items keep their server data
 * and lose only their JavaScript parts.
 *
 * @param items       The serializable part of each item, in the server order.
 * @param modules     The script modules, in the server order.
 * @param description What the items are, for the warning of a module that
 *                    fails to load, e.g. `fields of postType/page`.
 * @param importer    How to import a script module by id.
 * @return The items, in the server order.
 */
export async function resolveScriptModuleParts<
	Item extends { id: string },
	Parts extends object,
>(
	items: Item[],
	modules: ItemsModule[],
	description: string,
	importer: ModuleImporter = importModule
): Promise< Array< Item & Partial< Parts > > > {
	const results = await Promise.allSettled(
		modules.map( ( { id } ) => importer( id ) )
	);

	const partsById = new Map< string, Partial< Parts > >();
	results.forEach( ( result, index ) => {
		const { id: moduleId, ids } = modules[ index ];
		if ( result.status === 'rejected' ) {
			// eslint-disable-next-line no-console
			console.warn(
				`Could not load the script module ${ moduleId } of the ${ description }.`,
				result.reason
			);
			return;
		}
		const parts =
			( result.value as { default?: Record< string, Parts > } )
				?.default ?? {};
		for ( const itemId of ids ?? [] ) {
			if ( parts[ itemId ] ) {
				partsById.set( itemId, {
					...partsById.get( itemId ),
					...parts[ itemId ],
				} );
			}
		}
	} );

	return items.map( ( item ) => ( {
		...item,
		...partsById.get( item.id ),
	} ) );
}
