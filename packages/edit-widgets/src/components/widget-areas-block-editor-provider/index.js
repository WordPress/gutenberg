/**
 * WordPress dependencies
 */
import { SlotFillProvider } from '@wordpress/components';
import { uploadMedia } from '@wordpress/media-utils';
import { useDispatch, useSelect } from '@wordpress/data';
import {
	useEntityBlockEditor,
	store as coreStore,
	useResourcePermissions,
} from '@wordpress/core-data';
import { useMemo } from '@wordpress/element';
import {
	BlockEditorKeyboardShortcuts,
	CopyHandler,
	privateApis as blockEditorPrivateApis,
} from '@wordpress/block-editor';
import { ReusableBlocksMenuItems } from '@wordpress/reusable-blocks';
import { ShortcutProvider } from '@wordpress/keyboard-shortcuts';
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

const { ExperimentalBlockEditorProvider } = unlock( blockEditorPrivateApis );

export default function WidgetAreasBlockEditorProvider( {
	blockEditorSettings,
	children,
	...props
} ) {
	const mediaPermissions = useResourcePermissions( 'media' );
	const { reusableBlocks, isFixedToolbarActive, keepCaretInsideBlock } =
		useSelect(
			( select ) => ( {
				widgetAreas: select( editWidgetsStore ).getWidgetAreas(),
				widgets: select( editWidgetsStore ).getWidgets(),
				reusableBlocks: ALLOW_REUSABLE_BLOCKS
					? select( coreStore ).getEntityRecords(
							'postType',
							'wp_block'
					  )
					: [],
				isFixedToolbarActive: !! select( preferencesStore ).get(
					'core/edit-widgets',
					'fixedToolbar'
				),
				keepCaretInsideBlock: !! select( preferencesStore ).get(
					'core/edit-widgets',
					'keepCaretInsideBlock'
				),
			} ),
			[]
		);
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
			hasFixedToolbar: isFixedToolbarActive,
			keepCaretInsideBlock,
			mediaUpload: mediaUploadBlockEditor,
			templateLock: 'all',
			__experimentalSetIsInserterOpened: setIsInserterOpened,
		};
	}, [
		blockEditorSettings,
		isFixedToolbarActive,
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
		<ShortcutProvider>
			<BlockEditorKeyboardShortcuts.Register />
			<KeyboardShortcuts.Register />
			<SlotFillProvider>
				<ExperimentalBlockEditorProvider
					value={ blocks }
					onInput={ onInput }
					onChange={ onChange }
					settings={ settings }
					useSubRegistry={ false }
					{ ...props }
				>
					<CopyHandler>{ children }</CopyHandler>
					<ReusableBlocksMenuItems rootClientId={ widgetAreaId } />
				</ExperimentalBlockEditorProvider>
			</SlotFillProvider>
		</ShortcutProvider>
	);
}
