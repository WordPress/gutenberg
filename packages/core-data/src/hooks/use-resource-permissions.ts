import { useSelect } from '@wordpress/data';
import deprecated from '@wordpress/deprecated';
import warning from '@wordpress/warning';
import { store as coreStore } from '../';
import { Status } from './constants';
import { getResolutionStatus } from './utils';

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
	/**
	 * Resolution status
	 *
	 * @deprecated Check the permission values instead.
	 */
	status: Status;
	/**
	 * Is the data still being resolved?
	 *
	 * @deprecated Check the permission values instead.
	 */
	isResolving: boolean;
	/**
	 * Is the data resolved by now?
	 *
	 * @deprecated Check the permission values instead.
	 */
	hasResolved: boolean;
}

type ResourcePermissionsResolution< IdType > = ResolutionDetails &
	GlobalResourcePermissionsResolution &
	( IdType extends void ? SpecificResourcePermissionsResolution : {} );

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
 * Note: New code should call the `canUser` selector with `useSelect` instead,
 * checking only the actions it needs.
 *
 * @since 6.1.0 Introduced in WordPress core.
 *
 * @param    resource Entity resource to check. Accepts entity object `{ kind: 'postType', name: 'attachment', id: 1 }`
 *                    or REST base as a string - `media`.
 * @param    id       Optional ID of the resource to check, e.g. 10. Note: This argument is discouraged
 *                    when using an entity object as a resource to check permissions and will be ignored.
 *
 * @example
 * ```js
 * import { useResourcePermissions } from '@wordpress/core-data';
 *
 * function PagesList() {
 *   const { canCreate } = useResourcePermissions( { kind: 'postType', name: 'page' } );
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
 *   const { canCreate, canUpdate, canDelete } = useResourcePermissions( {
 *     kind: 'postType',
 *     name: 'page',
 *     id: pageId,
 *   } );
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
 * application, the appropriate permissions will be retrieved from
 * the store state using `canUser()`, or resolved if missing.
 *
 * @return Resource permissions.
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

	return useSelect(
		( select ) => {
			const hasId = isEntity ? !! resource.id : !! id;
			const { canUser, getResolutionState } = select( coreStore );
			const check = ( ...args: Parameters< typeof canUser > ) => ( {
				data: canUser( ...args ),
				...getResolutionStatus(
					getResolutionState( 'canUser', args )?.status
				),
			} );
			const collectionResource = isEntity
				? { kind: resource.kind, name: resource.name }
				: resource;
			const create = check( 'create', collectionResource );

			if ( ! hasId ) {
				const read = check( 'read', collectionResource );

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

			const recordId = id as string | number | undefined;
			const read = check( 'read', resource, recordId );
			const update = check( 'update', resource, recordId );
			const _delete = check( 'delete', resource, recordId );
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
	) as ResourcePermissionsResolution< IdType >;
}

export default useResourcePermissions;

export function useDeprecatedResourcePermissions(
	resource: string,
	id?: unknown
) {
	deprecated( `wp.data.__experimentalUseResourcePermissions`, {
		alternative: 'wp.data.useResourcePermissions',
		since: '6.1',
	} );
	return useResourcePermissions( resource, id );
}
