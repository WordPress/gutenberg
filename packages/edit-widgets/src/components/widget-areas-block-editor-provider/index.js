/**
 * WordPress dependencies
 */
import { SlotFillProvider } from '@wordpress/components';
import { useViewportMatch } from '@wordpress/compose';
import { uploadMedia } from '@wordpress/media-utils';
import { useDispatch, useSelect } from '@wordpress/data';
import {
	useEntityBlockEditor,
	store as coreStore,
	useResourcePermissions,
	__experimentalFetchLinkSuggestions as fetchLinkSuggestions,
} from '@wordpress/core-data';
import { useMemo, useCallback } from '@wordpress/element';
import {
	privateApis as blockEditorPrivateApis,
	store as blockEditorStore,
} from '@wordpress/block-editor';
import { privateApis as editPatternsPrivateApis } from '@wordpress/patterns';
import { store as preferencesStore } from '@wordpress/preferences';

/**
 * Internal dependencies
 */
import KeyboardShortcuts from '../keyboard-shortcuts';
import { buildWidgetAreasPostId, KIND, POST_TYPE } from '../../store/utils';
import useLastSelectedWidgetArea from '../../hooks/use-last-selected-widget-area';
import { store as editWidgetsStore } from '../../store';
import { ALLOW_REUSABLE_BLOCKS } from '../../constants';
import { unlock } from '../../lock-unlock';

const { ExperimentalBlockEditorProvider, settingsKeys } = unlock(
	blockEditorPrivateApis
);
const { PatternsMenuItems } = unlock( editPatternsPrivateApis );

function useLinkControlEntitySearch() {
	const settings = useSelect(
		( select ) => select( blockEditorStore ).getSettings(),
		[]
	);
	// The function should either be undefined or a stable function reference
	// throughout the editor lifetime, much like importing a function from a
	// module.
	const { pageOnFront, pageForPosts } = useSelect( ( select ) => {
		const { canUser, getEntityRecord } = select( coreStore );

		const siteSettings = canUser( 'read', 'settings' )
			? getEntityRecord( 'root', 'site' )
			: undefined;

		return {
			pageOnFront: siteSettings?.page_on_front,
			pageForPosts: siteSettings?.page_for_posts,
		};
	}, [] );

	return useCallback(
		async ( val, suggestionsQuery, withCreateSuggestion ) => {
			const { isInitialSuggestions } = suggestionsQuery;

			const results = await fetchLinkSuggestions(
				val,
				suggestionsQuery,
				settings
			);

			// Identify front page and update type to match.
			results.map( ( result ) => {
				if ( Number( result.id ) === pageOnFront ) {
					result.isFrontPage = true;
					return result;
				} else if ( Number( result.id ) === pageForPosts ) {
					result.isBlogHome = true;
					return result;
				}

				return result;
			} );

			// If displaying initial suggestions just return plain results.
			if ( isInitialSuggestions ) {
				return results;
			}

			// Here we append a faux suggestion to represent a "CREATE" option. This
			// is detected in the rendering of the search results and handled as a
			// special case. This is currently necessary because the suggestions
			// dropdown will only appear if there are valid suggestions and
			// therefore unless the create option is a suggestion it will not
			// display in scenarios where there are no results returned from the
			// API. In addition promoting CREATE to a first class suggestion affords
			// the a11y benefits afforded by `URLInput` to all suggestions (eg:
			// keyboard handling, ARIA roles...etc).
			//
			// Note also that the value of the `title` and `url` properties must correspond
			// to the text value of the `<input>`. This is because `title` is used
			// when creating the suggestion. Similarly `url` is used when using keyboard to select
			// the suggestion (the <form> `onSubmit` handler falls-back to `url`).
			return ! withCreateSuggestion
				? results
				: results.concat( {
						// the `id` prop is intentionally ommitted here because it
						// is never exposed as part of the component's public API.
						// see: https://github.com/WordPress/gutenberg/pull/19775#discussion_r378931316.
						title: val, // Must match the existing `<input>`s text value.
						url: val, // Must match the existing `<input>`s text value.
						type: '__CREATE__',
				  } );
		},
		[ pageOnFront, pageForPosts, settings ]
	);
}

export default function WidgetAreasBlockEditorProvider( {
	blockEditorSettings,
	children,
	...props
} ) {
	const mediaPermissions = useResourcePermissions( 'media' );
	const isLargeViewport = useViewportMatch( 'medium' );
	const { reusableBlocks, isFixedToolbarActive, keepCaretInsideBlock } =
		useSelect( ( select ) => {
			const { getEntityRecords } = select( coreStore );
			return {
				widgetAreas: select( editWidgetsStore ).getWidgetAreas(),
				widgets: select( editWidgetsStore ).getWidgets(),
				reusableBlocks: ALLOW_REUSABLE_BLOCKS
					? getEntityRecords( 'postType', 'wp_block' )
					: [],
				isFixedToolbarActive: !! select( preferencesStore ).get(
					'core/edit-widgets',
					'fixedToolbar'
				),
				keepCaretInsideBlock: !! select( preferencesStore ).get(
					'core/edit-widgets',
					'keepCaretInsideBlock'
				),
			};
		}, [] );
	const { setIsInserterOpened } = useDispatch( editWidgetsStore );

	const settings = useMemo( () => {
		let mediaUploadBlockEditor;
		if ( mediaPermissions.canCreate ) {
			mediaUploadBlockEditor = ( { onError, ...argumentsObject } ) => {
				uploadMedia( {
					wpAllowedMimeTypes: blockEditorSettings.allowedMimeTypes,
					onError: ( { message } ) => onError( message ),
					...argumentsObject,
				} );
			};
		}
		return {
			...blockEditorSettings,
			__experimentalReusableBlocks: reusableBlocks,
			hasFixedToolbar: isFixedToolbarActive || ! isLargeViewport,
			keepCaretInsideBlock,
			mediaUpload: mediaUploadBlockEditor,
			templateLock: 'all',
			__experimentalSetIsInserterOpened: setIsInserterOpened,
			[ settingsKeys.useLinkControlEntitySearch ]:
				useLinkControlEntitySearch,
		};
	}, [
		blockEditorSettings,
		isFixedToolbarActive,
		isLargeViewport,
		keepCaretInsideBlock,
		mediaPermissions.canCreate,
		reusableBlocks,
		setIsInserterOpened,
	] );

	const widgetAreaId = useLastSelectedWidgetArea();

	const [ blocks, onInput, onChange ] = useEntityBlockEditor(
		KIND,
		POST_TYPE,
		{ id: buildWidgetAreasPostId() }
	);

	return (
		<SlotFillProvider>
			<KeyboardShortcuts.Register />
			<ExperimentalBlockEditorProvider
				value={ blocks }
				onInput={ onInput }
				onChange={ onChange }
				settings={ settings }
				useSubRegistry={ false }
				{ ...props }
			>
				{ children }
				<PatternsMenuItems rootClientId={ widgetAreaId } />
			</ExperimentalBlockEditorProvider>
		</SlotFillProvider>
	);
}
