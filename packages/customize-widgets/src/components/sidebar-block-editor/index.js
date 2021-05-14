/**
 * External dependencies
 */
import { defaultTo } from 'lodash';

/**
 * WordPress dependencies
 */
import { store as coreStore } from '@wordpress/core-data';
import { useSelect } from '@wordpress/data';
import { useMemo, createPortal } from '@wordpress/element';
import {
	BlockList,
	BlockTools,
	BlockSelectionClearer,
	BlockInspector,
	ObserveTyping,
	WritingFlow,
	BlockEditorKeyboardShortcuts,
	__unstableBlockSettingsMenuFirstItem,
} from '@wordpress/block-editor';
import { uploadMedia } from '@wordpress/media-utils';

/**
 * Internal dependencies
 */
import BlockInspectorButton from '../block-inspector-button';
import Header from '../header';
import useInserter from '../inserter/use-inserter';
import SidebarEditorProvider from './sidebar-editor-provider';
import { store as customizeWidgetsStore } from '../../store';
import WelcomeGuide from '../welcome-guide';
import KeyboardShortcuts from '../keyboard-shortcuts';

export default function SidebarBlockEditor( {
	blockEditorSettings,
	sidebar,
	inserter,
	inspector,
} ) {
	const [ isInserterOpened, setIsInserterOpened ] = useInserter( inserter );
	const {
		hasUploadPermissions,
		isFixedToolbarActive,
		keepCaretInsideBlock,
		isWelcomeGuideActive,
	} = useSelect( ( select ) => {
		return {
			hasUploadPermissions: defaultTo(
				select( coreStore ).canUser( 'create', 'media' ),
				true
			),
			isFixedToolbarActive: select(
				customizeWidgetsStore
			).__unstableIsFeatureActive( 'fixedToolbar' ),
			keepCaretInsideBlock: select(
				customizeWidgetsStore
			).__unstableIsFeatureActive( 'keepCaretInsideBlock' ),
			isWelcomeGuideActive: select(
				customizeWidgetsStore
			).__unstableIsFeatureActive( 'welcomeGuide' ),
		};
	}, [] );
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
			__experimentalSetIsInserterOpened: setIsInserterOpened,
			mediaUpload: mediaUploadBlockEditor,
			hasFixedToolbar: isFixedToolbarActive,
			keepCaretInsideBlock,
		};
	}, [
		hasUploadPermissions,
		blockEditorSettings,
		isFixedToolbarActive,
		keepCaretInsideBlock,
	] );

	if ( isWelcomeGuideActive ) {
		return <WelcomeGuide sidebar={ sidebar } />;
	}

	return (
		<>
			<BlockEditorKeyboardShortcuts.Register />
			<KeyboardShortcuts.Register />

			<SidebarEditorProvider sidebar={ sidebar } settings={ settings }>
				<BlockEditorKeyboardShortcuts />
				<KeyboardShortcuts
					undo={ sidebar.undo }
					redo={ sidebar.redo }
					save={ sidebar.save }
				/>

				<Header
					sidebar={ sidebar }
					inserter={ inserter }
					isInserterOpened={ isInserterOpened }
					setIsInserterOpened={ setIsInserterOpened }
					isFixedToolbarActive={ isFixedToolbarActive }
				/>

				<BlockTools>
					<BlockSelectionClearer>
						<WritingFlow>
							<ObserveTyping>
								<BlockList />
							</ObserveTyping>
						</WritingFlow>
					</BlockSelectionClearer>
				</BlockTools>

				{ createPortal(
					// This is a temporary hack to prevent button component inside <BlockInspector>
					// from submitting form when type="button" is not specified.
					<form onSubmit={ ( event ) => event.preventDefault() }>
						<BlockInspector />
					</form>,
					inspector.contentContainer[ 0 ]
				) }
			</SidebarEditorProvider>

			<__unstableBlockSettingsMenuFirstItem>
				{ ( { onClose } ) => (
					<BlockInspectorButton
						inspector={ inspector }
						closeMenu={ onClose }
					/>
				) }
			</__unstableBlockSettingsMenuFirstItem>
		</>
	);
}
