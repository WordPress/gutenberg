import { store as coreStore } from '@wordpress/core-data';
import { resolveFieldsConfig } from '../fields-loader/resolve-fields-config';
import type { FieldsConfig } from '../fields-loader/resolve-fields-config';
import { unlock } from '../../lock-unlock';

/**
 * Resolves the fields of an entity from the server: the fields config the
 * `/wp/v2/entity-fields` route returns, through the private `getFieldsConfig`
 * selector of the core data store, with the JavaScript parts of its script
 * modules merged in.
 *
 * A failed request rejects, so the error is the resolution error of the
 * selector. A script module that fails to load does not: its fields keep
 * their server data, see `resolveFieldsConfig`.
 *
 * @param kind Entity kind.
 * @param name Entity name.
 */
export const getEntityFields =
	( kind: string, name: string ) =>
	async ( { dispatch, registry }: { dispatch: any; registry: any } ) => {
		const config: FieldsConfig | undefined = await unlock(
			registry.resolveSelect( coreStore )
		).getFieldsConfig( kind, name );
		const fields = config ? await resolveFieldsConfig( config ) : [];
		dispatch.receiveEntityFields( kind, name, fields );
	};
