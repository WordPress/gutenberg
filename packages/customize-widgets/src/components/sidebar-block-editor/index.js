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
	CopyHandler,
	ObserveTyping,
	WritingFlow,
	BlockEditorKeyboardShortcuts,
	__unstableBlockSettingsMenuFirstItem,
	__unstableEditorStyles as EditorStyles,
} from '@wordpress/block-editor';
import { uploadMedia } from '@wordpress/media-utils';
import { store as preferencesStore } from '@wordpress/preferences';

/**
 * Internal dependencies
 */
import BlockInspectorButton from '../block-inspector-button';
import Header from '../header';
import useInserter from '../inserter/use-inserter';
import SidebarEditorProvider from './sidebar-editor-provider';
import WelcomeGuide from '../welcome-guide';
import KeyboardShortcuts from '../keyboard-shortcuts';
import BlockAppender from '../block-appender';

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
		const { get } = select( preferencesStore );
		return {
			hasUploadPermissions: defaultTo(
				select( coreStore ).canUser( 'create', 'media' ),
				true
			),
			isFixedToolbarActive: !! get(
				'core/customize-widgets',
				'fixedToolbar'
			),
			keepCaretInsideBlock: !! get(
				'core/customize-widgets',
				'keepCaretInsideBlock'
			),
			isWelcomeGuideActive: !! get(
				'core/customize-widgets',
				'welcomeGuide'
			),
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
			__unstableHasCustomAppender: true,
		};
	}, [
		hasUploadPermissions,
		blockEditorSettings,
		isFixedToolbarActive,
		keepCaretInsideBlock,
		setIsInserterOpened,
	] );

	if ( isWelcomeGuideActive ) {
		return <WelcomeGuide sidebar={ sidebar } />;
	}

	return (
		<>
			<BlockEditorKeyboardShortcuts.Register />
			<KeyboardShortcuts.Register />

			<SidebarEditorProvider sidebar={ sidebar } settings={ settings }>
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

				<CopyHandler>
					<BlockTools>
						<EditorStyles styles={ settings.defaultEditorStyles } />
						<BlockSelectionClearer>
							<WritingFlow className="editor-styles-wrapper">
								<ObserveTyping>
									<BlockList
										renderAppender={ BlockAppender }
									/>
								</ObserveTyping>
							</WritingFlow>
						</BlockSelectionClearer>
					</BlockTools>
				</CopyHandler>

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
