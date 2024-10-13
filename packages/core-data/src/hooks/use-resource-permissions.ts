/**
 * WordPress dependencies
 */
import deprecated from '@wordpress/deprecated';
import warning from '@wordpress/warning';

/**
 * Internal dependencies
 */
import { store as coreStore } from '../';
import { Status } from './constants';
import useQuerySelect from './use-query-select';

interface GlobalResourcePermissionsResolution {
	/** Can the current user create new resources of this type? */
	canCreate: boolean;
}
interface SpecificResourcePermissionsResolution {
	/** Can the current user update resources of this type? */
	canUpdate: boolean;
	/** Can the current user delete resources of this type? */
	canDelete: boolean;
}
interface ResolutionDetails {
	/** Resolution status */
	status: Status;
	/**
	 * Is the data still being resolved?
	 */
	isResolving: boolean;
}

/**
 * Is the data resolved by now?
 */
type HasResolved = boolean;

type ResourcePermissionsResolution< IdType > = [
	HasResolved,
	ResolutionDetails &
		GlobalResourcePermissionsResolution &
		( IdType extends void ? SpecificResourcePermissionsResolution : {} ),
];

type EntityResource = { kind: string; name: string; id?: string | number };

function useResourcePermissions< IdType = void >(
	resource: string,
	id?: IdType
): ResourcePermissionsResolution< IdType >;

function useResourcePermissions< IdType = void >(
	resource: EntityResource,
	id?: never
): ResourcePermissionsResolution< IdType >;

/**
 * Resolves resource permissions.
 *
 * @since 6.1.0 Introduced in WordPress core.
 *
 * @param    resource Entity resource to check. Accepts entity object `{ kind: 'root', name: 'media', id: 1 }`
 *                    or REST base as a string - `media`.
 * @param    id       Optional ID of the resource to check, e.g. 10. Note: This argument is discouraged
 *                    when using an entity object as a resource to check permissions and will be ignored.
 *
 * @example
 * ```js
 * import { useResourcePermissions } from '@wordpress/core-data';
 *
 * function PagesList() {
 *   const { canCreate, isResolving } = useResourcePermissions( { kind: 'postType', name: 'page' } );
 *
 *   if ( isResolving ) {
 *     return 'Loading ...';
 *   }
 *
 *   return (
 *     <div>
 *       {canCreate ? (<button>+ Create a new page</button>) : false}
 *       // ...
 *     </div>
 *   );
 * }
 *
 * // Rendered in the application:
 * // <PagesList />
 * ```
 *
 * @example
 * ```js
 * import { useResourcePermissions } from '@wordpress/core-data';
 *
 * function Page({ pageId }) {
 *   const {
 *     canCreate,
 *     canUpdate,
 *     canDelete,
 *     isResolving
 *   } = useResourcePermissions( { kind: 'postType', name: 'page', id: pageId } );
 *
 *   if ( isResolving ) {
 *     return 'Loading ...';
 *   }
 *
 *   return (
 *     <div>
 *       {canCreate ? (<button>+ Create a new page</button>) : false}
 *       {canUpdate ? (<button>Edit page</button>) : false}
 *       {canDelete ? (<button>Delete page</button>) : false}
 *       // ...
 *     </div>
 *   );
 * }
 *
 * // Rendered in the application:
 * // <Page pageId={ 15 } />
 * ```
 *
 * In the above example, when `PagesList` is rendered into an
 * application, the appropriate permissions and the resolution details will be retrieved from
 * the store state using `canUser()`, or resolved if missing.
 *
 * @return Entity records data.
 * @template IdType
 */
function useResourcePermissions< IdType = void >(
	resource: string | EntityResource,
	id?: IdType
): ResourcePermissionsResolution< IdType > {
	// Serialize `resource` to a string that can be safely used as a React dep.
	// We can't just pass `resource` as one of the deps, because if it is passed
	// as an object literal, then it will be a different object on each call even
	// if the values remain the same.
	const isEntity = typeof resource === 'object';
	const resourceAsString = isEntity ? JSON.stringify( resource ) : resource;

	if ( isEntity && typeof id !== 'undefined' ) {
		warning(
			`When 'resource' is an entity object, passing 'id' as a separate argument isn't supported.`
		);
	}

	return useQuerySelect(
		( resolve ) => {
			const hasId = isEntity ? !! resource.id : !! id;
			const { canUser } = resolve( coreStore );
			const create = canUser(
				'create',
				isEntity
					? { kind: resource.kind, name: resource.name }
					: resource
			);

			if ( ! hasId ) {
				const read = canUser( 'read', resource );

				const isResolving = create.isResolving || read.isResolving;
				const hasResolved = create.hasResolved && read.hasResolved;
				let status = Status.Idle;
				if ( isResolving ) {
					status = Status.Resolving;
				} else if ( hasResolved ) {
					status = Status.Success;
				}

				return {
					status,
					isResolving,
					hasResolved,
					canCreate: create.hasResolved && create.data,
					canRead: read.hasResolved && read.data,
				};
			}

			const read = canUser( 'read', resource, id );
			const update = canUser( 'update', resource, id );
			const _delete = canUser( 'delete', resource, id );
			const isResolving =
				read.isResolving ||
				create.isResolving ||
				update.isResolving ||
				_delete.isResolving;
			const hasResolved =
				read.hasResolved &&
				create.hasResolved &&
				update.hasResolved &&
				_delete.hasResolved;

			let status = Status.Idle;
			if ( isResolving ) {
				status = Status.Resolving;
			} else if ( hasResolved ) {
				status = Status.Success;
			}
			return {
				status,
				isResolving,
				hasResolved,
				canRead: hasResolved && read.data,
				canCreate: hasResolved && create.data,
				canUpdate: hasResolved && update.data,
				canDelete: hasResolved && _delete.data,
			};
		},
		[ resourceAsString, id ]
	);
}

export default useResourcePermissions;

export function __experimentalUseResourcePermissions(
	resource: string,
	id?: unknown
) {
	deprecated( `wp.data.__experimentalUseResourcePermissions`, {
		alternative: 'wp.data.useResourcePermissions',
		since: '6.1',
	} );
	return useResourcePermissions( resource, id );
}
