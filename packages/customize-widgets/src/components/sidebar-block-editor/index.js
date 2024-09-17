/**
 * WordPress dependencies
 */
import { useViewportMatch } from '@wordpress/compose';
import { store as coreStore } from '@wordpress/core-data';
import { useSelect } from '@wordpress/data';
import { useMemo, createPortal } from '@wordpress/element';
import {
	BlockList,
	BlockToolbar,
	BlockInspector,
	privateApis as blockEditorPrivateApis,
	__unstableBlockSettingsMenuFirstItem,
} from '@wordpress/block-editor';
import { uploadMedia } from '@wordpress/media-utils';
import { store as preferencesStore } from '@wordpress/preferences';
import { privateApis as blockLibraryPrivateApis } from '@wordpress/block-library';

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
import { unlock } from '../../lock-unlock';

const { ExperimentalBlockCanvas: BlockCanvas } = unlock(
	blockEditorPrivateApis
);

const { BlockKeyboardShortcuts } = unlock( blockLibraryPrivateApis );

export default function SidebarBlockEditor( {
	blockEditorSettings,
	sidebar,
	inserter,
	inspector,
} ) {
	const [ isInserterOpened, setIsInserterOpened ] = useInserter( inserter );
	const isMediumViewport = useViewportMatch( 'small' );
	const {
		hasUploadPermissions,
		isFixedToolbarActive,
		keepCaretInsideBlock,
		isWelcomeGuideActive,
	} = useSelect( ( select ) => {
		const { get } = select( preferencesStore );
		return {
			hasUploadPermissions:
				select( coreStore ).canUser( 'create', {
					kind: 'root',
					name: 'media',
				} ) ?? true,
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
			hasFixedToolbar: isFixedToolbarActive || ! isMediumViewport,
			keepCaretInsideBlock,
			__unstableHasCustomAppender: true,
		};
	}, [
		hasUploadPermissions,
		blockEditorSettings,
		isFixedToolbarActive,
		isMediumViewport,
		keepCaretInsideBlock,
		setIsInserterOpened,
	] );

	if ( isWelcomeGuideActive ) {
		return <WelcomeGuide sidebar={ sidebar } />;
	}

	return (
		<>
			<KeyboardShortcuts.Register />
			<BlockKeyboardShortcuts />

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
					isFixedToolbarActive={
						isFixedToolbarActive || ! isMediumViewport
					}
				/>
				{ ( isFixedToolbarActive || ! isMediumViewport ) && (
					<BlockToolbar hideDragHandle />
				) }
				<BlockCanvas
					shouldIframe={ false }
					styles={ settings.defaultEditorStyles }
					height="100%"
				>
					<BlockList renderAppender={ BlockAppender } />
				</BlockCanvas>

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
