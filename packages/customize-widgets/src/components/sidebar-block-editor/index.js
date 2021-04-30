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
	BlockSelectionClearer,
	BlockInspector,
	ObserveTyping,
	WritingFlow,
	BlockEditorKeyboardShortcuts,
	__experimentalBlockSettingsMenuFirstItem,
} from '@wordpress/block-editor';
import { SlotFillProvider, Popover } from '@wordpress/components';
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
			__experimentalSetIsInserterOpened: setIsInserterOpened,
			mediaUpload: mediaUploadBlockEditor,
		};
	}, [] );
	const parentContainer = document.getElementById(
		'customize-theme-controls'
	);

	return (
		<>
			<BlockEditorKeyboardShortcuts.Register />
			<SlotFillProvider>
				<SidebarEditorProvider
					sidebar={ sidebar }
					settings={ settings }
				>
					<BlockEditorKeyboardShortcuts />

					<Header
						inserter={ inserter }
						isInserterOpened={ isInserterOpened }
						setIsInserterOpened={ setIsInserterOpened }
					/>

					<div className="customize-widgets__contextual-toolbar-wrapper">
						<Popover.Slot name="block-toolbar" />
					</div>

					<BlockSelectionClearer>
						<WritingFlow>
							<ObserveTyping>
								<BlockList />
							</ObserveTyping>
						</WritingFlow>
					</BlockSelectionClearer>

					{ createPortal(
						// This is a temporary hack to prevent button component inside <BlockInspector>
						// from submitting form when type="button" is not specified.
						<form onSubmit={ ( event ) => event.preventDefault() }>
							<BlockInspector />
						</form>,
						inspector.contentContainer[ 0 ]
					) }
				</SidebarEditorProvider>

				<__experimentalBlockSettingsMenuFirstItem>
					{ ( { onClose } ) => (
						<BlockInspectorButton
							inspector={ inspector }
							closeMenu={ onClose }
						/>
					) }
				</__experimentalBlockSettingsMenuFirstItem>

				{
					// We have to portal this to the parent of both the editor and the inspector,
					// so that the popovers will appear above both of them.
					createPortal( <Popover.Slot />, parentContainer )
				}
			</SlotFillProvider>
		</>
	);
}
