/**
 * WordPress dependencies
 */
import { useParams, useNavigate, useSearch, Link } from '@wordpress/route';
import { useView } from '@wordpress/views';
import { DataViews } from '@wordpress/dataviews';
import { Page } from '@wordpress/admin-ui';
import type { View } from '@wordpress/dataviews';
import {
	privateApis as coreDataPrivateApis,
	store as coreStore,
} from '@wordpress/core-data';
import { privateApis as componentsPrivateApis } from '@wordpress/components';
import { useMemo, useCallback, useState, useEffect } from '@wordpress/element';
import { useSelect } from '@wordpress/data';
import { __ } from '@wordpress/i18n';
import apiFetch from '@wordpress/api-fetch';

/**
 * Internal dependencies
 */
import { unlock } from '../lock-unlock';
import {
	DEFAULT_VIEW,
	DEFAULT_LAYOUTS,
	getActiveViewOverridesForTab,
	viewToQuery,
} from './view-utils';
import { STATUS_TABS } from './types';
import type { CommentWithPermissions } from './types';
import {
	authorNameField,
	contentField,
	postField,
	dateField,
	statusField,
	typeField,
} from './fields';
import {
	approveComment,
	unapproveComment,
	spamComment,
	trashComment,
	restoreComment,
	deleteComment,
} from './actions';

/**
 * Style dependencies
 */
import './style.scss';

const { useEntityRecordsWithPermissions } = unlock( coreDataPrivateApis );
const { Tabs } = unlock( componentsPrivateApis );

/**
 * Fetch lightweight comment counts for each status tab.
 *
 * @param currentUserId The current user's ID, used for the "mine" count.
 */
function useCommentCounts( currentUserId: number | undefined ) {
	const [ counts, setCounts ] = useState< Record< string, number > >( {} );

	useEffect( () => {
		const statuses = [ 'approve', 'hold', 'spam', 'trash' ];
		const fetches = statuses.map( ( status ) =>
			apiFetch( {
				path: `/wp/v2/comments?status=${ status }&per_page=1`,
				parse: false,
			} ).then( ( response: Response ) => ( {
				status,
				total: parseInt(
					response.headers.get( 'X-WP-Total' ) || '0',
					10
				),
			} ) )
		);

		// Fetch "mine" count if we have a user ID.
		if ( currentUserId ) {
			fetches.push(
				apiFetch( {
					path: `/wp/v2/comments?author=${ currentUserId }&per_page=1`,
					parse: false,
				} ).then( ( response: Response ) => ( {
					status: 'mine',
					total: parseInt(
						response.headers.get( 'X-WP-Total' ) || '0',
						10
					),
				} ) )
			);
		}

		Promise.all( fetches ).then( ( results ) => {
			const newCounts: Record< string, number > = {};
			results.forEach( ( { status, total } ) => {
				newCounts[ status ] = total;
			} );
			// "all" = approve + hold (matching classic WP behavior).
			newCounts.all =
				( newCounts.approve ?? 0 ) + ( newCounts.hold ?? 0 );
			setCounts( newCounts );
		} );
	}, [ currentUserId ] );

	return counts;
}

/**
 * Return a stable string ID for a comment item.
 *
 * @param item The comment record.
 */
function getItemId( item: CommentWithPermissions ) {
	return item.id.toString();
}

function CommentsList() {
	const { status: statusSlug = 'all' } = useParams( {
		from: '/$status',
	} );
	const navigate = useNavigate();
	const searchParams = useSearch( { from: '/$status' } );

	// View state management
	const activeViewOverrides = useMemo(
		() => getActiveViewOverridesForTab( statusSlug ),
		[ statusSlug ]
	);

	const handleQueryParamsChange = useCallback(
		( params: { page?: number; search?: string } ) => {
			navigate( {
				search: {
					...searchParams,
					...params,
				},
			} );
		},
		[ searchParams, navigate ]
	);

	const currentUserId = useSelect(
		( select ) =>
			(
				select( coreStore ).getCurrentUser() as
					| { id?: number }
					| undefined
			 )?.id,
		[]
	);
	const counts = useCommentCounts( currentUserId );

	const { view, isModified, updateView, resetToDefault } = useView( {
		kind: 'root',
		name: 'comment',
		slug: 'default',
		defaultView: DEFAULT_VIEW,
		activeViewOverrides,
		queryParams: searchParams,
		onChangeQueryParams: handleQueryParamsChange,
	} );

	const onChangeView = ( newView: View ) => {
		updateView( newView );
	};

	const onReset = () => {
		resetToDefault();
	};

	// Build query and fetch comments
	const queryArgs = useMemo( () => {
		const args = viewToQuery( view );
		if ( statusSlug === 'mine' && currentUserId ) {
			args.author = currentUserId;
		}
		return args;
	}, [ view, statusSlug, currentUserId ] );
	const {
		records: comments,
		totalItems,
		totalPages,
		isResolving,
		hasResolved,
	} = useEntityRecordsWithPermissions( 'root', 'comment', queryArgs );

	// Fields — hide status column when viewing a specific status tab
	const fields = useMemo( () => {
		const allFields = [
			authorNameField,
			contentField,
			postField,
			dateField,
			statusField,
			typeField,
		];
		return allFields
			.filter( ( field ) => {
				if ( field.id === 'status' && statusSlug !== 'all' ) {
					return false;
				}
				return true;
			} )
			.map( ( field ) => {
				// Disable status filtering since we use tabs
				if ( field.id === 'status' ) {
					return { ...field, filterBy: false };
				}
				return field;
			} );
	}, [ statusSlug ] );

	// Actions — context-sensitive based on current tab
	const actions = useMemo( () => {
		return [
			approveComment,
			unapproveComment,
			spamComment,
			trashComment,
			restoreComment,
			deleteComment,
		];
	}, [] );

	// Tab change handler
	const handleTabChange = useCallback(
		( newStatus: string ) => {
			navigate( {
				to: `/${ newStatus }`,
			} );
		},
		[ navigate ]
	);

	// Selection from URL
	const selection = searchParams.commentIds ?? [];

	return (
		<Page
			title={ __( 'Comments' ) }
			className="comments-page"
			hasPadding={ false }
		>
			<div className="comments-page__tabs-wrapper">
				<Tabs onSelect={ handleTabChange } selectedTabId={ statusSlug }>
					<Tabs.TabList>
						{ STATUS_TABS.map( ( tab ) => (
							<Tabs.Tab tabId={ tab.slug } key={ tab.slug }>
								{ tab.label }
								{ counts[ tab.slug ] !== undefined &&
									` (${ counts[ tab.slug ] })` }
							</Tabs.Tab>
						) ) }
					</Tabs.TabList>
				</Tabs>
			</div>
			<DataViews
				data={ comments }
				fields={ fields }
				view={ view }
				onChangeView={ onChangeView }
				actions={ actions }
				isLoading={ isResolving || ! hasResolved }
				paginationInfo={ {
					totalItems,
					totalPages,
				} }
				defaultLayouts={ DEFAULT_LAYOUTS }
				getItemId={ getItemId }
				selection={ selection }
				onReset={ isModified ? onReset : false }
				onChangeSelection={ ( items: string[] ) => {
					navigate( {
						search: {
							...searchParams,
							commentIds: items.length > 0 ? items : undefined,
						},
					} );
				} }
				renderItemLink={ ( {
					item,
					...props
				}: {
					item: CommentWithPermissions;
				} ) => (
					<Link
						to={ `/${ statusSlug }` }
						search={ {
							...searchParams,
							commentIds: [ item.id.toString() ],
						} }
						{ ...props }
						onClick={ ( event: React.MouseEvent ) => {
							event.stopPropagation();
						} }
					/>
				) }
			/>
		</Page>
	);
}

export const stage = CommentsList;
