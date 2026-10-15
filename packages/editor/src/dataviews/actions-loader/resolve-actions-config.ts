import type { Action } from '@wordpress/dataviews';
import { resolveScriptModuleParts } from '../resolve-script-module-parts';
import type { ModuleImporter } from '../resolve-script-module-parts';

/**
 * The actions registered on the server for an entity, as the
 * `/wp/v2/entity-actions` route returns them and the private
 * `getActionsConfig` selector of the core data store holds them.
 */
export type ActionsConfig = {
	kind: string;
	name: string;
	actions: Array< { id: string } & Record< string, any > >;
	script_modules: Array< { id: string; actions: string[] } >;
};

/**
 * Imports the script modules of an actions config and merges their
 * JavaScript parts into the actions, see `resolveScriptModuleParts`.
 *
 * An action does nothing without the `callback` or the `RenderModal` of its
 * script module, so the actions that get neither, because their module failed
 * to load or does not provide them, are left out.
 *
 * @param config   The actions config.
 * @param importer How to import a script module by id.
 * @return The actions, in the server order.
 */
export async function resolveActionsConfig< Item >(
	config: ActionsConfig,
	importer?: ModuleImporter
): Promise< Action< Item >[] > {
	const description = `actions of ${ config.kind }/${ config.name }`;
	const actions = await resolveScriptModuleParts<
		ActionsConfig[ 'actions' ][ number ],
		Record< string, unknown >
	>(
		config.actions ?? [],
		( config.script_modules ?? [] ).map( ( { id, actions: ids } ) => ( {
			id,
			ids,
		} ) ),
		description,
		importer
	);

	return actions.filter( ( action ) => {
		if ( action.callback || action.RenderModal ) {
			return true;
		}
		// eslint-disable-next-line no-console
		console.warn(
			`The action ${ action.id } of the ${ description } has no callback or modal, so it is left out.`
		);
		return false;
	} ) as unknown as Action< Item >[];
}
