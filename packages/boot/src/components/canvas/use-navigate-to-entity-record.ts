import { useCallback, useMemo } from '@wordpress/element';
import { useRegistry } from '@wordpress/data';
import { store as coreStore } from '@wordpress/core-data';
import { store as editorStore } from '@wordpress/editor';
import {
	useNavigate,
	useSearch,
	privateApis as routePrivateApis,
} from '@wordpress/route';
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
			 * Template and template part IDs carry a `theme//slug` form, so the
			 * separator has to survive being placed in the path.
			 *
			 * `focusMode` marks the entity as one navigated into rather than
			 * opened directly, which is what offers the way back out. The search
			 * is replaced rather than extended so the block stashed above stays
			 * with the entity it belongs to.
			 */
			navigate( {
				to: `/types/${ params.postType }/edit/${ encodeURIComponent(
					params.postId
				) }`,
				search: () => ( { focusMode: true } ),
			} );
		},
		[ navigate, registry ]
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
