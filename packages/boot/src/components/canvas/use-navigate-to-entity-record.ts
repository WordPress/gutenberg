import { useCallback, useMemo } from '@wordpress/element';
import { useDispatch, useRegistry, useSelect } from '@wordpress/data';
import { store as coreStore } from '@wordpress/core-data';
import { store as editorStore } from '@wordpress/editor';
import { store as noticesStore } from '@wordpress/notices';
import { decodeEntities } from '@wordpress/html-entities';
import { __, sprintf } from '@wordpress/i18n';
import {
	useNavigate,
	useSearch,
	privateApis as routePrivateApis,
} from '@wordpress/route';
import { store as bootStore } from '../../store';
import { unlock } from '../../lock-unlock';

const { useCanGoBack, useRouter } = unlock( routePrivateApis );

/*
 * The route tree is assembled from routes registered at runtime, so TanStack has
 * no search schema to infer and types `search` against a placeholder. Describe
 * the two calls this module makes instead.
 */
type Navigate = ( options: {
	to?: string;
	replace?: boolean;
	search?: (
		previous: Record< string, unknown >
	) => Record< string, unknown >;
} ) => void;

interface NavigateParams {
	postType: string;
	postId: string;
}

/**
 * Builds the editor's entity navigation callbacks.
 *
 * The editor uses these to move between an entity and one nested inside it —
 * a template part or a synced pattern reached from the block inspector. They
 * are passed through the editor settings, where `onNavigateToEntityRecord`
 * gates the inspector's edit affordance and `onNavigateToPreviousEntityRecord`
 * gates the document bar's back button.
 *
 * @return The two callbacks, for spreading into the editor settings.
 */
export default function useNavigateToEntityRecord() {
	const navigate = useNavigate() as Navigate;
	const search = useSearch( { strict: false } ) as { focusMode?: unknown };
	const registry = useRegistry();
	const getEntityLink = useSelect(
		( select ) => select( bootStore ).getEntityLink,
		[]
	);
	const router = useRouter();
	const canGoBack = useCanGoBack();

	const onNavigateToEntityRecord = useCallback(
		( params: NavigateParams ) => {
			/*
			 * Stash the block selected in the entity being left, so returning to
			 * it can restore the user's place. The edits hold the external
			 * client ID, which `onChangeSelection` has already resolved.
			 */
			const currentPostType = (
				registry.select( editorStore ) as any
			 ).getCurrentPostType();
			const currentPostId = (
				registry.select( editorStore ) as any
			 ).getCurrentPostId();
			const edits = registry
				.select( coreStore )
				.getEntityRecordEdits(
					'postType',
					currentPostType,
					currentPostId
				) as { selection?: { selectionStart?: { clientId?: string } } };
			const selectedBlock = edits?.selection?.selectionStart?.clientId;

			if ( selectedBlock ) {
				navigate( {
					search: ( previous: Record< string, unknown > ) => ( {
						...previous,
						selectedBlock,
					} ),
					replace: true,
				} );
			}

			/*
			 * `focusMode` marks the entity as one navigated into rather than
			 * opened directly, which is what offers the way back out. The search
			 * is replaced rather than extended so the block stashed above stays
			 * with the entity it belongs to.
			 */
			const to = getEntityLink( params.postType, params.postId );

			if ( to ) {
				navigate( { to, search: () => ( { focusMode: true } ) } );
			}
		},
		[ navigate, registry, getEntityLink ]
	);

	/*
	 * Only entities navigated into offer a way back out. The editor reads this
	 * as the entity being a focused one, giving it the document bar's back
	 * button and the surrounding padding, so an entity opened directly — from a
	 * list, say — must not have it. `canGoBack` covers reloading such a URL,
	 * where the marker survives but the history to return to does not.
	 */
	const isFocusMode = !! search.focusMode;
	const onNavigateToPreviousEntityRecord = useMemo(
		() =>
			isFocusMode && canGoBack ? () => router.history.back() : undefined,
		[ isFocusMode, canGoBack, router ]
	);

	return { onNavigateToEntityRecord, onNavigateToPreviousEntityRecord };
}

interface ActionItem {
	id: string | number;
	type: string;
	title?: string | { rendered?: string };
}

/**
 * Builds the callback the editor runs after a post action.
 *
 * Actions taken from inside the editor act on the entity being edited, so
 * trashing or deleting one leaves the canvas showing something that is no
 * longer there, and duplicating one gives no way to reach the copy.
 *
 * @param postType Post type rendered in the canvas.
 * @return The callback, for passing to the editor.
 */
export function useActionPerformed( postType?: string ) {
	const navigate = useNavigate() as Navigate;
	const { createSuccessNotice } = useDispatch( noticesStore );
	const getEntityLink = useSelect(
		( select ) => select( bootStore ).getEntityLink,
		[]
	);

	return useCallback(
		( actionId: string, items: ActionItem[] ) => {
			switch ( actionId ) {
				case 'move-to-trash':
				case 'delete-post': {
					const to = postType && getEntityLink( postType );

					if ( to ) {
						navigate( { to, search: () => ( {} ) } );
					}
					break;
				}

				case 'duplicate-post': {
					const newItem = items[ 0 ];
					const to = getEntityLink( newItem.type, newItem.id );

					if ( ! to ) {
						break;
					}

					const title =
						typeof newItem.title === 'string'
							? newItem.title
							: newItem.title?.rendered;

					/*
					 * The action has already announced the copy under this id.
					 * Reissuing it under the same id replaces that notice rather
					 * than stacking a second one, and adds the way to reach it.
					 */
					createSuccessNotice(
						sprintf(
							// translators: %s: Title of the created post, e.g: "Hello world".
							__( '"%s" successfully created.' ),
							decodeEntities( title ?? '' ) || __( '(no title)' )
						),
						{
							type: 'snackbar',
							id: 'duplicate-post-action',
							actions: [
								{
									label: __( 'Edit' ),
									onClick: () => navigate( { to } ),
								},
							],
						}
					);
					break;
				}
			}
		},
		[ navigate, createSuccessNotice, getEntityLink, postType ]
	);
}
