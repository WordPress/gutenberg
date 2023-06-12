/**
 * WordPress dependencies
 */
import deprecated from '@wordpress/deprecated';

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
		( IdType extends void ? SpecificResourcePermissionsResolution : {} )
];

/**
 * Resolves resource permissions.
 *
 * @since 6.1.0 Introduced in WordPress core.
 *
 * @param    resource The resource in question, e.g. media.
 * @param    id       ID of a specific resource entry, if needed, e.g. 10.
 *
 * @example
 * ```js
 * import { useResourcePermissions } from '@wordpress/core-data';
 *
 * function PagesList() {
 *   const { canCreate, isResolving } = useResourcePermissions( 'pages' );
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
 *   } = useResourcePermissions( 'pages', pageId );
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
export default function useResourcePermissions< IdType = void >(
	resource: string,
	id?: IdType
): ResourcePermissionsResolution< IdType > {
	return useQuerySelect(
		( resolve ) => {
			const { canUser } = resolve( coreStore );
			const create = canUser( 'create', resource );
			if ( ! id ) {
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
		[ resource, id ]
	);
}

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
