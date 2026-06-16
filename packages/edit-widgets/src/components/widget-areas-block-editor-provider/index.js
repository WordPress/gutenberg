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
	privateApis as coreDataPrivateApis,
} from '@wordpress/core-data';
import { useMemo } from '@wordpress/element';
import { privateApis as blockEditorPrivateApis } from '@wordpress/block-editor';
import { privateApis as editPatternsPrivateApis } from '@wordpress/patterns';
import { store as preferencesStore } from '@wordpress/preferences';
import { privateApis as blockLibraryPrivateApis } from '@wordpress/block-library';

/**
 * Internal dependencies
 */
import KeyboardShortcuts from '../keyboard-shortcuts';
import { buildWidgetAreasPostId, KIND, POST_TYPE } from '../../store/utils';
import useLastSelectedWidgetArea from '../../hooks/use-last-selected-widget-area';
import { store as editWidgetsStore } from '../../store';
import { unlock } from '../../lock-unlock';

const {
	ExperimentalBlockEditorProvider,
	selectBlockPatternsKey,
	reusableBlocksSelectKey,
	userPatternCategoriesSelectKey,
} = unlock( blockEditorPrivateApis );
const { PatternsMenuItems } = unlock( editPatternsPrivateApis );
const { BlockKeyboardShortcuts } = unlock( blockLibraryPrivateApis );

export default function WidgetAreasBlockEditorProvider( {
	blockEditorSettings,
	children,
	...props
} ) {
	const isLargeViewport = useViewportMatch( 'medium' );
	const {
		hasUploadPermissions,
		isFixedToolbarActive,
		keepCaretInsideBlock,
		pageOnFront,
		pageForPosts,
		restBlockPatternCategories,
	} = useSelect( ( select ) => {
		const { canUser, getEntityRecord, getBlockPatternCategories } =
			select( coreStore );
		const siteSettings = canUser( 'read', {
			kind: 'root',
			name: 'site',
		} )
			? getEntityRecord( 'root', 'site' )
			: undefined;
		return {
			hasUploadPermissions:
				canUser( 'create', {
					kind: 'postType',
					name: 'attachment',
				} ) ?? true,
			isFixedToolbarActive: !! select( preferencesStore ).get(
				'core/edit-widgets',
				'fixedToolbar'
			),
			keepCaretInsideBlock: !! select( preferencesStore ).get(
				'core/edit-widgets',
				'keepCaretInsideBlock'
			),
			pageOnFront: siteSettings?.page_on_front,
			pageForPosts: siteSettings?.page_for_posts,
			restBlockPatternCategories: getBlockPatternCategories(),
		};
	}, [] );
	const { setIsInserterOpened } = useDispatch( editWidgetsStore );

	const settingsBlockPatternCategories =
		blockEditorSettings.__experimentalAdditionalBlockPatternCategories ?? // WP 6.0
		blockEditorSettings.__experimentalBlockPatternCategories; // WP 5.9

	const blockPatternCategories = useMemo(
		() =>
			[
				...( settingsBlockPatternCategories || [] ),
				...( restBlockPatternCategories || [] ),
			].filter(
				( x, index, arr ) =>
					index === arr.findIndex( ( y ) => x.name === y.name )
			),
		[ settingsBlockPatternCategories, restBlockPatternCategories ]
	);

	const settings = useMemo( () => {
		let mediaUploadBlockEditor;
		if ( hasUploadPermissions ) {
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
			hasFixedToolbar: isFixedToolbarActive || ! isLargeViewport,
			keepCaretInsideBlock,
			mediaUpload: mediaUploadBlockEditor,
			templateLock: 'all',
			__experimentalSetIsInserterOpened: setIsInserterOpened,
			pageOnFront,
			pageForPosts,
			editorTool: 'edit',
			// Uses getBlockPatterns() rather than
			// getBlockPatternsForPostType() since the widgets editor has
			// no meaningful post type. Patterns with postTypes restrictions
			// may surface here, but they are still filtered by
			// __experimentalGetAllowedPatterns' block-type check.
			[ selectBlockPatternsKey ]: ( select ) => {
				const { getBlockPatterns, hasFinishedResolution } =
					select( coreStore );
				const patterns = getBlockPatterns();
				return hasFinishedResolution( 'getBlockPatterns' )
					? patterns
					: undefined;
			},
			[ reusableBlocksSelectKey ]: ( select ) => {
				const { RECEIVE_INTERMEDIATE_RESULTS } =
					unlock( coreDataPrivateApis );
				const { getEntityRecords: getEntityRecordsForReusable } =
					select( coreStore );
				return getEntityRecordsForReusable( 'postType', 'wp_block', {
					per_page: -1,
					[ RECEIVE_INTERMEDIATE_RESULTS ]: true,
				} );
			},
			[ userPatternCategoriesSelectKey ]: ( select ) => {
				return select( coreStore ).getUserPatternCategories();
			},
			__experimentalBlockPatternCategories: blockPatternCategories,
		};
	}, [
		hasUploadPermissions,
		blockEditorSettings,
		isFixedToolbarActive,
		isLargeViewport,
		keepCaretInsideBlock,
		setIsInserterOpened,
		pageOnFront,
		pageForPosts,
		blockPatternCategories,
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
			<BlockKeyboardShortcuts />
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
