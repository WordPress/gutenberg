/**
 * WordPress dependencies
 */
import { SlotFillProvider } from '@wordpress/components';
import { useViewportMatch } from '@wordpress/compose';
import { uploadMedia } from '@wordpress/media-utils';
import { useDispatch, useSelect } from '@wordpress/data';
import { useEntityBlockEditor, store as coreStore } from '@wordpress/core-data';
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
import { ALLOW_REUSABLE_BLOCKS } from '../../constants';
import { unlock } from '../../lock-unlock';

const { ExperimentalBlockEditorProvider } = unlock( blockEditorPrivateApis );
const { PatternsMenuItems } = unlock( editPatternsPrivateApis );
const { BlockKeyboardShortcuts } = unlock( blockLibraryPrivateApis );

const EMPTY_ARRAY = [];

export default function WidgetAreasBlockEditorProvider( {
	blockEditorSettings,
	children,
	...props
} ) {
	const isLargeViewport = useViewportMatch( 'medium' );
	const {
		hasUploadPermissions,
		reusableBlocks,
		isFixedToolbarActive,
		keepCaretInsideBlock,
		pageOnFront,
		pageForPosts,
	} = useSelect( ( select ) => {
		const { canUser, getEntityRecord, getEntityRecords } =
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
					kind: 'root',
					name: 'media',
				} ) ?? true,
			reusableBlocks: ALLOW_REUSABLE_BLOCKS
				? getEntityRecords( 'postType', 'wp_block' )
				: EMPTY_ARRAY,
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
		};
	}, [] );
	const { setIsInserterOpened } = useDispatch( editWidgetsStore );

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
			__experimentalReusableBlocks: reusableBlocks,
			hasFixedToolbar: isFixedToolbarActive || ! isLargeViewport,
			keepCaretInsideBlock,
			mediaUpload: mediaUploadBlockEditor,
			templateLock: 'all',
			__experimentalSetIsInserterOpened: setIsInserterOpened,
			pageOnFront,
			pageForPosts,
		};
	}, [
		hasUploadPermissions,
		blockEditorSettings,
		isFixedToolbarActive,
		isLargeViewport,
		keepCaretInsideBlock,
		reusableBlocks,
		setIsInserterOpened,
		pageOnFront,
		pageForPosts,
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
