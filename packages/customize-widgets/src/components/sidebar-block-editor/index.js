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

export default function SidebarBlockEditor( {
	blockEditorSettings,
	sidebar,
	inserter,
	inspector,
} ) {
	const [ isInserterOpened, setIsInserterOpened ] = useInserter( inserter );
	const hasUploadPermissions = useSelect(
		( select ) =>
			defaultTo( select( coreStore ).canUser( 'create', 'media' ), true ),
		[]
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
			__experimentalSetIsInserterOpened: setIsInserterOpened,
			mediaUpload: mediaUploadBlockEditor,
		};
	}, [ hasUploadPermissions, blockEditorSettings ] );

	return (
		<>
			<BlockEditorKeyboardShortcuts.Register />

			<SidebarEditorProvider sidebar={ sidebar } settings={ settings }>
				<BlockEditorKeyboardShortcuts />

				<Header
					inserter={ inserter }
					isInserterOpened={ isInserterOpened }
					setIsInserterOpened={ setIsInserterOpened }
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
