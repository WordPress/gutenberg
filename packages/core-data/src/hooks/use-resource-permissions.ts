/**
 * WordPress dependencies
 */
import deprecated from '@wordpress/deprecated';
import { useSelect } from '@wordpress/data';

/**
 * Internal dependencies
 */
import { store as coreStore } from '../';
import { Status } from './constants';

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
	return useSelect(
		( select ) => {
			const lazyCanCreate = lazyCanUser( select, 'create', resource );
			if ( ! id ) {
				const lazyPerms = [ lazyCanCreate ];
				return {
					get canCreate() {
						return lazyCanCreate.resolve();
					},
					isResolving: isResolving( lazyPerms ),
					hasResolved: hasResolved( lazyPerms ),
					status: getStatus( lazyPerms ),
				};
			}

			const lazyCanRead = lazyCanUser( select, 'read', resource, id );
			const lazyCanUpdate = lazyCanUser( select, 'update', resource, id );
			const lazyCanDelete = lazyCanUser( select, 'delete', resource, id );
			const lazyPerms = [
				lazyCanCreate,
				lazyCanRead,
				lazyCanUpdate,
				lazyCanDelete,
			];

			return {
				get canRead() {
					return lazyCanRead.resolve();
				},
				get canCreate() {
					return lazyCanCreate.resolve();
				},
				get canUpdate() {
					return lazyCanUpdate.resolve();
				},
				get canDelete() {
					return lazyCanDelete.resolve();
				},
				isResolving: isResolving( lazyPerms ),
				hasResolved: hasResolved( lazyPerms ),
				status: getStatus( lazyPerms ),
			};
		},
		[ resource, id ]
	);
}

/**
 * Returns a lazy permission getter to prevent immediate resolution of
 * each possible permission.
 *
 * @param  select
 * @param  permission
 * @param  resource
 * @param  id
 */
const lazyCanUser = (
	select: Function,
	permission: string,
	resource: string,
	id?: unknown
) => {
	const args: unknown[] = [ permission, resource ];
	if ( id ) {
		args.push( id );
	}
	const isResolving =
		select( coreStore ).getIsResolving( 'canUser', args ) === true;
	const hasResolved =
		select( coreStore ).hasFinishedResolution( 'canUser', args ) === true;
	return {
		resolve: () => select( coreStore ).canUser( ...args ) === true,
		isResolving,
		hasResolved,
	};
};

const isResolving = ( lazyPermissions ) => {
	return (
		lazyPermissions.filter( ( item ) => true === item.isResolving ).length >
		0
	);
};
const hasResolved = ( lazyPermissions ) => {
	return (
		lazyPermissions.filter( ( item ) => true === item.hasResolved )
			.length === lazyPermissions.length
	);
};

const getStatus = ( lazyPermissions ) => {
	if ( isResolving( lazyPermissions ) ) {
		return Status.Resolving;
	} else if ( hasResolved( lazyPermissions ) ) {
		return Status.Success;
	}
	return Status.Idle;
};

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
