/**
 * Returns an entity's config, loading the configs of its kind when needed.
 *
 * `@wordpress/data` never reruns a failed resolution, so a failed load is
 * retried when it left the entity unknown. Otherwise one failed request would
 * leave the entity unknown for the rest of the session.
 *
 * @param {Object}  thunkArgs               Thunk arguments.
 * @param {Object}  thunkArgs.select        Store selectors.
 * @param {Object}  thunkArgs.dispatch      Store actions.
 * @param {Object}  thunkArgs.resolveSelect Store selectors that wait for
 *                                          resolution.
 * @param {string}  kind                    Entity kind.
 * @param {string}  name                    Entity name.
 * @param {Object}  [options]               Options.
 * @param {boolean} [options.throwOnError]  Whether to throw the load error
 *                                          when it left the entity unknown.
 *                                          Defaults to false.
 *
 * @return {Promise<Object|undefined>} The entity config, if the entity is known.
 */
export default async function getOrLoadEntityConfig(
	{ select, dispatch, resolveSelect },
	kind,
	name,
	{ throwOnError = false } = {}
) {
	const findConfig = ( configs ) =>
		configs.find(
			( config ) => config.kind === kind && config.name === name
		);

	if (
		select.hasResolutionFailed( 'getEntitiesConfig', [ kind ] ) &&
		! findConfig( select.getEntitiesConfig( kind ) )
	) {
		dispatch.invalidateResolution( 'getEntitiesConfig', [ kind ] );
	}

	try {
		return findConfig( await resolveSelect.getEntitiesConfig( kind ) );
	} catch ( error ) {
		// A kind can mix static and loaded configs, so the entity may be
		// known even though the load failed.
		const entityConfig = findConfig( select.getEntitiesConfig( kind ) );
		if ( ! entityConfig && throwOnError ) {
			throw error;
		}
		return entityConfig;
	}
}
