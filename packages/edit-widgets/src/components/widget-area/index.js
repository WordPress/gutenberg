/**
 * External dependencies
 */
import { get, defaultTo } from 'lodash';

/**
 * WordPress dependencies
 */
import { useMemo, useCallback, useEffect } from '@wordpress/element';
import { uploadMedia } from '@wordpress/media-utils';
import { Panel, PanelBody } from '@wordpress/components';
import {
	BlockInspector,
	BlockEditorProvider,
	BlockList,
	Inserter as BlockInserter,
	WritingFlow,
	ObserveTyping,
	BlockEditorKeyboardShortcuts,
	ButtonBlockerAppender,
} from '@wordpress/block-editor';
import { useSelect, useDispatch } from '@wordpress/data';
import { parse, serialize } from '@wordpress/blocks';

/**
 * Internal dependencies
 */
import Sidebar from '../sidebar';
import SelectionObserver from './selection-observer';
import Inserter from '../inserter';

function getBlockEditorSettings( blockEditorSettings, hasUploadPermissions ) {
	if ( ! hasUploadPermissions ) {
		return blockEditorSettings;
	}
	const mediaUploadBlockEditor = ( { onError, ...argumentsObject } ) => {
		uploadMedia( {
			wpAllowedMimeTypes: blockEditorSettings.allowedMimeTypes,
			onError: ( { message } ) => onError( message ),
			...argumentsObject,
		} );
	};
	return {
		...blockEditorSettings,
		mediaUpload: mediaUploadBlockEditor,
	};
}

function WidgetArea( {
	id,
	blockEditorSettings,
	initialOpen,
	isSelectedArea,
	onBlockSelected,
} ) {
	const { blocks, widgetAreaName, hasUploadPermissions, rawContent } = useSelect(
		( select ) => {
			const {
				canUser,
				getEditedEntityRecord,
			} = select( 'core' );
			const widgetArea = getEditedEntityRecord( 'root', 'widgetArea', id );
			const widgetAreaContent = get( widgetArea, [ 'content' ], '' );
			return {
				blocks: widgetArea && widgetArea.blocks,
				rawContent: widgetAreaContent.raw ? widgetAreaContent.raw : widgetAreaContent,
				widgetAreaName: widgetArea && widgetArea.name,
				hasUploadPermissions: defaultTo( canUser( 'create', 'media' ), true ),
			};
		},
		[ id ]
	);
	const { editEntityRecord } = useDispatch( 'core' );
	const onChange = useCallback(
		( newBlocks ) => {
			editEntityRecord( 'root', 'widgetArea', id, { blocks: newBlocks } );
		},
		[ editEntityRecord, id ]
	);
	const onInput = useCallback(
		( newBlocks ) => {
			editEntityRecord( 'root', 'widgetArea', id, {
				blocks: newBlocks,
				content: serialize( newBlocks ),
			} );
		},
		[ editEntityRecord, id ]
	);
	const settings = useMemo(
		() => getBlockEditorSettings( blockEditorSettings, hasUploadPermissions ),
		[ blockEditorSettings, hasUploadPermissions ]
	);
	useEffect(
		() => {
			if ( blocks ) {
				return;
			}
			onChange( parse( rawContent ) );
		},
		[ blocks, onChange, rawContent ]
	);
	return (
		<Panel className="edit-widgets-widget-area">
			<PanelBody
				title={ widgetAreaName }
				initialOpen={ initialOpen }
			>
				<div
					onFocus={ ( event ) => {
						// Stop propagation of the focus event to avoid the parent
						// widget layout component catching the event and removing the selected area.
						event.stopPropagation();
						event.preventDefault();
					} }
				>
					<BlockEditorProvider
						value={ blocks }
						onInput={ onInput }
						onChange={ onChange }
						settings={ settings }
					>
						{ isSelectedArea && (
							<>
								<Inserter>
									<BlockInserter />
								</Inserter>
								<BlockEditorKeyboardShortcuts />
							</>
						) }
						<SelectionObserver
							isSelectedArea={ isSelectedArea }
							onBlockSelected={ onBlockSelected }
						/>
						<Sidebar.Inspector>
							<BlockInspector showNoBlockSelectedMessage={ false } />
						</Sidebar.Inspector>
						<div className="editor-styles-wrapper">
							<WritingFlow>
								<ObserveTyping>
									<BlockList
										className="edit-widgets-main-block-list"
										renderAppender={ ButtonBlockerAppender }
									/>
								</ObserveTyping>
							</WritingFlow>
						</div>
					</BlockEditorProvider>
				</div>
			</PanelBody>
		</Panel>
	);
}

export default WidgetArea;
