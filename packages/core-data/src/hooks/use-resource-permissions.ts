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
 * @param  resource The resource in question, e.g. media.
 * @param  id       ID of a specific resource entry, if needed, e.g. 10.
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
 * In the above example, when `PagesList` is rendered into an
 * application, the appropriate permissions and the resolution details will be retrieved from
 * the store state using `canUser()`, or resolved if missing.
 *
 * @return Entity records data.
 * @template IdType
 */
export default function __experimentalUseResourcePermissions< IdType = void >(
	resource: string,
	id: IdType
): ResourcePermissionsResolution< IdType > {
	return useQuerySelect(
		( resolve ) => {
			const { canUser } = resolve( coreStore );
			const create = canUser( 'create', resource );
			if ( ! id ) {
				return [
					create.hasResolved,
					{
						status: create.status,
						isResolving: create.isResolving,
						canCreate: create.hasResolved && create.data,
					},
				];
			}

			const update = canUser( 'update', resource, id );
			const _delete = canUser( 'delete', resource, id );
			const isResolving =
				create.isResolving || update.isResolving || _delete.isResolving;
			const hasResolved =
				create.hasResolved && update.hasResolved && _delete.hasResolved;

			let status = Status.Idle;
			if ( isResolving ) {
				status = Status.Resolving;
			} else if ( hasResolved ) {
				status = Status.Success;
			}
			return [
				hasResolved,
				{
					status,
					isResolving,
					canCreate: hasResolved && create.data,
					canUpdate: hasResolved && update.data,
					canDelete: hasResolved && _delete.data,
				},
			];
		},
		[ resource, id ]
	);
}
